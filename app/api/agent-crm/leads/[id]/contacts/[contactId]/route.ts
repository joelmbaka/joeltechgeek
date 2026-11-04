import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool } from '@/lib/agent-crm/db';
import { CONTACT_COLUMNS, parseContactFields, syncPrimaryContact } from '@/lib/agent-crm/contacts';
import type { LeadContact } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ id: string; contactId: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

async function updateContact(request: Request, params: Params, method: 'PATCH' | 'DELETE') {
  if (!validCrmWriteOrigin(request)) return fail('Invalid request origin.', 403);
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id, contactId } = await params.params;
  if (!UUID.test(id) || !UUID.test(contactId)) return fail('Invalid lead or contact ID.', 400);
  let fields: ReturnType<typeof parseContactFields> | null = null;
  let makePrimary = false;
  if (method === 'PATCH') {
    let body: unknown;
    try { body = await request.json(); }
    catch { return fail('Invalid JSON body.', 400); }
    fields = parseContactFields(body);
    if (!fields.ok) return fail(fields.error, 400);
    const primaryValue = (body as Record<string, unknown>).make_primary;
    if (primaryValue !== undefined && typeof primaryValue !== 'boolean')
      return fail('Invalid primary contact selection.', 400);
    makePrimary = primaryValue === true;
  }

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const lead = await client.query<{ id: string; company_name: string }>(
      `SELECT id::text, company_name FROM public.crm_leads WHERE id=$1 AND agent_id=$2
         AND NOT do_not_contact AND stage <> 'competitor' FOR UPDATE`,
      [id, access.agent.id],
    );
    if (!lead.rows.length) {
      await client.query('ROLLBACK');
      return fail('Lead not found or contacts are read-only.', 404);
    }
    const existing = await client.query<LeadContact>(
      `SELECT ${CONTACT_COLUMNS} FROM public.crm_lead_contacts WHERE id=$1 AND lead_id=$2 FOR UPDATE`,
      [contactId, id],
    );
    const contact = existing.rows[0];
    if (!contact) {
      await client.query('ROLLBACK');
      return fail('Contact not found in this lead.', 404);
    }
    if (method === 'DELETE') {
      let next: { id: string; name: string | null } | undefined;
      if (contact.is_primary) {
        const replacement = await client.query<{ id: string; name: string | null }>(
          `SELECT id::text, name FROM public.crm_lead_contacts
             WHERE lead_id=$1 AND id<>$2
             ORDER BY CASE WHEN nullif(btrim(coalesce(name,'')), '') IS NOT NULL THEN 0 ELSE 1 END,
               created_at,id LIMIT 1`,
          [id, contactId],
        );
        next = replacement.rows[0];
        if (!lead.rows[0].company_name.trim() && !next?.name?.trim()) {
          await client.query('ROLLBACK');
          return fail('Company or contact name required.', 400);
        }
      }
      await client.query('DELETE FROM public.crm_lead_contacts WHERE id=$1 AND lead_id=$2', [contactId, id]);
      if (contact.is_primary) {
        if (next) await client.query(
          'UPDATE public.crm_lead_contacts SET is_primary=true,updated_at=now() WHERE id=$1',
          [next.id],
        );
        await syncPrimaryContact(client, id);
      }
      await client.query('COMMIT');
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // PATCH requires contact fields; a user can also promote this contact.
    if (!fields || !fields.ok) return fail('Invalid contact data.', 400);
    if (makePrimary && !contact.is_primary) await client.query(
      'UPDATE public.crm_lead_contacts SET is_primary=false,updated_at=now() WHERE lead_id=$1 AND is_primary=true', [id],
    );
    const { name, role, phone, email } = fields.fields;
    if (!lead.rows[0].company_name.trim() && (contact.is_primary || makePrimary) && !name?.trim()) {
      await client.query('ROLLBACK');
      return fail('Company or contact name required.', 400);
    }
    const updated = await client.query<LeadContact>(
      `UPDATE public.crm_lead_contacts
         SET name=$3,role=$4,phone=$5,email=$6,
             is_primary=CASE WHEN $7::boolean THEN true ELSE is_primary END,
             updated_at=now()
         WHERE id=$1 AND lead_id=$2 RETURNING ${CONTACT_COLUMNS}`,
      [contactId, id, name, role, phone, email, makePrimary],
    );
    if (contact.is_primary || makePrimary) await syncPrimaryContact(client, id);
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, contact: updated.rows[0] }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    return crmError(error);
  } finally { client?.release(); }
}

export async function PATCH(request: Request, params: Params) {
  return updateContact(request, params, 'PATCH');
}
export async function DELETE(request: Request, params: Params) {
  return updateContact(request, params, 'DELETE');
}
