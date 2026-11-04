const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const m = import(pathToFileURL(path.join(__dirname, '../lib/agent-crm/lead-identity.ts')).href);

test('company-only lead is valid', async () => {
  const { normalizeLeadIdentity } = await m;
  assert.deepEqual(normalizeLeadIdentity({company_name:' ABC Logistics ',contact_name:''}),
    {ok:true,identity:{company_name:'ABC Logistics',contact_name:''}});
});
test('contact-only lead is valid', async () => {
  const { normalizeLeadIdentity } = await m;
  assert.deepEqual(normalizeLeadIdentity({company_name:'',contact_name:' John Mwangi '}),
    {ok:true,identity:{company_name:'',contact_name:'John Mwangi'}});
});
test('both company and contact are valid', async () => {
  const { normalizeLeadIdentity } = await m;
  assert.equal(normalizeLeadIdentity({company_name:'ABC',contact_name:'John'}).ok,true);
});
test('neither name is invalid', async () => {
  const { normalizeLeadIdentity } = await m;
  assert.deepEqual(normalizeLeadIdentity({company_name:' ',contact_name:'  '}),
    {ok:false,error:'Company or contact name required.'});
});
test('role/phone/email do not count as an identifying name', async () => {
  const { normalizeLeadIdentity } = await m;
  assert.equal(normalizeLeadIdentity({company_name:'',contact_name:'',phone:'0712345678',contact_role:'Manager',email:'x@y.com'}).ok,false);
});
test('legacy company-only payload remains supported', async () => {
  const { normalizeLeadIdentity } = await m;
  assert.equal(normalizeLeadIdentity({company_name:'Legacy Company'}).ok,true);
});
test('same company with multiple prospective leads remains valid in API parsing', async () => {
  const { normalizeLeadIdentity } = await m;
  const a = normalizeLeadIdentity({company_name:'ABC',contact_name:'A'});
  const b = normalizeLeadIdentity({company_name:'ABC',contact_name:'B'});
  assert.equal(a.ok,true);assert.equal(b.ok,true);
});
test('name lengths and types are checked', async () => {
  const { normalizeLeadIdentity } = await m;
  assert.equal(normalizeLeadIdentity({company_name:'x'.repeat(181),contact_name:'A'}).ok,false);
  assert.equal(normalizeLeadIdentity({company_name:'x',contact_name:'a'.repeat(151)}).ok,false);
  assert.equal(normalizeLeadIdentity({company_name:5,contact_name:'A'}).ok,false);
  assert.equal(normalizeLeadIdentity({company_name:'A',contact_name:{name:'B'}}).ok,false);
});
test('display name prefers company then contact', async () => {
  const { leadDisplayName } = await m;
  assert.equal(leadDisplayName({company_name:'ABC',contact_name:'John'}),'ABC');
  assert.equal(leadDisplayName({company_name:'',contact_name:'John'}),'John');
  assert.equal(leadDisplayName({company_name:'',contact_name:''}),'Unnamed lead');
});
