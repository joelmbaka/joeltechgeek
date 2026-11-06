const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = (p) => fs.readFileSync(path.join(root,p),'utf8');
const api = [
  'leads/route.ts','leads/[id]/route.ts',
  'leads/[id]/actions/route.ts','leads/[id]/classification/route.ts',
  'leads/[id]/followup/route.ts','leads/[id]/updates/route.ts',
  'leads/[id]/contact/route.ts',
  'leads/[id]/contacts/route.ts','leads/[id]/contacts/[contactId]/route.ts',
  'leads/[id]/identity/route.ts','categories/route.ts',
  'followups/upcoming/route.ts','mobile/meta/route.ts',
].map(p=>'app/api/agent-crm/'+p);

test('CRM APIs scope ownership to user_id and never trust agent applications', () => {
  for (const file of api) {
    const text = source(file);
    assert.doesNotMatch(text,/\bagent_id\b|sales_agent_applications|requireCrmAgent|access\.agent/);
    assert.match(text,/requireCrmUser/);
  }
});
test('canonical user model and verified Google registration', () => {
  const user=source('lib/agent-crm/users.ts');
  const web=source('auth.ts');
  const android=source('app/api/agent-crm/mobile/oauth/callback/route.ts');
  assert.match(user,/WHERE google_sub=\$1/);
  assert.match(user,/google_sub IS NULL OR google_sub=\$2/);
  assert.match(web,/profile\?\.email_verified !== true/);
  assert.match(web,/profile\.sub !== account\.providerAccountId/);
  assert.match(android,/payload\.email_verified !== true/);
  assert.match(android,/findOrCreateCrmUser/);
});
test('mobile login preserves published token format and legacy client response',()=>{
  const access=source('lib/agent-crm/mobile-auth.ts');
  const exchange=source('app/api/agent-crm/mobile/oauth/exchange/route.ts');
  const refresh=source('app/api/agent-crm/mobile/refresh/route.ts');
  assert.match(access,/sub: userId/);
  assert.match(exchange,/agent: user/);
  assert.match(refresh,/agent: user/);
  assert.match(access,/crm_mobile_sessions \(user_id/);
});
test('migration transfers IDs and removes duplicate owner columns',()=>{
  const sql=source('migrations/2026-11-04-crm-phase5-personal-users.sql');
  assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.crm_users/);
  assert.match(sql,/SELECT id,lower\(btrim\(email\)\),full_name,phone/);
  assert.match(sql,/RENAME COLUMN agent_id TO user_id/g);
  for(const table of ['crm_lead_events','crm_followup_changes','crm_lead_updates'])
    assert.match(sql,new RegExp('ALTER TABLE public\\.'+table+' DROP COLUMN agent_id'));
  assert.doesNotMatch(sql,/DROP TABLE\s+public\.crm_leads/i);
});
test('mobile notification migration accepts old reminders and uses new user key',()=>{
  const notify=source('mobile-app/src/lib/notifications.ts');
  assert.match(notify,/crm_user_id \?\? data\?\.crm_agent_id/);
  assert.match(notify,/crm_user_id: user\.id/);
});
