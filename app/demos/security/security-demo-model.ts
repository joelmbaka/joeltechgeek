export type Role = 'client' | 'manager';
export type Attendance = 'scheduled' | 'unconfirmed' | 'reported' | 'confirmed' | 'completed';
export type IssueStatus = 'open' | 'acknowledged' | 'responding' | 'resolved';
export type ReportPeriod = 'daily' | 'weekly' | 'monthly';
export type AssetKind = 'image' | 'document';
export type Staff = { id: string; name: string; phone: string; active: boolean };
export type Site = { id: string; name: string; area: string; client: string; contact: string };
export type Shift = {
  id: string; siteId: string; staffId: string; startAt: string; endAt: string;
  attendance: Attendance; arrivalAt?: string; departureAt?: string;
  method?: string; confirmedBy?: string;
};
export type Asset = { id: string; kind: AssetKind; name: string; sample: true };
export type IssueStep = { status: IssueStatus; at: string; note: string; by: string };
export type Issue = {
  id: string; siteId: string; title: string; description: string; openedAt: string;
  status: IssueStatus; history: IssueStep[]; assets: Asset[];
};
export type Activity = {
  id: string; siteId: string; at: string; title: string; detail: string;
  type: 'attendance' | 'observation' | 'visit' | 'issue' | 'update';
  clientVisible: boolean; assets: Asset[]; issueId?: string;
};
export type Report = {
  id: string; siteId: string; period: ReportPeriod; periodFrom: string;
  periodTo: string; publishedAt: string; title: string; summary: string;
};
export type State = {
  version: 3; anchorDate: string; sites: Site[]; staff: Staff[];
  shifts: Shift[]; issues: Issue[]; activity: Activity[]; reports: Report[];
};
export type TimelineItem = {
  id: string; at: string; kind: 'shift' | 'event'; title: string;
  detail: string; assets: Asset[]; shift?: Shift; issueId?: string;
};
export const STORAGE_KEY = 'jtg-security-client-service-v3';

