import { NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/agent-crm/auth';
import { getBusinessCategories } from '@/lib/agent-crm/categories';
import { crmError } from '@/lib/agent-crm/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  try {
    const industries = await getBusinessCategories(access.user.id);
    return NextResponse.json({ ok: true, industries },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
