'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness, CalendarDays, Check, ChevronRight,
  ExternalLink, LogOut, Phone, RefreshCw, Search, ShieldCheck, X,
} from 'lucide-react';
import { signIn as authSignIn, signOut as authSignOut } from 'next-auth/react';
import type { Agent, Lead, LeadStage, LeadStats, LeadUpdate } from '@/lib/agent-crm/types';
import { BrandLogo, BrandSymbol } from '@/components/BrandLogo';

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
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-white/10 dark:bg-[#0E1D2A] dark:hover:border-emerald-700 sm:p-5">
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
    <main className="min-h-screen bg-[#F6F8FA] text-[#0A2836] dark:bg-[#07111D] dark:text-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0A1724]/95">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <div className="min-w-0 shrink-0"><BrandLogo /></div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-[10px] font-bold tracking-wide text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-900/25 dark:text-emerald-300 sm:hidden">CRM</span>
            <div className="hidden border-l border-slate-200 pl-4 dark:border-white/15 sm:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#059669] dark:text-[#34D399]">Sales CRM</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Agent workspace</p>
            </div>
          </div>
          {view === 'ready' && (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-700/50">
                  {(data?.agent.name || 'A').trim().slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-32 truncate text-xs font-semibold text-[#0A2836] dark:text-slate-200">{data?.agent.name}</span>
              </div>
              <button type="button" onClick={() => void refresh(true)} disabled={refreshing} title="Refresh leads"
                aria-label="Refresh leads" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
                <RefreshCw className={'h-4 w-4 ' + (refreshing ? 'animate-spin' : '')} />
              </button>
              <button type="button" onClick={() => void signOut()}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
                <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span><span className="sr-only sm:hidden">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>
      {view === 'loading' ? (
        <div className="mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-md flex-col items-center justify-center px-5 py-16 text-center text-sm text-slate-500" role="status">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-white/10 dark:bg-[#122333]">
            <span className="dark:hidden"><BrandSymbol size={40} /></span>
            <span className="hidden dark:block"><BrandSymbol size={40} onDark /></span>
          </div>
          <RefreshCw className="mb-3 h-4 w-4 animate-spin text-[#059669]" /> Checking your CRM access...
        </div>
      ) : view !== 'ready' ? (
        <div className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-lg items-center justify-center px-4 py-12 sm:px-5 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(5,150,105,0.075),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_50%_45%,rgba(16,185,129,0.085),transparent_65%)]" />
          <section className="relative w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_65px_-38px_rgba(10,40,54,0.28)] dark:border-white/10 dark:bg-[#0E1D2A] dark:shadow-black/20">
            <div className="h-1 bg-gradient-to-r from-[#0A2836] via-[#059669] to-[#F4B843] dark:from-emerald-700 dark:via-emerald-400 dark:to-[#F4B843]" />
            <div className="px-7 pb-8 pt-9 text-center sm:px-10 sm:pb-10 sm:pt-10">
              <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[20px] border border-slate-200 bg-[#F8FAFB] shadow-sm dark:border-white/10 dark:bg-[#122D3A]">
                <span className="dark:hidden"><BrandSymbol size={47} /></span>
                <span className="hidden dark:block"><BrandSymbol size={47} onDark /></span>
              </div>
              <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.19em] text-[#059669] dark:text-[#34D399]">JoelTechGeek · Sales CRM</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0A2836] dark:text-white sm:text-[28px]">
                {view === 'denied' ? 'Account not authorized' : view === 'error' ? 'Connection problem' : 'Welcome to your workspace'}
              </h2>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-300">
                {view === 'denied'
                  ? 'Use the Google account you entered on your JoelTechGeek sales-agent application.'
                  : view === 'error' ? 'We could not load your leads. Check the connection and try again.'
                    : 'Sign in with your registered Google account to manage leads and follow-ups.'}
              </p>
              {error && <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200" role="alert">{error}</p>}
              <button type="button" onClick={() => void signIn()} disabled={googleLoading}
                className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#059669] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#047857] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 disabled:opacity-50 dark:ring-offset-[#0E1D2A]">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C31.66,6.053,28.045,4.5,24,4.5c-10.77,0-19.5,8.73-19.5,19.5 s8.73,19.5,19.5,19.5S43.5,34.77,43.5,24C43.5,22.659,43.393,21.355,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.818C14.465,16.23,18.897,13.5,24,13.5c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C31.66,6.053,28.045,4.5,24,4.5C16.318,4.5,9.656,8.838,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,43.5c5.164,0,9.81-1.977,13.285-5.197l-6.141-5.197C29.101,35.916,26.715,36.75,24,36.75 c-5.202,0-9.619-3.317-11.273-7.951l-6.526,5.027C9.51,39.074,16.227,43.5,24,43.5z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-3.999,5.607 c0.001-0.001,0.003-0.002,0.004-0.003l6.141,5.197C36.93,39.33,43.5,34.5,43.5,24C43.5,22.659,43.393,21.355,43.611,20.083z"/>
          </svg></span>
                {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
              </button>
              {view === 'error' && <button type="button" onClick={() => void refresh()}
                className="mt-4 text-sm font-semibold text-[#059669] hover:underline dark:text-[#34D399]">Retry connection</button>}
              <p className="mt-7 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
                Access is limited to registered JoelTechGeek sales agents.
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-7 sm:px-6 sm:pt-10">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#059669] dark:text-[#34D399]"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#F4B843]" /> Your pipeline</p>
              <h2 className="text-[28px] font-bold tracking-tight text-[#0A2836] dark:text-white sm:text-[32px]">My leads</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">Your prospects, conversations and next actions in one place.</p>
            </div>
            <span className="self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:self-auto">{data?.agent.name || 'Agent'}'s workspace</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {counters.map((item) => (
              <button type="button" key={item.key} onClick={() => setQueue(item.key)} aria-pressed={queue === item.key}
                className={'group relative min-w-0 overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] sm:p-5 ' +
                  (queue === item.key
                    ? 'border-[#059669] bg-emerald-50/70 ring-1 ring-[#059669]/50 dark:border-emerald-500 dark:bg-emerald-950/35'
                    : 'border-slate-200 bg-white hover:border-emerald-300 dark:border-white/10 dark:bg-[#0E1D2A] dark:hover:border-emerald-700')}>
                {queue === item.key && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[#059669]" />}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.title}</span>
                  <span className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ' +
                    (queue === item.key ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-300')}>
                    {item.key === 'all' && <BriefcaseBusiness className="h-[18px] w-[18px]" />}
                    {item.key === 'to_call' && <Phone className="h-[18px] w-[18px]" />}
                    {item.key === 'due' && <CalendarDays className="h-[18px] w-[18px]" />}
                    {item.key === 'interested' && <Check className="h-[18px] w-[18px]" />}
                  </span>
                </div>
                <strong className="mt-3 block text-3xl font-bold leading-none tabular-nums tracking-tight text-[#0A2836] dark:text-white sm:text-[34px]">{item.value}</strong>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {item.key === 'all' ? 'Assigned prospects' : item.key === 'to_call' ? 'Ready for outreach' : item.key === 'due' ? 'Need your attention' : 'Positive conversations'}
                </p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0E1D2A] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h3 className="text-sm font-bold text-[#0A2836] dark:text-white">Lead directory</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{leads.length} assigned</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Search leads</span>
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search company, contact or location"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFB] pl-10 pr-3 text-sm text-[#0A2836] outline-none placeholder:text-slate-400 focus:border-[#059669] focus:ring-2 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#0A1724] dark:text-slate-100 dark:focus:ring-emerald-900/40" />
              </label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} aria-label="Filter by industry"
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFB] px-3 text-sm font-medium text-[#0A2836] outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#0A1724] dark:text-slate-100 dark:focus:ring-emerald-900/40 sm:w-56">
                <option value="all">All industries</option>
                {industries.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
          {data?.has_more && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Showing the first 1,000 leads. Pagination will be needed before this agent exceeds 1,000.
            </p>
          )}
          <div className="flex items-center justify-between gap-3 px-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{filtered.length} lead{filtered.length === 1 ? '' : 's'} shown{queue !== 'all' ? ' · Filtered queue' : ''}</span>
            {(queue !== 'all' || industry !== 'all' || query) && (
              <button type="button" onClick={() => { setQueue('all'); setIndustry('all'); setQuery(''); }}
                className="font-semibold text-[#059669] hover:underline dark:text-[#34D399]">Clear filters</button>
            )}
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm dark:border-white/15 dark:bg-[#0E1D2A] sm:py-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/60 dark:border-emerald-800/30 dark:bg-emerald-900/20">
                {leads.length === 0 ? (
                  <>
                    <span className="dark:hidden"><BrandSymbol size={40} /></span>
                    <span className="hidden dark:block"><BrandSymbol size={40} onDark /></span>
                  </>
                ) : <Search className="h-7 w-7 text-[#059669] dark:text-emerald-300" />}
              </div>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#059669] dark:text-[#34D399]">
                {leads.length === 0 ? 'Ready for your first leads' : 'No matching results'}
              </p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-[#0A2836] dark:text-white">
                {leads.length === 0 ? 'No leads assigned yet' : 'No leads match these filters'}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
                {leads.length === 0
                  ? 'Once prospects are assigned to your account, they will appear here with their contact details and next actions.'
                  : 'Try another industry, search term or queue to find the prospect you need.'}
              </p>
              {leads.length === 0 && (
                <button type="button" onClick={() => void refresh(true)} disabled={refreshing}
                  className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <RefreshCw className={'h-3.5 w-3.5 ' + (refreshing ? 'animate-spin' : '')} /> Refresh leads
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={setSelected} />)}
            </div>
          )}
          <p className="pb-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Your workspace is private. Only leads assigned to your account appear here.
          </p>
        </div>
      )}
      {selected && <LeadDialog key={selected.id} lead={selected}
        onClose={() => setSelected(null)} onSaved={() => refresh(true)} />}
    </main>
  );
}
