const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('Android Add Lead opts into keyboard avoidance with header offset', () => {
  const page = read('mobile-app/src/components/ui.tsx');
  const addLead = read('mobile-app/src/app/leads/new.tsx');
  const otherScreens = [
    'mobile-app/src/app/index.tsx',
  ].map(read);
  assert.match(page, /keyboardAware = false/);
  assert.match(page, /keyboardAware \|\| Platform\.OS === 'ios' \? 'padding' : undefined/);
  assert.match(page, /keyboardVerticalOffset=\{keyboardAware \? keyboardVerticalOffset : 0\}/);
  assert.match(addLead, /useHeaderHeight\(\)/);
  assert.match(addLead, /<Page keyboardAware keyboardVerticalOffset=\{headerHeight\}>/);
  for (const src of otherScreens) assert.doesNotMatch(src, /<Page keyboardAware/);
});

test('Add Lead enters directly into company name and can select category without stacked keyboard', () => {
  const addLead = read('mobile-app/src/app/leads/new.tsx');
  const field = read('mobile-app/src/components/ui.tsx');
  const sheet = read('mobile-app/src/components/SelectSheet.tsx');
  assert.match(addLead, /<Field label="Company name"[^\n]*autoFocus inline\/>/);
  assert.match(field, /autoFocus=\{autoFocus\}/);
  assert.match(addLead, /onCreateOption=\{createCategory\} searchable dismissKeyboardOnOpen/);
  assert.match(addLead, /hideTriggerLabel dismissKeyboardOnOpen placeholder="Select priority"/);
  assert.match(sheet, /if \(dismissKeyboardOnOpen\) Keyboard\.dismiss\(\)/);
  assert.match(pageSource(), /keyboardShouldPersistTaps="handled"/);
});

function pageSource() { return read('mobile-app/src/components/ui.tsx'); }

