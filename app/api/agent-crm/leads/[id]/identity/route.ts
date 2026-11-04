import { NextResponse } from 'next/server';
import { requireCrmAgent, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { normalizeLeadIdentity } from '@/lib/agent-crm/lead-identity';
import type { Lead } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const errorResponse = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function PATCH(request: Request, { params }: Params) {
  if (!validCrmWriteOrigin(request)) return errorResponse('Invalid request origin.', 403);
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return errorResponse('Invalid lead ID.', 400);
  let input: unknown;
  try { input = await request.json(); }
  catch { return errorResponse('Invalid JSON body.', 400); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return errorResponse('Invalid lead details.', 400);
  }
  const parsed = normalizeLeadIdentity(input as Record<string, unknown>);
  if (!parsed.ok) return errorResponse(parsed.error, 400);
  try {
    const result = await getCrmPool().query<Lead>(
      `UPDATE public.crm_leads
         SET lead_title = $3, company_name = $4, updated_at = now()
         WHERE id = $1 AND agent_id = $2 RETURNING ${LEAD_COLUMNS}`,
      [id, access.agent.id, parsed.identity.lead_title, parsed.identity.company_name],
    );
    if (!result.rows[0]) return errorResponse('Lead not found.', 404);
    return NextResponse.json({ ok: true, lead: result.rows[0] },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
