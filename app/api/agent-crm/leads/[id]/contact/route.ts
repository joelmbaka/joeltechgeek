import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { parseContactFields, syncPrimaryContact } from '@/lib/agent-crm/contacts';
import type { Lead } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (error: string, status: number) => NextResponse.json(
  { ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } },
);

/** Legacy primary-contact edit endpoint kept for already-published Android clients. */
export async function PATCH(request: Request, { params }: Params) {
  if (!validCrmWriteOrigin(request)) return fail('Invalid request origin.', 403);
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return fail('Invalid lead ID.', 400);

  let payload: Record<string, unknown>;
  try { payload = await request.json() as Record<string, unknown>; }
  catch { return fail('Invalid contact data.', 400); }
  const parsed = parseContactFields({
    name: payload?.contact_name, role: payload?.contact_role,
    phone: payload?.phone, email: payload?.email,
  });
  if (!parsed.ok) return fail(parsed.error, 400);

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const lead = await client.query<{ id: string; company_name: string }>(
      `SELECT id::text, company_name FROM public.crm_leads
         WHERE id = $1 AND agent_id = $2
           AND NOT do_not_contact AND stage <> 'competitor'
         FOR UPDATE`, [id, access.agent.id],
    );
    if (!lead.rows.length) {
      await client.query('ROLLBACK');
      return fail('Lead not found or contacts are read-only.', 404);
    }
    if (!lead.rows[0].company_name.trim() && !parsed.fields.name?.trim()) {
      await client.query('ROLLBACK');
      return fail('Company or contact name required.', 400);
    }
    const primary = await client.query<{ id: string }>(
      'SELECT id::text FROM public.crm_lead_contacts WHERE lead_id = $1 AND is_primary = true LIMIT 1',
      [id],
    );
    const { name, role, phone, email } = parsed.fields;
    if (primary.rows.length) {
      await client.query(
        'UPDATE public.crm_lead_contacts SET name=$2, role=$3, phone=$4, email=$5, updated_at=now() WHERE id=$1',
        [primary.rows[0].id, name, role, phone, email],
      );
    } else {
      await client.query(
        'INSERT INTO public.crm_lead_contacts (lead_id, name, role, phone, email, is_primary) VALUES ($1,$2,$3,$4,$5,true)',
        [id, name, role, phone, email],
      );
    }
    await syncPrimaryContact(client, id);
    const updated = await client.query<Lead>(
      'SELECT ' + LEAD_COLUMNS + ' FROM public.crm_leads WHERE id = $1 AND agent_id = $2',
      [id, access.agent.id],
    );
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, lead: updated.rows[0] }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    return crmError(error);
  } finally { client?.release(); }
}
