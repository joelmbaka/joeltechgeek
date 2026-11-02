'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness, CalendarDays, Check, ChevronRight,
  ExternalLink, LogOut, Phone, RefreshCw, Search, ShieldCheck, X,
} from 'lucide-react';
import { signIn as authSignIn, signOut as authSignOut } from 'next-auth/react';
import type { Agent, Lead, LeadStage, LeadStats, LeadUpdate } from '@/lib/agent-crm/types';

type View = 'loading' | 'signed-out' | 'ready' | 'denied' | 'error';
type Queue = 'all' | 'to_call' | 'due' | 'interested';
type Response = {
  ok: boolean;
  agent: Agent;
  leads: Lead[];
  stats: LeadStats;
  has_more: boolean;
};
type FormValues = {
  outcome: string;
  notes: string;
  next_action: string;
  next_action_at: string;
  stage: string;
  do_not_contact: boolean;
};

const outcomes: Record<string, string> = {
  connected: 'Connected', no_answer: 'No answer', busy: 'Busy',
  switched_off: 'Switched off', wrong_number: 'Wrong number',
  call_back: 'Call back requested', interested: 'Interested',
  not_interested: 'Not interested', meeting_booked: 'Meeting booked',
  whatsapp_requested: 'WhatsApp requested',
  email_requested: 'Email requested', other: 'Other',
};
const stages: LeadStage[] = [
  'new', 'contacted', 'interested', 'meeting', 'proposal', 'negotiation',
  'won', 'lost', 'nurture',
];
const emptyStats: LeadStats = {
  total: 0, to_call: 0, followups_due: 0, interested: 0, meetings: 0, won: 0,
};
const label = (str: string) => str.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function dateLabel(str: string | null | undefined) {
  if (!str) return '';
  const date = new Date(str.slice(0, 10) + 'T12:00:00+03:00');
  return Number.isNaN(date.valueOf()) ? str : date.toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
function timeLabel(str: string) {
  const date = new Date(str);
  return Number.isNaN(date.valueOf()) ? str : date.toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}
function isToCall(lead: Lead) {
  return !lead.do_not_contact && !['won', 'lost'].includes(lead.stage) &&
    (!lead.last_contacted_at ||
      (!lead.next_action_at && ['no_answer','busy','switched_off'].includes(lead.last_outcome || '')));
}
function isDue(lead: Lead) {
  return Boolean(!lead.do_not_contact && !['won', 'lost'].includes(lead.stage)
    && lead.next_action_at && lead.next_action_at <= today());
}
function isInterested(lead: Lead) {
  return ['interested','meeting','proposal','negotiation'].includes(lead.stage);
}
function webUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
function errText(value: unknown) {
  return value instanceof Error ? value.message : 'Something went wrong. Please retry.';
}
async function api<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
  // Auth.js uses an encrypted, HTTP-only cookie. Never expose session tokens to JS.
  const res = await fetch(path, {
    method,
    headers: payload === undefined ? undefined : { 'Content-Type': 'application/json' },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(body?.error || 'CRM request failed.') as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return body as T;
}
function StageBadge({ lead }: { lead: Lead }) {
  const cls = lead.do_not_contact || ['lost','do_not_contact'].includes(lead.stage)
    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
    : lead.stage === 'won' || isInterested(lead)
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
      : isDue(lead)
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  return (
    <span className={'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ' + cls}>
      {lead.do_not_contact ? 'Do not contact' : label(lead.stage)}
    </span>
  );
}
function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (lead: Lead) => void }) {
  const site = webUrl(lead.website);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-slate-950 dark:text-white">{lead.company_name}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {lead.industry}{lead.city ? ' · ' + lead.city : ''}
            {lead.country !== 'Kenya' ? ' · ' + lead.country : ''}
          </p>
        </div>
        <StageBadge lead={lead} />
      </div>
      {lead.contact_name && (
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          <strong>{lead.contact_name}</strong>{lead.contact_role ? ' · ' + lead.contact_role : ''}
        </p>
      )}
      {lead.problem_summary && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{lead.problem_summary}</p>
      )}
      {lead.last_notes && <p className="mt-2 line-clamp-2 text-xs text-slate-500">Latest note: {lead.last_notes}</p>}
      {lead.last_outcome && (
        <p className="mt-3 text-xs text-slate-500">Last outcome: <strong className="text-slate-700 dark:text-slate-200">{outcomes[lead.last_outcome]}</strong></p>
      )}
      {lead.next_action && <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">Next: {lead.next_action}</p>}
      {lead.next_action_at && (
        <p className={'mt-2 flex items-center gap-1 text-xs font-medium ' +
          (isDue(lead) ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500')}>
          <CalendarDays className="h-3.5 w-3.5" />
          {isDue(lead) ? 'Due: ' : 'Follow-up: '}{dateLabel(lead.next_action_at)}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {lead.phone && !lead.do_not_contact && (
            <a href={'tel:' + lead.phone.replace(/[^+\d]/g, '')}
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <Phone className="h-4 w-4" /> Call
            </a>
          )}
          {site && <a href={site} target="_blank" rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1 px-2 text-xs text-slate-500 hover:text-emerald-700">
            <ExternalLink className="h-4 w-4" /> Website
          </a>}
        </div>
        <button type="button" onClick={() => onOpen(lead)}
          className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          {lead.do_not_contact ? 'View' : 'Update'} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
function LeadDialog({ lead, onClose, onSaved }: {
  lead: Lead; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<FormValues>({
    outcome: '', notes: '', next_action: lead.next_action || '',
    next_action_at: lead.next_action_at || '', stage: '', do_not_contact: false,
  });
  const [history, setHistory] = useState<LeadUpdate[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api<{ok:boolean; lead:Lead; history:LeadUpdate[]}>('/api/agent-crm/leads/' + lead.id)
      .then((x) => { if (active) setHistory(x.history); })
      .catch(() => { if (active) setHistory([]); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [lead.id]);
  useEffect(() => {
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [onClose]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.outcome || saving) return;
    setSaving(true); setError('');
    try {
      await api('/api/agent-crm/leads/' + lead.id, 'PATCH', {
        outcome: form.outcome,
        notes: form.notes,
        next_action: form.do_not_contact ? '' : form.next_action,
        next_action_at: form.do_not_contact ? null : form.next_action_at || null,
        ...(form.stage ? { stage: form.stage } : {}),
        do_not_contact: form.do_not_contact,
      });
      await onSaved();
      onClose();
    } catch (err) { setError(errText(err)); }
    finally { setSaving(false); }
  }
  const input = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/65 sm:items-center sm:p-5"
      role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="lead-title"
        className="max-h-[96dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:max-h-[90dvh] sm:rounded-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">{lead.industry}</p>
            <h2 id="lead-title" className="mt-1 text-xl font-bold">{lead.company_name}</h2>
            <p className="mt-1 text-xs text-slate-500">{lead.contact_name || 'Contact not identified'}
              {lead.phone ? ' · ' + lead.phone : ''}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close lead"
            className="rounded-xl border border-slate-200 p-2 dark:border-slate-700"><X className="h-5 w-5" /></button>
        </div>
        {lead.problem_summary && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300">{lead.problem_summary}</p>}
        {lead.qualification_reason && <p className="mt-2 text-xs text-slate-500">Why qualified: {lead.qualification_reason}</p>}
        {lead.do_not_contact ? (
          <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-200">
            Do Not Contact: this lead is now read-only.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">
              Call outcome <span className="text-rose-600">*</span>
              <select required className={input} value={form.outcome}
                onChange={(e) => setForm((x) => ({...x, outcome:e.target.value}))}>
                <option value="">Choose outcome</option>
                {Object.entries(outcomes).map(([value, name]) =>
                  <option key={value} value={value}>{name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Conversation notes
              <textarea className={input + ' min-h-24 resize-y'} rows={3}
                maxLength={2500} placeholder="What did the prospect say?"
                value={form.notes} onChange={(e) => setForm((x) => ({...x,notes:e.target.value}))} />
            </label>
            <label className="block text-sm font-semibold">
              Next action
              <input className={input} maxLength={300} disabled={form.do_not_contact}
                placeholder="Call back, send demo, request a meeting..."
                value={form.next_action}
                onChange={(e) => setForm((x) => ({...x,next_action:e.target.value}))} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Follow-up date
                <input type="date" className={input} disabled={form.do_not_contact}
                  value={form.next_action_at}
                  onChange={(e) => setForm((x) => ({...x,next_action_at:e.target.value}))} />
              </label>
              <label className="block text-sm font-semibold">
                Lead stage <span className="font-normal text-slate-500">(optional)</span>
                <select className={input} disabled={form.do_not_contact} value={form.stage}
                  onChange={(e) => setForm((x) => ({...x,stage:e.target.value}))}>
                  <option value="">Automatic from outcome</option>
                  {stages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
                </select>
              </label>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-rose-700"
                checked={form.do_not_contact}
                onChange={(e) => setForm((x) => ({...x,do_not_contact:e.target.checked}))} />
              <span><strong>Do not contact again</strong>
                <span className="block text-xs text-slate-500">Use if the prospect opts out. Future calls will be blocked.</span>
              </span>
            </label>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={!form.outcome || saving}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
              <Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save update'}
            </button>
          </form>
        )}
        <div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-800">
          <h3 className="text-sm font-semibold">Previous updates</h3>
          {historyLoading ? <p className="mt-2 text-sm text-slate-500">Loading history...</p>
            : history.length === 0 ? <p className="mt-2 text-sm text-slate-500">No previous updates.</p>
            : <div className="mt-3 space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <strong>{outcomes[h.outcome] || label(h.outcome)}</strong>
                      <span className="text-slate-500">{timeLabel(h.created_at)}</span>
                    </div>
                    {h.notes && <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{h.notes}</p>}
                    {h.next_action && <p className="mt-1 text-slate-500">Next: {h.next_action}
                      {h.next_action_at ? ' · ' + dateLabel(h.next_action_at) : ''}</p>}
                  </div>
                ))}
              </div>}
        </div>
      </section>
    </div>
  );
}

export function CrmClient() {
  const [view, setView] = useState<View>('loading');
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [queue, setQueue] = useState<Queue>('all');
  const [industry, setIndustry] = useState('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setView('loading');
    try {
      const response = await api<Response>('/api/agent-crm/leads');
      setData(response); setView('ready'); setError('');
    } catch (err) {
      const status = (err as Error & {status?: number}).status;
      setData(null);
      if (status === 403) setView('denied');
      else if (status === 401) {
        const accessDenied = new URLSearchParams(window.location.search).get('error') === 'AccessDenied';
        setView(accessDenied ? 'denied' : 'signed-out');
        if (accessDenied) setError('Only registered sales agents can access this CRM.');
        else setError('');
      } else {
        setError(errText(err));
        setView('error');
      }
    } finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function signIn() {
    setGoogleLoading(true); setError('');
    try {
      await authSignIn('google', { redirectTo: '/crm' }, { prompt: 'select_account' });
    } catch (err) {
      setError(errText(err)); setGoogleLoading(false);
    }
  }

  async function signOut() {
    setSelected(null); setData(null);
    try {
      await authSignOut({ redirectTo: '/crm' });
    } catch (err) {
      setError(errText(err));
      setView('error');
    }
  }
  const leads = data?.leads || [];
  const stats = data?.stats || emptyStats;
  const industries = useMemo(() => Array.from(new Set(leads.map((x) => x.industry))).sort(), [leads]);
  const filtered = useMemo(() => leads.filter((lead) => {
    if (industry !== 'all' && lead.industry !== industry) return false;
    if (queue === 'to_call' && !isToCall(lead)) return false;
    if (queue === 'due' && !isDue(lead)) return false;
    if (queue === 'interested' && !isInterested(lead)) return false;
    const term = query.trim().toLowerCase();
    return !term || [lead.company_name, lead.contact_name, lead.city,
      lead.phone, lead.industry, lead.problem_summary].some((s) => (s || '').toLowerCase().includes(term));
  }), [leads,industry,queue,query]);
  const counters: Array<{key:Queue; title:string; value:number}> = [
    {key:'all',title:'Total leads',value:stats.total},
    {key:'to_call',title:'To call',value:stats.to_call},
    {key:'due',title:'Follow-ups due',value:stats.followups_due},
    {key:'interested',title:'Interested',value:stats.interested},
  ];
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold sm:text-base">JoelTechGeek CRM</h1>
              <p className="text-[11px] text-slate-500">Sales agent workspace</p>
            </div>
          </div>
          {view === 'ready' && (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-48 truncate text-xs text-slate-500 sm:block">{data?.agent.name}</span>
              <button type="button" onClick={() => void refresh(true)} disabled={refreshing}
                aria-label="Refresh leads" className="rounded-xl border border-slate-200 p-2.5 dark:border-slate-700">
                <RefreshCw className={'h-4 w-4 ' + (refreshing ? 'animate-spin' : '')} />
              </button>
              <button type="button" onClick={() => void signOut()}
                className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700">
                <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>
      {view === 'loading' ? (
        <div className="mx-auto max-w-md px-5 py-28 text-center text-sm text-slate-500" role="status">
          <RefreshCw className="mx-auto mb-4 h-6 w-6 animate-spin" /> Checking your CRM access...
        </div>
      ) : view !== 'ready' ? (
        <div className="mx-auto max-w-md px-5 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ShieldCheck className="mx-auto h-9 w-9 text-emerald-700" />
            <h2 className="mt-5 text-xl font-bold">
              {view === 'denied' ? 'This email is not authorized' : view === 'error' ? 'Connection problem' : 'Welcome to your CRM'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {view === 'denied'
                ? 'Use the Google email you entered on your JoelTechGeek agent registration.'
                : view === 'error' ? 'We could not load your leads. You can retry.'
                  : 'Sign in with the Google account you used when applying to become a sales agent.'}
            </p>
            {error && <p className="mt-4 text-sm text-rose-700" role="alert">{error}</p>}
            <button type="button" onClick={() => void signIn()} disabled={googleLoading}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 font-semibold text-white disabled:opacity-50">
              {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
            </button>
            {view === 'error' && (
              <button type="button" onClick={() => void refresh()} className="mt-3 text-sm text-emerald-700">Retry</button>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">My leads</h2>
            <p className="mt-1 text-sm text-slate-500">Call prospects, record outcomes and set the next action.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {counters.map((item) => (
              <button type="button" key={item.key} onClick={() => setQueue(item.key)}
                className={'rounded-2xl border p-4 text-left shadow-sm transition sm:p-5 ' +
                  (queue === item.key
                    ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700 dark:bg-emerald-950'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900')}>
                <p className="text-xs text-slate-500 dark:text-slate-300">{item.title}</p>
                <strong className="mt-2 block text-2xl tabular-nums sm:text-3xl">{item.value}</strong>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search leads</span>
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search companies, contacts and locations"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}
              aria-label="Industry" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 sm:w-56">
              <option value="all">All industries</option>
              {industries.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          {data?.has_more && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Showing the first 1,000 leads. Pagination will be needed before this agent exceeds 1,000.
            </p>
          )}
          <p className="flex items-center justify-between text-sm text-slate-500">
            {filtered.length} lead{filtered.length === 1 ? '' : 's'} shown
            {queue !== 'all' && <button type="button" onClick={() => setQueue('all')} className="text-xs font-semibold text-emerald-700">Clear filter</button>}
          </p>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <BriefcaseBusiness className="mx-auto h-7 w-7 text-slate-400" />
              <h3 className="mt-3 font-semibold">{leads.length ? 'No matching leads' : 'No leads assigned yet'}</h3>
              <p className="mt-2 text-sm text-slate-500">{leads.length
                ? 'Try another filter or search.'
                : 'Your team will assign prospects to your account. They will appear here automatically.'}</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={setSelected} />)}
            </div>
          )}
          <p className="pb-5 text-center text-xs text-slate-400">
            Only leads assigned to your registered account are visible.
          </p>
        </div>
      )}
      {selected && <LeadDialog key={selected.id} lead={selected}
        onClose={() => setSelected(null)} onSaved={() => refresh(true)} />}
    </main>
  );
}
