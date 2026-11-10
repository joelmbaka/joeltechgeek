const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const source = (name) => readFileSync(join(__dirname, '..', 'mobile-app/src', name), 'utf8');

test('restoration separates verification, expiry and transient connectivity failure', () => {
  const session = source('lib/session.ts');
  const auth = source('lib/AuthProvider.tsx');
  assert.match(session, /controller\.abort\(\), 12000/);
  assert.match(session, /response\.status === 401 \|\| response\.status === 403/);
  assert.match(auth, /'checking' \| 'authenticated' \| 'signed_out' \| 'connection_error'/);
  assert.match(auth, /retryRestore: restore/);
  assert.match(auth, /current === 'authenticated' \? 'signed_out' : current/);
  assert.match(auth, /userBeforeRestore/);
});

test('For You is the loading shell, with no restoration spinner or active protected controls', () => {
  const home = source('app/index.tsx');
  const layout = source('app/_layout.tsx');
  assert.doesNotMatch(home, /Restoring your session|<LoadingState/);
  assert.match(home, /const shellLoading = sessionStatus !== 'authenticated' \|\| !user/);
  assert.match(home, /editable={!shellLoading}/);
  assert.match(home, /disabled={shellLoading}/);
  assert.match(home, /<LeadCardSkeleton count={5}\/>/);
  assert.match(layout, /headerShown: sessionStatus !== 'signed_out'/);
});

test('same-page focus refresh keeps confirmed rows but different queries do not leak them', () => {
  const home = source('app/index.tsx');
  assert.match(home, /JSON\.stringify\(\[user\.id, offset, debounced, apiView, industry\]\)/);
  assert.match(home, /pageCache\.current\?\.key === key \? pageCache\.current\.result : null/);
  assert.match(home, /setData\(confirmed\)/);
  assert.match(home, /pageCache\.current\?\.key === activeQueryKey \? data : null/);
  assert.match(home, /catalog\?\.userId === user\.id/);
  const openLead = home.split('const openLead = (id: string) => {')[1].split('const openReview = async')[0];
  assert.doesNotMatch(openLead, /setData\(null\)/);
});

test('connection-error UI includes retry without forcing a Google sign-in', () => {
  const home = source('app/index.tsx');
  assert.match(home, /sessionStatus === 'connection_error'/);
  assert.match(home, /Retry connection/);
  assert.match(home, /sessionStatus === 'signed_out'/);
});

test('Edit Lead loads lead and categories independently', () => {
  const edit = source('app/leads/edit/[id].tsx');
  assert.doesNotMatch(edit, /Promise\.all\(\[/);
  assert.match(edit, /setCategoriesLoading\(true\)/);
  assert.match(edit, /loading={categoriesLoading} loadingError={categoriesError}/);
  assert.match(edit, /<EditLeadSkeleton\/>/);
});

test('transitions have no full-screen spinning indicator; existing data skeletons remain', () => {
  const callback = source('app/auth-callback.tsx');
  const signingOut = source('app/signing-out.tsx');
  const shared = source('components/LoadingState.tsx');
  const profile = source('app/profile.tsx');
  assert.doesNotMatch(callback, /<LoadingState/);
  assert.doesNotMatch(signingOut, /<LoadingState/);
  assert.doesNotMatch(shared, /ActivityIndicator/);
  assert.match(profile, /void logout\(\)\.catch/);
  assert.doesNotMatch(profile, /router\.replace\('\/signing-out'\)/);
  assert.match(source('app/leads/[id].tsx'), /<LeadDetailSkeleton\/>/);
  assert.match(source('app/notifications.tsx'), /<NotificationCardSkeleton/);
});
