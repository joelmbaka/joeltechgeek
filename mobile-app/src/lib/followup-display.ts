/**
 * Display scheduled follow-up dates separately from when an activity was saved.
 * next_action_due_at is the authoritative UTC instant; historical events also
 * store a local date, time, and IANA zone when that instant is not provided.
 */
export type FollowupDueFields = {
  next_action_at: string | null;
  next_action_time: string | null;
  next_action_timezone?: string | null;
  next_action_due_at?: string | null;
};

function validTimeZone(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch { return null; }
}

export function formatFollowupDue(fields: FollowupDueFields): string | null {
  const date = fields.next_action_at;
  if (!date) return null;
  const zone = validTimeZone(fields.next_action_timezone);
  const currentZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';

  const time = fields.next_action_time?.slice(0, 5) || null;
  if (!time) {
    // Old date-only history is not necessarily a timed notification; don't
    // fabricate a 9 AM reminder in a historical entry.
    const noon = new Date(date + 'T12:00:00Z');
    if (!Number.isFinite(noon.getTime())) return date + ' (time not recorded)';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    }).format(noon) + ' (time not recorded)';
  }

  const utc = fields.next_action_due_at ? new Date(fields.next_action_due_at) : null;
  const instant = utc && Number.isFinite(utc.getTime()) ? utc
    : new Date(date + 'T' + time + ':00Z');

  if (!Number.isFinite(instant.getTime())) return date + ' at ' + time;

  // For history without a UTC timestamp, interpret saved local clock parts
  // using UTC purely for formatting (no time-zone conversion of these parts).
  const renderZone = utc && Number.isFinite(utc.getTime()) ? zone || 'UTC' : 'UTC';
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: renderZone,
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(instant);

  return label + (zone && zone !== currentZone ? ' (' + zone + ')' : '');
}
