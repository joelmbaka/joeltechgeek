import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmUser, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { parseFollowupSchedule, followupDueAtSQL } from '@/lib/agent-crm/followups';
import { resolveContactTarget } from '@/lib/agent-crm/contact-attribution';
import { parseActionType } from '@/lib/agent-crm/action-types';
import { resolveActivityChannel, stageForOutcome, LEAD_STAGES } from '@/lib/agent-crm/types';
import type { ActivityOutcome, Lead, LeadStage } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type FollowupMode = 'keep' | 'set' | 'complete' | 'cancel';
type FollowupInput = {
  mode?: FollowupMode;
  next_action?: unknown;
  next_action_type?: unknown;
  next_action_at?: unknown;
  next_action_time?: unknown;
  next_action_timezone?: unknown;
  contact_id?: unknown;
};
function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, {
    status, headers: { 'Cache-Control': 'no-store' },
  });
}

/**
 * One atomic update, across outcome, optional note, follow-up and disposition.
 * Missing followup means KEEP; a call never silently clears another task.
 */
export async function POST(request: Request, { params }: Params) {
  if (!validCrmWriteOrigin(request)) return fail('Invalid request origin.', 403);
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return fail('Invalid lead.', 400);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return fail('Invalid update details.');
    body = parsed as Record<string, unknown>;
  } catch { return fail('Invalid JSON body.'); }

  const outcome = body.outcome == null || body.outcome === '' ? null : body.outcome;
  const notes = body.notes ?? '';
  const disposition = body.disposition ?? 'keep';
  const stageOverride = body.stage;
  const rawFollowup = body.followup ?? { mode: 'keep' };
  if (typeof notes !== 'string' || notes.length > 2500)
    return fail('Notes must be 2,500 characters or fewer.');
  if (!['keep','competitor','do_not_contact'].includes(String(disposition)))
    return fail('Invalid disposition.');
  if (!rawFollowup || typeof rawFollowup !== 'object' || Array.isArray(rawFollowup))
    return fail('Invalid follow-up.');
  const followup = rawFollowup as FollowupInput;
  const mode = followup.mode ?? 'keep';
  if (!['keep','set','complete','cancel'].includes(mode)) return fail('Invalid follow-up action.');
  if (disposition !== 'keep' && mode === 'set')
    return fail('Excluded leads cannot schedule follow-ups.');
  const hasOutcome = typeof outcome === 'string' && outcome.length > 0;
  if (outcome !== null && !hasOutcome) return fail('Choose a valid outcome.');
  const activity = hasOutcome ? resolveActivityChannel(body.channel, outcome) : null;
  if (activity && !activity.ok) return fail(activity.error);
  if (stageOverride !== undefined && (
    !hasOutcome || typeof stageOverride !== 'string' ||
    !(LEAD_STAGES as string[]).includes(stageOverride) ||
    stageOverride === 'competitor' || stageOverride === 'do_not_contact'
  )) return fail('Invalid stage selection.');
  if (!hasOutcome && !notes.trim() && mode === 'keep' && disposition === 'keep')
    return fail('Record an outcome, note, follow-up, or disposition.');
  if (disposition !== 'keep' && hasOutcome && disposition === 'competitor')
    return fail('Competitor classification is separate from outreach outcomes.');

  let schedule: ReturnType<typeof parseFollowupSchedule> | null = null;
  let nextAction: string | null = null;
  if (mode === 'set') {
    if (typeof followup.next_action !== 'string' || !followup.next_action.trim() ||
      followup.next_action.length > 300)
      return fail('Enter a next action (300 characters or fewer).');
    nextAction = followup.next_action.trim();
    schedule = parseFollowupSchedule({
      next_action_at: followup.next_action_at,
      next_action_time: followup.next_action_time,
      next_action_timezone: followup.next_action_timezone,
    });
    if (!schedule.ok) return fail(schedule.error);
    if (!schedule.value.next_action_at) return fail('Choose a follow-up date.');
  }

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const locked = await client.query<{
      stage: LeadStage; do_not_contact: boolean; priority: string;
      phone: string | null; next_action: string | null;
      next_action_at: string | null; next_action_time: string | null;
      next_action_timezone: string | null;
      next_action_type: 'call'|'email'|'whatsapp'|'meeting'|'other'|null;
      next_action_contact_id: string | null;
    }>(
      `SELECT stage, do_not_contact, priority, phone, next_action,
              next_action_at::text, next_action_time::text,
              next_action_timezone, next_action_type,
              next_action_contact_id::text
         FROM public.crm_leads WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [id, access.user.id],
    );
    const current = locked.rows[0];
    if (!current) { await client.query('ROLLBACK'); return fail('Lead not found.', 404); }
    if (current.do_not_contact || ['competitor','do_not_contact','won','lost'].includes(current.stage)) {
      await client.query('ROLLBACK');
      return fail('This record is closed or excluded from outreach.', 409);
    }
    const stage: LeadStage = disposition === 'competitor' ? 'competitor' :
      disposition === 'do_not_contact' ? 'do_not_contact' :
      stageOverride !== undefined ? stageOverride as LeadStage :
      hasOutcome ? stageForOutcome(current.stage, outcome as ActivityOutcome) : current.stage;
    const closing = disposition !== 'keep' || ['won','lost'].includes(stage);
    if (closing && mode === 'set') {
      await client.query('ROLLBACK');
      return fail('Closed leads cannot schedule follow-ups.');
    }
    const effectiveMode: FollowupMode = closing ? 'cancel' : mode;
    if (effectiveMode === 'complete' && !current.next_action?.trim()) {
      await client.query('ROLLBACK');
      return fail('There is no outstanding action to complete.', 409);
    }

    const activityContact = hasOutcome
      ? await resolveContactTarget(client, id, body.contact_id)
      : { ok: true as const, id: null, name: null };
    if (!activityContact.ok) { await client.query('ROLLBACK'); return fail(activityContact.error); }

    let contact = { ok: true as const, id: null as string | null, name: null as string | null };
    let parsedType: 'call' | 'email' | 'whatsapp' | 'meeting' | 'other' | null = null;
    if (effectiveMode === 'set') {
      const choice = followup.contact_id !== undefined
        ? followup.contact_id
        : current.next_action ? current.next_action_contact_id : undefined;
      const resolved = await resolveContactTarget(client, id, choice);
      if (!resolved.ok) { await client.query('ROLLBACK'); return fail(resolved.error); }
      contact = resolved;
      const type = parseActionType(followup.next_action_type, nextAction, current.next_action_type);
      if (!type.ok) { await client.query('ROLLBACK'); return fail(type.error); }
      parsedType = type.value;
    }
    const nextDate = effectiveMode === 'set' && schedule?.ok ? schedule.value.next_action_at : null;
    const nextTime = effectiveMode === 'set' && schedule?.ok ? schedule.value.next_action_time : null;
    const nextZone = effectiveMode === 'set' && schedule?.ok ? schedule.value.next_action_timezone : null;
    const willChangeFollowup = effectiveMode === 'set'
      ? current.next_action !== nextAction ||
        current.next_action_at !== nextDate ||
        (current.next_action_time?.slice(0,5) || null) !== nextTime ||
        current.next_action_timezone !== nextZone ||
        current.next_action_contact_id !== contact.id ||
        current.next_action_type !== parsedType
      : effectiveMode !== 'keep' && !!current.next_action;

    if (!hasOutcome && !notes.trim() && disposition === 'keep' && !willChangeFollowup) {
      await client.query('ROLLBACK');
      return fail('There are no changes to save.', 409);
    }

    if (hasOutcome) {
      let calledPhone: string | null = null;
      if (activity?.ok && activity.channel === 'call') {
        if (activityContact.id) {
          const contactPhone = await client.query<{phone: string | null}>(
            'SELECT phone FROM public.crm_lead_contacts WHERE lead_id=$1 AND id=$2::uuid',
            [id,activityContact.id],
          );
          calledPhone = contactPhone.rows[0]?.phone || null;
        } else {
          calledPhone = current.phone;
        }
      }
      await client.query(
        `INSERT INTO public.crm_lead_events
           (lead_id,event_type,outcome,notes,channel,contact_id,contact_name_snapshot,
            called_phone,next_action,next_action_at,next_action_time,next_action_timezone,next_action_type)
         VALUES ($1,'outreach',$2,$3,$4,$5::uuid,$6,$7,$8,$9::date,$10::time,$11,$12)`,
        [id,outcome,notes.trim()||null,activity?.ok ? activity.channel : 'call',
          activityContact.id,activityContact.name,calledPhone,
          effectiveMode === 'set' ? nextAction : null,
          nextDate,nextTime,nextZone,parsedType],
      );
    }
    if (effectiveMode === 'complete' && current.next_action) {
      await client.query(
        `INSERT INTO public.crm_lead_events
           (lead_id,event_type,action,notes,contact_id)
         VALUES ($1,'action_completed',$2,$3,$4::uuid)`,
        [id,current.next_action,hasOutcome?null:notes.trim()||null,
         current.next_action_contact_id],
      );
    }
    if (disposition !== 'keep') {
      await client.query(
        `INSERT INTO public.crm_lead_events (lead_id,event_type,action,notes)
         VALUES ($1,'classification_changed',$2,$3)`,
        [id,disposition === 'competitor' ? 'Classified as competitor' : 'Marked Do Not Contact',
         hasOutcome ? null : notes.trim() || null],
      );
    }
    if (!hasOutcome && disposition === 'keep' && effectiveMode !== 'complete' && notes.trim()) {
      await client.query(
        `INSERT INTO public.crm_lead_events (lead_id,event_type,notes)
         VALUES ($1,'note_added',$2)`,[id,notes.trim()],
      );
    }
    if (willChangeFollowup) {
      await client.query(
        `INSERT INTO public.crm_followup_changes
          (lead_id,previous_action,previous_date,previous_time,previous_timezone,
           next_action,next_action_at,next_action_time,next_action_timezone,
           next_action_due_at,contact_id,contact_name_snapshot,next_action_type)
         VALUES ($1,$2,$3::date,$4::time,$5,$6,$7::date,$8::time,$9,
           ${followupDueAtSQL(7,8,9)},$10::uuid,$11,$12)`,
        [id,current.next_action,current.next_action_at,current.next_action_time,
         current.next_action_timezone,effectiveMode==='set'?nextAction:null,
         nextDate,nextTime,nextZone,contact.id,contact.name,parsedType],
      );
    }

    if (hasOutcome || disposition !== 'keep' || stage !== current.stage || notes.trim()) {
      await client.query(
        `UPDATE public.crm_leads
           SET stage=$3,do_not_contact=$4,
               priority=CASE WHEN $5::boolean THEN 'low' ELSE priority END,
               last_outcome_v2=CASE WHEN $6::boolean THEN $7 ELSE last_outcome_v2 END,
               last_activity_channel=CASE WHEN $6::boolean THEN $8 ELSE last_activity_channel END,
               last_contacted_at=CASE WHEN $6::boolean THEN now() ELSE last_contacted_at END,
               last_notes=CASE WHEN $9::text IS NOT NULL THEN $9 ELSE last_notes END,
               updated_at=now()
         WHERE id=$1 AND user_id=$2`,
        [id,access.user.id,stage,disposition==='do_not_contact',
         disposition==='competitor',hasOutcome,outcome,
         activity?.ok ? activity.channel : null,notes.trim()||null],
      );
    }
    if (willChangeFollowup) {
      await client.query(
        `UPDATE public.crm_leads
           SET next_action=$3,next_action_at=$4::date,next_action_time=$5::time,
               next_action_timezone=$6,
               next_action_due_at=${followupDueAtSQL(4,5,6)},
               next_action_contact_id=$7::uuid,next_action_type=$8,updated_at=now()
         WHERE id=$1 AND user_id=$2`,
        [id,access.user.id,effectiveMode==='set'?nextAction:null,
         nextDate,nextTime,nextZone,contact.id,parsedType],
      );
    }
    const result = await client.query<Lead>(
      'SELECT '+LEAD_COLUMNS+' FROM public.crm_leads WHERE id=$1 AND user_id=$2',
      [id,access.user.id],
    );
    await client.query('COMMIT');
    return NextResponse.json({ok:true,lead:result.rows[0]},{
      headers:{'Cache-Control':'private, no-store'},
    });
  } catch(error) {
    if(client) await client.query('ROLLBACK').catch(() => {});
    return crmError(error);
  } finally { client?.release(); }
}
