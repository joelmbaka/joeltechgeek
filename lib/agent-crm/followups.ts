/**
 * A follow-up with a date always gets a reminder. An omitted clock time
 * means 9:00 AM in the user's IANA time zone (not a fixed UTC offset).
 *
 * If the user chooses TODAY after 9:00 AM, schedule for 10 minutes from
 * now instead; otherwise a same-day reminder would already be in the past.
 * Explicitly chosen times are never changed.
 */
export const DEFAULT_REMINDER_TIME = '09:00';
export const SAME_DAY_REMINDER_DELAY_MINUTES = 10;

export type FollowupSchedule = {
  next_action_at: string | null;
  next_action_time: string | null;
  next_action_timezone: string | null;
};

function zonedClock(instant: Date, timezone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: string) => parts.find(p => p.type === type)?.value || '';
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  };
}

export function parseFollowupSchedule(body: Record<string, unknown>, now = new Date()):
  { ok: true; value: FollowupSchedule } | { ok: false; error: string } {
  const date = body.next_action_at ?? null;
  const time = body.next_action_time ?? null;
  const tz = body.next_action_timezone ?? null;
  if (date !== null && date !== '' && (
    typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date
  )) return { ok: false, error: 'Choose a valid follow-up date.' };
  if (time !== null && time !== '' && (
    typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )) return { ok: false, error: 'Choose a valid follow-up time.' };
  if (time && !date) return { ok: false, error: 'Choose a date before setting a time.' };
  if (tz !== null && tz !== '' && (typeof tz !== 'string' || tz.length > 64))
    return { ok: false, error: 'Invalid timezone.' };

  // All current browser/Android clients supply the local IANA timezone.
  // No server can infer the user's location from an absent timezone; use
  // the explicit, predictable UTC fallback rather than assuming Nairobi.
  const timezone = date ? (typeof tz === 'string' && tz ? tz : 'Etc/UTC') : null;
  if (timezone) {
    try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }); }
    catch { return { ok: false, error: 'Invalid timezone.' }; }
  }

  let scheduledDate = typeof date === 'string' && date ? date : null;
  let scheduledTime = typeof time === 'string' && time ? time : null;
  if (scheduledDate && timezone && !scheduledTime) {
    scheduledTime = DEFAULT_REMINDER_TIME;
    const local = zonedClock(now, timezone);
    if (scheduledDate === local.date && local.time >= DEFAULT_REMINDER_TIME) {
      const soon = zonedClock(new Date(now.getTime() +
        SAME_DAY_REMINDER_DELAY_MINUTES * 60_000), timezone);
      scheduledDate = soon.date;
      scheduledTime = soon.time;
    }
  }
  return {
    ok: true,
    value: {
      next_action_at: scheduledDate,
      next_action_time: scheduledTime,
      next_action_timezone: timezone,
    },
  };
}

/** Numeric SQL placeholders are (date, time, timezone). */
export function followupDueAtSQL(d: number, t: number, z: number): string {
  return `CASE WHEN $${d}::date IS NOT NULL AND $${t}::time IS NOT NULL ` +
    `THEN ($${d}::date + $${t}::time) AT TIME ZONE $${z}::varchar ELSE NULL END`;
}
