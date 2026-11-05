const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const read=(p)=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

const facts=import(pathToFileURL(path.join(__dirname,'../lib/agent-crm/lead-facts.ts')).href);
const types=import(pathToFileURL(path.join(__dirname,'../lib/agent-crm/action-types.ts')).href);

test('generic important facts normalize without requiring industry fields',async()=>{
  const {parseLeadFacts}=await facts;
  assert.deepEqual(parseLeadFacts([{label:' Current system ',value:' Spreadsheets ' }]),
    {ok:true,facts:[{label:'Current system',value:'Spreadsheets'}]});
  assert.deepEqual(parseLeadFacts([]),{ok:true,facts:[]});
  assert.equal(parseLeadFacts([{label:'',value:'ABC'}]).ok,false);
  assert.equal(parseLeadFacts([{label:'Account',value:'A'},{label:'account',value:'B'}]).ok,false);
  assert.equal(parseLeadFacts(Array.from({length:13},(_,i)=>({label:'Fact '+i,value:'A'}))).ok,false);
  assert.equal(parseLeadFacts([{label:'A',value:'B'.repeat(301)}]).ok,false);
});

test('typed actions validate and preserve legacy untyped actions',async()=>{
  const {parseActionType}=await types;
  assert.deepEqual(parseActionType('call','Call tomorrow'),{ok:true,value:'call'});
  assert.deepEqual(parseActionType('whatsapp','Write on WhatsApp'),{ok:true,value:'whatsapp'});
  assert.deepEqual(parseActionType(undefined,'Keep task','meeting'),{ok:true,value:'meeting'});
  assert.deepEqual(parseActionType(undefined,'Legacy untyped'),{ok:true,value:null});
  assert.deepEqual(parseActionType('email',''),{ok:true,value:null});
  assert.equal(parseActionType('phone','Call tomorrow').ok,false);
});

test('all six workflow views are implemented by both mobile and web',()=>{
  const m=read('mobile-app/src/app/index.tsx');
  const w=read('app/crm/CrmClient.tsx');
  const api=read('lib/agent-crm/work-queue.ts');
  for(const v of ['for_you','to_call','followups','done_today','priority','all']){
    assert.match(m,new RegExp("value: '"+v+"'"));
    assert.ok(w.includes('value="' + v + '"'));
    assert.ok(api.includes("'"+v+"'"));
  }
  assert.match(m,/title="View"/);
  assert.doesNotMatch(m,/title="Work queue"|title="Sort"/);
  assert.doesNotMatch(w,/setSortBy\(|setQueue\(/);
  assert.doesNotMatch(w,/Waiting/);
});

test('retry rules use history and a local calendar date, not updated_at',()=>{
  const q=read('lib/agent-crm/work-queue.ts');
  assert.match(q,/ranked AS/);
  assert.match(q,/failed_call_streak/);
  assert.match(q,/CASE WHEN w.failed_call_streak<=2 THEN 1 ELSE 3 END/);
  assert.match(q,/failed_call_streak BETWEEN 1 AND 4/);
  assert.match(q,/failed_call_streak>=5/);
  assert.match(q,/AT TIME ZONE \$2/);
  assert.match(q,/s\.target_id=COALESCE\(b\.next_action_contact_id,b\.primary_contact_id/);
  assert.match(q,/next_action_type='call'/);
  assert.match(q,/is_due OR /);
  assert.match(q,/length\(regexp_replace/);
});

test('lead notes and changes are separate from the immutable activity timeline',()=>{
  const brief=read('app/api/agent-crm/leads/[id]/brief/route.ts');
  const lead=read('app/api/agent-crm/leads/[id]/route.ts');
  assert.match(brief,/WHERE id=\$1 AND user_id=\$2/);
  assert.match(brief,/parseLeadFacts/);
  assert.match(brief,/lead_brief=\$3,important_details=\$4/);
  assert.match(lead,/crm_lead_events/);
  assert.match(lead,/crm_followup_changes/);
  assert.doesNotMatch(brief,/DELETE FROM|UPDATE public\.crm_lead_events/);
});

test('save and next runs only on activity save, after successful API response',()=>{
  const screen=read('mobile-app/src/app/leads/[id].tsx');
  const identity=screen.slice(screen.indexOf('const saveIdentity'),screen.indexOf('const beginContextEdit'));
  const save=screen.slice(screen.indexOf('const save = async'),screen.indexOf('const confirmCallSave'));
  assert.doesNotMatch(identity,/advance|candidate/);
  assert.match(save,/await apiFetch\(path/);
  assert.match(save,/if \(advance && kind === 'call'\)/);
  assert.match(save,/next\.leads\.find/);
  assert.match(screen,/confirmCallSave\(true\)/);
  assert.match(screen,/confirmCallSave\(false\)/);
  assert.match(screen,/title: 'Mark as Do Not Contact\?'/);
});

test('existing 9am reminder scheduler and tapping behavior remain intact',()=>{
  const followup=read('lib/agent-crm/followups.ts');
  const notifications=read('mobile-app/src/lib/notifications.ts');
  assert.match(followup,/DEFAULT_REMINDER_TIME = '09:00'/);
  assert.match(notifications,/lead_id: leadId/);
  assert.match(notifications,/notificationLeadId/);
  assert.match(notifications,/cancelScheduledNotificationAsync/);
});

test('search includes leads hidden from selected work view',()=>{
  const q=read('lib/agent-crm/work-queue.ts');
  assert.match(q,/search \? 'true' : workViewFilter\(view\)/);
});
test('Save & Next continues To Call regardless of original list sort',()=>{
  const lead=read('mobile-app/src/app/leads/[id].tsx');
  assert.match(lead,/const nextView = channel === 'call' \? 'to_call' : 'for_you'/);
  assert.match(lead,/view: nextView/);
});

test('changing a failed phone number makes the contact eligible to retry',()=>{
  const queue=read('lib/agent-crm/work-queue.ts');
  const api=read('app/api/agent-crm/leads/[id]/route.ts');
  assert.match(queue,/phone_changed/);
  assert.match(queue,/called_phone/);
  assert.match(api,/called_phone/);
  assert.match(api,/const calledPhone/);
  assert.match(queue,/AND NOT e.phone_changed/);
});

test('wrong numbers stay blocked until changed and secondary contacts cannot borrow primary phones',()=>{
  const queue=read('lib/agent-crm/work-queue.ts');
  assert.match(queue,/CASE WHEN b.next_action_contact_id IS NOT NULL THEN contact.phone/);
  assert.match(queue,/b.next_action_contact_id=b.primary_contact_id/);
  assert.match(queue,/AND NOT \(COALESCE\(e.last_call_outcome/);
});

test('web CRM supports Save & Next with due Call eligibility and refresh',()=>{
  const web=read('app/crm/CrmClient.tsx');
  assert.match(web,/onNext: \(lead: Lead \| null\) => void/);
  assert.match(web,/workView:'to_call',industry,query:'',alphabetical:false/);
  assert.match(web,/Save & Next/);
  assert.match(web,/Save & Stay/);
  assert.match(web,/onNext={setSelected}/);
});
