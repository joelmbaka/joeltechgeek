import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCrmPool } from './db';
import type { Agent } from './types';
import { getActiveMobileAgent } from './mobile-auth';

export type AgentAuth = { agent: Agent } | { response: NextResponse };

function deny(message: string, status: number): AgentAuth {
  return {
    response: NextResponse.json(
      { ok: false, error: message },
      { status, headers: { 'Cache-Control': 'no-store' } },
    ),
  };
}

export function validCrmWriteOrigin(request: Request): boolean {
  // Bearer tokens are not sent automatically by the browser. Authentication
  // independently rejects invalid tokens, while cookies require same-origin.
  if (request.headers.has('authorization')) return true;
  const origin = request.headers.get('origin');
  return origin !== null && origin === new URL(request.url).origin;
}
export async function requireCrmAgent(request?: Request): Promise<AgentAuth> {
  try {
    const authorization = request?.headers.get('authorization');
    if (authorization !== null && authorization !== undefined) {
      if (!authorization.startsWith('Bearer ')) return deny('Invalid mobile access token.', 401);
      const agent = await getActiveMobileAgent(authorization.slice(7));
      return agent ? { agent } : deny('Mobile session expired or access revoked.', 401);
    }
    const session = await auth();
    // Fail closed on absent or malformed sessions, including Auth.js error objects.
    const email = session?.user?.email?.trim().toLowerCase();
    if (typeof email !== 'string' || !email) {
      return deny('Please sign in with Google.', 401);
    }

    // Recheck registration on *every* API request; disabling access takes
    // effect without waiting for the cookie to expire.
    const result = await getCrmPool().query<{
      id: string; full_name: string; email: string
    }>(
      `SELECT id::text AS id, full_name, email
         FROM public.sales_agent_applications
         WHERE lower(email) = $1
           AND crm_access_enabled IS TRUE
           AND status <> 'declined'
         LIMIT 1`,
      [email],
    );
    const row = result.rows[0];
    if (!row) return deny('This Google email has no active agent registration.', 403);
    return { agent: { id: row.id, name: row.full_name, email: row.email } };
  } catch (error) {
    console.error('[AGENT_CRM_AUTH]', error);
    return deny('Unable to verify CRM access right now.', 503);
  }
}

export function crmError(error: unknown) {
  console.error('[AGENT_CRM_API]', error);
  return NextResponse.json(
    { ok: false, error: 'Unable to load or save CRM data right now.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
