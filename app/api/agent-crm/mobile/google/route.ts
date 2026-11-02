import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { PoolClient } from 'pg';
import { getCrmPool } from '@/lib/agent-crm/db';
import { mintMobileSession, mobileJson } from '@/lib/agent-crm/mobile-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Google rotates signing keys; jose fetches and caches its public JWKS.
// This endpoint NEVER reads Auth.js cookies or trusts a client-supplied email.
const googleKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
  { timeoutDuration: 5000, cooldownDuration: 30000 },
);

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || '0') > 10000) {
    return mobileJson({ error: 'Identity token is too large.' }, 413);
  }
  let idToken: unknown;
  try { idToken = (await request.json()).id_token; }
  catch { return mobileJson({ error: 'Invalid sign-in request.' }, 400); }

  if (typeof idToken !== 'string' || idToken.length < 100 || idToken.length > 8192 ||
    idToken.split('.').length !== 3) {
    return mobileJson({ error: 'Invalid Google identity token.' }, 401);
  }

  // This is the SAME public Web OAuth client ID used by the native Android
  // Google credential API to request an ID token. It is not a website session.
  const clientId = process.env.AUTH_GOOGLE_ID?.trim();
  if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
    console.error('[CRM_NATIVE_GOOGLE] AUTH_GOOGLE_ID missing');
    return mobileJson({ error: 'Google authentication is unavailable.' }, 503);
  }

  let email: string;
  try {
    const { payload } = await jwtVerify(idToken, googleKeys, {
      audience: clientId,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      algorithms: ['RS256'],
      clockTolerance: '30s',
    });
    if (payload.email_verified !== true || typeof payload.sub !== 'string' ||
      !payload.sub || typeof payload.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return mobileJson({ error: 'Use a verified Google account.' }, 401);
    }
    email = payload.email.trim().toLowerCase();
  } catch {
    return mobileJson({ error: 'Google could not verify this account. Please retry.' }, 401);
  }

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');
    const row = await client.query<{ id: string; name: string; email: string }>(
      `SELECT id::text AS id, full_name AS name, email
         FROM public.sales_agent_applications
        WHERE lower(email) = $1
          AND crm_access_enabled IS TRUE AND status <> 'declined'
        LIMIT 1`,
      [email],
    );
    const agent = row.rows[0];
    if (!agent) {
      await client.query('ROLLBACK');
      return mobileJson({ error: 'This Google account is not approved for the agent CRM.' }, 403);
    }
    const tokens = await mintMobileSession(client, agent.id);
    await client.query('COMMIT');
    return mobileJson({ ok: true, agent, ...tokens });
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    console.error('[CRM_NATIVE_GOOGLE]', error);
    return mobileJson({ error: 'Could not create the mobile session.' }, 503);
  } finally { client?.release(); }
}
