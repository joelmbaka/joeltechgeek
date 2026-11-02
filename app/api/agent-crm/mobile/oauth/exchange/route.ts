import type { PoolClient } from 'pg';
import { getCrmPool } from '@/lib/agent-crm/db';
import { digestToken, getActiveAgentById, mintMobileSession, mobileJson, pkceChallenge } from '@/lib/agent-crm/mobile-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 2048)
    return mobileJson({ error: 'Invalid request size.' }, 413);

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return mobileJson({ error: 'Invalid sign-in request.' }, 400); }

  if (typeof body?.code !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.code) ||
    typeof body?.verifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(body.verifier)) {
    return mobileJson({ error: 'Invalid authorization details.' }, 400);
  }
  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const found = await client.query<{ agent_id: string; challenge: string }>(
      \`SELECT agent_id::text, challenge FROM public.crm_mobile_auth_codes
       WHERE code_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE\`,
      [digestToken(body.code)],
    );
    if (!found.rows[0] || found.rows[0].challenge !== pkceChallenge(body.verifier)) {
      await client.query('ROLLBACK');
      return mobileJson({ error: 'Google sign-in expired. Please start again.' }, 401);
    }
    const agent = await getActiveAgentById(found.rows[0].agent_id, client);
    if (!agent) {
      await client.query('ROLLBACK');
      return mobileJson({ error: 'This Google account is no longer authorized.' }, 403);
    }
    await client.query('UPDATE public.crm_mobile_auth_codes SET used_at = now() WHERE code_hash = $1', [digestToken(body.code)]);
    const tokens = await mintMobileSession(client, agent.id);
    await client.query('COMMIT');
    return mobileJson({ ok: true, agent, ...tokens });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('[CRM_OAUTH_EXCHANGE]', error);
    return mobileJson({ error: 'Unable to complete Google sign-in.' }, 503);
  } finally { client?.release(); }
}
