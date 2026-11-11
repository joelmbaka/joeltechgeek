import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from './config';
import type { CrmUser } from './types';

// Milliol-style OAuth: a temporary Google browser session, independent of
// Auth.js website cookies, followed by a one-time code exchange in the app.
WebBrowser.maybeCompleteAuthSession();
const SESSION_KEY = 'crm.android.refresh.v1';
const PKCE_KEY = 'crm.android.oauth.verifier.v1';
let access: string | null = null;
let user: CrmUser | null = null;
let refreshing: Promise<CrmUser | null> | null = null;
let signingIn: Promise<void> | null = null;
const exchanges = new Map<string, Promise<CrmUser>>();
const listeners = new Set<(value: CrmUser | null) => void>();

export function getAccessToken() { return access; }
export function getUser() { return user; }
export function subscribeSession(cb: (value: CrmUser | null) => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function publish(value: CrmUser | null, token: string | null) {
  access = token;
  user = value;
  listeners.forEach((cb) => cb(value));
}
type Tokens = { ok: true; user?: CrmUser; agent?: CrmUser; access_token: string; refresh_token: string };
async function saveSession(value: Tokens) {
  await SecureStore.setItemAsync(SESSION_KEY, value.refresh_token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  publish(value.user ?? value.agent ?? null, value.access_token);
}
export async function restoreSession(): Promise<CrmUser | null> {
  return refreshSession();
}
export async function refreshSession(): Promise<CrmUser | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const oldToken = await SecureStore.getItemAsync(SESSION_KEY);
    if (!oldToken) { publish(null, null); return null; }
    // A stalled network must not leave the launch shell loading indefinitely.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let response: Response;
    try {
      response = await fetch(API_BASE_URL + '/api/agent-crm/mobile/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: oldToken }),
        signal: controller.signal,
      });
    } catch {
      throw new Error(controller.signal.aborted
        ? 'Connection timed out. Check your internet and retry.'
        : 'Cannot reach the CRM. Check your internet connection.');
    } finally {
      clearTimeout(timeout);
    }
    if (response.status === 401 || response.status === 403) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      publish(null, null);
      return null;
    }
    if (!response.ok) throw new Error('Could not restore the session. Please retry.');
    const value = await response.json() as Tokens;
    await saveSession(value);
    return value.user ?? value.agent ?? null;
  })();
  try { return await refreshing; } finally { refreshing = null; }
}

export async function startGoogleSignIn(): Promise<void> {
  if (signingIn) return signingIn;
  signingIn = (async () => {
    // The handoff verifier never leaves this device except when redeeming
    // the short-lived code over HTTPS. It is independent of Google's PKCE.
    const random = Crypto.getRandomBytes(32);
    const verifier = Array.from(random, (value) => value.toString(16).padStart(2, '0')).join('');
    const challenge = (await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256, verifier,
      { encoding: Crypto.CryptoEncoding.BASE64 },
    )).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await SecureStore.setItemAsync(PKCE_KEY, verifier, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    // EAS Update's native build channel survives OTA manifest changes.
    // Use it first so the installed preview APK can never route an OAuth
    // callback into the production package after receiving a JS update.
    // Dev clients have a null channel, so use their configured dev scheme.
    const configuredScheme = Constants.expoConfig?.scheme;
    const scheme = Updates.channel === 'preview'
      ? 'joeltechgeek-preview'
      : Updates.channel === 'production'
        ? 'joeltechgeek'
        : configuredScheme === 'joeltechgeek-dev'
          ? 'joeltechgeek-dev'
          : configuredScheme === 'joeltechgeek-preview'
            ? 'joeltechgeek-preview' : 'joeltechgeek';
    const returnUrl = Linking.createURL('auth-callback', {
      scheme, isTripleSlashed: true,
    });
    const url = new URL('/api/agent-crm/mobile/oauth/start', API_BASE_URL);
    url.searchParams.set('redirect_uri', returnUrl);
    url.searchParams.set('challenge', challenge);
    let result: WebBrowser.WebBrowserAuthSessionResult;
    try {
      result = await WebBrowser.openAuthSessionAsync(url.toString(), returnUrl);
    } catch {
      throw new Error('Cannot open Google sign-in. Please try again.');
    }
    // The Expo Router /auth-callback route owns exchange. Android can resolve
    // the browser promise and deliver the deep link in either order.
    if (result.type === 'cancel' || result.type === 'dismiss') return;
    if (result.type !== 'success') throw new Error('Google sign-in did not complete.');
  })();
  try { await signingIn; } finally { signingIn = null; }
}

export function exchangeGoogleCode(code: string): Promise<CrmUser> {
  const existing = exchanges.get(code);
  if (existing) return existing;
  const work = (async () => {
    const verifier = await SecureStore.getItemAsync(PKCE_KEY);
    if (!verifier) throw new Error('Google sign-in expired. Please try again.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try {
      response = await fetch(API_BASE_URL + '/api/agent-crm/mobile/oauth/exchange', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, verifier }),
        signal: controller.signal,
      });
    } catch {
      throw new Error(controller.signal.aborted
        ? 'Google sign-in timed out. Please retry.'
        : 'Unable to reach the CRM to complete sign-in.');
    } finally {
      clearTimeout(timeout);
    }
    const value = await response.json().catch(() => ({})) as Tokens & { error?: string };
    if (!response.ok) throw new Error(value.error || 'Google sign-in failed.');
    if (!(value.user ?? value.agent) || !value.access_token || !value.refresh_token)
      throw new Error('The CRM returned an invalid sign-in response.');
    await saveSession(value);
    await SecureStore.deleteItemAsync(PKCE_KEY);
    return (value.user ?? value.agent)!;
  })();
  exchanges.set(code, work);
  void work.finally(() => { exchanges.delete(code); }).catch(() => {});
  return work;
}

let reviewSigningIn: Promise<void> | null = null;
/**
 * Review access is granted only to the server's separate demo user. Never
 * encode Joel's credentials, user ID or an administrator token in the APK.
 */
export async function startPlayReviewSignIn(): Promise<void> {
  if (reviewSigningIn) return reviewSigningIn;
  reviewSigningIn = (async () => {
    let response: Response;
    try {
      response = await fetch(API_BASE_URL + '/api/agent-crm/mobile/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      throw new Error('Cannot reach the CRM. Check your internet connection.');
    }
    const body = await response.json().catch(() => ({})) as Partial<Tokens> & { error?: string };
    if (!response.ok) throw new Error(body.error || 'Review access is unavailable.');
    if (!(body.user ?? body.agent) || !body.access_token || !body.refresh_token) {
      throw new Error('The CRM returned an incomplete review session.');
    }
    await saveSession(body as Tokens);
  })();
  try { await reviewSigningIn; } finally { reviewSigningIn = null; }
}

export async function signOutSession(): Promise<void> {
  await refreshing?.catch(() => {});
  const token = await SecureStore.getItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(PKCE_KEY);
  publish(null, null);
  if (token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(API_BASE_URL + '/api/agent-crm/mobile/logout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: token }),
        signal: controller.signal,
      });
    } catch {
      // Local credentials were already erased; offline sign-out must complete.
    } finally {
      clearTimeout(timeout);
    }
  }
}
