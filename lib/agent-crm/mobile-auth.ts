import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { PoolClient } from 'pg';
import { getCrmPool } from './db';
import type { CrmUser } from './users';
import { PLAY_REVIEW_AGENT_EMAIL, playReviewEnabled } from './play-review';

const TOKEN_LIFETIME_SECONDS = 15 * 60;
export const randomToken = () => randomBytes(32).toString('base64url');
export const digestToken = (value: string) => createHash('sha256').update(value).digest('hex');
export const pkceChallenge = (value: string) => createHash('sha256').update(value).digest('base64url');

function signingKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET is missing or too short');
  return 'joeltechgeek-crm-mobile-v1:' + secret;
}
function signature(value: string): string {
  return createHmac('sha256', signingKey()).update(value).digest('base64url');
}
// Wire token format and signing key remain compatible with published Android.
export function issueAccessToken(sessionId: string, userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'joeltechgeek-crm', aud: 'crm-android', sid: sessionId,
    sub: userId, exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
  })).toString('base64url');
  const signed = header + '.' + payload;
  return signed + '.' + signature(signed);
}
export function validateAccessToken(value: string): { sid: string; userId: string } | null {
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
    return { sid: payload.sid, userId: payload.sub };
  } catch { return null; }
}
export async function getActiveMobileUser(token: string): Promise<CrmUser | null> {
  const identity = validateAccessToken(token);
  if (!identity) return null;
  const result = await getCrmPool().query<CrmUser>(
    `SELECT u.id::text, u.full_name AS name, u.email, u.phone, u.picture_url
       FROM public.crm_mobile_sessions s
       JOIN public.crm_users u ON u.id=s.user_id
       WHERE s.id=$1::uuid AND s.user_id=$2::uuid
         AND s.revoked_at IS NULL AND s.expires_at>now()
         AND u.is_active=true
         AND (lower(u.email) <> $3 OR $4::boolean)
       LIMIT 1`,
    [identity.sid, identity.userId, PLAY_REVIEW_AGENT_EMAIL, playReviewEnabled()]);
  return result.rows[0] || null;
}
export async function getActiveUserById(id: string, client: PoolClient): Promise<CrmUser | null> {
  const found = await client.query<CrmUser>(
    `SELECT id::text, full_name AS name, email, phone, picture_url
       FROM public.crm_users WHERE id=$1::uuid AND is_active=true
         AND (lower(email) <> $2 OR $3::boolean) LIMIT 1`,
    [id, PLAY_REVIEW_AGENT_EMAIL, playReviewEnabled()]);
  return found.rows[0] || null;
}
export async function mintMobileSession(client: PoolClient, userId: string) {
  const refreshToken = randomToken();
  const result = await client.query<{ id: string }>(
    `INSERT INTO public.crm_mobile_sessions (user_id,refresh_hash,expires_at)
      VALUES ($1::uuid,$2,now()+interval '30 days') RETURNING id::text`,
    [userId,digestToken(refreshToken)]);
  return {
    access_token: issueAccessToken(result.rows[0].id,userId),
    refresh_token: refreshToken,
    expires_in: TOKEN_LIFETIME_SECONDS,
  };
}
export function mobileJson(body: object, status = 200) {
  return Response.json(body,{ status, headers: { 'Cache-Control': 'no-store' } });
}
