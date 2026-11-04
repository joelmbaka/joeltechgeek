import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import type { Lead } from '@/lib/agent-crm/types';
import { parseFollowupSchedule, followupDueAtSQL } from '@/lib/agent-crm/followups';
import { resolveContactTarget } from '@/lib/agent-crm/contact-attribution';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(error: string, status: number) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request, { params }: Params) {
  // With cookie-backed authorization, reject cross-origin writes.
  if (!validCrmWriteOrigin(request)) {
    return fail('Invalid request origin.', 403);
  }
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return fail('Invalid lead.', 400);

  let body: Record<string, unknown>;
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return fail('Invalid action details.', 400);
    }
    body = input as Record<string, unknown>;
  } catch {
    return fail('Invalid JSON body.', 400);
  }

  const notes = body.notes ?? '';
  const nextAction = body.next_action ?? '';
  const parsed = parseFollowupSchedule(body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const schedule = parsed.value;
  if (typeof notes !== 'string' || notes.length > 2500 ||
      typeof nextAction !== 'string' || nextAction.length > 300) {
    return fail('Check the notes and next action.', 400);
  }
  const action = nextAction.trim() || null;
  if (schedule.next_action_at && !action) return fail('A follow-up date needs a next action.', 400);

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const locked = await client.query<{ next_action: string | null; next_action_contact_id: string | null; do_not_contact: boolean; stage: string }>(
      `SELECT next_action, next_action_contact_id::text, do_not_contact, stage FROM public.crm_leads
       WHERE id = $1 AND agent_id = $2 FOR UPDATE`,
      [id, access.agent.id],
    );
    const lead = locked.rows[0];
    if (!lead) {
      await client.query('ROLLBACK');
      return fail('Lead not found.', 404);
    }
    if (lead.do_not_contact || lead.stage === 'competitor') {
      await client.query('ROLLBACK');
      return fail('This record is excluded from outreach actions.', 409);
    }
    if (!lead.next_action?.trim()) {
      await client.query('ROLLBACK');
      return fail('There is no outstanding next action to complete.', 409);
    }

    // Completed activity belongs to the old scheduled target, while the new
    // follow-up can choose another contact.
    const completedContact = await resolveContactTarget(client, id, lead.next_action_contact_id);
    if (!completedContact.ok) {
      await client.query('ROLLBACK');
      return fail(completedContact.error, 400);
    }
    const nextContact = action ? await resolveContactTarget(
      client, id,
      body.next_action_contact_id !== undefined ? body.next_action_contact_id
        : lead.next_action_contact_id !== null ? lead.next_action_contact_id : undefined,
    ) : { ok: true as const, id: null, name: null };
    if (!nextContact.ok) {
      await client.query('ROLLBACK');
      return fail(nextContact.error, 400);
    }

    // This records completion of a task, not a new telephone call.
    await client.query(
      `INSERT INTO public.crm_lead_events
         (lead_id, agent_id, event_type, action, notes, next_action, next_action_at,
        next_action_time, next_action_timezone, next_action_due_at, contact_id,
        contact_name_snapshot)
       VALUES ($1, $2, 'action_completed', $3, $4, $5, $6::date,
         $7::time, $8, ${followupDueAtSQL(6, 7, 8)}, $9::uuid, $10)`,
      [id, access.agent.id, lead.next_action, notes.trim() || null, action,
        schedule.next_action_at, schedule.next_action_time, schedule.next_action_timezone,
        completedContact.id, completedContact.name],
    );
    await client.query(
      `UPDATE public.crm_leads
       SET next_action = $3, next_action_at = $4::date,
           next_action_time = $5::time, next_action_timezone = $6,
           next_action_due_at = ${followupDueAtSQL(4, 5, 6)},
           next_action_contact_id = $7::uuid, updated_at = now()
       WHERE id = $1 AND agent_id = $2`,
      [id, access.agent.id, action, schedule.next_action_at,
        schedule.next_action_time, schedule.next_action_timezone, nextContact.id],
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
