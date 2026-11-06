import { NextResponse } from 'next/server';
import { requireCrmUser, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool } from '@/lib/agent-crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type InboxRow = {
  id: string; lead_id: string; title: string; body: string;
  due_at: string; read_at: string | null;
};

/** Keep read notifications as history, but do not surface canceled unread tasks. */
export async function GET(request: Request) {
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  const params = new URL(request.url).searchParams;
  const rawLimit = params.get('limit') || '50';
  const rawOffset = params.get('offset') || '0';
  if (!/^\d+$/.test(rawLimit) || !/^\d+$/.test(rawOffset)) {
    return NextResponse.json({ ok: false, error: 'Invalid pagination.' }, { status: 400 });
  }
  const limit = Number(rawLimit), offset = Number(rawOffset);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isSafeInteger(offset) || offset < 0 || offset > 100000) {
    return NextResponse.json({ ok: false, error: 'Invalid pagination.' }, { status: 400 });
  }
  try {
    const rows = await getCrmPool().query<InboxRow>(
      `SELECT id::text, lead_id::text, title, body, due_at, read_at
         FROM public.crm_notifications
        WHERE user_id = $1 AND due_at <= now()
          AND (canceled_at IS NULL OR read_at IS NOT NULL)
        ORDER BY due_at DESC, id DESC LIMIT $2 OFFSET $3`,
      [access.user.id, limit + 1, offset],
    );
    return NextResponse.json({
      ok: true, notifications: rows.rows.slice(0, limit),
      has_more: rows.rows.length > limit, offset, limit,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
