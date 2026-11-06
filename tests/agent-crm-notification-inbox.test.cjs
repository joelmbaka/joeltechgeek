const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const previewModule = import(pathToFileURL(path.join(__dirname, '..',
  'mobile-app/src/lib/reminder-content.ts')).href);

test('inbox queries scope unread and history to the authenticated user and due time', () => {
  const inbox = read('app/api/agent-crm/notifications/route.ts');
  const count = read('app/api/agent-crm/notifications/unread-count/route.ts');
  const opened = read('app/api/agent-crm/notifications/[id]/read/route.ts');
  for (const file of [inbox, count, opened]) {
    assert.match(file, /requireCrmUser\(request\)/);
    assert.match(file, /user_id = \$1|user_id = \$2::uuid/);
    assert.match(file, /due_at <= now\(\)/);
  }
  assert.match(count, /canceled_at IS NULL AND read_at IS NULL/);
  assert.match(inbox, /canceled_at IS NULL OR read_at IS NOT NULL/);
  assert.match(opened, /validCrmWriteOrigin\(request\)/);
  assert.match(opened, /read_at = COALESCE\(read_at, now\(\)\)/);
});

test('migration captures every follow-up change without a job and avoids historical unread backfill', () => {
  const sql = read('migrations/2026-11-06-crm-notification-inbox.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_notifications/);
  assert.match(sql, /CREATE TRIGGER crm_followup_notification_sync/);
  assert.match(sql, /AFTER INSERT OR UPDATE OF next_action_due_at/);
  assert.match(sql, /read_at timestamptz/);
  assert.match(sql, /canceled_at timestamptz/);
  assert.match(sql, /WHERE l\.next_action_due_at > now\(\)/);
  assert.match(sql, /UPDATE public\.crm_notifications/);
  assert.match(sql, /AND \(OLD\.do_not_contact OR OLD\.stage IN/);
});

test('preview carries stable record identity without changing notification content', async () => {
  const { buildReminderPreview, isCurrentScheduledReminder,
    REMINDER_PREVIEW_VERSION } = await previewModule;
  const item = {
    id: '11111111-1111-4111-8111-111111111111',
    notification_id: '22222222-2222-4222-8222-222222222222',
    next_action_due_at: '2026-11-10T06:10:00.000Z',
    next_action_timezone: 'Africa/Nairobi',
    company_name: 'Test security company',
    selected_contact_name: 'Joel Musa',
    lead_contact_name: 'Joel Musa',
    next_action: 'Call to confirm requirements',
  };
  const preview = buildReminderPreview(item);
  assert.equal(preview.title, 'Test security company · Joel Musa');
  assert.equal(preview.body, 'Call to confirm requirements');
  assert.equal(preview.notificationId, item.notification_id);
  const scheduled = { content: {
    title: preview.title, body: preview.body,
    data: {crm_user_id:'user-1', lead_id:item.id,
      due:preview.dueAtMs, notification_id:preview.notificationId,
      reminder_preview_version:REMINDER_PREVIEW_VERSION},
  }};
  assert.equal(isCurrentScheduledReminder(scheduled, 'user-1', item.id, preview), true);
  assert.equal(isCurrentScheduledReminder(scheduled, 'user-2', item.id, preview), false);
  assert.equal(isCurrentScheduledReminder(scheduled, 'user-1', item.id,
    {...preview, notificationId:'33333333-3333-4333-8333-333333333333'}), false);
});

test('Android bell is before avatar, displays real unread count and links to inbox', () => {
  const layout = read('mobile-app/src/app/_layout.tsx');
  const bell = read('mobile-app/src/components/NotificationBell.tsx');
  const screen = read('mobile-app/src/app/notifications.tsx');
  assert.ok(layout.indexOf('<NotificationBell />') < layout.indexOf('<HeaderProfileMenu />'));
  assert.match(layout, /Stack\.Screen name="notifications"/);
  assert.match(bell, /getCrmUnreadCount/);
  assert.match(bell, /count > 99 \? '99\+' : count/);
  assert.match(bell, /60_000/);
  assert.match(screen, /markCrmNotificationRead\(item\.id\)/);
  assert.match(screen, /pathname: '\/leads\/\[id\]'/);
});

test('Android notification receipt and tap update server-backed inbox state', () => {
  const scheduler = read('mobile-app/src/lib/notifications.ts');
  const auth = read('mobile-app/src/lib/AuthProvider.tsx');
  const feed = read('app/api/agent-crm/followups/upcoming/route.ts');
  assert.match(scheduler, /notification_id: preview\.notificationId/);
  assert.match(auth, /addNotificationReceivedListener/);
  assert.match(auth, /markCrmNotificationRead\(notificationId\)/);
  assert.match(feed, /notificationId} AS notification_id/);
  assert.match(feed, /n\.user_id = l\.user_id/);
});

test('unread reminders have no age cap; recently read uses read_at for a rolling seven days', () => {
  const api = read('app/api/agent-crm/notifications/route.ts');
  const count = read('app/api/agent-crm/notifications/unread-count/route.ts');
  assert.match(api, /section === 'unread'/);
  assert.match(api, /read_at IS NULL AND canceled_at IS NULL/);
  assert.match(api, /read_at IS NOT NULL AND read_at >= now\(\) - INTERVAL '7 days'/);
  assert.match(api, /AND due_at <= now\(\)/);
  assert.match(api, /'due_at ASC, id ASC'/);
  assert.match(api, /'read_at DESC, id DESC'/);
  assert.doesNotMatch(api, /due_at >= now\(\) - INTERVAL '7 days'/);
  assert.match(count, /canceled_at IS NULL AND read_at IS NULL/);
  assert.doesNotMatch(api, /DELETE FROM|TRUNCATE/i);
});

test('notification sections use independent pagination with no maximum record count', () => {
  const api = read('app/api/agent-crm/notifications/route.ts');
  const client = read('mobile-app/src/lib/notification-inbox.ts');
  const screen = read('mobile-app/src/app/notifications.tsx');
  assert.match(api, /section !== 'unread' && section !== 'read'/);
  assert.match(api, /limit \+ 1, offset/);
  assert.match(api, /rows\.rows\.slice\(0, limit\)/);
  assert.match(api, /has_more: rows\.rows\.length > limit/);
  assert.doesNotMatch(api, /offset > 100000/);
  assert.match(client, /section: InboxSection, limit = 25, offset = 0/);
  assert.match(client, /new URLSearchParams\(\{/);
  assert.match(client, /section, limit: String\(limit\), offset: String\(offset\)/);
  assert.match(screen, /const PAGE_SIZE = 25/);
  assert.match(screen, /fetchPage\('unread', unreadItems\.length\)/);
  assert.match(screen, /fetchPage\('read', readItems\.length\)/);
  assert.match(screen, /appendUnique\(current, result\.notifications\)/);
});

test('recently read is collapsed by default; unread is visible and virtualized', () => {
  const screen = read('mobile-app/src/app/notifications.tsx');
  assert.match(screen, /useState\(false\)/);
  assert.match(screen, /setReadExpanded\(expanded => !expanded\)/);
  assert.match(screen, /if \(readExpanded\) \{/);
  assert.match(screen, /<FlatList/);
  assert.match(screen, /<Page scroll=\{false\}>/);
  assert.match(screen, /Recently read/);
  assert.match(screen, /Oldest due first/);
  assert.match(screen, /markCrmNotificationRead\(item\.id\)/);
  assert.match(screen, /router\.push\(\{ pathname: '\/leads\/\[id\]'/);
  assert.match(screen, /setUnreadItems\(current => current\.filter/);
});
