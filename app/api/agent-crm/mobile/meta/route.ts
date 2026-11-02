import { NextResponse } from 'next/server';
import { requireCrmAgent } from '@/lib/agent-crm/auth';
import { CRM_INDUSTRIES } from '@/lib/agent-crm/industries';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  return NextResponse.json({ ok: true, industries: CRM_INDUSTRIES },
    { headers: { 'Cache-Control': 'private, no-store' } });
}
