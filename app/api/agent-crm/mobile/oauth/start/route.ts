import { getCrmPool } from '@/lib/agent-crm/db';
import { digestToken, pkceChallenge, randomToken } from '@/lib/agent-crm/mobile-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The Google redirect remains this server. Only these three app destinations
// can receive a one-time, PKCE-bound handoff code.
const APP_CALLBACK = 'joeltechgeek:///auth-callback';
const DEV_APP_CALLBACK = 'joeltechgeek-dev:///auth-callback';
const PREVIEW_APP_CALLBACK = 'joeltechgeek-preview:///auth-callback';
const GOOGLE_CALLBACK = process.env.CRM_MOBILE_GOOGLE_CALLBACK_URL?.trim()
  || 'https://joeltechgeek.com/api/agent-crm/mobile/oauth/callback';

function errorPage(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  const clientId = process.env.AUTH_GOOGLE_ID?.trim();
  if (!clientId || !clientId.endsWith('.apps.googleusercontent.com') ||
      !process.env.AUTH_GOOGLE_SECRET?.trim()) {
    return errorPage('Google sign-in is not configured.', 503);
  }

  const params = new URL(request.url).searchParams;
  const appRedirect = params.get('redirect_uri');
  const challenge = params.get('challenge');
  if (![APP_CALLBACK, DEV_APP_CALLBACK, PREVIEW_APP_CALLBACK].includes(appRedirect || '') ||
      typeof challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) {
    return errorPage('Invalid mobile sign-in request.', 400);
  }

  // The prefix is bound to a random one-time state stored by SHA-256 digest.
  // It selects only a server-hardcoded callback, avoiding a DB migration and
  // never allowing user-controlled redirect destinations.
  const marker = appRedirect === DEV_APP_CALLBACK ? 'DEV_'
    : appRedirect === PREVIEW_APP_CALLBACK ? 'PRV_' : 'PRO_';
  const state = marker + randomToken().slice(0, 39);
  const nonce = randomToken();
  const googleVerifier = randomToken();

  try {
    await getCrmPool().query(
      `INSERT INTO public.crm_mobile_oauth_states
       (state_hash, code_verifier, nonce, app_challenge, expires_at)
       VALUES ($1, $2, $3, $4, now() + interval '5 minutes')`,
      [digestToken(state), googleVerifier, nonce, challenge],
    );
  } catch (error) {
    console.error('[CRM_OAUTH_START]', error);
    return errorPage('Unable to start Google sign-in.', 503);
  }

  const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  google.searchParams.set('client_id', clientId);
  google.searchParams.set('redirect_uri', GOOGLE_CALLBACK);
  google.searchParams.set('response_type', 'code');
  google.searchParams.set('scope', 'openid email profile');
  google.searchParams.set('state', state);
  google.searchParams.set('nonce', nonce);
  google.searchParams.set('code_challenge', pkceChallenge(googleVerifier));
  google.searchParams.set('code_challenge_method', 'S256');
  google.searchParams.set('prompt', 'select_account');
  google.searchParams.set('access_type', 'online');

  return new Response(null, {
    status: 302,
    headers: { Location: google.toString(), 'Cache-Control': 'no-store' },
  });
}
