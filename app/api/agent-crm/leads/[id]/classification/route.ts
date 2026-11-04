import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmUser, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import type { Lead } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error },
    { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Classify a business as a competitor or reopen it as a prospect.
 *  This is not an outreach event and never changes last_contacted_at.
 */
export async function PATCH(request: Request, { params }: Params) {
  if (!validCrmWriteOrigin(request)) return fail('Invalid request origin.', 403);
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return fail('Invalid lead.', 400);

  let body: Record<string, unknown>;
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return fail('Invalid classification.', 400);
    body = input as Record<string, unknown>;
  } catch {
    return fail('Invalid JSON body.', 400);
  }

  const status = body.status;
  const note = body.notes ?? '';
  if ((status !== 'competitor' && status !== 'new') ||
      typeof note !== 'string' || note.length > 800)
    return fail('Choose a valid status and brief reason.', 400);

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const locked = await client.query<{ stage: string; do_not_contact: boolean }>(
      `SELECT stage, do_not_contact FROM public.crm_leads
       WHERE id = $1 AND user_id = $2 FOR UPDATE`, [id, access.user.id],
    );
    const current = locked.rows[0];
    if (!current) {
      await client.query('ROLLBACK');
      return fail('Lead not found.', 404);
    }
    if (current.do_not_contact && current.stage !== 'competitor') {
      await client.query('ROLLBACK');
      return fail('Do Not Contact records cannot be reclassified here.', 409);
    }
    if ((status === 'competitor' && current.stage === 'competitor') ||
        (status === 'new' && current.stage !== 'competitor')) {
      await client.query('ROLLBACK');
      return fail('The status has not changed.', 409);
    }

    const reason = note.trim() || (status === 'competitor'
      ? 'Specialized fleet and petroleum operations software provider; retained for competitive research. Sales outreach on hold.'
      : 'Reopened as a potential sales prospect.');
    const action = status === 'competitor' ? 'Classified as competitor' : 'Reopened as prospect';
    await client.query(
      `UPDATE public.crm_leads
       SET stage = $3, priority = CASE WHEN $3 = 'competitor' THEN 'low' ELSE 'normal' END,
           do_not_contact = false,
           next_action = NULL, next_action_at = NULL, next_action_time = NULL,
           next_action_timezone = NULL, next_action_due_at = NULL,
           last_notes = concat_ws(E'\\n\\n', NULLIF(last_notes, ''), $4),
           updated_at = now()
       WHERE id = $1 AND user_id = $2`,
      [id, access.user.id, status, reason],
    );
    await client.query(
      `INSERT INTO public.crm_lead_events
       (lead_id, event_type, action, notes)
       VALUES ($1,'action_completed', $2, $3)`,
      [id, action, reason],
    );
    const result = await client.query<Lead>(
      'SELECT ' + LEAD_COLUMNS + ' FROM public.crm_leads WHERE id = $1 AND user_id = $2',
      [id, access.user.id],
    );
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, lead: result.rows[0] },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (client) { try { await client.query('ROLLBACK'); } catch { /* connection failed */ } }
    return crmError(error);
  } finally {
    client?.release();
  }
}
