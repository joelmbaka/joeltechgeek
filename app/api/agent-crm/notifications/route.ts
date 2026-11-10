import { NextResponse } from 'next/server';
import { requireCrmUser, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool } from '@/lib/agent-crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type InboxRow = {
  id: string; lead_id: string; title: string; body: string;
  due_at: string; read_at: string | null;
};

/** Independently page due unread reminders and the last seven days of read history. */
export async function GET(request: Request) {
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  const params = new URL(request.url).searchParams;
  const section = params.get('section') || 'unread';
  if (section !== 'unread' && section !== 'read') {
    return NextResponse.json({ ok: false, error: 'Invalid notification section.' }, { status: 400 });
  }
  const rawLimit = params.get('limit') || '25';
  const rawOffset = params.get('offset') || '0';
  if (!/^\d+$/.test(rawLimit) || !/^\d+$/.test(rawOffset)) {
    return NextResponse.json({ ok: false, error: 'Invalid pagination.' }, { status: 400 });
  }
  const limit = Number(rawLimit), offset = Number(rawOffset);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isSafeInteger(offset) || offset < 0) {
    return NextResponse.json({ ok: false, error: 'Invalid pagination.' }, { status: 400 });
  }
  // Read history is bounded by read_at (not the original due date). No
  // retention cap or deletion: only the inbox presentation is time-limited.
  const stateFilter = section === 'unread'
    ? 'AND read_at IS NULL AND canceled_at IS NULL'
    : "AND read_at IS NOT NULL AND read_at >= now() - INTERVAL '7 days'";
  const ordering = section === 'unread'
    ? 'due_at ASC, id ASC' : 'read_at DESC, id DESC';
  try {
    const rows = await getCrmPool().query<InboxRow>(
      `SELECT id::text, lead_id::text, title, body, due_at, read_at
         FROM public.crm_notifications
        WHERE user_id = $1 AND due_at <= now()
          AND (canceled_at IS NULL OR read_at IS NOT NULL)
          ${stateFilter}
        ORDER BY ${ordering} LIMIT $2 OFFSET $3`,
      [access.user.id, limit + 1, offset],
    );
    return NextResponse.json({
      ok: true, section, notifications: rows.rows.slice(0, limit),
      has_more: rows.rows.length > limit, offset, limit,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
