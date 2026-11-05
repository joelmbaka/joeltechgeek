import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiFetch } from './api';
import type { CrmUser } from './types';
import {
  buildReminderPreview, isCurrentScheduledReminder, REMINDER_PREVIEW_VERSION,
  type ReminderFeedItem,
} from './reminder-content';

const CHANNEL = 'crm-followups';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: true, shouldSetBadge: false,
  }),
});
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Follow-up reminders', importance: Notifications.AndroidImportance.HIGH,
  });
}
export async function requestReminderPermissions(): Promise<boolean> {
  await ensureChannel();
  let granted = (await Notifications.getPermissionsAsync()).granted;
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  return granted;
}

// Serialize all notification modifications: saving a follow-up, resuming the
// app and signing out must not race and leave duplicate pending alarms.
let notificationQueue: Promise<void> = Promise.resolve();
function enqueueNotificationWork(task: () => Promise<void>): Promise<void> {
  const work = notificationQueue.then(task, task);
  notificationQueue = work.catch(() => {});
  return work;
}

async function syncReminders(user: CrmUser): Promise<void> {
  await ensureChannel();
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  const result = await apiFetch<{ ok: boolean; reminders: ReminderFeedItem[] }>(
    '/api/agent-crm/followups/upcoming',
  );
  const desired = new Map<string, NonNullable<ReturnType<typeof buildReminderPreview>>>();
  const now = Date.now();
  for (const reminder of result.reminders) {
    const preview = buildReminderPreview(reminder);
    if (!preview || preview.dueAtMs <= now) continue;
    desired.set(reminder.id, preview);
  }

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const kept = new Set<string>();
  for (const notification of existing) {
    const data = notification.content.data;
    // An old app could have stored crm_agent_id. Read it only to remove stale
    // scheduled reminders during the migration to the new preview format.
    if ((data?.crm_user_id ?? data?.crm_agent_id) !== user.id) continue;
    const leadId = typeof data?.lead_id === 'string' ? data.lead_id : '';
    const preview = desired.get(leadId);
    if (preview && !kept.has(leadId) &&
        isCurrentScheduledReminder(notification, user.id, leadId, preview)) {
      kept.add(leadId);
    } else {
      // Removes old generic messages, changed dates/tasks/contacts, cancelled
      // follow-ups and duplicates. Other users' notifications are untouched.
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  for (const [leadId, preview] of desired) {
    if (kept.has(leadId) || preview.dueAtMs <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: preview.title, body: preview.body,
        data: {
          crm_user_id: user.id, lead_id: leadId, due: preview.dueAtMs,
          reminder_preview_version: REMINDER_PREVIEW_VERSION,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(preview.dueAtMs), channelId: CHANNEL,
      },
    });
  }
}
export function reconcileReminders(user: CrmUser): Promise<void> {
  return enqueueNotificationWork(() => syncReminders(user));
}
export function cancelUserReminders(userId: string): Promise<void> {
  return enqueueNotificationWork(async () => {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of all) {
      if ((item.content.data?.crm_user_id ?? item.content.data?.crm_agent_id) === userId) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  });
}
export function notificationLeadId(data: Record<string, unknown> | undefined): string | null {
  const id = data?.lead_id;
  return typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}
