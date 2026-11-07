import { NextResponse } from 'next/server';
import { requireCrmUser, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { normalizeLeadIdentity } from '@/lib/agent-crm/lead-identity';
import { canUseBusinessCategory } from '@/lib/agent-crm/categories';
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
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return fail('Invalid lead ID.', 400);
  let input: unknown;
  try { input = await request.json(); }
  catch { return fail('Invalid JSON body.', 400); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return fail('Invalid lead details.', 400);
  }
  const body = input as Record<string,unknown>;
  const company = body.company_name;
  if (typeof company !== 'string') return fail('Company name must be text.',400);
  if (company.length > 180) return fail('Company name must be 180 characters or fewer.',400);
  const limits = {industry:100,country:80,city:120,website:1000,priority:12} as const;
  const edits: Record<string,string> = {};
  for (const [field,limit] of Object.entries(limits)) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== 'string' || body[field].length > limit)
      return fail('Invalid '+field+' value.',400);
    edits[field] = body[field].trim();
  }
  if (edits.priority !== undefined && !['normal','high','low'].includes(edits.priority))
    return fail('Invalid priority.',400);
  if (edits.website) {
    try {
      const url = new URL(/^https?:\/\//i.test(edits.website) ? edits.website : 'https://' + edits.website);
      if (!['http:','https:'].includes(url.protocol) || !url.hostname || url.username || url.password)
        return fail('Invalid website URL.',400);
      edits.website = url.href;
    } catch { return fail('Invalid website URL.',400); }
  }
  if (edits.industry && !(await canUseBusinessCategory(access.user.id,edits.industry)))
    return fail('Choose a saved business category.',400);
  try {
    const db = getCrmPool();
    const stored = await db.query<{ contact_name: string | null }>(
      'SELECT contact_name FROM public.crm_leads WHERE id = $1 AND user_id = $2',
      [id, access.user.id],
    );
    if (!stored.rows[0]) return fail('Lead not found.', 404);
    const parsed = normalizeLeadIdentity({
      company_name: company, contact_name: stored.rows[0].contact_name,
    });
    if (!parsed.ok) return fail(parsed.error, 400);
    const columns = ['company_name'];
    const values: string[] = [parsed.identity.company_name];
    for (const field of ['industry','country','city','website','priority'] as const) {
      if (edits[field] === undefined) continue;
      columns.push(field); values.push(edits[field]);
    }
    const assignments = columns.map((column,index)=>column+'=
    if (!result.rows[0]) return fail('Company or contact name required.', 409);
    return NextResponse.json({ ok: true, lead: result.rows[0] },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
+(index+3)).join(',');
    const result = await db.query<Lead>(
      `UPDATE public.crm_leads SET ${assignments},updated_at=now()
         WHERE id=$1 AND user_id=$2
           AND ($3::text <> '' OR NULLIF(btrim(coalesce(contact_name, '')), '') IS NOT NULL)
         RETURNING ${LEAD_COLUMNS}`,
      [id,access.user.id,...values],
    );
    if (!result.rows[0]) return fail('Company or contact name required.', 409);
    return NextResponse.json({ ok: true, lead: result.rows[0] },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
