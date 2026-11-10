import { NextResponse } from 'next/server';
import { requireCrmUser, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool } from '@/lib/agent-crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The server clock, not Android's notification drawer, determines due/unread. */
export async function GET(request: Request) {
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  try {
    const result = await getCrmPool().query<{count: number}>(
      `SELECT count(*)::int AS count FROM public.crm_notifications
        WHERE user_id = $1 AND due_at <= now()
          AND canceled_at IS NULL AND read_at IS NULL`,
      [access.user.id],
    );
    return NextResponse.json({ ok: true, count: result.rows[0]?.count ?? 0 },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
