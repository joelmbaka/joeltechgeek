import { getCrmPool } from './db';

/** The signed-in user's saved categories plus categories assigned to their leads.
 * There are no global defaults; new users can create their first category.
 */
export async function getBusinessCategories(userId: string): Promise<string[]> {
  const db = getCrmPool();
  const [saved, used] = await Promise.all([
    db.query<{ name: string }>(
      'SELECT name FROM public.crm_business_categories WHERE user_id = $1 ORDER BY lower(name)',
      [userId],
    ),
    db.query<{ name: string }>(
      "SELECT DISTINCT industry AS name FROM public.crm_leads WHERE user_id = $1 AND btrim(industry) <> ''",
      [userId],
    ),
  ]);
  const names = new Map<string, string>();
  for (const raw of [...saved.rows.map((r) => r.name), ...used.rows.map((r) => r.name)]) {
    const name = raw.trim();
    if (name && !names.has(name.toLocaleLowerCase())) names.set(name.toLocaleLowerCase(), name);
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

/** Do not accept arbitrary categories submitted by another agent or a modified client. */
export async function canUseBusinessCategory(userId: string, name: string): Promise<boolean> {
  if (!name) return true;
  const result = await getCrmPool().query<{ found: boolean }>(
    `SELECT (
      EXISTS (SELECT 1 FROM public.crm_business_categories
              WHERE user_id = $1 AND lower(name) = lower($2))
      OR EXISTS (SELECT 1 FROM public.crm_leads
                 WHERE user_id = $1 AND lower(industry) = lower($2))
    ) AS found`,
    [userId, name],
  );
  return result.rows[0]?.found === true;
}
