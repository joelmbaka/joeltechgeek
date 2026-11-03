/**
 * Date-only follow-ups are valid. A clock time + IANA timezone additionally
 * produces an unambiguous UTC instant for mobile scheduling.
 */
export type FollowupSchedule = {
  next_action_at: string | null;
  next_action_time: string | null;
  next_action_timezone: string | null;
};
export function parseFollowupSchedule(body: Record<string, unknown>):
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
  const timezone = date ? (typeof tz === 'string' && tz ? tz : 'Africa/Nairobi') : null;
  if (timezone) {
    try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }); }
    catch { return { ok: false, error: 'Invalid timezone.' }; }
  }
  return {
    ok: true,
    value: {
      next_action_at: typeof date === 'string' && date ? date : null,
      next_action_time: typeof time === 'string' && time ? time : null,
      next_action_timezone: timezone,
    },
  };
}
/** Numeric SQL placeholders are (date, time, timezone). */
export function followupDueAtSQL(d: number, t: number, z: number): string {
  return 'CASE WHEN $'+d+'::date IS NOT NULL AND $'+t+'::time IS NOT NULL '+
    'THEN (
}
+d+'::date + 
}
+t+'::time) AT TIME ZONE 
}
+z+'::varchar ELSE NULL END';
}
