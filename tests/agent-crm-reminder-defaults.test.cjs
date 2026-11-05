const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const modulePromise = import(pathToFileURL(path.join(__dirname,'../lib/agent-crm/followups.ts')).href);

test('Future date without time defaults to 9 AM in user's IANA timezone', async () => {
  const { parseFollowupSchedule } = await modulePromise;
  const now = new Date('2026-06-20T12:00:00Z');
  for (const timezone of ['Africa/Nairobi','America/New_York','Europe/London','Asia/Tokyo','Pacific/Auckland']) {
    const result = parseFollowupSchedule({
      next_action_at:'2026-06-23',next_action_time:null,next_action_timezone:timezone
    },now);
    assert.equal(result.ok,true);
    assert.deepEqual(result.value,{next_action_at:'2026-06-23',next_action_time:'09:00',next_action_timezone:timezone});
  }
});
test('Today before 9 AM retains 9 AM local', async () => {
  const { parseFollowupSchedule } = await modulePromise;
  const result = parseFollowupSchedule({
    next_action_at:'2026-11-05',next_action_time:null,next_action_timezone:'Africa/Nairobi'
  },new Date('2026-11-05T05:30:00Z')); // 08:30 EAT
  assert.equal(result.ok,true); assert.equal(result.value.next_action_time,'09:00');
});
test('Today after 9 AM schedules for 10 minutes later', async () => {
  const { parseFollowupSchedule } = await modulePromise;
  const result = parseFollowupSchedule({
    next_action_at:'2026-11-05',next_action_time:null,next_action_timezone:'Africa/Nairobi'
  },new Date('2026-11-05T06:30:00Z')); // 09:30 EAT
  assert.equal(result.ok,true);
  assert.deepEqual(result.value,{
    next_action_at:'2026-11-05',next_action_time:'09:40',next_action_timezone:'Africa/Nairobi'
  });
});
test('Late night today rolls forward to tomorrow rather than a past alarm', async () => {
  const { parseFollowupSchedule } = await modulePromise;
  const result = parseFollowupSchedule({
    next_action_at:'2026-11-05',next_action_timezone:'Africa/Nairobi'
  },new Date('2026-11-05T20:57:00Z')); // 23:57 EAT
  assert.equal(result.ok,true);
  assert.equal(result.value.next_action_at,'2026-11-06');
  assert.equal(result.value.next_action_time,'00:07');
});
test('Explicit time is preserved even after default 9 AM has passed', async () => {
  const { parseFollowupSchedule } = await modulePromise;
  const result = parseFollowupSchedule({
    next_action_at:'2026-11-05',next_action_time:'16:45',next_action_timezone:'Africa/Nairobi'
  },new Date('2026-11-05T06:30:00Z'));
  assert.equal(result.ok,true); assert.equal(result.value.next_action_time,'16:45');
});
test('Timezone must be a valid IANA timezone; absent timezone has UTC fallback', async () => {
  const { parseFollowupSchedule } = await modulePromise;
  const bad = parseFollowupSchedule({next_action_at:'2026-11-10',next_action_timezone:'Moon/Sea'},new Date('2026-11-05T06:30:00Z'));
  assert.equal(bad.ok,false);
  const legacy = parseFollowupSchedule({next_action_at:'2026-11-10'},new Date('2026-11-05T06:30:00Z'));
  assert.equal(legacy.ok,true); assert.equal(legacy.value.next_action_timezone,'Etc/UTC');
  assert.equal(legacy.value.next_action_time,'09:00');
});
test('No date produces no reminder, and time without date is rejected', async () => {
  const { parseFollowupSchedule } = await modulePromise;
  const noDate = parseFollowupSchedule({next_action_at:null,next_action_time:null});
  assert.equal(noDate.ok,true); assert.equal(noDate.value.next_action_time,null);
  const invalid = parseFollowupSchedule({next_action_time:'11:00'});
  assert.equal(invalid.ok,false);
});
