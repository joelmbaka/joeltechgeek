import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiFetch } from './api';
import type { CrmUser } from './types';

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
export async function reconcileReminders(user: CrmUser) {
  await ensureChannel();
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  const result = await apiFetch<{
    ok: boolean; reminders: { id: string; next_action_due_at: string }[];
  }>('/api/agent-crm/followups/upcoming');
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const desired = new Map(result.reminders.map((r) =>
    [r.id + ':' + new Date(r.next_action_due_at).getTime(), r]));
  const have = new Set<string>();

  for (const notification of existing) {
    const data = notification.content.data;
    if ((data?.crm_user_id ?? data?.crm_agent_id) !== user.id || !data) continue; // migrate old scheduled reminders
    const key = String(data.lead_id) + ':' + String(data.due);
    if (!desired.has(key) || have.has(key)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    } else { have.add(key); }
  }
  for (const [key, reminder] of desired) {
    if (have.has(key)) continue;
    const due = new Date(reminder.next_action_due_at);
    if (!Number.isFinite(due.getTime()) || due.getTime() <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'CRM follow-up', body: 'A scheduled follow-up is due. Open the CRM to review it.',
        data: { crm_user_id: user.id, lead_id: reminder.id, due: due.getTime() },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: due, channelId: CHANNEL },
    });
  }
}
export async function cancelUserReminders(userId: string) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of all) if ((item.content.data?.crm_user_id ?? item.content.data?.crm_agent_id) === userId)
    await Notifications.cancelScheduledNotificationAsync(item.identifier);
}
export function notificationLeadId(data: Record<string, unknown> | undefined): string | null {
  const id = data?.lead_id;
  return typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}
