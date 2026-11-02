import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import type { Lead } from '@/lib/agent-crm/types';

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
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return fail('Invalid request origin.', 403);
  }
  const access = await requireCrmAgent();
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
  const nextDate = body.next_action_at ?? null;
  if (typeof notes !== 'string' || notes.length > 2500 ||
      typeof nextAction !== 'string' || nextAction.length > 300) {
    return fail('Check the notes and next action.', 400);
  }
  if (nextDate !== null && nextDate !== '' && (
    typeof nextDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(nextDate) ||
    Number.isNaN(Date.parse(nextDate)) ||
    new Date(nextDate).toISOString().slice(0, 10) !== nextDate
  )) {
    return fail('Choose a valid follow-up date.', 400);
  }
  const action = nextAction.trim() || null;
  const date = typeof nextDate === 'string' && nextDate ? nextDate : null;
  if (date && !action) return fail('A follow-up date needs a next action.', 400);

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const locked = await client.query<{ next_action: string | null; do_not_contact: boolean }>(
      `SELECT next_action, do_not_contact FROM public.crm_leads
       WHERE id = $1 AND agent_id = $2 FOR UPDATE`,
      [id, access.agent.id],
    );
    const lead = locked.rows[0];
    if (!lead) {
      await client.query('ROLLBACK');
      return fail('Lead not found.', 404);
    }
    if (lead.do_not_contact) {
      await client.query('ROLLBACK');
      return fail('This lead is marked Do Not Contact.', 409);
    }
    if (!lead.next_action?.trim()) {
      await client.query('ROLLBACK');
      return fail('There is no outstanding next action to complete.', 409);
    }

    // This records completion of a task, not a new telephone call.
    await client.query(
      `INSERT INTO public.crm_lead_events
         (lead_id, agent_id, event_type, action, notes, next_action, next_action_at)
       VALUES ($1, $2, 'action_completed', $3, $4, $5, $6::date)`,
      [id, access.agent.id, lead.next_action, notes.trim() || null, action, date],
    );
    await client.query(
      `UPDATE public.crm_leads
       SET next_action = $3, next_action_at = $4::date, updated_at = now()
       WHERE id = $1 AND agent_id = $2`,
      [id, access.agent.id, action, date],
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
