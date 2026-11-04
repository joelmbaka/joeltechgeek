const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const getModule = import(pathToFileURL(path.join(__dirname, '../lib/agent-crm/lead-identity.ts')).href);

test('creates a titled opportunity without a company', async () => {
  const { normalizeLeadIdentity } = await getModule;
  assert.deepEqual(normalizeLeadIdentity({lead_title:'  Website redesign ', company_name:''}), {
    ok: true, identity: {lead_title:'Website redesign', company_name:''},
  });
});

test('allows the same company for independent opportunities', async () => {
  const { normalizeLeadIdentity } = await getModule;
  const a = normalizeLeadIdentity({lead_title:'Fleet monitoring', company_name:'ABC Logistics'});
  const b = normalizeLeadIdentity({lead_title:'Driver portal', company_name:'ABC Logistics'});
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.notEqual(a.identity.lead_title, b.identity.lead_title);
  assert.equal(a.identity.company_name, b.identity.company_name);
});

test('legacy Android clients can still create leads with company only', async () => {
  const { normalizeLeadIdentity } = await getModule;
  assert.deepEqual(normalizeLeadIdentity({company_name:'  BlazeShield  '}, {allowLegacyTitle:true}), {
    ok: true, identity: {lead_title:'BlazeShield', company_name:'BlazeShield'},
  });
});

test('explicit empty title is not silently replaced by company', async () => {
  const { normalizeLeadIdentity } = await getModule;
  assert.equal(normalizeLeadIdentity({lead_title:' ', company_name:'ABC'}, {allowLegacyTitle:true}).ok, false);
});

test('requires an opportunity title for edits', async () => {
  const { normalizeLeadIdentity } = await getModule;
  for (const input of [{company_name:'ABC'}, {lead_title:'   ',company_name:'ABC'},
    {lead_title:null,company_name:'ABC'}]) {
    assert.equal(normalizeLeadIdentity(input).ok, false);
  }
});

test('trims company and title while keeping their original case', async () => {
  const { normalizeLeadIdentity } = await getModule;
  assert.deepEqual(normalizeLeadIdentity({lead_title:'  B2B Pilot  ',company_name:'  ACME Ltd  '}),{
    ok:true, identity:{lead_title:'B2B Pilot',company_name:'ACME Ltd'},
  });
});

test('rejects strings exceeding field limits', async () => {
  const { normalizeLeadIdentity } = await getModule;
  assert.equal(normalizeLeadIdentity({lead_title:'A'.repeat(181)}).ok,false);
  assert.equal(normalizeLeadIdentity({lead_title:'Valid',company_name:'X'.repeat(181)}).ok,false);
});

test('rejects invalid company types', async () => {
  const { normalizeLeadIdentity } = await getModule;
  assert.equal(normalizeLeadIdentity({lead_title:'Valid',company_name:{value:'ABC'}}).ok,false);
});

test('permits omitted or null company and normalizes to empty string', async () => {
  const { normalizeLeadIdentity } = await getModule;
  assert.deepEqual(normalizeLeadIdentity({lead_title:'Project A',company_name:null}),{
    ok:true, identity:{lead_title:'Project A',company_name:''},
  });
});
