import { NextResponse } from 'next/server';
import { requireCrmUser, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool } from '@/lib/agent-crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Params = { params: Promise<{id: string}> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: Params) {
  if (!validCrmWriteOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Invalid origin.' }, { status: 403 });
  }
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid notification.' }, { status: 400 });
  }
  try {
    const result = await getCrmPool().query<{id: string}>(
      `UPDATE public.crm_notifications
          SET read_at = COALESCE(read_at, now())
        WHERE id = $1::uuid AND user_id = $2::uuid AND due_at <= now()
          AND (canceled_at IS NULL OR read_at IS NOT NULL)
        RETURNING id::text`,
      [id, access.user.id],
    );
    if (!result.rows[0]) {
      return NextResponse.json({ ok: false, error: 'Notification not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ ok: true, id: result.rows[0].id },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
