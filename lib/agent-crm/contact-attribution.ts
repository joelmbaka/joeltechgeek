import type { PoolClient } from 'pg';

/** Missing contact_id (old clients): use primary contact when present.
 * Explicit null/empty means "Company / unspecified contact".
 * Never allow an ID from another lead, even if owned by the same agent.
 * Call only inside a transaction after locking the agent-owned lead.
 */
export type ContactTarget =
  | { ok: true; id: string | null; name: string | null }
  | { ok: false; error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveContactTarget(
  client: PoolClient,
  leadId: string,
  supplied: unknown,
): Promise<ContactTarget> {
  if (supplied === null || supplied === '') return { ok: true, id: null, name: null };
  if (supplied !== undefined && (typeof supplied !== 'string' || !UUID.test(supplied))) {
    return { ok: false, error: 'Invalid contact selection.' };
  }
  if (supplied === undefined) {
    const primary = await client.query<{
      id: string; name: string | null; role: string | null;
      phone: string | null; email: string | null;
    }>(
      `SELECT id::text, name, role, phone, email FROM public.crm_lead_contacts
       WHERE lead_id = $1 ORDER BY is_primary DESC, created_at, id LIMIT 1`,
      [leadId],
    );
    const row = primary.rows[0];
    return row
      ? { ok: true, id: row.id, name: row.name || row.phone || row.email || row.role || 'Contact' }
      : { ok: true, id: null, name: null };
  }
  const matching = await client.query<{
    id: string; name: string | null; role: string | null;
    phone: string | null; email: string | null;
  }>(
    `SELECT id::text, name, role, phone, email FROM public.crm_lead_contacts
     WHERE lead_id = $1 AND id = $2 LIMIT 1`,
    [leadId, supplied],
  );
  const row = matching.rows[0];
  if (!row) return { ok: false, error: 'That contact does not belong to this lead.' };
  return { ok: true, id: row.id, name: row.name || row.phone || row.email || row.role || 'Contact' };
}
