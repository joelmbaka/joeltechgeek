'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import styles from './SecurityExperience.module.css';
import {
  AlertCircle, ArrowRight, Bell, CalendarDays, CheckCircle2, ClipboardList,
  Clock3, FileText, House, Info, MapPin, MessageSquarePlus, Phone,
  RotateCcw, Send, ShieldCheck, WifiOff
} from 'lucide-react';
import {
  STORAGE_KEY, seedDemo, assignGuard, markArrival, recordDeparture,
  raiseIssue, logSiteIncident, progressIssue, publishReport,
  type Attendance, type Day, type DemoData, type Issue, type IssueStatus, type Role, type Shift
} from './security-demo-model';

const panes: Record<Role, { label: string; description: string; tabs: { id: string; name: string }[] }> = {
  operations: {
    label: 'Grace · Operations', description: 'Staffing, coverage and client service',
    tabs: [{ id: 'overview', name: 'Dashboard' }, { id: 'shifts', name: 'Deployments' }, { id: 'issues', name: 'Client issues' }, { id: 'reports', name: 'Reports' }],
  },
  supervisor: {
    label: 'Beatrice · Supervisor', description: 'Confirm attendance and resolve issues',
    tabs: [{ id: 'overview', name: 'Site checks' }, { id: 'issues', name: 'Issue responses' }],
  },
  client: {
    label: 'Alex · Property owner', description: 'Coverage, schedules and service updates',
    tabs: [{ id: 'overview', name: 'My property' }, { id: 'roster', name: 'Duty schedule' }, { id: 'issues', name: 'Raise an issue' }, { id: 'reports', name: 'Reports & updates' }],
  },
};

