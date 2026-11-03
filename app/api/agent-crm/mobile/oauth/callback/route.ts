import { timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getCrmPool } from '@/lib/agent-crm/db';
import { digestToken, randomToken } from '@/lib/agent-crm/mobile-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_CALLBACK = 'joeltechgeek:///auth-callback';
const GOOGLE_CALLBACK = 'https://joeltechgeek.com/api/agent-crm/mobile/oauth/callback';
const googleKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
  { timeoutDuration: 5000, cooldownDuration: 30000 },
);

type StateRow = { code_verifier: string; nonce: string; app_challenge: string };

/** Only accept HTTPS images from Google's profile-image domain. */
function verifiedGooglePicture(candidate: unknown): string | null {
  if (typeof candidate !== 'string' || candidate.length > 2048) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' ||
        (url.hostname !== 'googleusercontent.com' &&
          !url.hostname.endsWith('.googleusercontent.com'))) return null;
    return url.toString();
  } catch { return null; }
}
function backToApp(key: 'code' | 'error', value: string) {
  // The destination is a hardcoded app scheme, never a request-supplied URL.
  const url = APP_CALLBACK + '?' + key + '=' + encodeURIComponent(value);
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
}
function stateInvalid() {
  return new Response('This Google sign-in has expired. Return to the app and try again.', {
    status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
function equals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const state = search.get('state');
  const code = search.get('code');
  const providerError = search.get('error');

  if (!state || !/^[A-Za-z0-9_-]{43}$/.test(state)) return stateInvalid();

  let row: StateRow | undefined;
  try {
    // Atomic and one-time across concurrent requests and Vercel instances.
    const claimed = await getCrmPool().query<StateRow>(
      `UPDATE public.crm_mobile_oauth_states
          SET consumed_at = now()
        WHERE state_hash = $1 AND consumed_at IS NULL AND expires_at > now()
      RETURNING code_verifier, nonce, app_challenge`,
      [digestToken(state)],
    );
    row = claimed.rows[0];
  } catch (error) {
    console.error('[CRM_OAUTH_CALLBACK_STATE]', error);
    return backToApp('error', 'provider_error');
  }

  if (!row) return stateInvalid();
  if (providerError) return backToApp('error', providerError === 'access_denied' ? 'access_denied' : 'provider_error');
  if (!code || code.length > 4096) return backToApp('error', 'invalid_response');

  const clientId = process.env.AUTH_GOOGLE_ID?.trim();
  const clientSecret = process.env.AUTH_GOOGLE_SECRET?.trim();
  if (!clientId || !clientSecret) return backToApp('error', 'configuration_error');

  let idToken: string;
  let googleAccessToken: string | null = null;
  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: GOOGLE_CALLBACK,
      grant_type: 'authorization_code',
      code,
      code_verifier: row.code_verifier,
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return backToApp('error', 'provider_error');
    const body = await response.json() as { id_token?: unknown; access_token?: unknown };
    if (typeof body.id_token !== 'string' || !body.id_token) {
      return backToApp('error', 'invalid_response');
    }
    idToken = body.id_token;
    if (typeof body.access_token === 'string' && body.access_token.length <= 8192) {
      googleAccessToken = body.access_token;
    }
  } catch (error) {
    console.error('[CRM_OAUTH_CALLBACK_GOOGLE]', error);
    return backToApp('error', 'provider_error');
  }

  let email: string;
  let googleSubject: string;
  let googlePictureUrl: string | null = null;
  try {
    const { payload } = await jwtVerify(idToken, googleKeys, {
      audience: clientId,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      algorithms: ['RS256'],
      clockTolerance: '30s',
    });
    if (typeof payload.nonce !== 'string' || !equals(payload.nonce, row.nonce) ||
        typeof payload.sub !== 'string' || !payload.sub ||
        typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
      return backToApp('error', 'invalid_response');
    }
    if (payload.email_verified !== true) {
      return backToApp('error', 'google_email_unverified');
    }
    if (typeof payload.email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return backToApp('error', 'invalid_response');
    }
    email = payload.email.trim().toLowerCase();
    googleSubject = payload.sub;
    googlePictureUrl = verifiedGooglePicture(payload.picture);
  } catch (error) {
    console.error('[CRM_OAUTH_CALLBACK_IDENTITY]', error);
    return backToApp('error', 'invalid_response');
  }

  // Some Google ID tokens omit the optional picture claim. Request it from
  // UserInfo using the just-issued OAuth access token. The response must
  // match the *verified* ID token identity; it cannot authorize an account.
  if (!googlePictureUrl && googleAccessToken) {
    try {
      const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: 'Bearer ' + googleAccessToken },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (userInfoResponse.ok) {
        const info = await userInfoResponse.json() as {
          sub?: unknown; email?: unknown; email_verified?: unknown; picture?: unknown;
        };
        if (info.sub === googleSubject &&
            typeof info.email === 'string' &&
            info.email.trim().toLowerCase() === email &&
            info.email_verified === true) {
          googlePictureUrl = verifiedGooglePicture(info.picture);
        }
      }
    } catch {
      // Optional avatar lookup must never block a valid Google sign-in.
    }
  }

  try {
    const found = await getCrmPool().query<{ id: string }>(
      `SELECT id::text FROM public.sales_agent_applications
        WHERE lower(email) = $1 AND crm_access_enabled IS TRUE
          AND status <> 'declined' LIMIT 1`,
      [email],
    );
    const agent = found.rows[0];
    if (!agent) return backToApp('error', 'account_not_invited');

    // Preserve any existing photo if Google omits the optional picture claim.
    // We store only the verified Google URL, never the image or access token.
    if (googlePictureUrl) {
      await getCrmPool().query(
        'UPDATE public.sales_agent_applications SET google_picture_url = $1 WHERE id = $2::uuid',
        [googlePictureUrl, agent.id],
      );
    }
    const handoff = randomToken();
    await getCrmPool().query(
      `INSERT INTO public.crm_mobile_auth_codes
         (code_hash, agent_id, challenge, expires_at)
       VALUES ($1, $2::uuid, $3, now() + interval '2 minutes')`,
      [digestToken(handoff), agent.id, row.app_challenge],
    );
    return backToApp('code', handoff);
  } catch (error) {
    console.error('[CRM_OAUTH_CALLBACK_AGENT]', error);
    return backToApp('error', 'provider_error');
  }
}
