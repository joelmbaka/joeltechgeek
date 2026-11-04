/** Keep legacy apps compatible: they submit only company_name.
 * New clients must explicitly send a non-empty lead_title.
 * Company is optional, but each opportunity has a meaningful title.
 */
export type LeadIdentity = { lead_title: string; company_name: string };
type IdentityResult =
  | { ok: true; identity: LeadIdentity }
  | { ok: false; error: string };

export function normalizeLeadIdentity(
  body: Record<string, unknown>,
  options: { allowLegacyTitle?: boolean } = {},
): IdentityResult {
  const rawCompany = body.company_name;
  if (rawCompany !== undefined && rawCompany !== null && typeof rawCompany !== 'string') {
    return { ok: false, error: 'Company name must be text.' };
  }
  const companyName = typeof rawCompany === 'string' ? rawCompany.trim() : '';
  if (typeof rawCompany === 'string' && rawCompany.length > 180) {
    return { ok: false, error: 'Company name must be 180 characters or fewer.' };
  }
  const rawTitle = body.lead_title === undefined && options.allowLegacyTitle
    ? companyName : body.lead_title;
  if (typeof rawTitle !== 'string' || !rawTitle.trim()) {
    return { ok: false, error: 'Lead title is required.' };
  }
  if (rawTitle.length > 180) {
    return { ok: false, error: 'Lead title must be 180 characters or fewer.' };
  }
  return { ok: true, identity: {
    lead_title: rawTitle.trim(), company_name: companyName,
  } };
}
