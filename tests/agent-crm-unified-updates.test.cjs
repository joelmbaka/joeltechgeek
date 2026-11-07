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
  assert.match(editor,/Record an outcome or leave a note/);
  assert.match(editor,/channel: channel && outcome \? channel as ActivityChannel : null/);
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
test('lead page keeps recent history visible below the Record Update action',()=>{
  const lead=read('mobile-app/src/app/leads/[id].tsx');
  assert.ok(lead.indexOf('Next follow-up')<lead.indexOf('Lead overview'));
  assert.ok(lead.indexOf('Lead overview')<lead.indexOf('Activity history ('));
  assert.ok(lead.indexOf('+ Record update')<lead.indexOf('Activity history ('));
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

test('Save & Stay refreshes lead and activity history after the committed write',()=>{
  const screen=read('mobile-app/src/app/leads/[id].tsx');
  assert.match(screen,/detailsRequestVersion = useRef\(0\)/);
  assert.match(screen,/version !== detailsRequestVersion\.current/);
  assert.match(screen,/const refreshDetails = async \(leadId: string\)/);
  assert.match(screen,/setHistory\(details\.history\)/);
  assert.match(screen,/const fresh = await refreshDetails\(response\.lead\.id\)/);
  assert.match(screen,/Update saved, but history could not refresh/);
  assert.match(screen,/Refresh details/);
  assert.doesNotMatch(
    screen.slice(screen.indexOf('const saveUnified'),screen.indexOf('const openWebsite')),
    /reload\(\)/,
  );
});

test('competitor reopen validates the fetched lead ID and reports diagnostics only on dev',()=>{
  const screen=read('mobile-app/src/app/leads/[id].tsx');
  const route=read('app/api/agent-crm/leads/[id]/classification/route.ts');
  const start=screen.indexOf('const reopenCompetitor');
  const end=screen.indexOf('if(!user)return',start);
  const reopen=screen.slice(start,end);
  assert.match(reopen,/const leadId = activeLead\.id/);
  assert.match(reopen,/UUID\.test\(leadId\)/);
  assert.match(reopen,/encodeURIComponent\(leadId\)/);
  assert.match(reopen,/apiFetch<\{ok:true;lead:Lead\}>\(path/);
  assert.match(reopen,/refreshDetails\(leadId\)/);
  assert.match(reopen,/if \(__DEV__\) console\.warn/);
  assert.match(route,/if \(!UUID\.test\(id\)\) return fail\('Invalid lead\.', 400\)/);
});

test('Record Update modal keeps status bar visible in both themes',()=>{
  const modal=read('mobile-app/src/components/RecordUpdateSheet.tsx');
  assert.match(modal,/useColorScheme/);
  assert.match(modal,/statusBarTranslucent=\{false\}/);
  assert.match(modal,/<StatusBar style=\{dark \? 'light' : 'dark'\} hidden=\{false\}/);
  assert.match(modal,/SafeAreaView style=\{\{flex:1,backgroundColor:theme.background\}\}/);
  assert.doesNotMatch(modal,/<StatusBar[^>]*backgroundColor=/);
});
test('Record Update starts with follow-up form open, but keeps outcome-only possible',()=>{
  const editor=read('mobile-app/src/components/RecordUpdateSheet.tsx');
  assert.match(editor,/useState\(true\)/);
  assert.match(editor,/setIncludeFollowup\(true\)/);
  assert.match(editor,/const followupOpen = includeFollowup/);
  assert.match(editor,/const scheduling = followupOpen/);
  assert.match(editor,/const validSchedule = !scheduling/);
  assert.match(editor,/onPress=\{\(\)=>setIncludeFollowup/);
  assert.match(editor,/mode: scheduling \? 'set' : 'keep'/);
  assert.doesNotMatch(editor,/title="Next step"/);
  assert.match(editor,/Save & Stay/);
  assert.match(editor,/Save & Next/);
});
test('lead follow-up Edit and Complete are inline and not modal navigation',()=>{
  const screen=read('mobile-app/src/app/leads/[id].tsx');
  const component=read('mobile-app/src/components/InlineFollowupEditor.tsx');
  assert.match(screen,/<InlineFollowupEditor/);
  assert.match(screen,/setInlineFollowupMode\('edit'\)/);
  assert.match(screen,/setInlineFollowupMode\('complete'\)/);
  assert.match(screen,/setInlineFollowupMode\(null\)/);
  assert.match(screen,/\/followup'/);
  assert.match(screen,/followup:\{mode:'complete'\}/);
  assert.match(component,/Save follow-up/);
  assert.match(component,/Mark completed/);
  assert.match(component,/Completion notes \(optional\)/);
  assert.match(component,/onCancel/);
});
test('lead hierarchy and header Edit match requested ordering',()=>{
  const screen=read('mobile-app/src/app/leads/[id].tsx');
  const overview=screen.indexOf('Lead overview');
  const record=screen.indexOf('+ Record update');
  const history=screen.indexOf('Activity history (');
  assert.ok(overview >= 0 && overview < record && record < history);
  assert.match(screen,/<Stack.Screen options=\{\{/);
  assert.match(screen,/headerRight: \(\) => <Pressable/);
  assert.match(screen,/onPress=\{\(\)=>router\.push\(\{pathname:'\/leads\/edit\/\[id\]'/);
  assert.match(screen,/← Back to leads/);
});
test('contact edit and remove are icon actions in the header and forms split width',()=>{
  const contacts=read('mobile-app/src/components/LeadContacts.tsx');
  assert.match(contacts,/import \{ SymbolView \} from 'expo-symbols'/);
  assert.match(contacts,/accessibilityLabel=\{'Edit '/);
  assert.match(contacts,/accessibilityLabel=\{'Remove '/);
  assert.match(contacts,/tintColor=\{theme.warning\}/);
  assert.match(contacts,/borderRadius:16,paddingHorizontal:9/);
  assert.match(contacts,/Save contact/);
  assert.match(contacts,/Add contact/);
  assert.match(contacts,/style=\{\{flex:1\}\}>/);
  assert.doesNotMatch(contacts,/'>Edit<\/Text>/);
});
test('time display accepts stored 24-hour values and formats 12-hour',()=>{
  const picker=read('mobile-app/src/components/NativeSchedulePicker.tsx');
  assert.match(picker,/String\(hour % 12 \|\| 12\)/);
  assert.match(picker,/hour < 12 \? ' AM' : ' PM'/);
  assert.ok(picker.includes('/^' + String.fromCharCode(92) + 'd{2}:' +
    String.fromCharCode(92) + 'd{2}$/'));
  assert.doesNotMatch(picker,/is24Hour(?!=\{false\})/);
});
