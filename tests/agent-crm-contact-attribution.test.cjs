const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Node 22: node --experimental-strip-types --test tests/agent-crm-contact-attribution.test.cjs
const modulePromise = import(pathToFileURL(path.join(__dirname, '../lib/agent-crm/contact-attribution.ts')).href);
const leadId = 'bb5fd64c-6792-480b-9c03-00edff8d4e3e';
const otherLeadId = 'cd485ac0-a1a1-44f3-81a5-595eb819fe65';
const primaryId = '81d6c40c-adfd-4c12-80b5-36eae2b981d5';
const secondaryId = '223bfb8e-4b08-48ca-94e7-e3f4239b3954';
const outsiderId = '3dbe2dc7-617f-401e-a18f-2279dbb46731';
const contacts = [
  { id: primaryId, lead_id: leadId, name: 'Grace', role: 'Manager', phone: null, email: null, is_primary: true },
  { id: secondaryId, lead_id: leadId, name: 'Kevin', role: 'Technician', phone: null, email: null, is_primary: false },
  { id: outsiderId, lead_id: otherLeadId, name: 'Other', role: null, phone: null, email: null, is_primary: true },
];
function mockClient(records) {
  return {
    async query(sql, args) {
      const rows = records.filter((c) => c.lead_id === args[0]);
      return {
        rows: sql.includes('ORDER BY')
          ? rows.sort((a, b) => Number(b.is_primary) - Number(a.is_primary)).slice(0, 1)
          : rows.filter((c) => c.id === args[1]),
      };
    },
  };
}
test('old clients default to the primary contact', async () => {
  const { resolveContactTarget } = await modulePromise;
  assert.deepEqual(await resolveContactTarget(mockClient(contacts), leadId, undefined),
    { ok: true, id: primaryId, name: 'Grace' });
});
test('one contact is associated automatically', async () => {
  const { resolveContactTarget } = await modulePromise;
  assert.equal((await resolveContactTarget(mockClient(contacts.slice(1, 2)), leadId, undefined)).id, secondaryId);
});
test('no contacts means a lead-level activity', async () => {
  const { resolveContactTarget } = await modulePromise;
  assert.deepEqual(await resolveContactTarget(mockClient([]), leadId, undefined),
    { ok: true, id: null, name: null });
});
test('explicit company-level activity is preserved', async () => {
  const { resolveContactTarget } = await modulePromise;
  for (const value of [null, '']) {
    assert.deepEqual(await resolveContactTarget(mockClient(contacts), leadId, value),
      { ok: true, id: null, name: null });
  }
});
test('secondary contact selection is accepted', async () => {
  const { resolveContactTarget } = await modulePromise;
  assert.deepEqual(await resolveContactTarget(mockClient(contacts), leadId, secondaryId),
    { ok: true, id: secondaryId, name: 'Kevin' });
});
test('cross-lead contact selection is rejected', async () => {
  const { resolveContactTarget } = await modulePromise;
  assert.equal((await resolveContactTarget(mockClient(contacts), leadId, outsiderId)).ok, false);
});
test('malformed contact IDs are rejected', async () => {
  const { resolveContactTarget } = await modulePromise;
  assert.equal((await resolveContactTarget(mockClient(contacts), leadId, 'not-a-uuid')).ok, false);
});