export function kenyaToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (kind: string) => parts.find(p => p.type === kind)?.value || '';
  return value('year') + '-' + value('month') + '-' + value('day');
}
export function addDays(ymd: string, count: number): string {
  const d = new Date(ymd + 'T12:00:00+03:00');
  d.setUTCDate(d.getUTCDate() + count);
  return kenyaToday(d);
}
export function localInstant(day: string, time: string): string {
  return day + 'T' + time + ':00+03:00';
}
export function dayBounds(day: string): [number, number] {
  return [Date.parse(localInstant(day, '00:00')), Date.parse(localInstant(addDays(day, 1), '00:00'))];
}
export function formatClock(instant: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(instant));
}
export function formatDay(day: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(day + 'T12:00:00+03:00'));
}
export function dayOfInstant(instant: string): string { return kenyaToday(new Date(instant)); }
export function shiftOnDay(shift: Shift, day: string): boolean {
  const [start, end] = dayBounds(day);
  return Date.parse(shift.startAt) < end && Date.parse(shift.endAt) > start;
}
export function shiftWindow(shift: Shift, day: string): string {
  const [start, end] = dayBounds(day);
  const from = Date.parse(shift.startAt), to = Date.parse(shift.endAt);
  const first = from < start ? '00:00' : formatClock(shift.startAt);
  const last = to > end ? '00:00 (+1)' : formatClock(shift.endAt);
  return first + ' – ' + last;
}
export function issueAt(issues: Issue[], id: string): Issue | undefined {
  return issues.find(i => i.id === id);
}
function newId(prefix: string): string {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}
function nowIso(): string { return new Date().toISOString(); }
function activity(state: State, info: Omit<Activity, 'id'>): Activity[] {
  return [{ ...info, id: newId('evt') }, ...state.activity];
}
export function seedDemo(day: string = kenyaToday()): State {
  const previous = addDays(day, -1), weekAgo = addDays(day, -7), monthAgo = addDays(day, -30);
  const iso = localInstant;
  const img: Asset = { id: 'photo-gate', kind: 'image', name: 'Gate inspection · sample photo', sample: true };
  const doc: Asset = { id: 'document-repair', kind: 'document', name: 'Repair confirmation · sample PDF', sample: true };
  return {
    version: 3, anchorDate: day,
    sites: [
      { id: 'greenview', name: 'Greenview Apartments', area: 'Kilimani, Nairobi', client: 'Alex Kamau', contact: '07XX XXX 900' },
      { id: 'karen', name: 'Karen Residence', area: 'Karen, Nairobi', client: 'Njeri Wambui', contact: '07XX XXX 900' },
      { id: 'westlands', name: 'Westlands Plaza', area: 'Westlands, Nairobi', client: 'Samira Hassan', contact: '07XX XXX 900' },
    ],
    staff: [
      { id: 'kevin', name: 'Kevin Otieno', phone: '07XX XXX 201', active: true },
      { id: 'brian', name: 'Brian Mwangi', phone: '07XX XXX 202', active: true },
      { id: 'peter', name: 'Peter Kariuki', phone: '07XX XXX 203', active: true },
      { id: 'mary', name: 'Mary Achieng', phone: '07XX XXX 204', active: true },
      { id: 'daniel', name: 'Daniel Mwangi', phone: '07XX XXX 205', active: true },
    ],
    shifts: [
      { id: 's-prior', siteId: 'greenview', staffId: 'brian', startAt: iso(previous, '18:00'), endAt: iso(day, '06:00'), attendance: 'completed', arrivalAt: iso(previous, '18:03'), departureAt: iso(day, '06:02'), method: 'Supervisor confirmation', confirmedBy: 'Grace' },
      { id: 's-day', siteId: 'greenview', staffId: 'kevin', startAt: iso(day, '06:00'), endAt: iso(day, '18:00'), attendance: 'confirmed', arrivalAt: iso(day, '06:04'), method: 'Supervisor confirmation', confirmedBy: 'Grace' },
      { id: 's-night', siteId: 'greenview', staffId: 'brian', startAt: iso(day, '18:00'), endAt: iso(addDays(day, 1), '06:00'), attendance: 'scheduled' },
      { id: 's-yesterday', siteId: 'greenview', staffId: 'kevin', startAt: iso(previous, '06:00'), endAt: iso(previous, '18:00'), attendance: 'completed', arrivalAt: iso(previous, '06:01'), departureAt: iso(previous, '18:00'), method: 'Supervisor confirmation', confirmedBy: 'Grace' },
      { id: 's-karen', siteId: 'karen', staffId: 'peter', startAt: iso(day, '06:00'), endAt: iso(day, '18:00'), attendance: 'reported', arrivalAt: iso(day, '06:11'), method: 'Office telephone report (unverified)' },
      { id: 's-westlands', siteId: 'westlands', staffId: 'mary', startAt: iso(day, '06:00'), endAt: iso(day, '18:00'), attendance: 'unconfirmed' },
      { id: 's-next', siteId: 'greenview', staffId: 'kevin', startAt: iso(addDays(day, 1), '06:00'), endAt: iso(addDays(day, 1), '18:00'), attendance: 'scheduled' },
    ],
    issues: [
      { id: 'issue-gate', siteId: 'greenview', title: 'Rear gate lock needs attention',
        description: 'The rear access gate is not closing properly.', openedAt: iso(day, '09:15'),
        status: 'responding', history: [
          { status: 'open', at: iso(day, '09:15'), by: 'Alex · Property owner', note: 'Reported a faulty lock at the rear gate.' },
          { status: 'acknowledged', at: iso(day, '09:26'), by: 'Grace · Security Manager', note: 'Concern acknowledged.' },
          { status: 'responding', at: iso(day, '10:05'), by: 'Grace · Security Manager', note: 'Site inspection arranged with the property caretaker.' },
        ], assets: [img] },
      { id: 'issue-light', siteId: 'greenview', title: 'Security light not working',
        description: 'Security light near the visitor entrance was out.', openedAt: iso(weekAgo, '19:10'),
        status: 'resolved', history: [
          { status: 'open', at: iso(weekAgo, '19:10'), by: 'Alex · Property owner', note: 'Reported faulty external light.' },
          { status: 'acknowledged', at: iso(addDays(weekAgo, 1), '08:30'), by: 'Grace · Security Manager', note: 'Maintenance contact notified.' },
          { status: 'responding', at: iso(addDays(weekAgo, 1), '10:40'), by: 'Grace · Security Manager', note: 'Electrical repair being arranged.' },
          { status: 'resolved', at: iso(addDays(weekAgo, 2), '14:15'), by: 'Grace · Security Manager', note: 'Lighting repaired and inspected.' },
        ], assets: [doc] },
    ],
    activity: [
      { id: 'evt-visit', siteId: 'greenview', at: iso(day, '11:20'), title: 'Site visit completed',
        detail: 'Supervisor inspected the entrance and reviewed guard coverage.', type: 'visit', clientVisible: true, assets: [img] },
      { id: 'evt-issue', siteId: 'greenview', at: iso(day, '09:15'), title: 'Client issue reported',
        detail: 'Rear gate lock requires attention.', type: 'issue', clientVisible: true, assets: [img], issueId: 'issue-gate' },
      { id: 'evt-arrival', siteId: 'greenview', at: iso(day, '06:04'), title: 'Day shift arrival confirmed',
        detail: 'Kevin Otieno · Supervisor confirmation.', type: 'attendance', clientVisible: true, assets: [] },
      { id: 'evt-handover', siteId: 'greenview', at: iso(day, '06:02'), title: 'Overnight handover',
        detail: 'Brian Mwangi completed the overnight shift.', type: 'attendance', clientVisible: true, assets: [] },
      { id: 'evt-overnight', siteId: 'greenview', at: iso(previous, '22:35'), title: 'Night patrol observation',
        detail: 'Perimeter checked; no urgent concerns recorded.', type: 'observation', clientVisible: true, assets: [] },
      { id: 'evt-old', siteId: 'greenview', at: iso(weekAgo, '19:10'), title: 'Site concern reported',
        detail: 'External security lighting issue.', type: 'issue', clientVisible: true, assets: [doc], issueId: 'issue-light' },
    ],
    reports: [
      { id: 'rep-day', siteId: 'greenview', period: 'daily', periodFrom: day, periodTo: day,
        publishedAt: iso(day, '08:30'), title: 'Daily security service report',
        summary: 'Night shift completed, daytime coverage confirmed, morning handover recorded.' },
      { id: 'rep-yest', siteId: 'greenview', period: 'daily', periodFrom: previous, periodTo: previous,
        publishedAt: iso(previous, '20:00'), title: 'Daily site report',
        summary: 'Day-shift attendance and site observations recorded.' },
      { id: 'rep-week', siteId: 'greenview', period: 'weekly', periodFrom: weekAgo, periodTo: previous,
        publishedAt: iso(previous, '18:30'), title: 'Weekly service review',
        summary: 'Summary of shift coverage, site visits, and reported concerns.' },
      { id: 'rep-month', siteId: 'greenview', period: 'monthly', periodFrom: monthAgo, periodTo: previous,
        publishedAt: iso(previous, '10:00'), title: 'Monthly service summary',
        summary: 'Review of staffing, coverage exceptions, reports and issue resolutions.' },
    ],
  };
}
export function valid(data: unknown): data is State {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<State>;
  return d.version === 3 && typeof d.anchorDate === 'string' &&
    Array.isArray(d.sites) && Array.isArray(d.staff) && Array.isArray(d.shifts) &&
    Array.isArray(d.issues) && Array.isArray(d.activity) && Array.isArray(d.reports);
}
export function timelineForDay(state: State, day: string, siteId: string): TimelineItem[] {
  const [start, end] = dayBounds(day);
  const shifts: TimelineItem[] = state.shifts
    .filter(s => s.siteId === siteId && shiftOnDay(s, day))
    .map(s => ({
      id: 'timeline-' + s.id, at: new Date(Math.max(start, Date.parse(s.startAt))).toISOString(),
      kind: 'shift' as const,
      title: (state.staff.find(p => p.id === s.staffId)?.name || 'Assigned officer') + ' · Duty shift',
      detail: shiftWindow(s, day) + ' · ' + (s.attendance === 'confirmed' ? 'Arrival confirmed' : s.attendance === 'completed' ? 'Shift completed' : s.attendance === 'reported' ? 'Arrival reported, not verified' : s.attendance === 'unconfirmed' ? 'Arrival not confirmed' : 'Scheduled') +
        (Date.parse(s.startAt) < start ? ' · Continued from previous day' : '') +
        (Date.parse(s.endAt) > end ? ' · Continues next day' : ''),
      assets: [], shift: s,
    }));
  const events: TimelineItem[] = state.activity
    .filter(a => a.siteId === siteId && a.clientVisible && Date.parse(a.at) >= start && Date.parse(a.at) < end)
    .map(a => ({ id: a.id, at: a.at, kind: 'event' as const, title: a.title,
      detail: a.detail, assets: a.assets, issueId: a.issueId }));
  return [...shifts, ...events].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id));
}
export function siteIssues(state: State, siteId: string): Issue[] {
  return state.issues.filter(i => i.siteId === siteId).sort((a,b) => Date.parse(b.openedAt) - Date.parse(a.openedAt));
}
export function siteReports(state: State, siteId: string): Report[] {
  return state.reports.filter(r => r.siteId === siteId).sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
export function assignShift(state: State, shiftId: string, staffId: string): State {
  const shift = state.shifts.find(s => s.id === shiftId), staff = state.staff.find(p => p.id === staffId && p.active);
  if (!shift || !staff) throw new Error('Select a valid shift and active officer.');
  if (!['scheduled', 'unconfirmed'].includes(shift.attendance)) throw new Error('Only unstarted shifts can be reassigned.');
  if (state.shifts.some(s => s.id !== shiftId && s.staffId === staffId &&
    Date.parse(s.startAt) < Date.parse(shift.endAt) && Date.parse(s.endAt) > Date.parse(shift.startAt)))
    throw new Error('Officer is already assigned to an overlapping shift.');
  return { ...state, shifts: state.shifts.map(s => s.id === shiftId ? { ...s, staffId, attendance: 'scheduled' as Attendance, arrivalAt: undefined, method: undefined, confirmedBy: undefined } : s),
    activity: activity(state, { siteId: shift.siteId, at: nowIso(), title: 'Duty assignment changed',
      detail: staff.name + ' assigned to the ' + formatClock(shift.startAt) + ' shift.', type: 'update', clientVisible: true, assets: [] }) };
}
export function addShift(state: State, siteId: string, staffId: string, day: string, start: string, end: string): State {
  if (!state.sites.some(s => s.id === siteId) || !state.staff.some(p => p.id === staffId && p.active)) throw new Error('Choose a valid property and active officer.');
  if (!/^\d{4}-\d\d-\d\d$/.test(day) || !/^\d\d:\d\d$/.test(start) || !/^\d\d:\d\d$/.test(end)) throw new Error('Enter a valid shift date and time.');
  const endDate = end <= start ? addDays(day, 1) : day;
  const next: Shift = { id: newId('shift'), siteId, staffId, startAt: localInstant(day, start),
    endAt: localInstant(endDate, end), attendance: 'scheduled' };
  if (Date.parse(next.endAt) <= Date.parse(next.startAt)) throw new Error('Shift end must be after start.');
  if (state.shifts.some(s => s.staffId === staffId && Date.parse(s.startAt) < Date.parse(next.endAt) && Date.parse(s.endAt) > Date.parse(next.startAt)))
    throw new Error('Officer has an overlapping duty shift.');
  return { ...state, shifts: [...state.shifts, next],
    activity: activity(state, { siteId, at: nowIso(), title: 'Shift scheduled', detail: 'New officer shift added to the roster.', type: 'update', clientVisible: true, assets: [] }) };
}
export function confirmAttendance(state: State, shiftId: string, method: 'office' | 'supervisor'): State {
  const shift = state.shifts.find(s => s.id === shiftId);
  if (!shift || shift.attendance === 'completed' || shift.attendance === 'confirmed') throw new Error('This shift cannot accept another arrival update.');
  if (Date.parse(shift.startAt) > Date.now()) throw new Error('A future shift cannot be checked in before its start time.');
  const attendance: Attendance = method === 'supervisor' ? 'confirmed' : 'reported';
  if (method === 'office' && shift.attendance === 'reported') throw new Error('Attendance was already reported; confirm it on site.');
  const at = nowIso();
  const staffName = state.staff.find(p => p.id === shift.staffId)?.name || 'Officer';
  return { ...state,
    shifts: state.shifts.map(s => s.id === shiftId ? { ...s, attendance, arrivalAt: s.arrivalAt || at,
      method: method === 'supervisor' ? 'Supervisor confirmation' : 'Office telephone report (unverified)',
      confirmedBy: method === 'supervisor' ? 'Grace · Security Manager' : undefined } : s),
    activity: activity(state, { siteId: shift.siteId, at, title: method === 'supervisor' ? 'Duty arrival confirmed' : 'Duty arrival reported',
      detail: staffName + ' · ' + (method === 'supervisor' ? 'Confirmed by security manager.' : 'Reported to office; awaiting verification.'),
      type: 'attendance', clientVisible: true, assets: [] }) };
}
export function completeShift(state: State, shiftId: string): State {
  const shift = state.shifts.find(s => s.id === shiftId);
  if (!shift || shift.attendance !== 'confirmed') throw new Error('Confirm arrival before recording departure.');
  const at = nowIso();
  return { ...state, shifts: state.shifts.map(s => s.id === shiftId ? { ...s, attendance: 'completed' as Attendance, departureAt: at } : s),
    activity: activity(state, { siteId: shift.siteId, at, title: 'Duty departure recorded',
      detail: (state.staff.find(p => p.id === shift.staffId)?.name || 'Officer') + ' completed the duty shift.',
      type: 'attendance', clientVisible: true, assets: [] }) };
}
export function addSite(state: State, name: string, area: string, client: string, contact: string): State {
  if (name.trim().length < 4 || client.trim().length < 3 || area.trim().length < 3)
    throw new Error('Enter the site name, location and client name.');
  if (state.sites.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) throw new Error('This site is already listed.');
  return { ...state, sites: [...state.sites, { id: newId('site'), name: name.trim(), area: area.trim(), client: client.trim(), contact: contact.trim() || 'Office contact pending' }] };
}
export function addStaff(state: State, name: string, phone: string): State {
  if (name.trim().length < 3) throw new Error('Enter the officer name.');
  return { ...state, staff: [...state.staff, { id: newId('officer'), name: name.trim(), phone: phone.trim() || 'Not provided', active: true }] };
}
export function addIssue(state: State, siteId: string, title: string, description: string, actor: 'client' | 'manager'): State {
  if (!state.sites.some(s => s.id === siteId) || title.trim().length < 5 || description.trim().length < 10)
    throw new Error('Choose a site, an issue title and a meaningful description.');
  const at = nowIso(), clean = title.trim().slice(0, 100);
  const issue: Issue = { id: newId('issue'), siteId, title: clean, description: description.trim().slice(0, 600), openedAt: at,
    status: 'open', history: [{ status: 'open', at, note: description.trim().slice(0,600), by: actor === 'client' ? 'Property owner' : 'Security Manager' }], assets: [] };
  return { ...state, issues: [issue, ...state.issues],
    activity: activity(state, { siteId, at, title: actor === 'client' ? 'Client issue raised' : 'Site incident recorded',
      detail: clean, type: 'issue', clientVisible: true, assets: [], issueId: issue.id }) };
}
export function advanceIssue(state: State, id: string, note: string): State {
  const issue = state.issues.find(i => i.id === id);
  if (!issue || issue.status === 'resolved') throw new Error('There is no open issue to update.');
  const next: Record<Exclude<IssueStatus, 'resolved'>, IssueStatus> = {
    open: 'acknowledged', acknowledged: 'responding', responding: 'resolved',
  };
  const status = next[issue.status];
  if (status !== 'acknowledged' && note.trim().length < 8) throw new Error('Enter an update describing the action taken.');
  const at = nowIso(), detail = note.trim() || 'Your issue has been acknowledged.';
  return { ...state,
    issues: state.issues.map(i => i.id === id ? { ...i, status, history: [...i.history, { status, at, note: detail, by: 'Grace · Security Manager' }] } : i),
    activity: activity(state, { siteId: issue.siteId, at, title: 'Issue ' + (status === 'responding' ? 'in progress' : status),
      detail: issue.title + ' · ' + detail, type: 'issue', clientVisible: true, assets: [], issueId: id }) };
}
export function addSampleEvidence(state: State, issueId: string, kind: AssetKind): State {
  const issue = state.issues.find(i => i.id === issueId);
  if (!issue) throw new Error('Issue not found.');
  const asset: Asset = { id: newId('asset'), kind, name: kind === 'image' ? 'Site observation · sample photo' : 'Service response · sample document', sample: true };
  const at = nowIso();
  return { ...state, issues: state.issues.map(i => i.id === issueId ? { ...i, assets: [...i.assets, asset] } : i),
    activity: activity(state, { siteId: issue.siteId, at, title: 'Evidence added to issue',
      detail: asset.name, type: 'observation', clientVisible: true, assets: [asset], issueId }) };
}
export function logVisit(state: State, siteId: string, note: string, attachSample = false): State {
  if (!state.sites.some(s => s.id === siteId) || note.trim().length < 10) throw new Error('Choose a site and enter visit details.');
  return { ...state, activity: activity(state, { siteId, at: nowIso(), title: 'Site visit recorded',
    detail: note.trim().slice(0,600), type: 'visit', clientVisible: true,
    assets: attachSample ? [{ id: newId('visit-photo'), kind: 'image', name: 'Site visit · sample photo', sample: true }] : [] }) };
}
export function publishReport(state: State, siteId: string, period: ReportPeriod): State {
  if (!state.sites.some(s => s.id === siteId)) throw new Error('Choose a valid site.');
  const today = kenyaToday(), start = period === 'daily' ? today : period === 'weekly' ? addDays(today, -6) : today.slice(0, 7) + '-01';
  const title = period[0].toUpperCase() + period.slice(1) + ' security service report';
  const assignments = state.shifts.filter(s => s.siteId === siteId && dayOfInstant(s.startAt) >= start && dayOfInstant(s.startAt) <= today);
  const confirmed = assignments.filter(s => s.attendance === 'confirmed' || s.attendance === 'completed').length;
  const summary = assignments.length + ' assigned shifts; ' + confirmed + ' confirmed or completed; ' +
    state.issues.filter(i => i.siteId === siteId && i.status !== 'resolved').length + ' outstanding issues.';
  const report: Report = { id: newId('report'), siteId, period, periodFrom: start, periodTo: today,
    publishedAt: nowIso(), title, summary };
  return { ...state, reports: [report, ...state.reports],
    activity: activity(state, { siteId, at: report.publishedAt, title: 'New ' + period + ' report published',
      detail: summary, type: 'update', clientVisible: true, assets: [] }) };
}
