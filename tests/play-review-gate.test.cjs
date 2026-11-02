const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Compile this tiny pure helper without loading Next.js or production DB.
const source = readFileSync(join(__dirname, '../lib/agent-crm/play-review.ts'), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function load(env) {
  const context = { exports: {}, process: { env }, Date };
  vm.runInNewContext(javascript, context, { filename: 'play-review.js' });
  return context.exports;
}
const now = Date.parse('2026-11-02T20:00:00Z');
const until = '2026-12-31T00:00:00Z';

test('review access is off without both explicit server settings', () => {
  assert.equal(load({}).playReviewEnabled(now), false);
  assert.equal(load({ CRM_PLAY_REVIEW_ENABLED: 'true' }).playReviewEnabled(now), false);
  assert.equal(load({ CRM_PLAY_REVIEW_UNTIL: until }).playReviewEnabled(now), false);
  assert.equal(load({ CRM_PLAY_REVIEW_ENABLED: 'TRUE', CRM_PLAY_REVIEW_UNTIL: until }).playReviewEnabled(now), false);
});
test('review access works within the enabled window and expires exactly on deadline', () => {
  const gate = load({ CRM_PLAY_REVIEW_ENABLED: 'true', CRM_PLAY_REVIEW_UNTIL: until });
  assert.equal(gate.playReviewEnabled(now), true);
  assert.equal(gate.playReviewEnabled(Date.parse(until) - 1), true);
  assert.equal(gate.playReviewEnabled(Date.parse(until)), false);
  assert.equal(gate.playReviewEnabled(Date.parse(until) + 1), false);
});
test('malformed or expired review expiry fails closed', () => {
  for (const date of ['not-a-date', '', '2026-01-01T00:00:00Z', '2027-01-01', '2027/01/01']) {
    const gate = load({ CRM_PLAY_REVIEW_ENABLED: 'true', CRM_PLAY_REVIEW_UNTIL: date });
    assert.equal(gate.playReviewEnabled(now), false, date);
  }
});
test('review identity is synthetic and cannot be an ordinary Google inbox', () => {
  const identity = load({});
  assert.equal(identity.PLAY_REVIEW_AGENT_EMAIL, 'play-review@joeltechgeek.invalid');
});
