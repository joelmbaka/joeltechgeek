/** At least one identifying name is required to create a B2B prospect.
 * Company and primary contact are individually optional.
 * The lead uses the company as its display name, falling back to the contact.
 */
export type LeadIdentity = { company_name: string; contact_name: string };
export type IdentityResult =
  | { ok: true; identity: LeadIdentity }
  | { ok: false; error: string };

export function normalizeLeadIdentity(body: Record<string, unknown>): IdentityResult {
  const company = body.company_name;
  const contact = body.contact_name;
  if (company !== undefined && company !== null && typeof company !== 'string') {
    return { ok: false, error: 'Company name must be text.' };
  }
  if (contact !== undefined && contact !== null && typeof contact !== 'string') {
    return { ok: false, error: 'Contact name must be text.' };
  }
  if (typeof company === 'string' && company.length > 180) {
    return { ok: false, error: 'Company name must be 180 characters or fewer.' };
  }
  if (typeof contact === 'string' && contact.length > 150) {
    return { ok: false, error: 'Contact name must be 150 characters or fewer.' };
  }
  const companyName = typeof company === 'string' ? company.trim() : '';
  const contactName = typeof contact === 'string' ? contact.trim() : '';
  if (!companyName && !contactName) {
    return { ok: false, error: 'Company or contact name required.' };
  }
  return { ok: true, identity: { company_name: companyName, contact_name: contactName } };
}

export function leadDisplayName(lead: {
  company_name: string | null | undefined;
  contact_name: string | null | undefined;
}): string {
  return lead.company_name?.trim() || lead.contact_name?.trim() || 'Unnamed lead';
}
