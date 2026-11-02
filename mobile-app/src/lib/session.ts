import * as SecureStore from 'expo-secure-store';
import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isSuccessResponse,
} from 'react-native-nitro-google-signin';
import { API_BASE_URL } from './config';
import type { Agent } from './types';

// Native Google Credential Manager only. Never use Auth.js website cookies,
// the website sign-in page, a browser OAuth session or a redirect URI.
const SESSION_KEY = 'crm.android.refresh.v1';
let access: string | null = null;
let agent: Agent | null = null;
let refreshing: Promise<Agent | null> | null = null;
let signingIn: Promise<void> | null = null;
let googleConfigured = false;
const listeners = new Set<(value: Agent | null) => void>();

export function getAccessToken() { return access; }
export function getAgent() { return agent; }
export function subscribeSession(cb: (value: Agent | null) => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function publish(value: Agent | null, token: string | null) {
  access = token;
  agent = value;
  listeners.forEach((cb) => cb(value));
}
type Tokens = { ok: true; agent: Agent; access_token: string; refresh_token: string };

async function saveSession(value: Tokens) {
  await SecureStore.setItemAsync(SESSION_KEY, value.refresh_token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  publish(value.agent, value.access_token);
}
export async function restoreSession(): Promise<Agent | null> {
  return refreshSession();
}
export async function refreshSession(): Promise<Agent | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const oldToken = await SecureStore.getItemAsync(SESSION_KEY);
    if (!oldToken) { publish(null, null); return null; }

    let response: Response;
    try {
      response = await fetch(API_BASE_URL + '/api/agent-crm/mobile/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: oldToken }),
      });
    } catch {
      // Keep the saved session on network failures, so the agent can retry.
      throw new Error('Unable to reach the CRM. Check your internet connection.');
    }
    if (response.status === 401 || response.status === 403) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      publish(null, null);
      return null;
    }
    if (!response.ok) throw new Error('Could not restore the session. Please retry.');
    const data = await response.json() as Tokens;
    await saveSession(data);
    return data.agent;
  })();
  try { return await refreshing; } finally { refreshing = null; }
}
function configureGoogle() {
  if (googleConfigured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  // This is a PUBLIC Google OAuth client identifier, not an OAuth secret.
  if (!webClientId || !/^[\w-]+\.apps\.googleusercontent\.com$/.test(webClientId)) {
    throw new Error('Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to the Web OAuth client ID.');
  }
  GoogleOneTapSignIn.configure({
    webClientId,
    autoSelectOnSignIn: false,
  });
  googleConfigured = true;
}
export async function startGoogleSignIn(): Promise<void> {
  if (signingIn) return signingIn;
  signingIn = (async () => {
    configureGoogle();
    await GoogleOneTapSignIn.checkPlayServices();

    // Explicit native account selector (Android Credential Manager). No web UI.
    const result = await GoogleOneTapSignIn.presentExplicitSignIn();
    if (isCancelledResponse(result)) return;
    if (!isSuccessResponse(result) || !result.data.idToken) {
      throw new Error('Google did not return an identity token. Select an account and retry.');
    }
    let response: Response;
    try {
      response = await fetch(API_BASE_URL + '/api/agent-crm/mobile/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: result.data.idToken }),
      });
    } catch {
      throw new Error('Cannot reach the CRM server. Check your connection and retry.');
    }
    const body = await response.json().catch(() => ({})) as Partial<Tokens> & { error?: string };
    if (!response.ok) throw new Error(body.error || 'Google sign-in failed.');
    if (!body.agent || !body.refresh_token || !body.access_token) {
      throw new Error('The CRM server returned an invalid sign-in response.');
    }
    await saveSession(body as Tokens);
  })();
  try { await signingIn; } finally { signingIn = null; }
}
export async function signOutSession(): Promise<void> {
  // Finish any in-flight token rotation to revoke the latest refresh token.
  await refreshing?.catch(() => {});
  const token = await SecureStore.getItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(SESSION_KEY);
  publish(null, null);
  if (googleConfigured) await GoogleOneTapSignIn.signOut().catch(() => {});
  if (token) await fetch(API_BASE_URL + '/api/agent-crm/mobile/logout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: token }),
  }).catch(() => {});
}
