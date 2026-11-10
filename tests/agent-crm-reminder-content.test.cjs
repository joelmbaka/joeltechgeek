const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const modulePromise = import(pathToFileURL(path.join(__dirname, '../mobile-app/src/lib/reminder-content.ts')).href);
const reminder = (patch = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  company_name: 'BlazeShield', lead_contact_name: 'Primary person',
  selected_contact_name: 'Daniel', next_action: 'Follow up on mobile app requirements',
  next_action_due_at: '2026-11-06T06:00:00.000Z',
  next_action_timezone: 'Africa/Nairobi', ...patch,
});

test('notification names selected contact and company, with action-only body', async () => {
  const { buildReminderPreview } = await modulePromise;
  const result = buildReminderPreview(reminder());
  assert.equal(result.title, 'BlazeShield · Daniel');
  assert.match(result.body, /Follow up on mobile app requirements/);
  assert.equal(result.body, 'Follow up on mobile app requirements');
});
test('company follow-up does not accidentally display the primary contact', async () => {
  const { buildReminderPreview } = await modulePromise;
  assert.equal(buildReminderPreview(reminder({ selected_contact_name: null })).title, 'BlazeShield');
});
test('individual lead uses contact name when company is absent', async () => {
  const { buildReminderPreview } = await modulePromise;
  assert.equal(buildReminderPreview(reminder({ company_name: '', selected_contact_name: null, lead_contact_name: 'Daniel' })).title, 'Daniel');
});
test('long, multiline actions are shortened without leaking history', async () => {
  const { buildReminderPreview } = await modulePromise;
  const result = buildReminderPreview(reminder({
    next_action: '  Check\n the demo  ' + 'and requirements '.repeat(25),
  }));
  assert.doesNotMatch(result.body, /\n/);
  assert.match(result.body, /…/);
  assert.ok(result.body.length < 170);
});
test('blank task has useful fallback', async () => {
  const { buildReminderPreview } = await modulePromise;
  assert.match(buildReminderPreview(reminder({ next_action: null })).body, /^Follow-up due/);
});
test('scheduled instants differ across dates while notification wording stays concise', async () => {
  const { buildReminderPreview } = await modulePromise;
  const summer = buildReminderPreview(reminder({
    next_action_due_at: '2026-07-01T13:00:00.000Z', next_action_timezone: 'America/New_York',
  }));
  const winter = buildReminderPreview(reminder({
    next_action_due_at: '2026-12-01T14:00:00.000Z', next_action_timezone: 'America/New_York',
  }));
  assert.equal(summer.body, winter.body);
  assert.equal(summer.body, 'Follow up on mobile app requirements');
  assert.notEqual(summer.dueAtMs, winter.dueAtMs);
});
test('edited task and contact invalidate old scheduled notification even if due is unchanged', async () => {
  const { buildReminderPreview, isCurrentScheduledReminder, REMINDER_PREVIEW_VERSION } = await modulePromise;
  const initial = buildReminderPreview(reminder());
  const record = {content:{title: initial.title, body:initial.body, data:{
    crm_user_id:'owner-uuid',lead_id:reminder().id,
    due:initial.dueAtMs,reminder_preview_version: REMINDER_PREVIEW_VERSION,
  }}};
  assert.equal(isCurrentScheduledReminder(record,'owner-uuid',reminder().id,initial),true);
  const updatedTask = buildReminderPreview(reminder({next_action:'Send updated proposal'}));
  assert.equal(isCurrentScheduledReminder(record,'owner-uuid',reminder().id,updatedTask),false);
  const updatedContact = buildReminderPreview(reminder({selected_contact_name:'Grace'}));
  assert.equal(isCurrentScheduledReminder(record,'owner-uuid',reminder().id,updatedContact),false);
  assert.equal(isCurrentScheduledReminder(record,'other-user',reminder().id,initial),false);
});
test('legacy generic notifications get replaced with contextual messages', async () => {
  const { buildReminderPreview, isCurrentScheduledReminder } = await modulePromise;
  const preview = buildReminderPreview(reminder());
  const old = {content:{title:'CRM follow-up',body:'A scheduled follow-up is due. Open the CRM to review it.',data:{
    crm_agent_id:'owner-uuid',lead_id:reminder().id,due:preview.dueAtMs,
  }}};
  assert.equal(isCurrentScheduledReminder(old,'owner-uuid',reminder().id,preview),false);
});
test('API scopes to user, joins selected contact by lead, and excludes private fields', () => {
  const feed = fs.readFileSync(path.join(__dirname,'../app/api/agent-crm/followups/upcoming/route.ts'),'utf8');
  assert.match(feed,/requireCrmUser\(request\)/);
  assert.match(feed,/l\.user_id = \$1/);
  assert.match(feed,/selected\.lead_id = l\.id/);
  assert.match(feed,/selected\.name AS selected_contact_name/);
  assert.doesNotMatch(feed,/SELECT\s+l\.\*|SELECT\s+\*/i);
  assert.match(feed,/Cache-Control': 'private, no-store'/);
});
test('notification tap retains owner-scoped lead deep link and reconciliation removes duplicates', () => {
  const scheduler=fs.readFileSync(path.join(__dirname,'../mobile-app/src/lib/notifications.ts'),'utf8');
  assert.match(scheduler,/lead_id: leadId/);
  assert.match(scheduler,/kept\.has\(leadId\)/);
  assert.match(scheduler,/cancelScheduledNotificationAsync/);
  assert.match(scheduler,/enqueueNotificationWork/);
});

test('company and contact edits still reconcile reminders after the redesign', () => {
  const screen=fs.readFileSync(path.join(__dirname,'../mobile-app/src/app/leads/[id].tsx'),'utf8');
  assert.match(screen,/pathname:'\/leads\/edit\/\[id\]'/);
  assert.match(screen,/if\(user\)void reconcileReminders\(user\)/);
  assert.match(screen,/onRefresh=\{\(\)=>\{reload\(\);void reconcileReminders\(user\)/);
});

test('Android may serialize notification data numbers as strings', async () => {
  const { buildReminderPreview, isCurrentScheduledReminder, REMINDER_PREVIEW_VERSION } = await modulePromise;
  const preview = buildReminderPreview(reminder());
  const existing = {content:{
    title: preview.title, body: preview.body, data: {
      crm_user_id:'owner-uuid', lead_id:reminder().id,
      due:String(preview.dueAtMs),reminder_preview_version:String(REMINDER_PREVIEW_VERSION),
    },
  }};
  assert.equal(isCurrentScheduledReminder(existing,'owner-uuid',reminder().id,preview),true);
});

test('notification text omits both scheduled time and time zone', async () => {
  const { buildReminderPreview } = await modulePromise;
  const value = buildReminderPreview(reminder());
  assert.equal(value.title, 'BlazeShield · Daniel');
  assert.equal(value.body, 'Follow up on mobile app requirements');
  assert.doesNotMatch(value.body, /AM|PM|GMT|UTC|Africa\/Nairobi/);
});

test('follow-up display distinguishes a due time from the saved timestamp', async () => {
  const { pathToFileURL } = require('node:url');
  const format = await import(pathToFileURL(path.join(__dirname,'../mobile-app/src/lib/followup-display.ts')).href);
  const due = format.formatFollowupDue({
    next_action_at: '2026-11-05',
    next_action_time: '10:50:00',
    next_action_timezone: 'Africa/Nairobi',
    next_action_due_at: '2026-11-05T07:50:00.000Z',
  });
  assert.match(due, /Nov 5, 2026/);
  assert.match(due, /10:50 AM/);
  const historical = format.formatFollowupDue({
    next_action_at: '2026-11-05',
    next_action_time: '10:50:00',
    next_action_timezone: 'Africa/Nairobi',
  });
  assert.match(historical, /10:50 AM/);
  const legacy = format.formatFollowupDue({
    next_action_at: '2026-11-05', next_action_time: null,
  });
  assert.match(legacy, /time not recorded/);
});

test('Android shows recent activity and displays the follow-up due time', () => {
  const screen=fs.readFileSync(path.join(__dirname,'../mobile-app/src/app/leads/[id].tsx'),'utf8');
  assert.match(screen,/new Date\(event\.created_at\)\.toLocaleString/);
  assert.match(screen,/formatFollowupDue\(event\)/);
  assert.match(screen,/formatFollowupDue\(activeLead\)/);
  assert.match(screen,/history\.slice\(0,3\)/);
  assert.doesNotMatch(screen,/Leave time blank for a 9:00 AM reminder/);
});