const STATUS: Record<Attendance, { name: string; className: string }> = {
  scheduled: { name: 'Scheduled', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200' },
  unconfirmed: { name: 'Not confirmed', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' },
  reported: { name: 'Reported · unverified', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200' },
  confirmed: { name: 'Supervisor confirmed', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' },
  completed: { name: 'Shift completed', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200' },
};
const ISSUE_STATUS: Record<IssueStatus, { name: string; className: string }> = {
  open: { name: 'Open', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' },
  acknowledged: { name: 'Acknowledged', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200' },
  responding: { name: 'In progress', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200' },
  resolved: { name: 'Resolved', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' },
};
const NEXT: Record<IssueStatus, IssueStatus | null> = {
  open: 'acknowledged', acknowledged: 'responding', responding: 'resolved', resolved: null,
};
function TabIcon({ id }: { id: string }) {
  const props = { className: 'h-5 w-5', 'aria-hidden': true as const };
  if (id === 'overview') return <House {...props} />;
  if (id === 'shifts' || id === 'roster') return <CalendarDays {...props} />;
  if (id === 'issues') return <MessageSquarePlus {...props} />;
  if (id === 'reports') return <FileText {...props} />;
  return <ClipboardList {...props} />;
}
const btn = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40';
const outline = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200';
const input = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const panel = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900';

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={panel + ' ' + className}>{children}</div>;
}
function Pill({ status }: { status: Attendance | IssueStatus }) {
  const cfg = status in STATUS ? STATUS[status as Attendance] : ISSUE_STATUS[status as IssueStatus];
  return <span className={'rounded-full px-2.5 py-1 text-xs font-semibold ' + cfg.className}>{cfg.name}</span>;
}
function Heading({ title, detail }: { title: string; detail?: string }) {
  return <div className="mb-5"><h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>{detail && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>}</div>;
}
function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <Card><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>{hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}</Card>;
}

export default function SecurityExperience() {
  const [data, setData] = useState<DemoData>(seedDemo);
  const [hydrated, setHydrated] = useState(false);
  const [role, setRole] = useState<Role>('client');
  const screenRef = useRef<HTMLElement>(null);
  const [tab, setTab] = useState('overview');
  const [siteId, setSiteId] = useState('greenview');
  const [day, setDay] = useState<Day>('today');
  const [message, setMessage] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDetail, setIssueDetail] = useState('');
  const [incidentSiteId, setIncidentSiteId] = useState('greenview');
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDetail, setIncidentDetail] = useState('');
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && 'version' in parsed &&
            parsed.version === 2 && 'shifts' in parsed && Array.isArray(parsed.shifts) &&
            'issues' in parsed && Array.isArray(parsed.issues) &&
            'activity' in parsed && Array.isArray(parsed.activity) &&
            'sites' in parsed && Array.isArray(parsed.sites) && parsed.sites.length > 0 &&
            'guards' in parsed && Array.isArray(parsed.guards) &&
            'reports' in parsed && Array.isArray(parsed.reports)) setData(parsed as DemoData);
      }
    } catch {
      // Corrupt or inaccessible local storage must never block the public demo.
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Browser storage is optional. */ }
  }, [data, hydrated]);

  const currentSite = data.sites.find(s => s.id === siteId) || data.sites[0];
  const todays = data.shifts.filter(s => s.day === 'today');
  const pending = todays.filter(s => s.status === 'unconfirmed' || s.status === 'reported');
  const unresolved = data.issues.filter(i => i.status !== 'resolved');
  const forClient = useMemo(() => ({
    today: data.shifts.filter(s => s.siteId === siteId && s.day === 'today'),
    tomorrow: data.shifts.filter(s => s.siteId === siteId && s.day === 'tomorrow'),
    issues: data.issues.filter(i => i.siteId === siteId && i.visibleToClient),
    reports: data.reports.filter(r => r.siteId === siteId),
    updates: data.activity.filter(a => a.siteId === siteId && a.audience === 'client'),
  }), [data, siteId]);

  function perform(action: (before: DemoData) => DemoData, success: string) {
    try { setData(action(data)); setMessage(success); } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not complete that action.');
    }
  }
  function changeRole(next: Role) { setRole(next); setTab('overview'); setMessage(''); if (screenRef.current) screenRef.current.scrollTop = 0; }
  function changeTab(next: string) { setTab(next); setMessage(''); if (screenRef.current) screenRef.current.scrollTop = 0; }
  function reset() {
    if (window.confirm('Reset all fictional shift, report, and issue data?')) {
      setData(seedDemo()); setRole('client'); setTab('overview'); setSiteId('greenview'); setMessage('Demo reset to its original sample data.');
    }
  }
  function guardFor(shift: Shift) { return data.guards.find(g => g.id === shift.guardId); }
  function siteFor(shift: Shift) { return data.sites.find(s => s.id === shift.siteId); }

  function shiftCard(shift: Shift, context: 'client' | 'operations' | 'supervisor') {
    const guard = guardFor(shift);
    const editable = context === 'operations' && ['scheduled', 'unconfirmed'].includes(shift.status);
    const officeCanReport = context === 'operations' && shift.day === 'today' && ['scheduled', 'unconfirmed'].includes(shift.status);
    const supervisorCanConfirm = context === 'supervisor' && shift.day === 'today' && ['scheduled', 'unconfirmed', 'reported'].includes(shift.status);
    const supervisorCanDepart = context === 'supervisor' && shift.status === 'confirmed';
    return (
      <Card key={shift.id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {context !== 'client' && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{siteFor(shift)?.name}</p>}
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{guard?.name || 'Unassigned guard'}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"><Clock3 className="h-4 w-4" /> {shift.starts}–{shift.ends} · {shift.day === 'today' ? 'Today' : 'Tomorrow'}</p>
          </div>
          <Pill status={shift.status} />
        </div>
        {(shift.arrival || shift.departure || shift.source) && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
          {shift.arrival && <p>Arrival: {shift.arrival}{shift.departure ? ' · Departure: ' + shift.departure : ''}</p>}
          {shift.source && <p>Method: {shift.source}</p>}
          {shift.confirmedBy && <p>Confirmed by: {shift.confirmedBy}</p>}
        </div>}
        {context !== 'client' && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Staff contact: {guard?.phone || 'Not available'} · Sample directory</p>}
        {context === 'client' && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{guard?.workContact ? 'Approved guard work contact: ' + guard.workContact + ' · ' : ''}Security control room: {currentSite.controlRoom}</p>}
        {editable && <div className="mt-4">
          <label htmlFor={'assign-' + shift.id} className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Change assigned officer</label>
          <select id={'assign-' + shift.id} className={input} value={shift.guardId}
            onChange={e => perform(d => assignGuard(d, shift.id, e.target.value), 'Duty roster updated. Client view reflects this change.')}>
            {data.guards.filter(g => g.active).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>}
        {officeCanReport && <button className={outline + ' mt-3 w-full'} onClick={() => perform(d => markArrival(d, shift.id, 'office'), 'Office report recorded as unverified, not a confirmed check-in.')}>Record telephone-reported arrival</button>}
        {supervisorCanConfirm && <button className={btn + ' mt-3 w-full'} onClick={() => perform(d => markArrival(d, shift.id, 'supervisor'), 'Attendance confirmed by supervisor; client view updated.')}><CheckCircle2 className="h-4 w-4" /> Confirm arrival on site</button>}
        {supervisorCanDepart && <button className={outline + ' mt-3 w-full'} onClick={() => perform(d => recordDeparture(d, shift.id), 'Supervisor-confirmed departure recorded.')}><Clock3 className="h-4 w-4" /> Record shift departure</button>}
      </Card>
    );
  }

  function issueCard(issue: Issue, canAdvance: boolean) {
    const next = NEXT[issue.status];
    return <Card key={issue.id}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{data.sites.find(s => s.id === issue.siteId)?.name} · {issue.origin === 'client' ? 'Client request' : 'Site incident'}</p>
          <h3 className="mt-1 font-bold text-slate-900 dark:text-white">{issue.title}</h3></div>
        <Pill status={issue.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{issue.detail}</p>
      {issue.response && <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"><span className="font-semibold">Latest response: </span>{issue.response}</div>}
      {canAdvance && next && <div className="mt-4 space-y-2">
        {next !== 'acknowledged' && <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          Response / resolution note
          <textarea rows={2} value={responseNotes[issue.id] || ''} className={input + ' mt-1'} placeholder="Describe action taken (minimum 8 characters)"
            onChange={e => setResponseNotes(n => ({ ...n, [issue.id]: e.target.value }))} />
        </label>}
        <button className={btn + ' w-full'} onClick={() => perform(d => progressIssue(d, issue.id, next, responseNotes[issue.id] || ''),
          'Issue updated. The client can now see the new status.')}>
          {next === 'acknowledged' ? 'Acknowledge client issue' : next === 'responding' ? 'Record supervisor response' : 'Resolve issue'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>}
    </Card>;
  }

  function incidentForm() {
    return <Card className="mb-5">
      <h3 className="font-bold">Log a security incident</h3>
      <p className="mt-1 text-xs text-slate-500">Record a site incident from the office or supervisor&apos;s company device. It appears in the relevant client portal.</p>
      <form className="mt-4 grid gap-3" onSubmit={e => {
        e.preventDefault();
        try {
          setData(logSiteIncident(data, incidentSiteId, incidentTitle, incidentDetail));
          setIncidentTitle(''); setIncidentDetail('');
          setMessage('Site incident logged and added to the client portal.');
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not record the incident.'); }
      }}>
        <label className="block text-xs font-semibold">Property
          <select className={input + ' mt-1'} value={incidentSiteId} onChange={e => setIncidentSiteId(e.target.value)}>
            {data.sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold">Incident title
          <input className={input + ' mt-1'} required minLength={5} maxLength={90} value={incidentTitle} placeholder="e.g. Main gate damaged"
            onChange={e => setIncidentTitle(e.target.value)} />
        </label>
        <label className="block text-xs font-semibold ">Incident details
          <textarea className={input + ' mt-1'} required minLength={10} maxLength={500} rows={2} value={incidentDetail}
            placeholder="What happened and what action is needed?" onChange={e => setIncidentDetail(e.target.value)} />
        </label>
        <button className={btn + ' '} type="submit"><MessageSquarePlus className="h-4 w-4" /> Record incident</button>
      </form>
    </Card>;
  }

  return (
    <div className={styles.stage}>
      <aside className={styles.intro}>
        <p className={styles.kicker}>JOELTECHGEEK · INTERACTIVE CONCEPT</p>
        <h1>Every property covered. Every client informed.</h1>
        <p>See how a security company manages duty schedules, confirms attendance and keeps property owners informed—through a connected mobile experience.</p>
        <a href="/demos/security">← About this solution</a>
      </aside>

      <section className={styles.phone} aria-label="Interactive security operations mobile demo">
        <div className={styles.statusbar} aria-hidden="true"><span>9:41</span><span>●●● ◕ ▰</span></div>
        <header className={styles.appHeader}>
          <span className={styles.logo}><ShieldCheck className="h-6 w-6" aria-hidden="true" /></span>
          <div className={styles.brand}>
            <strong>Security Operations</strong>
            <span>CLIENT SERVICE · DEMO</span>
          </div>
          <label className={styles.roleLabel} htmlFor="security-role-select">
            Switch role
            <select id="security-role-select" className={styles.roleSelect} value={role}
              onChange={e => changeRole(e.target.value as Role)}>
              <option value="client">Alex · Client</option>
              <option value="operations">Grace · Operations</option>
              <option value="supervisor">Beatrice · Supervisor</option>
            </select>
          </label>
        </header>
        <main ref={screenRef} className={styles.screen} aria-label={panes[role].label + ' workspace'}>
          <div className="mb-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">{panes[role].label}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{panes[role].description}</p>
          </div>
          {message && <div role="status" className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            <span className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" />{message}</span>
            <button type="button" aria-label="Dismiss message" onClick={() => setMessage('')}>×</button>
          </div>}
        {role === 'client' && <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Client service portal</p>
            <h2 className="mt-1 text-xl font-bold">{currentSite.name}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" />{currentSite.area}</p></div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Preview a sample client site
            <select className={input + ' mt-1'} value={siteId} onChange={e => setSiteId(e.target.value)}>
              {data.sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>}

        {role === 'client' && tab === 'overview' && <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Assigned today" value={forClient.today.length} hint="Scheduled duty slots" />
            <Metric label="Supervisor confirmed" value={forClient.today.filter(s => ['confirmed', 'completed'].includes(s.status)).length} hint="Not the same as GPS tracking" />
            <Metric label="Open site issues" value={forClient.issues.filter(i => i.status !== 'resolved').length} hint="Visible to your security company" />
          </div>
          <div><Heading title="Who's assigned today?" detail="See the roster, clock-in evidence source, and service contact in one place." />
            <div className="grid gap-3">{forClient.today.map(s => shiftCard(s, 'client'))}</div></div>
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div><h3 className="font-bold">Need assistance at your property?</h3><p className="mt-1 text-sm text-slate-500">Send a concern directly to the security operations team and track its resolution.</p></div>
            <button className={btn} onClick={() => setTab('issues')}><MessageSquarePlus className="h-4 w-4" /> Raise an issue</button>
          </Card>
          <div><Heading title="Latest service updates" detail="Illustrative in-app updates, not real push notifications." />
            <Card><div className="space-y-3">{forClient.updates.length ? forClient.updates.slice(0, 6).map(a => <div key={a.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"><Bell className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /><div className="text-sm"><p>{a.message}</p><p className="mt-1 text-xs text-slate-400">{a.stamp}</p></div></div>) : <p className="text-sm text-slate-500">No service updates yet.</p>}</div></Card>
          </div>
        </div>}
        {role === 'client' && tab === 'roster' && <div>
          <Heading title="Duty schedule" detail="Today's coverage and tomorrow's assignments. Changes from Operations appear here instantly." />
          <div className="mb-4 flex gap-2">{(['today', 'tomorrow'] as Day[]).map(d => <button key={d} onClick={() => setDay(d)} className={day === d ? btn : outline}>{d === 'today' ? 'Today' : 'Tomorrow'}</button>)}</div>
          <div className="grid gap-3">{(day === 'today' ? forClient.today : forClient.tomorrow).map(s => shiftCard(s, 'client'))}</div>
        </div>}
        {role === 'client' && tab === 'issues' && <div className="grid gap-5">
          <div><Heading title="Report a site concern" detail="Your issue reaches the security operations queue; follow each status as it changes." />
            <Card><form className="space-y-4" onSubmit={e => {
              e.preventDefault();
              try { const next = raiseIssue(data, siteId, issueTitle, issueDetail); setData(next); setIssueTitle(''); setIssueDetail(''); setMessage('Issue sent to the sample operations queue. Switch to Operations to see it.'); }
              catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to submit issue.'); }
            }}>
              <label className="block text-sm font-semibold">Concern title<input required minLength={5} maxLength={90} className={input + ' mt-1.5'} placeholder="e.g. Rear gate left unsecured" value={issueTitle} onChange={e => setIssueTitle(e.target.value)} /></label>
              <label className="block text-sm font-semibold">What happened?<textarea required minLength={10} maxLength={500} rows={4} className={input + ' mt-1.5'} placeholder="Explain the concern and where it occurred" value={issueDetail} onChange={e => setIssueDetail(e.target.value)} /></label>
              <button className={btn + ' w-full'} type="submit"><Send className="h-4 w-4" /> Submit client issue</button>
            </form></Card></div>
          <div><Heading title="Your reported issues" detail="Track acknowledgement, response and resolution." />
            <div className="space-y-3">{forClient.issues.length ? forClient.issues.map(i => issueCard(i, false)) : <Card><p className="text-sm text-slate-500">No issues reported for this property.</p></Card>}</div></div>
        </div>}
        {role === 'client' && tab === 'reports' && <div className="grid gap-5">
          <div><Heading title="Published site reports" detail="Only reports published for this property appear here." />
            <div className="space-y-3">{forClient.reports.map(r => <Card key={r.id}><div className="flex items-center gap-2 font-semibold"><FileText className="h-5 w-5 text-emerald-700" />{r.title}</div><p className="mt-2 text-xs text-slate-500">{r.published}</p><p className="mt-3 text-sm leading-6">{r.summary}</p></Card>)}
              {!forClient.reports.length && <Card><p className="text-sm text-slate-500">No reports published yet.</p></Card>}</div>
          </div>
          <div><Heading title="Notifications & service updates" detail="In-app history only. Real push and SMS alerts are not connected." />
            <Card><div className="space-y-3">{forClient.updates.map(a => <div key={a.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"><p className="text-sm">{a.message}</p><p className="mt-1 text-xs text-slate-500">{a.stamp}</p></div>)}</div></Card></div>
        </div>}

        {role === 'operations' && tab === 'overview' && <div className="space-y-6">
          <Heading title="Operations control centre" detail="See exceptions first: unresolved client issues, unconfirmed arrivals, and upcoming coverage." />
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Client sites" value={data.sites.length} />
            <Metric label="Today's shifts" value={todays.length} />
            <Metric label="Attendance exceptions" value={pending.length} hint="Unconfirmed or unverified" />
            <Metric label="Open client issues" value={unresolved.length} />
          </div>
          <div className="grid gap-5">
            <div><Heading title="Attendance needs attention" detail="A reported arrival isn't automatically independently confirmed." />
              <div className="space-y-3">{pending.map(s => shiftCard(s, 'operations'))}{!pending.length && <Card><p className="text-sm text-slate-500">No attendance exceptions in the sample roster.</p></Card>}</div>
            </div>
            <div><Heading title="Client requests awaiting resolution" />
              <div className="space-y-3">{unresolved.slice(0, 4).map(i => issueCard(i, true))}{!unresolved.length && <Card><p className="text-sm text-slate-500">No unresolved requests.</p></Card>}</div>
            </div>
          </div>
        </div>}
        {role === 'operations' && tab === 'shifts' && <div>
          <Heading title="Deployments & staff directory" detail="Plan tomorrow, replace an unstarted assignment, and record telephone-reported attendance without claiming GPS verification." />
          <div className="mb-5 flex flex-wrap gap-2">{(['today', 'tomorrow'] as Day[]).map(d => <button key={d} onClick={() => setDay(d)} className={day === d ? btn : outline}>{d === 'today' ? "Today's shifts" : "Tomorrow's shifts"}</button>)}</div>
          <div className="grid gap-3">{data.shifts.filter(s => s.day === day).map(s => shiftCard(s, 'operations'))}</div>
          <div className="mt-7"><Heading title="Staff directory" detail="Contact numbers shown only in authorised staff-facing demo roles." />
            <div className="grid gap-3">{data.guards.map(g => <Card key={g.id}><p className="font-bold">{g.name}</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Phone className="h-4 w-4" />{g.phone}</p><p className="mt-2 text-xs text-emerald-700">Active staff · Sample record</p></Card>)}</div></div>
        </div>}
        {role === 'operations' && tab === 'issues' && <div><Heading title="Client requests & incidents" detail="Record site incidents and address customer concerns. Changes become visible to the affected property owner." />
          {incidentForm()}
          <div className="grid gap-3">{data.issues.map(i => issueCard(i, true))}</div></div>}
        {role === 'operations' && tab === 'reports' && <div>
          <Heading title="Publish client service reports" detail="Generate a snapshot with confirmed, telephone-reported and unresolved statuses kept separate." />
          <div className="mb-5 flex flex-wrap gap-3">{data.sites.map(site => <button key={site.id} className={outline} onClick={() => perform(d => publishReport(d, site.id), 'Report published to ' + site.name + ' client portal.')}><FileText className="h-4 w-4" /> Publish: {site.name}</button>)}</div>
          <div className="grid gap-3">{data.reports.map(r => <Card key={r.id}><p className="text-xs font-semibold uppercase text-emerald-700">{data.sites.find(s => s.id === r.siteId)?.name}</p><h3 className="mt-1 font-bold">{r.title}</h3><p className="mt-1 text-xs text-slate-500">{r.published}</p><p className="mt-3 text-sm">{r.summary}</p></Card>)}</div>
        </div>}

        {role === 'supervisor' && tab === 'overview' && <div>
          <Heading title="Supervisor site checks" detail="Confirm attendance using a shared company device. Guard smartphones and mobile data are not required." />
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"><WifiOff className="h-5 w-5 shrink-0" /> Supervisor confirmation and office attendance reports have distinct verification levels. This demo does not collect location.</div>
          <div className="grid gap-3">{todays.map(s => shiftCard(s, 'supervisor'))}</div>
        </div>}
        {role === 'supervisor' && tab === 'issues' && <div><Heading title="Respond to client concerns" detail="Log site incidents, acknowledge client concerns, and record the response through resolution." />
          {incidentForm()}
          <div className="grid gap-3">{data.issues.map(i => issueCard(i, true))}</div></div>}


        <div className="mt-6 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-[10px] leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Fictional, browser-only demo. Staff, attendance, incidents and client records are samples. No live devices, calls, messages, tracking or emergency services are connected.</p>
        </div>
        </main>
        <nav className={styles.tabBar} aria-label="Mobile app navigation">
          {panes[role].tabs.map(t => (
            <button type="button" key={t.id}
              className={styles.tab + ' ' + (tab === t.id ? styles.tabActive : '')}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => changeTab(t.id)}>
              <TabIcon id={t.id} /><span>{t.name === 'My property' ? 'Home' : t.name === 'Duty schedule' ? 'Roster' : t.name === 'Raise an issue' ? 'Issues' : t.name === 'Reports & updates' ? 'Reports' : t.name === 'Issue responses' ? 'Issues' : t.name === 'Client issues' ? 'Issues' : t.name === 'Deployments' ? 'Shifts' : t.name === 'Site checks' ? 'Sites' : t.name}</span>
            </button>
          ))}
        </nav>
        <div className={styles.gesture} aria-hidden="true"><span /></div>
      </section>

      <aside className={styles.guide}>
        <p className={styles.kicker}>EXPLORE THE JOURNEY</p>
        <h2>Schedule. Confirm. Respond.</h2>
        <ol>
          <li>Choose Grace from the dropdown and update a duty roster.</li>
          <li>Switch to Beatrice to confirm an arrival.</li>
          <li>Switch to Alex to review attendance and raise a concern.</li>
          <li>Resolve the issue, then publish a client report.</li>
        </ol>
        <button type="button" className={styles.reset} onClick={reset}><RotateCcw className="h-4 w-4" /> Reset demo data</button>
        <small>All names, numbers and events are illustrative. Changes stay in this browser.</small>
      </aside>
    </div>
  );
}
