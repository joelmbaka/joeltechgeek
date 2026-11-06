const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../lib/agent-crm/play-review.ts'), 'utf8');
function load(sourceText, env = {}) {
  const javascript = ts.transpileModule(sourceText, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, process: { env } };
  vm.runInNewContext(javascript, context, { filename: 'play-review.js' });
  return context.exports;
}

test('production Review Access stays disabled by default, regardless of QA flag', () => {
  assert.equal(load(source).PLAY_REVIEW_ACCESS_ENABLED, false);
  assert.equal(load(source).playReviewEnabled(), false);
  assert.equal(load(source, { NODE_ENV: 'production',
    CRM_ENABLE_LOCAL_REVIEW_ACCESS: 'true' }).playReviewEnabled(), false);
});

test('local Review Access requires explicit opt-in on development backend', () => {
  assert.equal(load(source, { NODE_ENV: 'development' }).playReviewEnabled(), false);
  assert.equal(load(source, { NODE_ENV: 'development',
    CRM_ENABLE_LOCAL_REVIEW_ACCESS: 'false' }).playReviewEnabled(), false);
  assert.equal(load(source, { NODE_ENV: 'development',
    CRM_ENABLE_LOCAL_REVIEW_ACCESS: 'true' }).playReviewEnabled(), true);
  assert.equal(load(source, { NODE_ENV: 'test',
    CRM_ENABLE_LOCAL_REVIEW_ACCESS: 'true' }).playReviewEnabled(), false);
});

test('review identity remains a separate synthetic user, never a real agent', () => {
  assert.equal(load(source).PLAY_REVIEW_USER_EMAIL, 'play-review@joeltechgeek.invalid');
  assert.equal(load(source).PLAY_REVIEW_USER_EMAIL.endsWith('.invalid'), true);
});

test('mobile app only offers review button when server confirms access', () => {
  const screen = readFileSync(join(__dirname, '../mobile-app/src/app/index.tsx'), 'utf8');
  assert.match(screen, /SHOW_REVIEW_ACCESS_BUTTON = true/);
  assert.match(screen, /body\?\.enabled === true/);
});
