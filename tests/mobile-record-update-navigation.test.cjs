const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const mobile = name => readFileSync(join(__dirname,'..','mobile-app','src',name),'utf8');

test('record update always exposes activity type and contact without an outcome picker', () => {
  const src = mobile('components/RecordUpdateSheet.tsx');
  assert.match(src, /<Text style={styles.label}>Activity type<\/Text>/);
  assert.match(src, /<SelectSheet title="Contact" value={interactionContact}/);
  assert.match(src, /<Field label="Notes \(optional\)"/);
  assert.doesNotMatch(src, /Record outcome \(optional\)|Choose outcome|title="Outcome"|showOutcome/);
  assert.match(src, /outcome: null,/);
  assert.match(src, /channel: hasInteraction \? channel as ActivityChannel : null/);
  assert.match(src, /const hasInteraction = !!notes\.trim\(\) && disposition === 'keep'/);
});

test('a new record update never imports or silently modifies an existing follow-up', () => {
  const src = mobile('components/RecordUpdateSheet.tsx');
  assert.match(src, /const \[includeFollowup, setIncludeFollowup\] = useState\(false\)/);
  assert.match(src, /setDisposition\('keep'\);setIncludeFollowup\(false\)/);
  assert.match(src, /setNextAction\(''\);setActionType\('call'\);setDate\(''\);setTime\(''\)/);
  assert.doesNotMatch(src, /setNextAction\(lead\.next_action/);
  assert.match(src, /const scheduling = followupOpen/);
  assert.match(src, /mode: scheduling \? 'set' : 'keep'/);
  assert.match(src, /const validSchedule = !scheduling \|\| \(!!nextAction\.trim\(\) && !!date\)/);
});

test('WhatsApp uses a reusable offline image instead of emoji/text glyphs', () => {
  const icon = mobile('components/WhatsAppIcon.tsx');
  const contact = mobile('components/LeadContactActions.tsx');
  const select = mobile('components/SelectSheet.tsx');
  const update = mobile('components/RecordUpdateSheet.tsx');
  assert.match(icon, /data:image\/png;base64/);
  assert.match(contact, /item\.kind==='whatsapp' \? <WhatsAppIcon/);
  assert.match(select, /option\.value === 'whatsapp' \? <WhatsAppIcon/);
  assert.match(update, /option\.value==='whatsapp' \? <WhatsAppIcon/);
  assert.doesNotMatch(contact, /icon:'◉'/);
});

test('lead detail has previous and next controls bound to the current list snapshot', () => {
  const src = mobile('app/leads/[id].tsx');
  assert.match(src, /const queueIds = parseQueueIds\(queueIdsParam\)/);
  assert.match(src, /const canPrevious = queueIndex >= 0/);
  assert.match(src, /const canNext = queueIndex >= 0/);
  assert.match(src, /queueView:queueView \|\|/);
  assert.match(src, /industry:industry \|\| 'all', q:queueQuery \|\| '', countries:queueCountries \|\| ''/);
  assert.match(src, /disabled=\{!canPrevious \|\| !!navigating/);
  assert.match(src, /disabled=\{!canNext \|\| !!navigating/);
  assert.match(src, /← Back to leads/);
});

test('record update drafts survive contact refreshes but reset on every reopening', () => {
  const src = mobile('components/RecordUpdateSheet.tsx');
  assert.match(src, /const initializedFor = useRef<string \| null>\(null\)/);
  assert.match(src, /if \(!visible\) \{ initializedFor\.current = null; return; \}/);
  assert.match(src, /if \(initializedFor\.current === lead\.id\) return/);
  assert.match(src, /\[visible, lead\.id, primary\]/);
});

test('classification cancels follow-ups without requiring a coded outcome', () => {
  const src = mobile('components/RecordUpdateSheet.tsx');
  assert.match(src, /if \(next!=='keep'\) setIncludeFollowup\(false\)/);
  assert.match(src, /const canSave = !savingKind && validSchedule && hasChange/);
  assert.doesNotMatch(src, /setChannel\(''\)|setOutcome\(/);
});

test('Save & Next respects Closed & Excluded and original pipeline views', () => {
  const src = mobile('app/leads/[id].tsx');
  assert.match(src, /const ids = parseQueueIds\(queueIdsParam\);/);
  assert.match(src, /const selectedView = view \|\| 'for_you';/);
  assert.match(src, /const apiView = queueView \|\| \(selectedView === 'all' \? 'all_active' : selectedView\);/);
  assert.doesNotMatch(src, /view === 'closed' \? \[\]/);
});

test('record update is above the follow-up and overview, and modal status bar has contrast', () => {
  const lead = mobile('app/leads/[id].tsx');
  const modal = mobile('components/RecordUpdateSheet.tsx');
  assert.ok(lead.indexOf('+ Record update') < lead.indexOf('Next follow-up'));
  assert.ok(lead.indexOf('+ Record update') < lead.indexOf('Lead overview'));
  assert.match(modal, /<StatusBar style=\{dark \? 'light' : 'dark'\} hidden=\{false\}\/>/);
  assert.match(modal, /statusBarTranslucent=\{false\}/);
  assert.match(modal, /SafeAreaView style=\{\{flex:1,backgroundColor:theme\.background\}\}/);
});

test('a saved note counts as work done today without hiding overdue follow-ups', () => {
  const queue = readFileSync(join(__dirname, '..', 'lib', 'agent-crm', 'work-queue.ts'), 'utf8');
  const updates = readFileSync(join(__dirname, '..', 'app', 'api', 'agent-crm',
    'leads', '[id]', 'updates', 'route.ts'), 'utf8');
  assert.match(updates, /VALUES \(\$1,'note_added',\$2,\$3,\$4::uuid,\$5\)/);
  assert.match(queue, /e\.event_type IN \('outreach','action_completed','note_added'\)/);
  assert.match(queue, /a\.last_worked_at AT TIME ZONE \$2/);
  assert.match(queue, /if\(view==='done_today'\) return ACTIVE \+ ' AND w\.done_today'/);
  assert.match(queue, /w\.is_due OR \(NOT w\.done_today AND w\.next_action_at IS NULL/);
  assert.match(queue, /WHEN e\.is_due THEN 'due'/);
});

test('lead contact card shows legacy company details only without linked contacts', () => {
  const src = mobile('components/LeadContacts.tsx');
  assert.match(src, /contacts\.length === 0 && !!\(lead\.phone\?\.trim\(\) \|\| lead\.email\?\.trim\(\)\)/);
  assert.match(src, /const displayedContactCount = contacts\.length \+ \(showCompanyContact \? 1 : 0\)/);
  assert.match(src, /Contacts \(\{displayedContactCount\}\)/);
  assert.match(src, /displayedContactCount === 0/);
  assert.match(src, /showCompanyContact \? <View/);
  assert.match(src, /lead\.contact_name\?\.trim\(\) \|\| 'Company contact'/);
  assert.match(src, /phone=\{lead\.phone\} email=\{lead\.email\}/);
  assert.match(src, /contacts\.map\(\(c\) =>/);
  assert.doesNotMatch(src, /apiFetch\([^)]*companyContact/);
});

test('activity history appears above lead overview on the lead details screen', () => {
  const src = mobile('app/leads/[id].tsx');
  const history = src.indexOf('Activity history ({history.length})');
  const overview = src.indexOf('>Lead overview</Text>');
  const contacts = src.indexOf('<LeadContacts lead={activeLead}');
  assert.ok(history >= 0 && overview >= 0 && contacts >= 0);
  assert.ok(history < overview, 'Activity history should appear above Lead overview');
  assert.ok(overview < contacts, 'Contacts should remain below Lead overview');
});
