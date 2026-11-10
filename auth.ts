import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getCrmPool } from '@/lib/agent-crm/db';
import { findOrCreateCrmUser, verifiedGooglePicture } from '@/lib/agent-crm/users';

// Google authentication is also registration. There are no invitations,
// sales-agent applications, roles, or workspaces in this individual CRM.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/crm', error: '/crm' },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google' ||
          profile?.email_verified !== true ||
          typeof profile.email !== 'string' ||
          typeof profile.sub !== 'string' ||
          profile.sub !== account.providerAccountId) return false;
      try {
        await findOrCreateCrmUser({
          googleSub: profile.sub,
          email: profile.email,
          name: typeof profile.name === 'string' ? profile.name : null,
          pictureUrl: verifiedGooglePicture(profile.picture),
        });
        return true;
      } catch (error) {
        console.error('[CRM_GOOGLE_REGISTRATION]', error);
        return false; // No cookie minted on DB outage or identity conflict.
      }
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && typeof profile?.sub === 'string') {
        const match = await getCrmPool().query<{ id: string }>(
          'SELECT id::text FROM public.crm_users WHERE google_sub=$1 AND is_active=true',
          [profile.sub]);
        if (!match.rows[0]) throw new Error('CRM identity is unavailable.');
        token.crmUserId = match.rows[0].id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.crmUserId === 'string') {
        (session.user as typeof session.user & { crm_user_id?: string }).crm_user_id = token.crmUserId;
      }
      return session;
    },
  },
});
