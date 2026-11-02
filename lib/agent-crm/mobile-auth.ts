import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { PoolClient } from 'pg';
import { getCrmPool } from './db';
import type { Agent } from './types';

const TOKEN_LIFETIME_SECONDS = 15 * 60;
export const MOBILE_SESSION_DAYS = 30;

export const randomToken = () => randomBytes(32).toString('base64url');
export const digestToken = (value: string) => createHash('sha256').update(value).digest('hex');
export const pkceChallenge = (verifier: string) =>
  createHash('sha256').update(verifier).digest('base64url');

function signingKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET is missing or too short');
  return 'joeltechgeek-crm-mobile-v1:' + secret;
}
function signature(value: string): string {
  return createHmac('sha256', signingKey()).update(value).digest('base64url');
}
export function issueAccessToken(sessionId: string, agentId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'joeltechgeek-crm', aud: 'crm-android', sid: sessionId,
    sub: agentId, exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
  })).toString('base64url');
  const signed = header + '.' + payload;
  return signed + '.' + signature(signed);
}
export function validateAccessToken(value: string): { sid: string; agentId: string } | null {
  try {
    const pieces = value.split('.');
    if (pieces.length !== 3 || pieces.some((p) => !p)) return null;
    const signed = pieces[0] + '.' + pieces[1];
    const expected = Buffer.from(signature(signed));
    const given = Buffer.from(pieces[2]);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    const header = JSON.parse(Buffer.from(pieces[0], 'base64url').toString()) as { alg?: string };
    const payload = JSON.parse(Buffer.from(pieces[1], 'base64url').toString()) as {
      iss?: string; aud?: string; sid?: string; sub?: string; exp?: number;
    };
    if (header.alg !== 'HS256' || payload.iss !== 'joeltechgeek-crm' ||
      payload.aud !== 'crm-android' || !payload.sid || !payload.sub ||
      typeof payload.exp !== 'number' || payload.exp <= Date.now() / 1000) return null;
    return { sid: payload.sid, agentId: payload.sub };
  } catch {
    return null;
  }
}
export async function getActiveMobileAgent(token: string): Promise<Agent | null> {
  const identity = validateAccessToken(token);
  if (!identity) return null;
  const row = await getCrmPool().query<{ id: string; name: string; email: string }>(
    `SELECT a.id::text AS id, a.full_name AS name, a.email
       FROM public.crm_mobile_sessions s
       JOIN public.sales_agent_applications a ON a.id = s.agent_id
       WHERE s.id = $1::uuid AND s.agent_id = $2::uuid
         AND s.revoked_at IS NULL AND s.expires_at > now()
         AND a.crm_access_enabled IS TRUE AND a.status <> 'declined'
       LIMIT 1`,
    [identity.sid, identity.agentId],
  );
  return row.rows[0] || null;
}
export async function getActiveAgentById(id: string, client: PoolClient): Promise<Agent | null> {
  const found = await client.query<{ id: string; name: string; email: string }>(
    `SELECT id::text, full_name AS name, email
       FROM public.sales_agent_applications
       WHERE id = $1::uuid AND crm_access_enabled IS TRUE AND status <> 'declined'
       LIMIT 1`,
    [id],
  );
  return found.rows[0] || null;
}
export async function mintMobileSession(client: PoolClient, agentId: string) {
  const refreshToken = randomToken();
  const result = await client.query<{ id: string }>(
    `INSERT INTO public.crm_mobile_sessions (agent_id, refresh_hash, expires_at)
      VALUES ($1::uuid, $2, now() + interval '30 days') RETURNING id::text AS id`,
    [agentId, digestToken(refreshToken)],
  );
  return {
    access_token: issueAccessToken(result.rows[0].id, agentId),
    refresh_token: refreshToken,
    expires_in: TOKEN_LIFETIME_SECONDS,
  };
}
export function mobileJson(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
