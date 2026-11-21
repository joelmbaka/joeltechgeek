const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const mobile = name => readFileSync(join(__dirname,'..','mobile-app','src',name),'utf8');

test('record update starts as notes-only; outcome is opt-in', () => {
  const src = mobile('components/RecordUpdateSheet.tsx');
  assert.match(src, /const \[showOutcome, setShowOutcome\] = useState\(false\)/);
  assert.match(src, /accessibilityState=\{\{expanded:showOutcome\}\}/);
  assert.match(src, /\{showOutcome \? <>/);
  assert.match(src, /<Field label="Notes \(optional\)"/);
  assert.match(src, /const hasInteraction = showOutcome && !!channel && !!outcome/);
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
