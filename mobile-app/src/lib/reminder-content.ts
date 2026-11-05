/** Data returned by the user-scoped reminder feed. No private notes or phone numbers. */
export type ReminderFeedItem = {
  id: string;
  next_action_due_at: string;
  next_action_timezone: string | null;
  company_name: string | null;
  lead_contact_name: string | null;
  selected_contact_name: string | null;
  next_action: string | null;
};

export const REMINDER_PREVIEW_VERSION = 2;

export type ReminderPreview = {
  title: string;
  body: string;
  dueAtMs: number;
};

const clean = (value: string | null | undefined) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

/** Keep the useful beginning of long actions without putting entire notes on-screen. */
function shorten(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const prefix = value.slice(0, maxLength - 1);
  const lastSpace = prefix.lastIndexOf(' ');
  return prefix.slice(0, lastSpace >= Math.floor(maxLength * .6) ? lastSpace : maxLength - 1).trimEnd() + '…';
}

export function buildReminderPreview(reminder: ReminderFeedItem): ReminderPreview | null {
  const dueAtMs = Date.parse(reminder.next_action_due_at);
  if (!Number.isFinite(dueAtMs)) return null;
  const company = clean(reminder.company_name);
  // Only the explicitly targeted contact. NEVER replace it with a random
  // primary contact when the follow-up belongs to the whole company.
  const selected = clean(reminder.selected_contact_name);
  const fallback = clean(reminder.lead_contact_name);
  const title = company && selected && company.toLocaleLowerCase() !== selected.toLocaleLowerCase()
    ? shorten(company, 48) + ' · ' + shorten(selected, 34)
    : shorten(company || selected || fallback || 'CRM follow-up', 88);

  const action = shorten(clean(reminder.next_action) || 'Follow-up due', 125);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  };
  let clock: string;
  try {
    clock = new Intl.DateTimeFormat('en-US', {
      ...options, ...(reminder.next_action_timezone ? { timeZone: reminder.next_action_timezone } : {}),
    }).format(new Date(dueAtMs));
  } catch {
    // A corrupted or obsolete timezone should not stop all reminders.
    clock = new Intl.DateTimeFormat('en-US', options).format(new Date(dueAtMs));
  }
  return { title, body: action + ' · ' + clock, dueAtMs };
}

/** Detects edits to contact or task, even when the due time hasn't changed. */
export function isCurrentScheduledReminder(
  existing: {
    content: {
      title: string | null;
      body: string | null;
      data?: Record<string, unknown>;
    };
  },
  userId: string,
  leadId: string,
  preview: ReminderPreview,
): boolean {
  const data = existing.content.data;
  return data?.crm_user_id === userId &&
    data?.lead_id === leadId &&
    data?.due === preview.dueAtMs &&
    data?.reminder_preview_version === REMINDER_PREVIEW_VERSION &&
    existing.content.title === preview.title &&
    existing.content.body === preview.body;
}
