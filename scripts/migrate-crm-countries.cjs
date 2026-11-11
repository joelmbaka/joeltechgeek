/** One-time migration: audit first; run --apply only after reviewing the report.
 * Usage:
 *   DATABASE_URL=... node --experimental-strip-types scripts/migrate-crm-countries.cjs
 *   DATABASE_URL=... node --experimental-strip-types scripts/migrate-crm-countries.cjs --apply
 * No changes are made without --apply. Unknown historical values stop the migration.
 */
const { Client } = require('pg');
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');

async function main() {
  const apply = process.argv.includes('--apply');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const { countryCode } = await import(
    pathToFileURL(join(__dirname, '../lib/agent-crm/countries.ts')).href,
  );
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(
      'SELECT country, count(*)::int AS count FROM public.crm_leads GROUP BY country ORDER BY country',
    );
    const changes = [];
    const unknown = [];
    let unchanged = 0;
    for (const row of result.rows) {
      const raw = typeof row.country === 'string' ? row.country : '';
      if (!raw.trim()) { unchanged += row.count; continue; }
      const code = countryCode(raw);
      if (!code) { unknown.push({ value: raw, leads: row.count }); continue; }
      if (raw === code) { unchanged += row.count; continue; }
      changes.push({ from: raw, to: code, leads: row.count });
    }
    console.log(JSON.stringify({
      mode: apply ? 'apply' : 'dry-run',
      changes, unknown, alreadyNormalizedOrBlank: unchanged,
    }, null, 2));
    if (unknown.length) {
      throw new Error('Unrecognized historical countries found. Correct them before applying.');
    }
    if (!apply) {
      console.log('Dry-run only. No rows were changed. Use --apply to migrate.');
      return;
    }
    await client.query('BEGIN');
    try {
      for (const change of changes) {
        await client.query(
          'UPDATE public.crm_leads SET country=$1 WHERE country=$2',
          [change.to, change.from],
        );
      }
      await client.query('COMMIT');
      console.log('Country-code migration committed. Lead identities and workflow data unchanged.');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    await client.end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
