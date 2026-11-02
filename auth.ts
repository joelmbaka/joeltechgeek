import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getCrmPool } from '@/lib/agent-crm/db';

// Self-hosted authentication: Google verifies the identity; our application
// owns its encrypted session cookies and agent registration authorization.
// No Auth.js adapter or separate auth database is required.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30, // Persist across browser restarts for up to 30 days.
  },
  pages: {
    signIn: '/crm',
    error: '/crm',
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return false;
      // Reject unverified or malformed Google identities before minting a session.
      if (profile?.email_verified !== true || typeof profile.email !== 'string') return false;
      const email = profile.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;

      try {
        const result = await getCrmPool().query(
          `SELECT 1 FROM public.sales_agent_applications
           WHERE lower(email) = $1
             AND crm_access_enabled IS TRUE
             AND status <> 'declined'
           LIMIT 1`,
          [email],
        );
        return (result.rowCount ?? 0) > 0;
      } catch (error) {
        console.error('[CRM_GOOGLE_SIGN_IN]', error);
        return false; // Fail closed when registration verification is unavailable.
      }
    },
  },
});
