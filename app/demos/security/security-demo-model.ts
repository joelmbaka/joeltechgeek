export type Role = 'operations' | 'supervisor' | 'client';
export type Day = 'today' | 'tomorrow';
export type Attendance = 'scheduled' | 'unconfirmed' | 'reported' | 'confirmed' | 'completed';
export type IssueStatus = 'open' | 'acknowledged' | 'responding' | 'resolved';

export type Guard = { id: string; name: string; phone: string; active: boolean };
export type Site = { id: string; name: string; area: string; client: string; controlRoom: string };
export type Shift = {
  id: string; siteId: string; guardId: string; day: Day; starts: string; ends: string;
  status: Attendance; arrival?: string; departure?: string; source?: string; confirmedBy?: string;
};
export type Issue = {
  id: string; siteId: string; title: string; detail: string; origin: 'client' | 'operations';
  status: IssueStatus; response: string; visibleToClient: boolean;
};
export type Report = { id: string; siteId: string; title: string; summary: string; published: string };
export type Activity = { id: string; siteId: string; message: string; audience: 'team' | 'client'; stamp: string };
export type DemoData = {
  version: 2; guards: Guard[]; sites: Site[]; shifts: Shift[];
  issues: Issue[]; reports: Report[]; activity: Activity[];
};

export const STORAGE_KEY = 'joeltechgeek-security-service-demo-v2';
export const seedDemo = (): DemoData => ({
  version: 2,
  guards: [
    { id: 'kevin', name: 'Kevin Otieno', phone: '+254 700 100 201', active: true },
    { id: 'brian', name: 'Brian Mwangi', phone: '+254 700 100 202', active: true },
    { id: 'daniel', name: 'Daniel Mwangi', phone: '+254 700 100 203', active: true },
    { id: 'mary', name: 'Mary Achieng', phone: '+254 700 100 204', active: true },
    { id: 'peter', name: 'Peter Kariuki', phone: '+254 700 100 205', active: true },
    { id: 'jane', name: 'Jane Wanjiru', phone: '+254 700 100 206', active: true },
  ],
  sites: [
    { id: 'greenview', name: 'Greenview Apartments', area: 'Kilimani, Nairobi', client: 'Alex Kamau', controlRoom: '0700 900 900' },
    { id: 'karen', name: 'Karen Residence', area: 'Karen, Nairobi', client: 'Njeri Wambui', controlRoom: '0700 900 900' },
    { id: 'westlands', name: 'Westlands Plaza', area: 'Westlands, Nairobi', client: 'Samira Hassan', controlRoom: '0700 900 900' },
  ],
  shifts: [
    { id: 'shift-1', siteId: 'greenview', guardId: 'kevin', day: 'today', starts: '06:00', ends: '18:00', status: 'unconfirmed' },
    { id: 'shift-2', siteId: 'greenview', guardId: 'brian', day: 'today', starts: '18:00', ends: '06:00', status: 'scheduled' },
    { id: 'shift-3', siteId: 'karen', guardId: 'peter', day: 'today', starts: '06:00', ends: '18:00', status: 'reported', arrival: '06:11', source: 'Office telephone report (not independently verified)' },
    { id: 'shift-4', siteId: 'westlands', guardId: 'mary', day: 'today', starts: '06:00', ends: '18:00', status: 'confirmed', arrival: '05:57', source: 'Supervisor visual confirmation', confirmedBy: 'Beatrice' },
    { id: 'shift-5', siteId: 'greenview', guardId: 'kevin', day: 'tomorrow', starts: '06:00', ends: '18:00', status: 'scheduled' },
    { id: 'shift-6', siteId: 'greenview', guardId: 'brian', day: 'tomorrow', starts: '18:00', ends: '06:00', status: 'scheduled' },
    { id: 'shift-7', siteId: 'karen', guardId: 'peter', day: 'tomorrow', starts: '06:00', ends: '18:00', status: 'scheduled' },
    { id: 'shift-8', siteId: 'westlands', guardId: 'mary', day: 'tomorrow', starts: '06:00', ends: '18:00', status: 'scheduled' },
  ],
  issues: [
    { id: 'issue-1', siteId: 'greenview', title: 'Rear gate lock needs inspection', detail: 'Property owner noticed the rear gate lock is loose.', origin: 'client', status: 'open', response: '', visibleToClient: true },
  ],
  reports: [
    { id: 'report-1', siteId: 'greenview', title: 'Overnight site summary', summary: 'Night shift handover recorded. No emergency escalation in the sample report. Day-shift arrival still awaiting confirmation.', published: 'Today · 08:30' },
  ],
  activity: [
    { id: 'activity-1', siteId: 'greenview', message: 'Overnight site report published for client review', audience: 'client', stamp: '08:30' },
  ],
});

const append = (data: DemoData, siteId: string, message: string, audience: Activity['audience']): Activity[] =>
  [{ id: 'activity-' + (data.activity.length + 1), siteId, message, audience, stamp: 'Demo update' }, ...data.activity];

