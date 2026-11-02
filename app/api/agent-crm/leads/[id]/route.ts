import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { CALL_OUTCOMES, LEAD_STAGES } from '@/lib/agent-crm/types';
import type { CallOutcome, Lead, LeadStage, LeadUpdate } from '@/lib/agent-crm/types';

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

export async function GET(_request: Request, { params }: Params) {
  const access = await requireCrmAgent();
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
    const history = await db.query<LeadUpdate>(
      `SELECT id::text AS id, outcome, notes, next_action,
               next_action_at::text AS next_action_at, created_at
         FROM public.crm_lead_updates
         WHERE lead_id = $1 AND agent_id = $2
         ORDER BY created_at DESC LIMIT 30`,
      [id, access.agent.id],
    );
    return NextResponse.json(
      { ok: true, lead: lead.rows[0], history: history.rows },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return crmError(error);
  }
}

function nextStage(previous: LeadStage, outcome: CallOutcome): LeadStage {
  if (outcome === 'interested') return 'interested';
  if (outcome === 'meeting_booked') return 'meeting';
  if (outcome === 'not_interested') return 'lost';
  if (previous === 'new') return 'contacted';
  return previous;
}

export async function PATCH(request: Request, { params }: Params) {
  // Defense in depth for same-site cookie authorization.
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return response('Invalid request origin.', 403);
  }
  const access = await requireCrmAgent();
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
  const dueDate = body.next_action_at;
  const stageOverride = body.stage;
  const optOut = body.do_not_contact === true;

  if (typeof outcome !== 'string' || !CALL_OUTCOMES.some((x) => x === outcome)) {
    return response('Choose a valid call outcome.', 400);
  }
  if (typeof notes !== 'string' || notes.length > 2500 ||
      typeof nextAction !== 'string' || nextAction.length > 300 ||
      (stageOverride !== undefined && (typeof stageOverride !== 'string' ||
        !LEAD_STAGES.some((s) => s === stageOverride)))) {
    return response('Please check the notes, next action, and stage.', 400);
  }
  if (dueDate !== null && dueDate !== '' && (
    typeof dueDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
    Number.isNaN(Date.parse(dueDate)) ||
    new Date(dueDate).toISOString().slice(0, 10) !== dueDate
  )) {
    return response('Please choose a valid follow-up date.', 400);
  }

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const lock = await client.query<{ stage: LeadStage; do_not_contact: boolean }>(
      `SELECT stage, do_not_contact FROM public.crm_leads
         WHERE id = $1 AND agent_id = $2 FOR UPDATE`,
      [id, access.agent.id],
    );
    const current = lock.rows[0];
    if (!current) {
      await client.query('ROLLBACK');
      return response('Lead not found.', 404);
    }
    if (current.do_not_contact) {
      await client.query('ROLLBACK');
      return response('This lead is marked Do Not Contact.', 409);
    }

    const stage = optOut ? 'do_not_contact' :
      (typeof stageOverride === 'string' && stageOverride !== 'new'
        ? stageOverride as LeadStage
        : nextStage(current.stage, outcome as CallOutcome));
    const note = notes.trim() || null;
    const action = optOut ? null : nextAction.trim() || null;
    const date = optOut ? null : typeof dueDate === 'string' && dueDate ? dueDate : null;

    await client.query(
      `UPDATE public.crm_leads
         SET last_outcome = $3, last_notes = $4, next_action = $5,
             next_action_at = $6::date, last_contacted_at = now(),
             do_not_contact = $7, stage = $8, updated_at = now()
         WHERE id = $1 AND agent_id = $2`,
      [id, access.agent.id, outcome, note, action, date, optOut, stage],
    );
    await client.query(
      `INSERT INTO public.crm_lead_updates
         (lead_id, agent_id, outcome, notes, next_action, next_action_at)
         VALUES ($1,$2,$3,$4,$5,$6::date)`,
      [id, access.agent.id, outcome, note, action, date],
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
