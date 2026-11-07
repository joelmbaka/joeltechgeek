const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('category suggestions come only from signed-in user database records', () => {
  const categories = read('lib/agent-crm/categories.ts');
  const api = read('app/api/agent-crm/categories/route.ts');
  assert.match(categories, /crm_business_categories WHERE user_id = \\$1/);
  assert.match(categories, /crm_leads WHERE user_id = \\$1/);
  assert.doesNotMatch(categories, /CRM_INDUSTRIES|isCrmIndustry/);
  assert.match(api, /getBusinessCategories\\(access\\.user\\.id\\)/);
  assert.match(api, /INSERT INTO public\\.crm_business_categories \\(user_id, name\\)/);
  assert.doesNotMatch(api, /CRM_INDUSTRIES/);
});

test('both create-lead screens can save a new category without predefined options', () => {
  const web = read('app/crm/AddLeadModal.tsx');
  const android = read('mobile-app/src/app/leads/new.tsx');
  assert.match(web, /useState<string\\[\\]>\\(\\[\\]\\)/);
  assert.match(web, /\\+ Add new category/);
  assert.match(web, /\\/api\\/agent-crm\\/categories/);
  assert.match(android, /onCreateOption=\\{createCategory\\}/);
  assert.match(android, /\\/api\\/agent-crm\\/categories/);
  assert.doesNotMatch(web, /CRM_INDUSTRIES/);
});

test('web and Android industry filters use the current user lead categories', () => {
  const web = read('app/crm/CrmClient.tsx');
  const android = read('mobile-app/src/app/index.tsx');
  const queue = read('lib/agent-crm/work-queue.ts');
  assert.match(web, /data\\?\\.industries \\|\\| \\[\\]/);
  assert.doesNotMatch(web, /CRM_INDUSTRIES/);
  assert.match(android, /data\\?\\.industries/);
  assert.match(queue, /SELECT industry,count\\(\\*\\)::int count FROM public\\.crm_leads WHERE user_id=\\$1/);
});