export function assignGuard(data: DemoData, shiftId: string, guardId: string): DemoData {
  const shift = data.shifts.find(s => s.id === shiftId);
  if (!shift || !['scheduled', 'unconfirmed'].includes(shift.status)) throw new Error('Only an unstarted shift can be reassigned.');
  const guard = data.guards.find(g => g.id === guardId && g.active);
  if (!guard) throw new Error('Choose an active guard.');
  if (data.shifts.some(s => s.id !== shift.id && s.guardId === guardId && s.day === shift.day &&
    s.starts === shift.starts && s.ends === shift.ends)) throw new Error('That guard already has an overlapping assignment.');
  return {
    ...data, shifts: data.shifts.map(s => s.id === shiftId ? { ...s, guardId, status: 'scheduled', arrival: undefined, source: undefined, confirmedBy: undefined } : s),
    activity: append(data, shift.siteId, guard.name + ' assigned to the ' + shift.starts + ' shift (' + shift.day + ')', 'client'),
  };
}

export function markArrival(data: DemoData, shiftId: string, method: 'office' | 'supervisor'): DemoData {
  const shift = data.shifts.find(s => s.id === shiftId);
  if (!shift || shift.day !== 'today' || !['scheduled', 'unconfirmed', 'reported'].includes(shift.status)) {
    throw new Error('Select an active-day shift awaiting attendance confirmation.');
  }
  if (method === 'office' && shift.status === 'reported') throw new Error('This arrival is already reported; a supervisor can confirm it.');
  const guard = data.guards.find(g => g.id === shift.guardId)!;
  const status: Attendance = method === 'supervisor' ? 'confirmed' : 'reported';
  const source = method === 'supervisor' ? 'Supervisor visual confirmation' : 'Office telephone report (not independently verified)';
  const arrival = shift.arrival || '06:04';
  return {
    ...data,
    shifts: data.shifts.map(s => s.id === shiftId ? {
      ...s, status, arrival, source, confirmedBy: method === 'supervisor' ? 'Beatrice' : undefined,
    } : s),
    activity: append(data, shift.siteId,
      guard.name + ': attendance ' + (method === 'supervisor' ? 'confirmed on site by supervisor' : 'reported to office, verification pending'), 'client'),
  };
}

export function recordDeparture(data: DemoData, shiftId: string): DemoData {
  const shift = data.shifts.find(s => s.id === shiftId);
  if (!shift || shift.status !== 'confirmed') throw new Error('Departure requires a confirmed arrival.');
  const guard = data.guards.find(g => g.id === shift.guardId)!;
  return {
    ...data,
    shifts: data.shifts.map(s => s.id === shiftId ? { ...s, status: 'completed', departure: '18:02' } : s),
    activity: append(data, shift.siteId, guard.name + ': shift departure confirmed by supervisor', 'client'),
  };
}

export function raiseIssue(data: DemoData, siteId: string, title: string, detail: string): DemoData {
  if (!data.sites.some(s => s.id === siteId)) throw new Error('Select a valid property.');
  const cleanTitle = title.trim();
  const cleanDetail = detail.trim();
  if (cleanTitle.length < 5 || cleanDetail.length < 10) throw new Error('Please add an issue title and details.');
  const issue: Issue = {
    id: 'issue-' + (data.issues.reduce((n, i) => Math.max(n, Number(i.id.replace('issue-', '')) || 0), 0) + 1),
    siteId, title: cleanTitle.slice(0, 90), detail: cleanDetail.slice(0, 500),
    origin: 'client', status: 'open', response: '', visibleToClient: true,
  };
  return {
    ...data, issues: [issue, ...data.issues],
    activity: append(data, siteId, 'New client issue: ' + issue.title, 'client'),
  };
}

export function progressIssue(data: DemoData, issueId: string, next: IssueStatus, note = ''): DemoData {
  const issue = data.issues.find(i => i.id === issueId);
  if (!issue) throw new Error('Issue not found.');
  const allowed: Record<IssueStatus, IssueStatus | null> = {
    open: 'acknowledged', acknowledged: 'responding', responding: 'resolved', resolved: null,
  };
  if (allowed[issue.status] !== next) throw new Error('Issue must progress through acknowledgement, response, and resolution.');
  if ((next === 'responding' || next === 'resolved') && note.trim().length < 8) throw new Error('Record a meaningful response note.');
  return {
    ...data,
    issues: data.issues.map(i => i.id === issueId ? { ...i, status: next, response: note.trim() || i.response } : i),
    activity: append(data, issue.siteId, 'Issue "' + issue.title + '" ' + (next === 'resolved' ? 'resolved' : 'moved to ' + next), 'client'),
  };
}

export function publishReport(data: DemoData, siteId: string): DemoData {
  if (!data.sites.some(s => s.id === siteId)) throw new Error('Site not found.');
  const shifts = data.shifts.filter(s => s.siteId === siteId && s.day === 'today');
  const confirmed = shifts.filter(s => ['confirmed', 'completed'].includes(s.status)).length;
  const reported = shifts.filter(s => s.status === 'reported').length;
  const openIssues = data.issues.filter(i => i.siteId === siteId && i.status !== 'resolved').length;
  const report: Report = {
    id: 'report-' + (data.reports.length + 1), siteId, title: 'Site coverage and issue summary',
    summary: confirmed + ' of ' + shifts.length + ' shifts confirmed by supervisor; ' + reported +
      ' reported but not independently confirmed; ' + openIssues + ' issues unresolved.',
    published: 'Just published · Demo',
  };
  return { ...data, reports: [report, ...data.reports],
    activity: append(data, siteId, 'New security service report available for client review', 'client') };
}
