const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const modulePromise = import(pathToFileURL(path.join(__dirname,'../lib/agent-crm/types.ts')).href);
const valid = (types, channel, outcome) => types.resolveActivityChannel(channel, outcome);

test('Call is the default for published clients', async () => {
  const t = await modulePromise;
  assert.deepEqual(valid(t, undefined, 'no_answer'), {ok:true,channel:'call'});
  assert.deepEqual(valid(t, undefined, 'trial_started'), {ok:true,channel:'call'});
});
test('email, WhatsApp and other activity types validate compatible results', async () => {
  const t = await modulePromise;
  assert.deepEqual(valid(t,'email','sent'),{ok:true,channel:'email'});
  assert.deepEqual(valid(t,'whatsapp','reply_received'),{ok:true,channel:'whatsapp'});
  assert.deepEqual(valid(t,'other','onboarding_completed'),{ok:true,channel:'other'});
});
test('invalid channel/outcome pair is rejected', async () => {
  const t = await modulePromise;
  assert.equal(valid(t,'email','busy').ok,false);
  assert.equal(valid(t,'call','sent').ok,false);
  assert.equal(valid(t,'whatsapp','no_answer').ok,false);
  assert.equal(valid(t,'sms','sent').ok,false);
});
test('legacy Pilot requested and Email sent work only without a new channel', async () => {
  const t = await modulePromise;
  assert.deepEqual(valid(t,undefined,'pilot_requested'),{ok:true,channel:'call'});
  assert.deepEqual(valid(t,undefined,'email_sent'),{ok:true,channel:'email'});
  assert.equal(valid(t,'call','pilot_requested').ok,false);
  assert.equal(valid(t,'email','email_sent').ok,false);
  assert.ok(!t.CALL_OUTCOMES.includes('pilot_requested'));
  assert.ok(!t.MESSAGE_OUTCOMES.includes('email_sent'));
});
test('no Trial unsuccessful or trial-requested results are offered', async () => {
  const t = await modulePromise;
  assert.ok(![...t.CALL_OUTCOMES,...t.MESSAGE_OUTCOMES].some(
    (s)=>s==='trial_unsuccessful'||s==='trial_requested'||s==='pilot_requested'
  ));
});
test('Trial started advances only early stages to Interested', async () => {
  const t = await modulePromise;
  assert.equal(t.stageForOutcome('new','trial_started'),'interested');
  assert.equal(t.stageForOutcome('nurture','trial_started'),'interested');
  assert.equal(t.stageForOutcome('proposal','trial_started'),'proposal');
});
test('Onboarding completed means Won and Not interested means Lost', async () => {
  const t = await modulePromise;
  assert.equal(t.stageForOutcome('interested','onboarding_completed'),'won');
  assert.equal(t.stageForOutcome('interested','not_interested'),'lost');
});
test('unanswered and ordinary communications never move a progressed lead backward', async () => {
  const t = await modulePromise;
  assert.equal(t.stageForOutcome('new','no_answer'),'new');
  assert.equal(t.stageForOutcome('meeting','no_answer'),'meeting');
  assert.equal(t.stageForOutcome('proposal','reply_received'),'proposal');
  assert.equal(t.stageForOutcome('won','sent'),'won');
});
test('meeting and proposal outcomes advance without downgrading negotiation', async () => {
  const t = await modulePromise;
  assert.equal(t.stageForOutcome('interested','meeting_booked'),'meeting');
  assert.equal(t.stageForOutcome('meeting','proposal_requested'),'proposal');
  assert.equal(t.stageForOutcome('negotiation','meeting_booked'),'negotiation');
});
test('competitor and Do Not Contact classifications remain closed', async () => {
  const t = await modulePromise;
  assert.equal(t.stageForOutcome('competitor','onboarding_completed'),'competitor');
  assert.equal(t.stageForOutcome('do_not_contact','not_interested'),'do_not_contact');
});
test('migration retains historical values and supports all current channel outcomes', async () => {
  const t = await modulePromise;
  const migration = fs.readFileSync(path.join(__dirname,
    '../migrations/2026-11-04-agent-crm-phase-4-activity.sql'),'utf8');
  const all = [...new Set([...t.CALL_OUTCOMES,...t.MESSAGE_OUTCOMES,
    ...t.OTHER_OUTCOMES,...t.LEGACY_OUTCOMES])];
  for (const outcome of all) assert.ok(migration.includes("'"+outcome+"'"),outcome);
  for (const channel of t.ACTIVITY_CHANNELS) assert.ok(migration.includes("'"+channel+"'"),channel);
  assert.ok(migration.includes('BEGIN;') && migration.includes('COMMIT;'));
});

const mobilePromise = import(pathToFileURL(path.join(__dirname,
  '../mobile-app/src/lib/types.ts')).href);

test('Android and API agree on every activity type and result', async () => {
  const api = await modulePromise;
  const mobile = await mobilePromise;
  for (const channel of api.ACTIVITY_CHANNELS) {
    assert.deepEqual(
      mobile.OUTCOMES_BY_CHANNEL[channel].map(([value]) => value),
      [...api.CHANNEL_OUTCOMES[channel]],
      'channel '+channel,
    );
  }
});
test('Android stage preview matches API stage transitions', async () => {
  const api = await modulePromise;
  const mobile = await mobilePromise;
  for (const stage of api.LEAD_STAGES) {
    const all = [...new Set([...api.CALL_OUTCOMES,...api.MESSAGE_OUTCOMES,
      ...api.OTHER_OUTCOMES,...api.LEGACY_OUTCOMES])];
    for (const outcome of all) {
      assert.equal(mobile.suggestedStage(stage,outcome),
        api.stageForOutcome(stage,outcome),stage+' / '+outcome);
    }
  }
});
