import { NextResponse } from 'next/server';
import { requireCrmAgent, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { normalizeLeadIdentity } from '@/lib/agent-crm/lead-identity';
import type { Lead } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Edits the optional company name; contacts are edited through contact endpoints.
 * A company cannot be cleared unless the existing primary contact has a name.
 */
export async function PATCH(request: Request, { params }: Params) {
  if (!validCrmWriteOrigin(request)) return fail('Invalid request origin.', 403);
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return fail('Invalid lead ID.', 400);
  let input: unknown;
  try { input = await request.json(); }
  catch { return fail('Invalid JSON body.', 400); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return fail('Invalid lead details.', 400);
  }
  const company = (input as Record<string, unknown>).company_name;
  if (typeof company !== 'string') return fail('Company name must be text.', 400);
  if (company.length > 180) return fail('Company name must be 180 characters or fewer.', 400);
  try {
    const db = getCrmPool();
    const stored = await db.query<{ contact_name: string | null }>(
      'SELECT contact_name FROM public.crm_leads WHERE id = $1 AND agent_id = $2',
      [id, access.agent.id],
    );
    if (!stored.rows[0]) return fail('Lead not found.', 404);
    const parsed = normalizeLeadIdentity({
      company_name: company, contact_name: stored.rows[0].contact_name,
    });
    if (!parsed.ok) return fail(parsed.error, 400);
    const result = await db.query<Lead>(
      `UPDATE public.crm_leads
         SET company_name = $3, updated_at = now()
         WHERE id = $1 AND agent_id = $2
           AND ($3::text <> '' OR NULLIF(btrim(coalesce(contact_name, '')), '') IS NOT NULL)
         RETURNING ${LEAD_COLUMNS}`,
      [id, access.agent.id, parsed.identity.company_name],
    );
    if (!result.rows[0]) return fail('Company or contact name required.', 409);
    return NextResponse.json({ ok: true, lead: result.rows[0] },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
