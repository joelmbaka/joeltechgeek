import { apiFetch } from './api';

export type CrmInboxNotification = {
  id: string;
  lead_id: string;
  title: string;
  body: string;
  due_at: string;
  read_at: string | null;
};

export type InboxPage = {
  ok: true;
  notifications: CrmInboxNotification[];
  has_more: boolean;
  offset: number;
  limit: number;
};

const subscribers = new Set<() => void>();
/** Refresh the bell and inbox after reading, saving or receiving a reminder. */
export function subscribeInboxChanges(listener: () => void): () => void {
  subscribers.add(listener);
  return () => { subscribers.delete(listener); };
}
export function notifyInboxChanged(): void {
  subscribers.forEach((listener) => listener());
}
export function listCrmNotifications(limit = 50, offset = 0): Promise<InboxPage> {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiFetch<InboxPage>('/api/agent-crm/notifications?' + query);
}
export function getCrmUnreadCount(): Promise<number> {
  return apiFetch<{ok: true; count: number}>('/api/agent-crm/notifications/unread-count')
    .then((result) => result.count);
}
export async function markCrmNotificationRead(notificationId: string): Promise<void> {
  await apiFetch('/api/agent-crm/notifications/' + encodeURIComponent(notificationId) + '/read', {
    method: 'POST',
  });
  notifyInboxChanged();
}
