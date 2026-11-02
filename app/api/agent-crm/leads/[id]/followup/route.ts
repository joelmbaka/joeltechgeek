import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { parseFollowupSchedule, followupDueAtSQL } from '@/lib/agent-crm/followups';
import type { Lead } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Schedule/edit follow-up independently of call outcomes. */
export async function PATCH(request: Request, { params }: Params) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return fail('Invalid request origin.', 403);
  const access = await requireCrmAgent();
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return fail('Invalid lead.', 400);

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Invalid follow-up.', 400);
    body = value as Record<string, unknown>;
  } catch { return fail('Invalid JSON body.', 400); }

  if (typeof body.next_action !== 'string' || body.next_action.length > 300)
    return fail('Please check the next action.', 400);
  const action = body.next_action.trim() || null;
  const parsed = parseFollowupSchedule(body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const schedule = parsed.value;
  if (schedule.next_action_at && !action) return fail('Enter an action for the follow-up date.', 400);

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const locked = await client.query<{
      do_not_contact: boolean;
      next_action: string | null;
      next_action_at: string | null;
      next_action_time: string | null;
      next_action_timezone: string | null;
    }>(
      `SELECT do_not_contact, next_action, next_action_at::text,
         next_action_time::text, next_action_timezone
       FROM public.crm_leads WHERE id = $1 AND agent_id = $2 FOR UPDATE`,
      [id, access.agent.id],
    );
    const current = locked.rows[0];
    if (!current) { await client.query('ROLLBACK'); return fail('Lead not found.', 404); }
    if (current.do_not_contact) {
      await client.query('ROLLBACK');
      return fail('This lead is marked Do Not Contact.', 409);
    }
    const unchanged = current.next_action === action &&
      current.next_action_at === schedule.next_action_at &&
      (current.next_action_time?.slice(0, 5) || null) === schedule.next_action_time &&
      current.next_action_timezone === schedule.next_action_timezone;
    if (unchanged) {
      await client.query('ROLLBACK');
      return fail('There are no changes to save.', 409);
    }
    await client.query(
      `INSERT INTO public.crm_followup_changes
       (lead_id, agent_id, previous_action, previous_date, previous_time,
        previous_timezone, next_action, next_action_at, next_action_time,
        next_action_timezone, next_action_due_at)
       VALUES ($1,$2,$3,$4::date,$5::time,$6,$7,$8::date,$9::time,$10,
         ${followupDueAtSQL(8,9,10)})`,
      [id, access.agent.id, current.next_action, current.next_action_at,
        current.next_action_time, current.next_action_timezone,
        action, schedule.next_action_at, schedule.next_action_time,
        schedule.next_action_timezone],
    );
    await client.query(
      `UPDATE public.crm_leads
       SET next_action = $3, next_action_at = $4::date,
           next_action_time = $5::time, next_action_timezone = $6,
           next_action_due_at = ${followupDueAtSQL(4,5,6)}, updated_at = now()
       WHERE id = $1 AND agent_id = $2`,
      [id, access.agent.id, action, schedule.next_action_at,
        schedule.next_action_time, schedule.next_action_timezone],
    );
    const result = await client.query<Lead>(
      'SELECT ' + LEAD_COLUMNS + ' FROM public.crm_leads WHERE id = $1 AND agent_id = $2',
      [id, access.agent.id],
    );
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, lead: result.rows[0] },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (client) { try { await client.query('ROLLBACK'); } catch { /* connection unavailable */ } }
    return crmError(error);
  } finally { client?.release(); }
}
