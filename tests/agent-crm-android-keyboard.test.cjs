const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('Android Add Lead opts into keyboard avoidance with header offset', () => {
  const page = read('mobile-app/src/components/ui.tsx');
  const addLead = read('mobile-app/src/app/leads/new.tsx');
  const otherScreens = [
    'mobile-app/src/components/RecordUpdateSheet.tsx',
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
  assert.match(addLead, /<Field label="Company name"[^\n]*autoFocus\/>/);
  assert.match(field, /autoFocus=\{autoFocus\}/);
  assert.match(addLead, /onCreateOption=\{createCategory\} searchable dismissKeyboardOnOpen/);
  assert.match(addLead, /onChange=\{setPriority\} dismissKeyboardOnOpen/);
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
  assert.match(detail, /onChangeText=\{setCompanyDraft\} autoFocus/);
  assert.match(detail, /<Field label="Lead brief/);
  assert.match(detail, /<Field label="Important details"/);
  assert.equal((contacts.match(/<Field label="Name"[^\n]*autoFocus\/>/g) || []).length, 2);
  assert.match(contacts, /keyboardType="phone-pad"/);
  assert.match(contacts, /keyboardType="email-address"/);
  assert.match(followup, /placeholder="e\.g\. Call to confirm requirements" autoFocus/);
  assert.match(followup, /dismissKeyboardOnOpen/);
  assert.doesNotMatch(update, /keyboardAware/);
});
