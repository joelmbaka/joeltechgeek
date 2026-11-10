import { API_BASE_URL } from './config';
import { getAccessToken, refreshSession } from './session';

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  async function send(token: string | null): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', 'Bearer ' + token);
    return fetch(API_BASE_URL + path, { ...init, headers });
  }
  let response: Response;
  try { response = await send(getAccessToken()); }
  catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError('Connection unavailable. Check internet and retry.', 0);
  }
  if (response.status === 401) {
    const restored = await refreshSession();
    if (!restored) throw new ApiError('Your session has expired. Sign in again.', 401);
    try { response = await send(getAccessToken()); }
    catch (error) {
      if (init.signal?.aborted) throw error;
      throw new ApiError('Connection unavailable. Check internet and retry.', 0);
    }
  }
  if (__DEV__ && path.startsWith('/api/agent-crm/')) {
    console.info('[CRM_API]', { path, method: init.method || 'GET', status: response.status });
  }
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new ApiError(data.error || 'Request failed (' + response.status + ')', response.status);
  return data;
}
