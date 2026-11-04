import type { PoolClient } from 'pg';
import { getCrmPool } from '@/lib/agent-crm/db';
import { mintMobileSession, mobileJson } from '@/lib/agent-crm/mobile-auth';
import { PLAY_REVIEW_AGENT_EMAIL, playReviewEnabled } from '@/lib/agent-crm/play-review';
import type { CrmUser } from '@/lib/agent-crm/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Discoverability only. Review access is controlled by the server, never by a
 * build-time secret in the APK. Feature is OFF unless both env values are valid.
 */
export function GET() {
  return mobileJson({ ok: true, enabled: playReviewEnabled() });
}

/**
 * Public one-tap review login. Does NOT impersonate Joel or access real leads.
 * Session is a normal agent-scoped mobile session for a synthetic demo agent.
 * Android Play reviewers can use it without Google, OTP, account credentials,
 * device-bound permissions, or location restrictions.
 */
export async function POST() {
  if (!playReviewEnabled()) return mobileJson({ error: 'Review access is disabled.' }, 403);

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const match = await client.query<CrmUser>(
      `SELECT id::text, full_name AS name, email, phone, picture_url
         FROM public.crm_users WHERE lower(email) = $1 AND is_active=true LIMIT 1`,
      [PLAY_REVIEW_AGENT_EMAIL],
    );
    const user = match.rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return mobileJson({ error: 'Review workspace is not initialized.' }, 503);
    }
    // Check a second time in case the server setting changes before committing.
    if (!playReviewEnabled()) {
      await client.query('ROLLBACK');
      return mobileJson({ error: 'Review access is disabled.' }, 403);
    }
    const tokens = await mintMobileSession(client, user.id);
    await client.query('COMMIT');
    return mobileJson({ ok: true, user, agent: user, ...tokens });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('[CRM_PLAY_REVIEW]', error);
    return mobileJson({ error: 'Review sign-in is unavailable.' }, 503);
  } finally {
    client?.release();
  }
}
