import { getCrmPool } from '@/lib/agent-crm/db';
import { digestToken, mobileJson } from '@/lib/agent-crm/mobile-auth';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  let token: unknown;
  try { token = (await request.json()).refresh_token; } catch { return mobileJson({ ok: true }); }
  if (typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    try {
      await getCrmPool().query(
        'UPDATE public.crm_mobile_sessions SET revoked_at = now() WHERE refresh_hash = $1 AND revoked_at IS NULL',
        [digestToken(token)],
      );
    } catch (error) { console.error('[CRM_MOBILE_LOGOUT]', error); return mobileJson({ error: 'Unable to sign out.' }, 503); }
  }
  return mobileJson({ ok: true });
}
