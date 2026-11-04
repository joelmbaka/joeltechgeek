import { getCrmPool } from './db';

export type CrmUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  picture_url: string | null;
};

// Only Google-verified identities enter this function. CRM data is keyed by
// crm_users.id, never by Google email, application ID, or an arbitrary client ID.
export async function findOrCreateCrmUser(identity: {
  googleSub: string; email: string; name?: string | null; pictureUrl?: string | null;
}): Promise<CrmUser> {
  const googleSub = identity.googleSub.trim();
  const email = identity.email.trim().toLowerCase();
  if (!googleSub || googleSub.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    throw new Error('Unverified Google CRM identity.');
  const name = (identity.name?.trim() || email.split('@')[0]).slice(0, 150);
  const picture = verifiedGooglePicture(identity.pictureUrl);
  const client = await getCrmPool().connect();
  try {
    await client.query('BEGIN');
    // Google subject is authoritative. Email is a one-time, verified lookup
    // only for linking imported accounts with no subject assigned yet.
    const bySub = await client.query<{ id: string }>(
      'SELECT id::text FROM public.crm_users WHERE google_sub=$1 FOR UPDATE',
      [googleSub]);
    let id = bySub.rows[0]?.id;
    if (!id) {
      const byEmail = await client.query<{ id: string; google_sub: string | null }>(
        'SELECT id::text, google_sub FROM public.crm_users WHERE lower(btrim(email))=$1 FOR UPDATE',
        [email]);
      if (byEmail.rows[0]) {
        if (byEmail.rows[0].google_sub && byEmail.rows[0].google_sub !== googleSub)
          throw new Error('This email belongs to another Google identity.');
        id = byEmail.rows[0].id;
      }
    }
    const result = id
      ? await client.query<CrmUser>(
          `UPDATE public.crm_users
           SET google_sub=$2, email=$3, full_name=$4,
               picture_url=COALESCE($5,picture_url), updated_at=now()
           WHERE id=$1::uuid AND is_active=true
             AND (google_sub IS NULL OR google_sub=$2)
           RETURNING id::text, full_name AS name, email, phone, picture_url`,
          [id, googleSub, email, name, picture])
      : await client.query<CrmUser>(
          `INSERT INTO public.crm_users (google_sub,email,full_name,picture_url)
           VALUES ($1,$2,$3,$4)
           RETURNING id::text, full_name AS name, email, phone, picture_url`,
          [googleSub, email, name, picture]);
    if (!result.rows[0]) throw new Error('CRM account is inactive.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    // Unique subject/email violations fail closed; no cross-account merges.
    throw error;
  } finally {
    client.release();
  }
}

export function verifiedGooglePicture(candidate: unknown): string | null {
  if (typeof candidate !== 'string' || candidate.length > 2048) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' ||
        (url.hostname !== 'googleusercontent.com' &&
          !url.hostname.endsWith('.googleusercontent.com'))) return null;
    return url.toString();
  } catch { return null; }
}
