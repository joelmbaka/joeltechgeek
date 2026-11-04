import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCrmPool } from './db';
import type { CrmUser } from './users';
import { getActiveMobileUser } from './mobile-auth';

export type CrmAuth = { user: CrmUser } | { response: NextResponse };

function deny(message: string, status: number): CrmAuth {
  return { response: NextResponse.json({ ok: false, error: message },
    { status, headers: { 'Cache-Control': 'no-store' } }) };
}
export function validCrmWriteOrigin(request: Request): boolean {
  if (request.headers.has('authorization')) return true;
  const origin = request.headers.get('origin');
  return origin !== null && origin === new URL(request.url).origin;
}
export async function requireCrmUser(request?: Request): Promise<CrmAuth> {
  try {
    const authorization = request?.headers.get('authorization');
    if (authorization != null) {
      if (!authorization.startsWith('Bearer ')) return deny('Invalid mobile access token.', 401);
      const user = await getActiveMobileUser(authorization.slice(7));
      return user ? { user } : deny('Mobile session expired or access revoked.', 401);
    }
    const session = await auth();
    // Auth.js JWT subject was bound server-side to a verified Google subject.
    // Never look up CRM ownership by an email supplied by a browser.
    const id = (session?.user as typeof session.user & { crm_user_id?: string } | undefined)?.crm_user_id;
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))
      return deny('Please sign in with Google.', 401);
    const found = await getCrmPool().query<CrmUser>(
      `SELECT id::text, full_name AS name, email, phone, picture_url
       FROM public.crm_users WHERE id=$1::uuid AND is_active=true LIMIT 1`, [id]);
    const user = found.rows[0];
    return user ? { user } : deny('CRM account is disabled.', 403);
  } catch (error) {
    console.error('[CRM_AUTH]', error);
    return deny('Unable to verify CRM access right now.', 503);
  }
}
export function crmError(error: unknown) {
  console.error('[CRM_API]', error);
  return NextResponse.json({ ok: false, error: 'Unable to load or save CRM data right now.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
