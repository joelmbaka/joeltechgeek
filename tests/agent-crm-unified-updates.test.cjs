const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('unified endpoint is one authenticated transaction with rollback',()=>{
  const api = read('app/api/agent-crm/leads/[id]/updates/route.ts');
  assert.match(api,/requireCrmUser\(request\)/);
  assert.match(api,/validCrmWriteOrigin\(request\)/);
  assert.match(api,/WHERE id=\$1 AND user_id=\$2 FOR UPDATE/);
  assert.match(api,/await client\.query\('BEGIN'\)/);
  assert.match(api,/await client\.query\('COMMIT'\)/);
  assert.match(api,/await client\.query\('ROLLBACK'\)/);
  assert.match(api,/event_type,outcome,notes,channel/);
  assert.match(api,/crm_followup_changes/);
});
test('all update combinations: optional interaction, note, task, or exclusion',()=>{
  const api=read('app/api/agent-crm/leads/[id]/updates/route.ts');
  const editor=read('mobile-app/src/components/RecordUpdateSheet.tsx');
  assert.match(api,/mode === 'keep'/);
  assert.match(api,/!hasOutcome && !notes\.trim\(\) && mode === 'keep'/);
  assert.match(api,/if \(hasOutcome\)/);
  assert.match(api,/if \(effectiveMode === 'complete'/);
  assert.match(api,/event_type,notes/);
  assert.match(api,/classification_changed/);
  assert.match(api,/disposition === 'do_not_contact'/);
  assert.match(api,/willChangeFollowup/);
  assert.match(editor,/No interaction \(note or follow-up only\)/);
  assert.match(editor,/Notes \(optional\)/);
  assert.match(editor,/Save & Stay/);
  assert.match(editor,/Save & Next/);
});
test('note and classification migration keeps existing activity rows',()=>{
  const sql=read('migrations/2026-11-06-crm-unified-updates.sql');
  assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;/);
  assert.match(sql,/note_added/);assert.match(sql,/classification_changed/);
  assert.match(sql,/event_type = 'outreach'/);
  assert.match(sql,/event_type = 'action_completed'/);
  assert.doesNotMatch(sql,/DELETE FROM|TRUNCATE/i);
});
test('mobile active directory excludes closed; web directory stays compatible',()=>{
  const queue=read('lib/agent-crm/work-queue.ts');
  const mobile=read('mobile-app/src/app/index.tsx');
  assert.match(queue,/return ACTIVE;/);
  assert.match(queue,/if\(view==='all' \|\| view==='all_az'\) return 'true'/);
  assert.match(queue,/all_active/);
  assert.match(mobile,/all_az_active/);
  assert.match(queue,/return ACTIVE \+ ' AND w.done_today'/);
  for(const suffix of ['closed','closed_competitor','closed_dnc','closed_won','closed_lost'])
    assert.ok(queue.includes("'"+suffix+"'"));
  assert.match(queue,/search && view==='for_you' \? ACTIVE/);
  assert.match(mobile,/Closed & Excluded/);
  assert.match(mobile,/title="Closed status"/);
  assert.match(mobile,/closedStatus !== 'all'/);
});
test('lead page is action-first and history is visible before recording an update',()=>{
  const lead=read('mobile-app/src/app/leads/[id].tsx');
  assert.ok(lead.indexOf('Next follow-up')<lead.indexOf('Lead overview'));
  assert.ok(lead.indexOf('Lead overview')<lead.indexOf('Activity history ('));
  assert.ok(lead.indexOf('Activity history (')<lead.indexOf('+ Record update'));
  assert.match(lead,/history\.slice\(0,3\)/);
  assert.match(lead,/RecordUpdateSheet/);
  assert.match(lead,/openBrowserAsync/);
  assert.match(lead,/const saveUnified = async/);
  assert.match(lead,/savingRef\.current/);
});
test('three contact actions maintain equal width, including disabled placeholders',()=>{
  const actions=read('mobile-app/src/components/LeadContactActions.tsx');
  const contacts=read('mobile-app/src/components/LeadContacts.tsx');
  assert.match(actions,/kind:'call',label:'Call'/);
  assert.match(actions,/kind:'whatsapp',label:'WhatsApp'/);
  assert.match(actions,/kind:'email',label:'Email'/);
  assert.match(actions,/accessibilityState=\{\{disabled:!enabled\}\}/);
  assert.match(actions,/style=\{\{flex:1,minWidth:0/);
  assert.match(contacts,/<LeadContactActions/);
});
test('native time selection is 12-hour AM/PM while keeping 24-hour API storage',()=>{
  const picker=read('mobile-app/src/components/NativeSchedulePicker.tsx');
  assert.match(picker,/is24Hour=\{false\}/);
  assert.match(picker,/timeLabel\(value\)/);
  assert.match(picker,/two\(value\.getHours\(\)\)/);
});
