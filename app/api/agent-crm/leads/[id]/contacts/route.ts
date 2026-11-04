import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool } from '@/lib/agent-crm/db';
import { CONTACT_COLUMNS, parseContactFields, syncPrimaryContact } from '@/lib/agent-crm/contacts';
import type { LeadContact } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

export async function GET(request: Request, { params }: Params) {
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return fail('Invalid lead ID.', 400);
  try {
    const result = await getCrmPool().query<LeadContact>(
      `SELECT ${CONTACT_COLUMNS} FROM public.crm_lead_contacts c
         WHERE c.lead_id = $1 AND EXISTS
           (SELECT 1 FROM public.crm_leads l WHERE l.id = c.lead_id AND l.agent_id = $2)
         ORDER BY is_primary DESC, created_at, id`, [id, access.agent.id],
    );
    return NextResponse.json({ ok: true, contacts: result.rows }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}

export async function POST(request: Request, { params }: Params) {
  if (!validCrmWriteOrigin(request)) return fail('Invalid request origin.', 403);
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return fail('Invalid lead ID.', 400);
  let input: unknown;
  try { input = await request.json(); }
  catch { return fail('Invalid JSON body.', 400); }
  const parsed = parseContactFields(input);
  if (!parsed.ok) return fail(parsed.error, 400);

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    // Lock the parent to serialize primary selection with all other contact writes.
    const lead = await client.query<{ id: string; company_name: string }>(
      `SELECT id::text, company_name FROM public.crm_leads WHERE id=$1 AND agent_id=$2
         AND NOT do_not_contact AND stage <> 'competitor' FOR UPDATE`,
      [id, access.agent.id],
    );
    if (!lead.rows.length) {
      await client.query('ROLLBACK');
      return fail('Lead not found or contacts are read-only.', 404);
    }
    const hasPrimary = await client.query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM public.crm_lead_contacts WHERE lead_id=$1 AND is_primary=true) AS exists', [id],
    );
    const isPrimary = !hasPrimary.rows[0]?.exists;
    const { name, role, phone, email } = parsed.fields;
    if (isPrimary && !lead.rows[0].company_name.trim() && !name?.trim()) {
      await client.query('ROLLBACK');
      return fail('Company or contact name required.', 400);
    }
    const added = await client.query<LeadContact>(
      `INSERT INTO public.crm_lead_contacts (lead_id,name,role,phone,email,is_primary)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${CONTACT_COLUMNS}`,
      [id, name, role, phone, email, isPrimary],
    );
    if (isPrimary) await syncPrimaryContact(client, id);
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, contact: added.rows[0] }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    return crmError(error);
  } finally { client?.release(); }
}
