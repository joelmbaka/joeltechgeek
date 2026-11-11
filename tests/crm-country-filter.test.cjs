const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const base = path.join(__dirname, '..');
const source = name => fs.readFileSync(path.join(base, name), 'utf8');
const countries = import(pathToFileURL(path.join(base, 'lib/agent-crm/countries.ts')).href);

test('shared country catalog contains all 249 distinct ISO alpha-2 territories', async () => {
  const { COUNTRIES } = await countries;
  assert.equal(COUNTRIES.length, 249);
  assert.equal(new Set(COUNTRIES.map(row => row.code)).size, 249);
  assert.ok(COUNTRIES.every(row => /^[A-Z]{2}$/.test(row.code) && row.name.length));
});

test('country names, codes and familiar legacy aliases normalize consistently', async () => {
  const { countryCode, countryName, countrySearchMatches } = await countries;
  assert.equal(countryCode('Kenya'), 'KE');
  assert.equal(countryCode('ke'), 'KE');
  assert.equal(countryCode('UK'), 'GB');
  assert.equal(countryCode('United Kingdom'), 'GB');
  assert.equal(countryCode('USA'), 'US');
  assert.equal(countryCode('Ivory Coast'), 'CI');
  assert.equal(countryCode('Côte d’Ivoire'), 'CI');
  assert.equal(countryCode('Not a country'), null);
  assert.equal(countryName('GB'), 'United Kingdom');
  assert.equal(countryName('Kenya'), 'Kenya');
  assert.equal(countryName('Unmapped old value'), 'Unmapped old value');
  assert.ok(countrySearchMatches('United States', 'uni'));
  assert.ok(countrySearchMatches('United States', 'america'));
  assert.ok(!countrySearchMatches('Kenya', 'britain'));
});

test('legacy and ISO records count under the same code; blanks and unknowns stay distinct', async () => {
  const { countryCountMap, UNSPECIFIED_COUNTRY, UNRECOGNIZED_COUNTRY } = await countries;
  const counts = countryCountMap([
    { country: 'Kenya', count: 4 },
    { country: 'KE', count: 7 },
    { country: 'UK', count: 2 },
    { country: '', count: 3 },
    { country: 'Unknown historic string', count: 1 },
  ]);
  assert.equal(counts.KE, 11);
  assert.equal(counts.GB, 2);
  assert.equal(counts[UNSPECIFIED_COUNTRY], 3);
  assert.equal(counts[UNRECOGNIZED_COUNTRY], 1);
});

test('SQL filter terms include ISO codes and original legacy display names', async () => {
  const { countryFilterTerms } = await countries;
  const values = countryFilterTerms(['KE', 'GB']);
  assert.ok(values.includes('ke'));
  assert.ok(values.includes('kenya'));
  assert.ok(values.includes('gb'));
  assert.ok(values.includes('united kingdom'));
  assert.ok(values.includes('uk'));
  assert.ok(!values.includes('united states'));
});

test('server applies multi-country filters before page limit and calculates per-user counts', () => {
  const sql = source('lib/agent-crm/work-queue.ts');
  assert.match(sql, /params\.get\('countries'\)/);
  assert.match(sql, /countryFilterTerms\(codes\)/);
  assert.match(sql, /filters\.push\('\(' \+ alternatives\.join\(' OR '\) \+ '\)'\)/);
  assert.match(sql, /countryCountMap\(countryRows\.rows\)/);
  assert.match(sql, /WHERE user_id=\$1 GROUP BY country/);
  const conditionPos = sql.indexOf("const condition=filters.join(' AND ')");
  const filterPos = sql.indexOf("if (countries.length)");
  const limitPos = sql.indexOf("const select=prefix+' SELECT w.*");
  assert.ok(filterPos > 0 && filterPos < conditionPos && conditionPos < limitPos);
});

test('POST and identity PATCH normalize country names and codes before storing', () => {
  assert.match(source('app/api/agent-crm/leads/route.ts'), /values\.country = code/);
  assert.match(source('app/api/agent-crm/leads/[id]/identity/route.ts'), /edits\.country = code/);
});

test('Add and Edit use searchable world-country pickers, filter uses checkbox sheet', () => {
  const add = source('mobile-app/src/app/leads/new.tsx');
  const edit = source('mobile-app/src/app/leads/edit/[id].tsx');
  const home = source('mobile-app/src/app/index.tsx');
  const sheet = source('mobile-app/src/components/CountryFilterSheet.tsx');
  assert.match(add, /COUNTRIES\.map/);
  assert.match(add, /searchable autoFocusSearch/);
  assert.match(edit, /countryCode\(lead\.country\)/);
  assert.match(edit, /searchable autoFocusSearch/);
  assert.match(home, /<CountryFilterSheet/);
  assert.match(home, /countries: countriesParam/);
  assert.match(home, /queueCountries: countriesParam/);
  assert.match(sheet, /accessibilityRole="checkbox"/);
  assert.match(sheet, /Search countries/);
  assert.match(sheet, /onApply\(draft\)/);
});

test('Save & Next retains the country filter when crossing page boundaries', () => {
  const detail = source('mobile-app/src/app/leads/[id].tsx');
  assert.match(detail, /queueCountries:queueCountries\|\|''/);
  assert.match(detail, /countries:queueCountries\|\|''/);
});

test('country filter trigger identifies Country and cancel never applies drafts', () => {
  const sheet = source('mobile-app/src/components/CountryFilterSheet.tsx');
  assert.match(sheet, />Country<\/Text>/);
  assert.match(sheet, /accessibilityLabel="Cancel country filter changes" onPress={close}/);
  assert.match(sheet, />Cancel<\/Text>/);
  assert.match(sheet, /const apply = \(\) => \{ onApply\(draft\); close\(\); \}/);
  assert.match(sheet, /onPress=\{\(\) => setDraft\(\[\]\)\}/);
  assert.match(sheet, /Apply filter/);
  assert.doesNotMatch(sheet, />Done<\/Text>/);
  assert.doesNotMatch(sheet, /map\(\(offset, index\)/);
});

test('selected country control is larger and inactive chevron is visually centered', () => {
  const sheet = source('mobile-app/src/components/CountryFilterSheet.tsx');
  assert.match(sheet, /minWidth: active \? 126 : 108, minHeight: active \? 64 : 54/);
  assert.match(sheet, /borderWidth: active \? 2 : 1/);
  assert.match(sheet, /fontSize: active \? 14 : 13/);
  assert.match(sheet, /width: 18, height: 18, alignItems: 'center', justifyContent: 'center'/);
  assert.match(sheet, /transform: \[\{ rotate: '45deg' \}\]/);
  assert.doesNotMatch(sheet, />⌄<\/Text>/);
});
