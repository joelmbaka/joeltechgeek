import type { PoolClient } from 'pg';
import { getCrmPool } from '@/lib/agent-crm/db';
import { randomToken, digestToken, issueAccessToken, getActiveAgentById, mobileJson } from '@/lib/agent-crm/mobile-auth';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  let refreshToken: unknown;
  try { refreshToken = (await request.json()).refresh_token; } catch { return mobileJson({ error: 'Invalid request.' }, 400); }
  if (typeof refreshToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(refreshToken))
    return mobileJson({ error: 'Invalid session.' }, 401);

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const found = await client.query<{ id: string; agent_id: string }>(
      `SELECT id::text, agent_id::text FROM public.crm_mobile_sessions
       WHERE refresh_hash = $1 AND revoked_at IS NULL AND expires_at > now() FOR UPDATE`,
      [digestToken(refreshToken)],
    );
    const session = found.rows[0];
    if (!session) { await client.query('ROLLBACK'); return mobileJson({ error: 'Session expired.' }, 401); }
    const agent = await getActiveAgentById(session.agent_id, client);
    if (!agent) { await client.query('ROLLBACK'); return mobileJson({ error: 'Agent access revoked.' }, 403); }
    const nextToken = randomToken();
    await client.query(
      `UPDATE public.crm_mobile_sessions SET refresh_hash = $1, rotated_at = now()
         WHERE id = $2::uuid`,
      [digestToken(nextToken), session.id],
    );
    await client.query('COMMIT');
    return mobileJson({ ok: true, agent, access_token: issueAccessToken(session.id, agent.id),
      refresh_token: nextToken, expires_in: 900 });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('[CRM_MOBILE_REFRESH]', error);
    return mobileJson({ error: 'Could not refresh session.' }, 503);
  } finally { client?.release(); }
}
