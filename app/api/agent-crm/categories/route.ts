import { NextResponse } from 'next/server';
import { requireCrmUser, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getBusinessCategories } from '@/lib/agent-crm/categories';
import { getCrmPool } from '@/lib/agent-crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  try {
    const categories = await getBusinessCategories(access.user.id);
    return NextResponse.json({ ok: true, categories },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}

export async function POST(request: Request) {
  if (!validCrmWriteOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Invalid request origin.' }, { status: 403 });
  }
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  let name: string;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        typeof (body as { name?: unknown }).name !== 'string') {
      return NextResponse.json({ ok: false, error: 'Enter a category name.' }, { status: 400 });
    }
    name = ((body as { name: string }).name).trim().replace(/\s+/g, ' ');
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid category request.' }, { status: 400 });
  }
  if (!name || name.length > 100 || ['all', '__uncategorized__'].includes(name.toLowerCase())) {
    return NextResponse.json({ ok: false, error: 'Enter a valid category name (up to 100 characters).' }, { status: 400 });
  }
  try {
    // Reuse a category already saved or assigned by this user instead of duplicating it.
    const existing = (await getBusinessCategories(access.user.id))
      .find((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existing) return NextResponse.json({ ok: true, category: existing },
      { headers: { 'Cache-Control': 'private, no-store' } });
    const db = getCrmPool();
    await db.query(
      'INSERT INTO public.crm_business_categories (user_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [access.user.id, name],
    );
    const stored = await db.query<{ name: string }>(
      'SELECT name FROM public.crm_business_categories WHERE user_id = $1 AND lower(btrim(name)) = lower($2) LIMIT 1',
      [access.user.id, name],
    );
    return NextResponse.json({ ok: true, category: stored.rows[0]?.name || name },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
