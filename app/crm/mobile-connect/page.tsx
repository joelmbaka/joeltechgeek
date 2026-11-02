import Link from 'next/link';
import { auth, signIn } from '@/auth';
import { getCrmPool } from '@/lib/agent-crm/db';
import { digestToken, randomToken } from '@/lib/agent-crm/mobile-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ challenge?: string }> };

export default async function MobileConnect({ searchParams }: Props) {
  const { challenge } = await searchParams;
  const validChallenge = typeof challenge === 'string' && /^[A-Za-z0-9_-]{43}$/.test(challenge);
  if (!validChallenge) return <main style={{ padding: 28 }}>Invalid mobile sign-in request.</main>;

  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  const wrapper = { maxWidth: 440, margin: '60px auto', padding: 24, fontFamily: 'system-ui' };
  if (!email) {
    async function continueWithGoogle() {
      'use server';
      await signIn('google', { redirectTo: '/crm/mobile-connect?challenge=' + encodeURIComponent(challenge!) });
    }
    return <main style={wrapper}>
      <h1>JoelTechGeek CRM</h1>
      <p>Sign in with your registered sales-agent Google account to connect Android.</p>
      <form action={continueWithGoogle}>
        <button type="submit" style={{ padding: 12, background: '#059669', color: 'white', border: 0, borderRadius: 8 }}>
          Continue with Google
        </button>
      </form>
    </main>;
  }

  const agent = await getCrmPool().query<{ id: string }>(
    `SELECT id::text AS id FROM public.sales_agent_applications
       WHERE lower(email) = $1 AND crm_access_enabled IS TRUE
       AND status <> 'declined' LIMIT 1`,
    [email],
  );
  if (!agent.rows[0]) return <main style={wrapper}>
    <h1>Access denied</h1>
    <p>This Google account has no active JoelTechGeek sales-agent registration.</p>
    <Link href="/crm">Return to CRM</Link>
  </main>;

  // This one-time code cannot be redeemed without the app's PKCE verifier.
  const code = randomToken();
  await getCrmPool().query(
    `INSERT INTO public.crm_mobile_auth_codes (code_hash, agent_id, challenge, expires_at)
       VALUES ($1, $2::uuid, $3, now() + interval '2 minutes')`,
    [digestToken(code), agent.rows[0].id, challenge],
  );
  const deepLink = 'joeltechgeek:///auth-callback?code=' + encodeURIComponent(code);
  return <main style={wrapper}>
    <h1>Google account verified</h1>
    <p>Continue to the Android app to complete sign-in.</p>
    <a href={deepLink} style={{ display: 'inline-block', padding: 12, borderRadius: 8,
      background: '#059669', color: 'white', textDecoration: 'none' }}>
      Open JoelTechGeek CRM
    </a>
    <p style={{ color: '#66748B', fontSize: 13 }}>This link expires in two minutes and works only with the app that started this sign-in.</p>
  </main>;
}
