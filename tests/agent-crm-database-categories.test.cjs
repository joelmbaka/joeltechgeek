const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('category suggestions come only from signed-in user database records', () => {
  const categories = read('lib/agent-crm/categories.ts');
  const api = read('app/api/agent-crm/categories/route.ts');
  assert.match(categories, /crm_business_categories WHERE user_id = \$1/);
  assert.doesNotMatch(categories, /SELECT DISTINCT industry/);
  assert.doesNotMatch(categories, /CRM_INDUSTRIES|isCrmIndustry/);
  assert.match(api, /getBusinessCategories\(access\.user\.id\)/);
  assert.match(api, /INSERT INTO public\.crm_business_categories \(user_id, name\)/);
  assert.doesNotMatch(api, /CRM_INDUSTRIES/);
});

test('both create-lead screens can save a new category without predefined options', () => {
  const web = read('app/crm/AddLeadModal.tsx');
  const android = read('mobile-app/src/app/leads/new.tsx');
  assert.match(web, /useState<string\[\]>\(\[\]\)/);
  assert.match(web, /\+ Add new category/);
  assert.match(web, /\/api\/agent-crm\/categories/);
  assert.match(android, /onCreateOption=\{createCategory\}/);
  assert.match(android, /\/api\/agent-crm\/categories/);
  assert.doesNotMatch(web, /CRM_INDUSTRIES/);
});

test('web and Android industry filters use the current user lead categories', () => {
  const web = read('app/crm/CrmClient.tsx');
  const android = read('mobile-app/src/app/index.tsx');
  const queue = read('lib/agent-crm/work-queue.ts');
  assert.match(web, /data\?\.industries \|\| \[\]/);
  assert.doesNotMatch(web, /CRM_INDUSTRIES/);
  assert.match(android, /data\?\.industries/);
  assert.match(queue, /JOIN public\.crm_business_categories/);
});

test('Android category creation is an isolated bottom-sheet view with bounded preview', () => {
  const sheet = read('mobile-app/src/components/SelectSheet.tsx');
  assert.match(sheet, /\{!adding \? <ScrollView/);
  assert.match(sheet, /\{adding \? 'New category' : title\}/);
  assert.match(sheet, /existingCategories\.slice\(0, 5\)/);
  assert.match(sheet, /Show all /);
  assert.match(sheet, /Category already exists\./);
  assert.doesNotMatch(sheet, /e\.g\. Fleet Operators/);
});

test('Web category creation uses a separate centered dialog and compact category preview', () => {
  const web = read('app/crm/AddLeadModal.tsx');
  assert.match(web, /aria-labelledby="new-business-category-title"/);
  assert.match(web, /categories\.slice\(0, 5\)/);
  assert.match(web, /max-h-40 overflow-y-auto/);
  assert.match(web, /Category already exists\./);
  assert.doesNotMatch(web, /e\.g\. Fleet Operators/);
});

test('Duplicate business categories are rejected by server for the authenticated user', () => {
  const api = read('app/api/agent-crm/categories/route.ts');
  assert.match(api, /Category already exists\./);
  assert.match(api, /status: 409/);
  assert.match(api, /RETURNING name/);
  assert.match(api, /replace\(\/\\s\+\/g, ' '\)/);
});

test('lead category ownership is enforced by a composite foreign key with legacy-client sync', () => {
  const migration = read('migrations/2026-11-07-crm-normalize-business-categories.sql');
  const db = read('lib/agent-crm/db.ts');
  const categories = read('lib/agent-crm/categories.ts');
  assert.match(migration, /FOREIGN KEY \(business_category_id, user_id\)/);
  assert.match(migration, /REFERENCES public\.crm_business_categories\(id, user_id\)/);
  assert.match(migration, /CREATE TRIGGER crm_leads_business_category_sync/);
  assert.match(migration, /CREATE TRIGGER crm_business_category_name_sync/);
  assert.match(migration, /RAISE EXCEPTION 'Category backfill is incomplete'/);
  assert.match(db, /business_category_id::text AS business_category_id/);
  assert.doesNotMatch(categories, /SELECT DISTINCT industry/);
});
