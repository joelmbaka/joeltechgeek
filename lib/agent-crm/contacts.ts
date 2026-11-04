import type { PoolClient } from 'pg';

export type ContactFields = {
  name: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
};

export type LeadContact = ContactFields & {
  id: string;
  lead_id: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export const CONTACT_COLUMNS = 'id::text, lead_id::text, name, role, phone, email, is_primary, created_at, updated_at';

export function parseContactFields(value: unknown): { ok: true; fields: ContactFields } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Invalid contact details.' };
  }
  const body = value as Record<string, unknown>;
  const limits = { name: 150, role: 120, phone: 40, email: 254 } as const;
  const fields = {} as ContactFields;
  for (const [key, limit] of Object.entries(limits)) {
    const raw = body[key];
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      return { ok: false, error: 'Invalid contact ' + key + '.' };
    }
    if (typeof raw === 'string' && raw.length > limit) {
      return { ok: false, error: 'Contact ' + key + ' is too long.' };
    }
    fields[key as keyof ContactFields] = typeof raw === 'string' ? raw.trim() || null : null;
  }
  if (!Object.values(fields).some(Boolean)) return { ok: false, error: 'Provide at least one contact detail.' };
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return { ok: false, error: 'Invalid contact email.' };
  }
  return { ok: true, fields };
}

/** Called only while the owning crm_leads row is locked in a transaction.
 * crm_leads.*contact fields remain a backward-compatible primary-contact snapshot.
 */
export async function syncPrimaryContact(client: PoolClient, leadId: string) {
  const primary = await client.query<ContactFields>(
    'SELECT name, role, phone, email FROM public.crm_lead_contacts WHERE lead_id = $1 AND is_primary = true LIMIT 1',
    [leadId],
  );
  const contact = primary.rows[0];
  await client.query(
    `UPDATE public.crm_leads
       SET contact_name = $2, contact_role = $3, phone = $4, email = $5, updated_at = now()
       WHERE id = $1`,
    [leadId, contact?.name ?? null, contact?.role ?? null,
      contact?.phone ?? null, contact?.email ?? null],
  );
}
