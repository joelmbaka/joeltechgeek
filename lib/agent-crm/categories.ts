import { getCrmPool } from './db';

/** The saved, user-scoped catalogue is the single source of category options. */
export async function getBusinessCategories(userId: string): Promise<string[]> {
  const result = await getCrmPool().query<{name:string}>(
    'SELECT name FROM public.crm_business_categories WHERE user_id = $1 ORDER BY lower(name)',
    [userId],
  );
  return result.rows.map(row => row.name);
}

/** Resolve a category by name for existing web and Android clients. */
export async function canUseBusinessCategory(userId: string, name: string): Promise<boolean> {
  if (!name) return true;
  const result = await getCrmPool().query<{found:boolean}>(
    `SELECT EXISTS(SELECT 1 FROM public.crm_business_categories
      WHERE user_id = $1 AND lower(btrim(name)) = lower(btrim($2))) AS found`,
    [userId, name],
  );
  return result.rows[0]?.found === true;
}
