import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from './config';
import type { Agent } from './types';

WebBrowser.maybeCompleteAuthSession();
const SESSION_KEY = 'crm.android.refresh.v1';
const PKCE_KEY = 'crm.android.oauth.verifier.v1';
let access: string | null = null;
let agent: Agent | null = null;
let refreshing: Promise<Agent | null> | null = null;
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
type Tokens = { ok: boolean; agent: Agent; access_token: string; refresh_token: string };
async function saveSession(value: Tokens) {
  await SecureStore.setItemAsync(SESSION_KEY, value.refresh_token);
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
    } catch { throw new Error('Unable to reach the CRM. Check your internet connection.'); }
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
export async function startGoogleSignIn() {
  const random = Crypto.getRandomBytes(32);
  const verifier = Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const challenge = (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await SecureStore.setItemAsync(PKCE_KEY, verifier);
  const callback = Linking.createURL('auth-callback', { scheme: 'joeltechgeek', isTripleSlashed: true });
  const url = API_BASE_URL + '/crm/mobile-connect?challenge=' + encodeURIComponent(challenge);
  const result = await WebBrowser.openAuthSessionAsync(url, callback);
  if (result.type === 'success' && 'url' in result && result.url) {
    const parsed = Linking.parse(result.url);
    const code = parsed.queryParams?.code;
    if (typeof code === 'string') await exchangeMobileCode(code);
  }
}
export async function exchangeMobileCode(code: string): Promise<Agent> {
  const verifier = await SecureStore.getItemAsync(PKCE_KEY);
  if (!verifier) throw new Error('Sign-in session expired. Please retry.');
  const response = await fetch(API_BASE_URL + '/api/agent-crm/mobile/exchange', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, verifier }),
  });
  const data = await response.json() as Tokens & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Google sign-in failed.');
  await saveSession(data);
  await SecureStore.deleteItemAsync(PKCE_KEY);
  return data.agent;
}
export async function signOutSession() {
  const token = await SecureStore.getItemAsync(SESSION_KEY);
  // Clear locally even without network. Server expiry remains a backstop.
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(PKCE_KEY);
  publish(null, null);
  if (token) await fetch(API_BASE_URL + '/api/agent-crm/mobile/logout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: token }),
  }).catch(() => {});
}