test('Lead Details opts in to keyboard-aware scrolling without changing Record Update', () => {
  const detail = read('mobile-app/src/app/leads/[id].tsx');
  const contacts = read('mobile-app/src/components/LeadContacts.tsx');
  const followup = read('mobile-app/src/components/InlineFollowupEditor.tsx');
  const update = read('mobile-app/src/components/RecordUpdateSheet.tsx');
  assert.match(detail, /useHeaderHeight\(\)/);
  assert.match(detail, /<Page keyboardAware keyboardVerticalOffset=\{headerHeight\}>/);
  const editLead = read('mobile-app/src/app/leads/edit/[id].tsx');
  assert.match(detail, /pathname:'\/leads\/edit\/\[id\]'/);
  assert.match(editLead, /<Field label="Company name"[^\n]*inline\/>/);
  assert.match(detail, /<Field label="Lead brief/);
  assert.match(detail, /<Field label="Important details"/);
  assert.equal((contacts.match(/<Field label="Name"[^\n]*autoFocus\/>/g) || []).length, 2);
  assert.match(contacts, /keyboardType="phone-pad"/);
  assert.match(contacts, /keyboardType="email-address"/);
  assert.match(followup, /placeholder="e\.g\. Call to confirm requirements" autoFocus/);
  assert.match(followup, /dismissKeyboardOnOpen/);
  assert.match(update, /<KeyboardAvoidingView style=\{\{flex:1\}\} behavior="padding">/);
});

test('Record Update keeps editable fields visible in its own Android full-screen modal', () => {
  const update = read('mobile-app/src/components/RecordUpdateSheet.tsx');
  assert.match(update, /presentationStyle="fullScreen"/);
  assert.match(update, /<KeyboardAvoidingView style=\{\{flex:1\}\} behavior="padding">/);
  assert.match(update, /<ScrollView keyboardShouldPersistTaps="handled"/);
  assert.match(update, /<Field label="Notes \(optional\)"/);
  assert.match(update, /<Field label="Next action \(required\)"/);
  assert.equal((update.match(/dismissKeyboardOnOpen/g) || []).length, 6);
  assert.match(update, /Save & Stay/);
  assert.match(update, /Save & Next/);
  assert.doesNotMatch(update, /autoFocus/);
});

test('Lead Directory keeps search visible without replacing its FlatList', () => {
  const directory = read('mobile-app/src/app/index.tsx');
  assert.match(directory, /useHeaderHeight\(\)/);
  assert.match(directory, /<KeyboardAvoidingView style=\{\{ flex: 1 \}\} behavior="padding" keyboardVerticalOffset=\{headerHeight\}>/);
  assert.match(directory, /<FlatList/);
  assert.match(directory, /Keyboard\.addListener\('keyboardDidShow'/);
  assert.match(directory, /if \(!searchFocused\.current\) return/);
  assert.match(directory, /searchRowY\.current \+ 14 - 24/);
  assert.match(directory, /onFocus=\{\(\) => \{ searchFocused\.current = true; \}\}/);
  assert.match(directory, /onBlur=\{\(\) => \{ searchFocused\.current = false; \}\}/);
  assert.match(directory, /onSubmitEditing=\{Keyboard\.dismiss\}/);
  assert.doesNotMatch(directory, /autoFocus/);
});

test('Record Update prefills suggested clock without scheduling an untouched reminder', () => {
  const update = read('mobile-app/src/components/RecordUpdateSheet.tsx');
  const picker = read('mobile-app/src/components/NativeSchedulePicker.tsx');
  assert.match(update, /const clock = defaultFollowupClock\(\)/);
  assert.match(update, /setDate\(lead\.next_action \? \(lead\.next_action_at \|\| ''\) : clock\.date\)/);
  assert.match(update, /setTime\(lead\.next_action \? \(lead\.next_action_time\?\.slice\(0,5\) \|\| ''\) : clock\.time\)/);
  assert.match(update, /setScheduleTouched\(false\)/);
  assert.match(update, /lead\.next_action\s*\?\s*scheduleTouched && followupFieldsChanged\s*:\s*scheduleTouched \|\| !!nextAction\.trim\(\)/);
  assert.match(update, /mode: scheduling \? 'set' : 'keep'/);
  assert.match(update, /<NativeSchedulePicker label="Date" mode="date" value=\{date\} decorated/);
  assert.match(update, /<NativeSchedulePicker label="Time" mode="time" value=\{time\} decorated/);
  assert.match(picker, /decorated = false/);
});

test('Record Update uses compact activity chips and keyboard-safe sticky save actions', () => {
  const update = read('mobile-app/src/components/RecordUpdateSheet.tsx');
  assert.match(update, /CHANNELS\.map\(option => <Pressable/);
  assert.match(update, /\{option\.icon\}/);
  assert.match(update, /singleActivityRow = screenWidth >= 480/);
  assert.match(update, /flexBasis:singleActivityRow\?'0%':'47%'/);
  assert.doesNotMatch(update, /label:'No interaction \(note or follow-up only\)'/);
  assert.match(update, /!keyboardVisible \? <View/);
  assert.match(update, /Keyboard\.addListener\('keyboardDidShow'/);
  assert.match(update, /Keyboard\.addListener\('keyboardDidHide'/);
  assert.match(update, /Save & Stay/);
  assert.match(update, /Save & Next/);
  assert.match(update, /<KeyboardAvoidingView style=\{\{flex:1\}\} behavior="padding">/);
});

test('Add Lead uses compact inline rows and treats country/city as optional global free text', () => {
  const addLead = read('mobile-app/src/app/leads/new.tsx');
  const ui = read('mobile-app/src/components/ui.tsx');
  const selector = read('mobile-app/src/components/SelectSheet.tsx');
  const api = read('app/api/agent-crm/leads/route.ts');
  assert.match(addLead, /const \[country, setCountry\] = useState\(''\)/);
  assert.doesNotMatch(addLead, /Boolean\(country\.trim\(\)\)/);
  assert.doesNotMatch(api, /Country is required/);
  assert.match(api, /values\.country,/);
  assert.match(addLead, /label="Country"[^\n]*placeholder="Optional" inline/);
  assert.match(addLead, /label="City"[^\n]*placeholder="Optional" inline/);
  assert.match(addLead, /label="Company name"[^\n]*autoFocus inline/);
  assert.match(addLead, /label="Primary contact name"[^\n]*inline/);
  assert.match(ui, /inline = false/);
  assert.match(ui, /inline && \{flex:1,minWidth:0\}/);
  assert.match(selector, /hideTriggerLabel = false/);
  assert.match(addLead, /title="Business category" value=\{industry\} hideTriggerLabel/);
  assert.match(addLead, /hideTriggerLabel dismissKeyboardOnOpen placeholder="Select priority"/);
  assert.doesNotMatch(addLead, />New lead</);
  assert.doesNotMatch(addLead, /Company or contact name required/);
  assert.match(addLead, /label="Lead brief[^"]*"[^\n]*multiline/);
  assert.match(addLead, /label="Initial activity notes[^"]*"[^\n]*multiline/);
});

test('Record Update shows four icon activity choices in stable rows', () => {
  const update = read('mobile-app/src/components/RecordUpdateSheet.tsx');
  const channels = update.match(/const CHANNELS = \[([\s\S]*?)\];/);
  assert.ok(channels);
  const entries = [...channels[1].matchAll(/\{value:'([^']+)',label:'([^']+)',icon:'([^']+)'\}/g)];
  assert.deepEqual(entries.map((match) => match[1]), ['call', 'whatsapp', 'email', 'other']);
  assert.match(update, /flexWrap:'wrap',gap:8/);
  assert.match(update, /flexBasis:singleActivityRow\?'0%':'47%'/);
  assert.match(update, /useWindowDimensions\(\)/);
  assert.match(update, /const \[channel, setChannel\] = useState\('call'\)/);
  assert.match(update, /channel && outcome \? channel as ActivityChannel : null/);
});

test('Add Lead groups primary contact details together', () => {
  const addLead = read('mobile-app/src/app/leads/new.tsx');
  const contact = addLead.indexOf('label="Primary contact name"');
  const phone = addLead.indexOf('label="Phone number"');
  const email = addLead.indexOf('label="Email"');
  const category = addLead.indexOf('>Business category</Text>');
  assert.ok(contact >= 0 && contact < phone && phone < email && email < category);
  assert.equal((addLead.match(/label="Phone number"/g) || []).length, 1);
  assert.equal((addLead.match(/label="Email"/g) || []).length, 1);
});

test('Record Update keeps outcome, action and classification values while showing emoji labels', () => {
  const update = read('mobile-app/src/components/RecordUpdateSheet.tsx');
  assert.match(update, /title="Outcome \(optional\)"/);
  assert.doesNotMatch(update, /Outcome \(optional for note or follow-up only\)/);
  assert.match(update, /OUTCOME_ICONS\[value\] \|\| '📝'/);
  assert.match(update, /value,label,icon:OUTCOME_ICONS\[value\] \|\| '📝'/);
  for (const value of ['call','email','whatsapp','meeting','other']) {
    assert.match(update, new RegExp("value:'" + value + "',label:'[^']+',icon:'[^']+'",'u'));
  }
  for (const value of ['keep','do_not_contact','competitor']) {
    assert.match(update, new RegExp("value:'" + value + "',label:'[^']+',icon:'[^']+'",'u'));
  }
  assert.match(update, /onChange=\{\(value\)=>\{setOutcome\(value\);setStage\(''\);\}\}/);
  assert.match(update, /onChange=\{\(value\)=>\{setActionType\(value\);setScheduleTouched\(true\);\}\}/);
});

test('Edit Lead page supports company, category, location, website and priority', () => {
  const detail=read('mobile-app/src/app/leads/[id].tsx');
  const edit=read('mobile-app/src/app/leads/edit/[id].tsx');
  const api=read('app/api/agent-crm/leads/[id]/identity/route.ts');
  const layout=read('mobile-app/src/app/_layout.tsx');
  assert.match(layout,/name="leads\/edit\/\[id\]"/);
  assert.match(detail,/pathname:'\/leads\/edit\/\[id\]'/);
  assert.doesNotMatch(detail,/identityEditing/);
  assert.match(edit,/<Page keyboardAware keyboardVerticalOffset=\{headerHeight\}>/);
  for(const label of ['Company name','Country','City','Website'])
    assert.ok(edit.includes('label="'+label+'"'));
  assert.match(edit,/title="Business category"/);
  assert.match(edit,/title="Priority"/);
  assert.match(api,/canUseBusinessCategory/);
  for (const field of ['industry','country','city','website','priority'])
    assert.match(api, new RegExp(field + ': \\d+'));
  assert.match(api,/user_id=\$2/);
});
test('Inline follow-up uses Record Update style while retaining its save contract', () => {
  const edit=read('mobile-app/src/components/InlineFollowupEditor.tsx');
  assert.match(edit,/<NativeSchedulePicker label="Date" mode="date" value=\{date\} decorated/);
  assert.match(edit,/<NativeSchedulePicker label="Time" mode="time" value=\{time\} decorated/);
  assert.match(edit,/label: 'Call', icon: '📞'/);
  assert.match(edit,/label: 'WhatsApp', icon: '💬'/);
  assert.match(edit,/kind:'edit',action:action.trim\(\),actionType,date/);
});

test('Edit Lead saves brief and important details atomically with business details', () => {
  const edit = read('mobile-app/src/app/leads/edit/[id].tsx');
  const api = read('app/api/agent-crm/leads/[id]/identity/route.ts');
  assert.match(edit, /label="Lead brief \(max 220 characters\)"/);
  assert.match(edit, /label="Important details"/);
  assert.match(edit, /lead_brief:brief\.trim\(\)/);
  assert.match(edit, /important_details:details\.trim\(\)/);
  assert.match(api, /important_details: 5000/);
  assert.match(api, /lead_brief: 220/);
  assert.match(api, /const assignments = columns\.map/);
  assert.match(api, /\[id, access\.user\.id, \.\.\.values\]/);
  assert.match(api, /canUseBusinessCategory/);
  assert.doesNotMatch(api, /const assignments = columns\.map\(\(column,index\)=>column\+'=/);
});

test('Edit Lead shows a form-shaped skeleton instead of loading spinner', () => {
  const edit = read('mobile-app/src/app/leads/edit/[id].tsx');
  const skeleton = read('mobile-app/src/components/Skeleton.tsx');
  assert.match(edit, /import \{ EditLeadSkeleton \} from '@\/components\/Skeleton'/);
  assert.match(edit, /!loaded \? <EditLeadSkeleton\/>/);
  assert.doesNotMatch(edit, /<Busy\/>/);
  assert.match(skeleton, /export function EditLeadSkeleton\(\)/);
  assert.match(skeleton, /Loading edit lead form/);
  assert.match(skeleton, /Array\.from\(\{length:6\}/);
});

test('Dropdown icons appear after labels with a consistent visual gap', () => {
  const sheet = read('mobile-app/src/components/SelectSheet.tsx');
  const update = read('mobile-app/src/components/RecordUpdateSheet.tsx');
  const followup = read('mobile-app/src/components/InlineFollowupEditor.tsx');
  assert.match(sheet, /icon\?: string/);
  assert.match(sheet, /selected\?\.icon \? <Text/);
  assert.match(sheet, /option\.icon \? <Text/);
  assert.match(sheet, /marginLeft:10/);
  assert.match(sheet, /alignItems: 'center', gap: 12/);
  assert.match(update, /value,label,icon:OUTCOME_ICONS\[value\] \|\| '📝'/);
  assert.match(update, /label:'Keep active',icon:'✅'/);
  assert.match(followup, /label: 'Call', icon: '📞'/);
  assert.doesNotMatch(update, /label:'📞 Call'/);
});
