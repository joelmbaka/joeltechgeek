const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('public Terms route has canonical metadata and covers the CRM Android app', () => {
  const terms = read('app/terms/page.tsx');
  assert.match(terms, /export const metadata/);
  assert.match(terms, /canonical: '\/terms'/);
  assert.match(terms, /export default function TermsPage/);
  assert.match(terms, /CallsBound Android app/);
  assert.match(terms, /Effective date: 7 November 2026/);
  assert.match(terms, /mbakajoe26@gmail\.com/);
  assert.match(terms, /laws of Kenya/);
  assert.match(terms, /href="\/privacy"/);
});

test('Terms covers core account, privacy, reminder and payment responsibilities', () => {
  const terms = read('app/terms/page.tsx');
  for (const section of [
    'accounts', 'crm-records', 'acceptable-use', 'notifications',
    'fees', 'third-parties', 'disclaimers', 'privacy', 'changes-law',
  ]) {
    assert.match(terms, new RegExp(`id: '${section}'`));
  }
  assert.match(terms, /These terms do not by themselves enroll you in a paid subscription/);
  assert.match(terms, /do not promise that the Services will always be uninterrupted/);
  assert.match(terms, /Nothing in these terms excludes liability or rights that cannot lawfully/);
});

test('site footer and sitemap discover Terms and keep the Privacy Policy', () => {
  const footer = read('components/Footer.tsx');
  const sitemap = read('app/sitemap.ts');
  assert.match(footer, /href="\/terms"/);
  assert.match(footer, /href="\/privacy"/);
  assert.match(sitemap, /\$\{base\}\/terms/);
  assert.match(sitemap, /\$\{base\}\/privacy/);
});

test('Android Profile offers Terms alongside the existing privacy and deletion links', () => {
  const profile = read('mobile-app/src/app/profile.tsx');
  assert.match(profile, /https:\/\/joeltechgeek\.com\/terms/);
  assert.match(profile, /https:\/\/joeltechgeek\.com\/privacy/);
  assert.match(profile, /Request account\/data deletion/);
});

test('CallsBound display branding preserves native identity and existing asset paths', () => {
  const app = JSON.parse(read('mobile-app/app.json')).expo;
  const variants = read('mobile-app/app.config.js');
  const layout = read('mobile-app/src/app/_layout.tsx');
  const login = read('mobile-app/src/app/index.tsx');
  const web = read('app/crm/CrmClient.tsx');
  const privacy = read('app/privacy/page.tsx');
  const terms = read('app/terms/page.tsx');

  assert.equal(app.name, 'CallsBound');
  assert.equal(app.slug, 'joeltechgeek');
  assert.equal(app.scheme, 'joeltechgeek');
  assert.equal(app.android.package, 'com.joeltechgeek.app');
  assert.equal(app.ios.bundleIdentifier, 'com.joeltechgeek.app');
  assert.equal(app.icon, './assets/images/icon.png');
  assert.equal(app.android.adaptiveIcon.foregroundImage, './assets/images/android-icon-foreground.png');
  assert.ok(variants.includes("'CallsBound Dev'"));
  assert.ok(variants.includes("'CallsBound Preview'"));
  assert.ok(variants.includes('com.joeltechgeek.app.preview'));
  assert.ok(layout.includes('CallsBound'));
  assert.ok(!layout.includes('JoelTechGeek CRM'));
  assert.ok(login.includes('>CallsBound</Text>'));
  assert.ok(web.includes('aria-label="CallsBound"'));
  assert.ok(web.includes('New to CallsBound?'));
  assert.ok(!web.includes('<BrandLogo'));
  assert.ok(privacy.includes('CallsBound Android app'));
  assert.ok(terms.includes('CallsBound Android app'));
  assert.ok(!web.includes('JoelTechGeek CRM'));
});
