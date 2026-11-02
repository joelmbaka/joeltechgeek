import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCrmPool } from './db';
import type { Agent } from './types';

export type AgentAuth = { agent: Agent } | { response: NextResponse };

function deny(message: string, status: number): AgentAuth {
  return {
    response: NextResponse.json(
      { ok: false, error: message },
      { status, headers: { 'Cache-Control': 'no-store' } },
    ),
  };
}

export async function requireCrmAgent(request: Request): Promise<AgentAuth> {
  const bearer = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') || '');
  if (!bearer) return deny('Please sign in with Google.', 401);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return deny('CRM sign-in is not configured.', 503);

  try {
    // Do not trust a client-supplied email or decode a JWT without verification.
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(bearer[1]);
    const user = data.user;
    if (error || !user?.email || !user.email_confirmed_at) {
      return deny('Your session has expired. Please sign in again.', 401);
    }
    const providers = user.app_metadata?.providers as string[] | undefined;
    const googleLinked = user.app_metadata?.provider === 'google' ||
      providers?.includes('google') ||
      user.identities?.some((identity) => identity.provider === 'google');
    if (!googleLinked) return deny('Please use Google sign-in for this CRM.', 403);

    const email = user.email.trim().toLowerCase();
    const db = getCrmPool();
    const result = await db.query<{ id: string; full_name: string; email: string }>(
      `SELECT id::text AS id, full_name, email
         FROM public.sales_agent_applications
         WHERE lower(email) = $1
           AND crm_access_enabled = true
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
