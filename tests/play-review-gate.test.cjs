const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// No production DB needed. Compile just the pure server gate helper.
const source = readFileSync(join(__dirname, '../lib/agent-crm/play-review.ts'), 'utf8');
function load(sourceText, env = {}) {
  const javascript = ts.transpileModule(sourceText, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, process: { env } };
  vm.runInNewContext(javascript, context, { filename: 'play-review.js' });
  return context.exports;
}
test('review access stays enabled without environment variables or an expiration date', () => {
  const gate = load(source);
  assert.equal(gate.PLAY_REVIEW_ACCESS_ENABLED, true);
  assert.equal(gate.playReviewEnabled(), true);
  assert.equal(load(source, { CRM_PLAY_REVIEW_ENABLED: 'false',
    CRM_PLAY_REVIEW_UNTIL: '2000-01-01T00:00:00Z' }).playReviewEnabled(), true);
});
test('disabling in server code rejects existing review sessions at the auth gate', () => {
  const disabledSource = source.replace(
    'export const PLAY_REVIEW_ACCESS_ENABLED = true;',
    'export const PLAY_REVIEW_ACCESS_ENABLED = false;',
  );
  assert.notEqual(disabledSource, source);
  assert.equal(load(disabledSource).playReviewEnabled(), false);
});
test('the review identity is a synthetic, non-routable inbox, not Joel', () => {
  const gate = load(source);
  assert.equal(gate.PLAY_REVIEW_AGENT_EMAIL, 'play-review@joeltechgeek.invalid');
  assert.equal(gate.PLAY_REVIEW_AGENT_EMAIL.endsWith('.invalid'), true);
});
test('gate implementation has no runtime environment or date dependence', () => {
  assert.equal(source.includes('process.env'), false);
  assert.equal(source.includes('Date.now'), false);
});
