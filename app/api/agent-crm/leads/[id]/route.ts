import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { CONTACT_COLUMNS } from '@/lib/agent-crm/contacts';
import { resolveContactTarget } from '@/lib/agent-crm/contact-attribution';
import type { LeadContact } from '@/lib/agent-crm/types';
import { CALL_OUTCOMES, LEAD_STAGES, stageForOutcome } from '@/lib/agent-crm/types';
import type { CallOutcome, Lead, LeadStage, LeadUpdate } from '@/lib/agent-crm/types';
import { parseFollowupSchedule, followupDueAtSQL } from '@/lib/agent-crm/followups';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function response(error: string, status: number) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function GET(request: Request, { params }: Params) {
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return response('Invalid lead.', 400);
  try {
    const db = getCrmPool();
    const lead = await db.query<Lead>(
      'SELECT ' + LEAD_COLUMNS +
      ' FROM public.crm_leads WHERE id = $1 AND agent_id = $2',
      [id, access.agent.id],
    );
    if (!lead.rows[0]) return response('Lead not found.', 404);
    // Preserve the original call log and merge it with the new outcome/action
    // timeline without modifying historical rows.
    const [history, contacts] = await Promise.all([
      db.query<LeadUpdate>(
      `SELECT * FROM (
         SELECT id::text AS id, 'outreach'::text AS event_type,
                outcome::text AS outcome, NULL::text AS action,
                notes, next_action, next_action_at::text AS next_action_at,
                NULL::text AS next_action_time, NULL::text AS next_action_timezone,
                NULL::uuid AS contact_id, NULL::text AS contact_name_snapshot, created_at
         FROM public.crm_lead_updates
         WHERE lead_id = $1 AND agent_id = $2
         UNION ALL
         SELECT id::text AS id, event_type::text, outcome::text,
                action, notes, next_action, next_action_at::text,
                next_action_time::text, next_action_timezone, contact_id,
                contact_name_snapshot::text, created_at
         FROM public.crm_lead_events
         WHERE lead_id = $1 AND agent_id = $2
         UNION ALL
         SELECT id::text, 'followup_updated'::text, NULL::text,
                'Follow-up updated'::text, NULL::text,
                next_action, next_action_at::text, next_action_time::text,
                next_action_timezone, contact_id, contact_name_snapshot::text, created_at
         FROM public.crm_followup_changes
         WHERE lead_id = $1 AND agent_id = $2
       ) AS timeline ORDER BY created_at DESC LIMIT 50`,
      [id, access.agent.id],
      ),
      db.query<LeadContact>(
        'SELECT ' + CONTACT_COLUMNS +
        ' FROM public.crm_lead_contacts WHERE lead_id = $1 ORDER BY is_primary DESC, created_at ASC, id ASC',
        [id],
      ),
    ]);
    return NextResponse.json(
      { ok: true, lead: lead.rows[0], history: history.rows, contacts: contacts.rows },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return crmError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  // Defense in depth for same-site cookie authorization.
  if (!validCrmWriteOrigin(request)) {
    return response('Invalid request origin.', 403);
  }
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return response('Invalid lead.', 400);

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return response('Invalid update.', 400);
    }
    body = value as Record<string, unknown>;
  } catch {
    return response('Invalid JSON body.', 400);
  }
  const outcome = body.outcome;
  const notes = body.notes;
  const nextAction = body.next_action;
  const parsed = parseFollowupSchedule(body);
  if (!parsed.ok) return response(parsed.error, 400);
  const schedule = parsed.value;
  const dueDate = schedule.next_action_at;
  const stageOverride = body.stage;
  const optOut = body.do_not_contact === true;

  if (typeof outcome !== 'string' || !CALL_OUTCOMES.some((x) => x === outcome)) {
    return response('Choose a valid call outcome.', 400);
  }
  if (typeof notes !== 'string' || notes.length > 2500 ||
      typeof nextAction !== 'string' || nextAction.length > 300 ||
      (stageOverride !== undefined && (typeof stageOverride !== 'string' ||
        !LEAD_STAGES.some((s) => s === stageOverride) || stageOverride === 'competitor'))) {
    return response('Please check the notes, next action, and stage.', 400);
  }
  if (dueDate && !optOut && !nextAction.trim()) {
    return response('Enter a next action for the selected date.', 400);
  }

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const lock = await client.query<{ stage: LeadStage; do_not_contact: boolean; next_action_contact_id: string | null }>(
      `SELECT stage, do_not_contact, next_action_contact_id::text FROM public.crm_leads
         WHERE id = $1 AND agent_id = $2 FOR UPDATE`,
      [id, access.agent.id],
    );
    const current = lock.rows[0];
    if (!current) {
      await client.query('ROLLBACK');
      return response('Lead not found.', 404);
    }
    if (current.do_not_contact || current.stage === 'competitor') {
      await client.query('ROLLBACK');
      return response('This record is excluded from outreach.', 409);
    }

    const callContact = await resolveContactTarget(client, id, body.contact_id);
    if (!callContact.ok) {
      await client.query('ROLLBACK');
      return response(callContact.error, 400);
    }
    const actionContact = optOut || !nextAction.trim()
      ? { ok: true as const, id: null, name: null }
      : await resolveContactTarget(
          client, id,
          body.next_action_contact_id !== undefined
            ? body.next_action_contact_id
            : current.next_action ? current.next_action_contact_id : undefined,
        );
    if (!actionContact.ok) {
      await client.query('ROLLBACK');
      return response(actionContact.error, 400);
    }

    const stage = optOut ? 'do_not_contact' :
      (typeof stageOverride === 'string' && stageOverride !== 'new'
        ? stageOverride as LeadStage
        : stageForOutcome(current.stage, outcome as CallOutcome));
    const note = notes.trim() || null;
    const action = optOut ? null : nextAction.trim() || null;
    const date = optOut ? null : dueDate;
    const time = optOut ? null : schedule.next_action_time;
    const timezone = optOut ? null : schedule.next_action_timezone;

    await client.query(
      `UPDATE public.crm_leads
         SET last_outcome_v2 = $3, last_notes = $4, next_action = $5,
             next_action_at = $6::date, next_action_time = $9::time,
             next_action_timezone = $10, next_action_due_at = ${followupDueAtSQL(6, 9, 10)},
             last_contacted_at = now(), do_not_contact = $7, stage = $8,
             next_action_contact_id = $11::uuid, updated_at = now()
         WHERE id = $1 AND agent_id = $2`,
      [id, access.agent.id, outcome, note, action, date, optOut, stage, time, timezone, actionContact.id],
    );
    await client.query(
      `INSERT INTO public.crm_lead_events
         (lead_id, agent_id, event_type, outcome, notes, next_action, next_action_at,
          next_action_time, next_action_timezone, next_action_due_at,
          contact_id, contact_name_snapshot)
         VALUES ($1,$2,'outreach',$3,$4,$5,$6::date,$7::time,$8,
           ${followupDueAtSQL(6, 7, 8)},$9::uuid,$10)`,
      [id, access.agent.id, outcome, note, action, date, time, timezone,
        callContact.id, callContact.name],
    );
    const result = await client.query<Lead>(
      'SELECT ' + LEAD_COLUMNS + ' FROM public.crm_leads WHERE id = $1 AND agent_id = $2',
      [id, access.agent.id],
    );
    await client.query('COMMIT');
    return NextResponse.json(
      { ok: true, lead: result.rows[0] },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch { /* connection failed */ }
    }
    return crmError(error);
  } finally {
    client?.release();
  }
}
