import { NextResponse } from 'next/server';
import { requireCrmAgent, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import type { Lead } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: Params) {
  if (!validCrmWriteOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid lead ID.' }, { status: 400 });
  let body: Record<string,unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid contact data.' }, { status: 400 }); }
  const limits: Record<string,number> = { contact_name: 150, contact_role: 120, phone: 40, email: 254 };
  const values: string[] = [];
  for (const [field, limit] of Object.entries(limits)) {
    const value = body[field] ?? '';
    if (typeof value !== 'string' || value.length > limit)
      return NextResponse.json({ error: 'Invalid ' + field }, { status: 400 });
    values.push(value.trim());
  }
  if (values[3] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[3]))
    return NextResponse.json({ error: 'Invalid contact email.' }, { status: 400 });
  try {
    const result = await getCrmPool().query<Lead>(
      'UPDATE public.crm_leads SET contact_name=$3, contact_role=$4, phone=$5, email=$6, updated_at=now() ' +
      'WHERE id=$1 AND agent_id=$2 AND NOT do_not_contact RETURNING ' + LEAD_COLUMNS,
      [id, access.agent.id, ...values.map((v) => v || null)],
    );
    if (!result.rows[0]) return NextResponse.json({ error: 'Lead not found or contact disabled.' }, { status: 404 });
    return NextResponse.json({ ok: true, lead: result.rows[0] }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) { return crmError(error); }
}
