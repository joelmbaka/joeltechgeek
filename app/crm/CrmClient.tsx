'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BriefcaseBusiness, CalendarDays, Check, ChevronRight,
  ExternalLink, LogOut, Phone, Plus, RefreshCw, Search, X,
} from 'lucide-react';
import { signIn as authSignIn, signOut as authSignOut } from 'next-auth/react';
import { CHANNEL_OUTCOMES, CALL_OUTCOME_LABELS, callOutcomeLabel, stageForOutcome } from '@/lib/agent-crm/types';
import type { CrmUser, ActivityChannel, ActivityOutcome, Lead, LeadContact, LeadStage, LeadStats, LeadUpdate } from '@/lib/agent-crm/types';
import { BrandLogo, BrandSymbol } from '@/components/BrandLogo';
import { CRM_INDUSTRIES } from '@/lib/agent-crm/industries';
import { AddLeadModal } from './AddLeadModal';
import { LeadContactsPanel } from './LeadContactsPanel';

type View = 'loading' | 'signed-out' | 'ready' | 'denied' | 'error';
type Queue = 'all' | 'to_call' | 'due' | 'interested';
type LeadSort = 'recommended' | 'follow_up' | 'priority' | 'company' | 'industry' | 'recent';
type Response = {
  ok: boolean;
  user: CrmUser;
  leads: Lead[];
  stats: LeadStats;
  has_more: boolean;
  filtered_total: number;
  industries: string[];
  industry_counts: Record<string, number>;
};
type FormValues = {
  channel: ActivityChannel;
  outcome: string;
  notes: string;
  next_action: string;
  next_action_at: string;
  next_action_time: string;
  stage: string;
  do_not_contact: boolean;
};

const stages: LeadStage[] = [
  'new', 'contacted', 'interested', 'meeting', 'proposal', 'negotiation',
  'won', 'lost', 'nurture',
];
const emptyStats: LeadStats = {
  total: 0, to_call: 0, followups_due: 0, interested: 0, meetings: 0, won: 0,
};
const PAGE_SIZE = 50;
function leadPageUrl(filters: { queue: Queue; industry: string; sortBy: LeadSort; query: string }, offset = 0) {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
    queue: filters.queue,
    industry: filters.industry,
    sort: filters.sortBy === 'follow_up' ? 'followup' : filters.sortBy,
    q: filters.query,
  });
  return '/api/agent-crm/leads?' + params.toString();
}
const label = (str: string) => str.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
function todayInZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (kind: string) => parts.find((value) => value.type === kind)?.value || '';
  return part('year') + '-' + part('month') + '-' + part('day');
}
function today() { return todayInZone('Africa/Nairobi'); }
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
    timeZone: browserTimezone(), day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}
function isDue(lead: Lead) {
  if (lead.do_not_contact || ['won', 'lost', 'competitor'].includes(lead.stage) || !lead.next_action_at)
    return false;
  if (lead.next_action_due_at) return Date.parse(lead.next_action_due_at) <= Date.now();
  const zone = lead.next_action_timezone || 'Etc/UTC';
  try {
    return lead.next_action_at <= todayInZone(zone);
  } catch { return lead.next_action_at <= today(); }
}
function followupLabel(date: string | null | undefined, time?: string | null, zone?: string | null) {
  if (!date) return 'No date scheduled';
  if (!time) return dateLabel(date) + ' · Time not set';
  const parts = time.slice(0, 5).split(':').map(Number);
  const clock = new Date(2026, 0, 1, parts[0], parts[1]).toLocaleTimeString('en-KE', {
    hour: 'numeric', minute: '2-digit',
  });
  return dateLabel(date) + ' at ' + clock + (zone ? ' (' + zone + ')' : '');
}
function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
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
  const cls = lead.stage === 'competitor'
    ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200'
    : lead.do_not_contact || ['lost','do_not_contact'].includes(lead.stage)
    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
    : lead.stage === 'won' || isInterested(lead)
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
      : isDue(lead)
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  return (
    <span className={'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ' + cls}>
      {lead.stage === 'competitor' ? 'Competitor' : lead.do_not_contact ? 'Do not contact' : label(lead.stage)}
    </span>
  );
}
function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (lead: Lead) => void }) {
  const site = webUrl(lead.website);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-white/10 dark:bg-[#0E1D2A] dark:hover:border-emerald-700 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-slate-950 dark:text-white">
            {lead.company_name || lead.contact_name || 'Unnamed lead'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {[lead.industry, lead.city, lead.country !== 'Kenya' ? lead.country : null]
              .filter(Boolean).join(' · ') || 'No category'}
          </p>
        </div>
        <StageBadge lead={lead} />
      </div>
      {lead.contact_name && (lead.company_name || lead.contact_role) && (
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          {lead.company_name && <strong>{lead.contact_name}</strong>}
          {lead.contact_role ? (lead.company_name ? ' · ' : '') + lead.contact_role : ''}
        </p>
      )}
      {lead.problem_summary && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{lead.problem_summary}</p>
      )}
      {lead.last_notes && <p className="mt-2 line-clamp-2 text-xs text-slate-500">Latest note: {lead.last_notes}</p>}
      {lead.last_outcome && (
        <p className="mt-3 text-xs text-slate-500">Last {lead.last_activity_channel || (lead.last_outcome === 'email_sent' ? 'email' : 'call')} outcome: <strong className="text-slate-700 dark:text-slate-200">{callOutcomeLabel(lead.last_outcome)}</strong></p>
      )}
      {lead.next_action && <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">Next: {lead.next_action}</p>}
      {lead.next_action_at && (
        <p className={'mt-2 flex items-center gap-1 text-xs font-medium ' +
          (isDue(lead) ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500')}>
          <CalendarDays className="h-3.5 w-3.5" />
          {isDue(lead) ? 'Due: ' : 'Follow-up: '}{followupLabel(lead.next_action_at, lead.next_action_time, lead.next_action_timezone)}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {lead.phone && !lead.do_not_contact && lead.stage !== 'competitor' && (
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
          {lead.do_not_contact || lead.stage === 'competitor' ? 'View' : 'Update'} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
function LeadDialog({ lead, onClose, onSaved }: {
  lead: Lead; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<FormValues>({
    channel: 'call', outcome: '', notes: '', next_action: lead.next_action || '',
    next_action_at: lead.next_action_at || '',
    next_action_time: lead.next_action_time?.slice(0, 5) || '',
    stage: '', do_not_contact: false,
  });
  const [history, setHistory] = useState<LeadUpdate[]>([]);
  const [contacts, setContacts] = useState<LeadContact[] | null>(null);
  const [companyName, setCompanyName] = useState(lead.company_name);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [identityError, setIdentityError] = useState('');
  // null = automatic primary/default; '' = explicit company-level activity.
  const [callContactChoice, setCallContactChoice] = useState<string | null>(null);
  const [followupContactChoice, setFollowupContactChoice] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingClassification, setSavingClassification] = useState(false);
  const [classificationError, setClassificationError] = useState('');
  const [error, setError] = useState('');
  const [planFromCall, setPlanFromCall] = useState(false);

  const [editingFollowup, setEditingFollowup] = useState(false);
  const [followupAction, setFollowupAction] = useState(lead.next_action || '');
  const [followupDate, setFollowupDate] = useState(lead.next_action_at || '');
  const [followupTime, setFollowupTime] = useState(lead.next_action_time?.slice(0, 5) || '');
  const [savingFollowup, setSavingFollowup] = useState(false);
  const [followupError, setFollowupError] = useState('');

  const [showComplete, setShowComplete] = useState(false);
  const [completedNotes, setCompletedNotes] = useState('');
  const [completedNextAction, setCompletedNextAction] = useState('');
  const [completedNextDate, setCompletedNextDate] = useState('');
  const [completedNextTime, setCompletedNextTime] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  useEffect(() => {
    let active = true;
    api<{ok:boolean; lead:Lead; history:LeadUpdate[]; contacts: LeadContact[]}>('/api/agent-crm/leads/' + lead.id)
      .then((x) => { if (active) { setHistory(x.history); setContacts(x.contacts); } })
      .catch(() => { if (active) setHistory([]); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [lead.id]);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !(saving || savingFollowup || completing || savingClassification || savingIdentity)) onClose();
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [onClose, saving, savingFollowup, completing, savingClassification, savingIdentity]);


  async function updateClassification(status: 'competitor' | 'new') {
    if (savingClassification) return;
    setSavingClassification(true);
    setClassificationError('');
    try {
      await api('/api/agent-crm/leads/' + lead.id + '/classification', 'PATCH', { status });
      await onSaved();
      onClose();
    } catch (err) { setClassificationError(errText(err)); }
    finally { setSavingClassification(false); }
  }

  const primaryContactId = contacts?.find((c) => c.is_primary)?.id || contacts?.[0]?.id || '';
  const selectedContactId = (choice: string | null, existing: string) => {
    if (!contacts?.length) return '';
    if (contacts.length === 1) return contacts[0].id;
    return choice !== null && (choice === '' || contacts.some((c) => c.id === choice))
      ? choice : (existing === '' || contacts.some((c) => c.id === existing))
        ? existing : primaryContactId;
  };
  const callContactId = selectedContactId(callContactChoice, primaryContactId);
  const followupDefault = lead.next_action ? lead.next_action_contact_id || primaryContactId : primaryContactId;
  const followupContactId = selectedContactId(followupContactChoice, followupDefault);
  const contactOptions = contacts?.map((c) => ({
    value: c.id,
    label: (c.name || c.phone || c.email || c.role || 'Contact') +
      (c.role && c.name ? ' — ' + c.role : '') +
      (c.is_primary ? ' (Primary)' : ''),
  })) || [];
  const contactPicker = (value: string, onChange: (next: string) => void, title: string) => (
    contacts !== null && contacts.length > 1 ? (
      <label className="block text-sm font-semibold">
        {title}
        <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Company / unspecified contact</option>
          {contactOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>
    ) : null
  );

  async function saveIdentity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingIdentity || !(companyName.trim() || primaryContact?.name?.trim() || (contacts === null && lead.contact_name?.trim()))) return;
    setSavingIdentity(true);
    setIdentityError('');
    try {
      const updated = await api<{ ok: boolean; lead: Lead }>(
        '/api/agent-crm/leads/' + lead.id + '/identity', 'PATCH',
        { company_name: companyName },
      );
      setCompanyName(updated.lead.company_name);
      setEditingIdentity(false);
      await onSaved();
    } catch (err) {
      setIdentityError(errText(err));
    } finally { setSavingIdentity(false); }
  }

  async function submitCall(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.outcome || saving) return;
    const proposedStage = form.stage || stageForOutcome(lead.stage, form.outcome as ActivityOutcome);
    if (!form.do_not_contact && proposedStage !== lead.stage &&
        ['won','lost'].includes(proposedStage) &&
        !window.confirm('This will mark the entire lead ' + label(proposedStage) + '. Continue?')) return;
    if (planFromCall && form.next_action_time && !form.next_action_at) {
      setError('Choose a date before selecting a time.'); return;
    }
    if (planFromCall && form.next_action_at && !form.next_action.trim() && !form.do_not_contact) {
      setError('Enter a next action for this date.'); return;
    }
    setSaving(true); setError('');
    try {
      await api('/api/agent-crm/leads/' + lead.id, 'PATCH', {
        outcome: form.outcome,
        channel: form.channel,
        notes: form.notes,
        contact_id: callContactId || null,
        // If planning from this call, target the person just spoken to.
        // Otherwise preserve the existing follow-up contact on the server.
        ...(planFromCall ? { next_action_contact_id: form.do_not_contact ? null : callContactId || null } : {}),
        next_action: form.do_not_contact ? '' : planFromCall ? form.next_action : lead.next_action || '',
        next_action_at: form.do_not_contact ? null
          : planFromCall ? form.next_action_at || null : lead.next_action_at || null,
        next_action_time: form.do_not_contact ? null
          : planFromCall ? form.next_action_time || null : lead.next_action_time?.slice(0, 5) || null,
        next_action_timezone: form.do_not_contact ? null
          : planFromCall && form.next_action_at ? browserTimezone()
            : lead.next_action_at ? lead.next_action_timezone || browserTimezone() : null,
        ...(form.stage ? { stage: form.stage } : {}),
        do_not_contact: form.do_not_contact,
      });
      await onSaved();
      onClose();
    } catch (err) { setError(errText(err)); }
    finally { setSaving(false); }
  }

  async function saveFollowup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingFollowup) return;
    if (followupDate && !followupAction.trim()) {
      setFollowupError('Enter an action to schedule this follow-up.'); return;
    }
    if (followupTime && !followupDate) {
      setFollowupError('Choose a follow-up date before entering a time.'); return;
    }
    setSavingFollowup(true); setFollowupError('');
    try {
      await api('/api/agent-crm/leads/' + lead.id + '/followup', 'PATCH', {
        next_action: followupAction,
        next_action_at: followupDate || null,
        next_action_time: followupTime || null,
        next_action_timezone: followupDate ? browserTimezone() : null,
        contact_id: followupContactId || null,
      });
      await onSaved();
      onClose();
    } catch (err) { setFollowupError(errText(err)); }
    finally { setSavingFollowup(false); }
  }

  async function completeAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead.next_action || completing) return;
    if (completedNextDate && !completedNextAction.trim()) {
      setCompleteError('Enter the next action for that follow-up date.'); return;
    }
    if (completedNextTime && !completedNextDate) {
      setCompleteError('Choose a date before selecting a time.'); return;
    }
    setCompleting(true); setCompleteError('');
    try {
      await api('/api/agent-crm/leads/' + lead.id + '/actions', 'POST', {
        notes: completedNotes,
        next_action: completedNextAction,
        next_action_at: completedNextDate || null,
        next_action_time: completedNextTime || null,
        next_action_timezone: completedNextDate ? browserTimezone() : null,
        next_action_contact_id: completedNextAction.trim() ? followupContactId || null : null,
      });
      await onSaved();
      onClose();
    } catch (err) { setCompleteError(errText(err)); }
    finally { setCompleting(false); }
  }

  const input = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const lastCompleted = history.find((item) => item.event_type === 'action_completed');
  const primaryContact = contacts?.find((contact) => contact.is_primary);
  const primaryDisplay = contacts === null ? lead.contact_name : primaryContact?.name;
  const primaryPhone = contacts === null ? lead.phone : primaryContact?.phone;
  async function refreshContacts() {
    const data = await api<{ ok: boolean; contacts: LeadContact[] }>('/api/agent-crm/leads/' + lead.id);
    setContacts(data.contacts);
    await onSaved();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 sm:items-center sm:p-5"
      role="presentation" onMouseDown={(e) => {
        if (e.target === e.currentTarget && !(saving || savingFollowup || completing || savingClassification)) onClose();
      }}>
      <section role="dialog" aria-modal="true" aria-labelledby="lead-title"
        className="max-h-[96dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:max-h-[90dvh] sm:rounded-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{lead.industry || "No category"}</p>
            <h2 id="lead-title" className="mt-1 text-xl font-bold">
              {companyName || primaryContact?.name || lead.contact_name || 'Unnamed lead'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{primaryDisplay || 'Contact not identified'}
              {primaryPhone ? ' · ' + primaryPhone : ''}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close lead"
            className="rounded-xl border border-slate-200 p-2 dark:border-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-3">
          <button type="button" disabled={savingIdentity} onClick={() => {
            setEditingIdentity((current) => !current);
            setIdentityError('');
          }} className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
            {editingIdentity ? 'Cancel editing lead' : 'Edit lead details'}
          </button>
          {editingIdentity && (
            <form onSubmit={(event) => void saveIdentity(event)}
              className="mt-3 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
              <p className="text-xs text-slate-500">Company or contact name required.</p>
              <label className="block text-xs font-semibold">
                Company name
                <input autoFocus className={input} maxLength={180}
                  value={companyName} onChange={(event) => setCompanyName(event.target.value)}/>
              </label>
              <p className="text-xs text-slate-500">Edit the primary contact name in Contacts below.</p>
              {identityError && <p role="alert" className="text-xs text-rose-700">{identityError}</p>}
              <button type="submit" disabled={savingIdentity ||
                !(companyName.trim() || primaryContact?.name?.trim() || (contacts === null && lead.contact_name?.trim()))}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:col-span-2">
                {savingIdentity ? 'Saving…' : 'Save lead details'}
              </button>
            </form>
          )}
        </div>
        {contacts !== null && <LeadContactsPanel leadId={lead.id} contacts={contacts}
          locked={lead.do_not_contact || lead.stage === 'competitor'} onUpdated={refreshContacts}/>}
        {lead.problem_summary && (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300">{lead.problem_summary}</p>
        )}
        {lead.qualification_reason && (
          <p className="mt-2 text-xs text-slate-500">Why qualified: {lead.qualification_reason}</p>
        )}
        {!historyLoading && lastCompleted && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/40">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Completed: {lastCompleted.action || 'Follow-up action'}
              </p>
              <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                {timeLabel(lastCompleted.created_at)}
                {lastCompleted.notes ? ' · ' + lastCompleted.notes : ''}
              </p>
            </div>
          </div>
        )}

        {classificationError && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{classificationError}</p>}
        {lead.stage === 'competitor' ? (
          <section className="mt-5 rounded-xl border border-violet-200 bg-violet-50/60 p-4 text-sm dark:border-violet-800 dark:bg-violet-950/20">
            <p className="font-semibold">Competitor — research record</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Excluded from calls, outreach queues and follow-up reminders. The company remains searchable under its business category.
            </p>
            <button type="button" disabled={savingClassification}
              onClick={() => {
                if (window.confirm('Return this competitor to the new-lead queue?'))
                  void updateClassification('new');
              }}
              className="mt-3 min-h-10 rounded-xl border border-violet-300 bg-white px-4 text-xs font-semibold text-violet-800 disabled:opacity-60 dark:border-violet-700 dark:bg-violet-900/40 dark:text-violet-100">
              {savingClassification ? 'Saving…' : 'Reopen as prospect'}
            </button>
          </section>
        ) : null}
        {lead.do_not_contact || lead.stage === 'competitor' ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {lead.stage === 'competitor'
              ? 'Competitive intelligence only. Outreach and reminders are paused.'
              : 'Do Not Contact: this lead is now read-only.'}
          </p>
        ) : (
          <>
            {/* Scheduling is not another phone call. */}
            <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-800/50 dark:bg-sky-950/20">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">
                    Follow-up schedule
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {lead.next_action || 'No action scheduled'}
                  </h3>
                  {lead.next_action && contacts && contacts.length > 1 && (
                    <p className="mt-1 text-xs text-sky-800 dark:text-sky-200">
                      Contact: {contacts.find((c) => c.id === lead.next_action_contact_id)?.name ||
                        (lead.next_action_contact_id ? 'Former contact' : 'Company / unspecified')}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-sky-900 dark:text-sky-200">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    Reminder due: {followupLabel(lead.next_action_at, lead.next_action_time, lead.next_action_timezone)}
                  </p>
                </div>
                <button type="button" onClick={() => {
                    setEditingFollowup((value) => !value);
                    setShowComplete(false);
                    setFollowupError('');
                  }} aria-expanded={editingFollowup}
                  className="min-h-10 rounded-xl border border-sky-300 bg-white px-3 text-xs font-semibold text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200">
                  {editingFollowup ? 'Cancel edit' : 'Edit follow-up'}
                </button>
              </div>
              {editingFollowup && (
                <form onSubmit={saveFollowup} className="mt-4 space-y-3 border-t border-sky-200 pt-4 dark:border-sky-800">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Update the follow-up without logging a call or marking the action completed.
                  </p>
                  {contactPicker(followupContactId, setFollowupContactChoice, 'Contact (optional)')}
                  <label className="block text-sm font-semibold">
                    Next action
                    <input required={Boolean(followupDate)} className={input} maxLength={300}
                      value={followupAction} onChange={(e) => setFollowupAction(e.target.value)}
                      placeholder="Call to discuss the demo" />
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">
                      Follow-up date
                      <input type="date" className={input} value={followupDate}
                        onChange={(e) => { setFollowupDate(e.target.value); if (!e.target.value) setFollowupTime(''); }} />
                    </label>
                    <label className="block text-sm font-semibold">
                      Time (optional)
                      <input type="time" className={input} disabled={!followupDate}
                        value={followupTime} onChange={(e) => setFollowupTime(e.target.value)} />
                    </label>
                  </div>
                  {followupError && <p role="alert" className="text-sm text-rose-700">{followupError}</p>}
                  <button type="submit" disabled={savingFollowup || Boolean(followupDate && !followupAction.trim())}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-800 px-4 font-semibold text-white hover:bg-sky-900 disabled:opacity-50">
                    <Check className="h-4 w-4" /> {savingFollowup ? 'Saving...' : 'Save follow-up'}
                  </button>
                </form>
              )}
              {lead.next_action && !editingFollowup && (
                <div className="mt-4 border-t border-sky-200 pt-3 dark:border-sky-800">
                  <button type="button" aria-expanded={showComplete}
                    onClick={() => { setShowComplete((value) => !value); setCompleteError(''); }}
                    className="text-xs font-semibold text-sky-800 underline-offset-4 hover:underline dark:text-sky-200">
                    {showComplete ? 'Hide completion form' : 'Mark this action completed'}
                  </button>
                  {showComplete && (
                    <form onSubmit={completeAction} className="mt-3 space-y-3 rounded-xl border border-sky-200 bg-white/90 p-3 dark:border-sky-800 dark:bg-slate-900">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Record what you finished. This does not create a new call outcome.
                      </p>
                      <label className="block text-sm font-semibold">
                        Completion notes
                        <textarea rows={2} maxLength={2500} className={input}
                          placeholder="What did you finish?"
                          value={completedNotes} onChange={(e) => setCompletedNotes(e.target.value)} />
                      </label>
                      <label className="block text-sm font-semibold">
                        Next action (optional)
                        <input className={input} maxLength={300}
                          value={completedNextAction} onChange={(e) => setCompletedNextAction(e.target.value)}
                          placeholder="Call to get feedback" />
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block text-sm font-semibold">
                          Next follow-up date
                          <input type="date" className={input} value={completedNextDate}
                            onChange={(e) => {
                              setCompletedNextDate(e.target.value);
                              if (!e.target.value) setCompletedNextTime('');
                            }} />
                        </label>
                        <label className="block text-sm font-semibold">
                          Time (optional)
                          <input type="time" className={input} disabled={!completedNextDate}
                            value={completedNextTime} onChange={(e) => setCompletedNextTime(e.target.value)} />
                        </label>
                      </div>
                      {completeError && <p role="alert" className="text-sm text-rose-700">{completeError}</p>}
                      <button type="submit" disabled={completing || Boolean(completedNextDate && !completedNextAction.trim())}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">
                        <Check className="h-4 w-4" />
                        {completing ? 'Saving...' : 'Confirm action completed'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </section>

            {/* Logging outreach is independent from editing/completing reminders. */}
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/30">
              <h3 className="text-base font-bold">Record activity</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Record a call or message independently from existing follow-ups.
              </p>
              <form onSubmit={submitCall} className="mt-4 space-y-4">
                <label className="block text-sm font-semibold">
                  Activity type
                  <select className={input} value={form.channel} disabled={saving}
                    onChange={(event) => setForm((previous) => ({
                      ...previous, channel: event.target.value as ActivityChannel, outcome: '', stage: '',
                    }))}>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                {contactPicker(callContactId, setCallContactChoice, 'Contact')}
                <label className="block text-sm font-semibold">
                  Result <span className="text-rose-600">*</span>
                  <select required className={input} value={form.outcome} disabled={savingClassification}
                    onChange={(e) => {
                      if (e.target.value === 'mark_competitor') {
                        // Administrative classification, never a call outcome sent to the API.
                        e.currentTarget.value = form.outcome;
                        if (window.confirm('Mark this business as a competitor? It stays searchable, but outreach and reminders stop. No call will be logged.'))
                          void updateClassification('competitor');
                        return;
                      }
                      setForm((x) => ({...x, outcome: e.target.value}));
                    }}>
                    <option value="">Choose outcome</option>
                    {CHANNEL_OUTCOMES[form.channel].map((value) => (
                      <option key={value} value={value}>{CALL_OUTCOME_LABELS[value]}</option>
                    ))}
                    {form.channel === 'call' && <option value="mark_competitor">Mark as competitor</option>}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Notes
                  <textarea className={input + ' min-h-24 resize-y'} rows={3}
                    maxLength={2500} placeholder="What did the prospect say?"
                    value={form.notes}
                    onChange={(e) => setForm((x) => ({...x, notes: e.target.value}))} />
                </label>
                <button type="button" aria-expanded={planFromCall}
                  onClick={() => setPlanFromCall((value) => !value)}
                  className="text-xs font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300">
                  {planFromCall ? 'Hide follow-up planning' : 'Plan a follow-up (optional)'}
                </button>
                {planFromCall && (
                  <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                    <label className="block text-sm font-semibold">
                      Next action
                      <input className={input} maxLength={300} disabled={form.do_not_contact}
                        value={form.next_action}
                        onChange={(e) => setForm((x) => ({...x, next_action: e.target.value}))} />
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="block text-sm font-semibold">
                        Follow-up date
                        <input type="date" className={input} disabled={form.do_not_contact}
                          value={form.next_action_at}
                          onChange={(e) => setForm((x) => ({
                            ...x, next_action_at: e.target.value,
                            next_action_time: e.target.value ? x.next_action_time : '',
                          }))} />
                      </label>
                      <label className="block text-sm font-semibold">
                        Time (optional)
                        <input type="time" className={input}
                          disabled={form.do_not_contact || !form.next_action_at}
                          value={form.next_action_time}
                          onChange={(e) => setForm((x) => ({...x, next_action_time: e.target.value}))} />
                      </label>
                    </div>
                  </div>
                )}
                <label className="block text-sm font-semibold">
                  Lead stage <span className="font-normal text-slate-500">(optional)</span>
                  <select className={input} disabled={form.do_not_contact} value={form.stage}
                    onChange={(e) => setForm((x) => ({...x, stage: e.target.value}))}>
                    <option value="">Suggested: {form.outcome
                      ? label(stageForOutcome(lead.stage, form.outcome as ActivityOutcome))
                      : label(lead.stage)}</option>
                    {stages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
                  </select>
                </label>
                {form.outcome && ['not_interested','onboarding_completed','trial_started'].includes(form.outcome) && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {form.outcome === 'not_interested'
                      ? 'Not interested normally closes the entire lead as Lost. Choose the current stage above if only one contact declined.'
                      : form.outcome === 'trial_started'
                        ? 'Trial started is recorded as an outcome; the stage is Interested unless further along.'
                        : 'Onboarding completed marks the lead Won when the customer is committed and set up.'}
                  </p>
                )}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-rose-700"
                    checked={form.do_not_contact}
                    onChange={(e) => setForm((x) => ({...x, do_not_contact: e.target.checked}))} />
                  <span><strong>Do not contact again</strong>
                    <span className="block text-xs text-slate-500">
                      Only use for opt-outs. Future outreach will be blocked.
                    </span>
                  </span>
                </label>
                {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
                <button type="submit" disabled={!form.outcome || saving}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                  <Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save activity'}
                </button>
              </form>
            </section>
          </>
        )}

        <section className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-800">
          <h3 className="text-sm font-semibold">Activity history</h3>
          {historyLoading ? (
            <p className="mt-2 text-sm text-slate-500">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No previous updates.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {history.map((h) => (
                <div key={h.id} className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <strong>
                      {h.event_type === 'action_completed'
                        ? 'Completed: ' + (h.action || 'Task')
                        : h.event_type === 'followup_updated'
                          ? 'Follow-up changed'
                          : h.outcome ? (h.channel ? label(h.channel) + ' · ' : '') + callOutcomeLabel(h.outcome) : 'Outreach'}
                    </strong>
                    <span className="text-slate-500">Recorded: {timeLabel(h.created_at)}</span>
                  </div>
                  {h.contact_name_snapshot && <p className="mt-1 text-xs text-slate-500">Contact: {h.contact_name_snapshot}</p>}
                  {h.notes && <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{h.notes}</p>}
                  {h.next_action && (
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                      Next action: {h.next_action}
                    </p>
                  )}
                  {h.next_action_at && (
                    <p className="mt-1 text-sky-800 dark:text-sky-300">
                      Reminder due: {followupLabel(h.next_action_at, h.next_action_time, h.next_action_timezone)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
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
  const [adding, setAdding] = useState(false);
  const [queue, setQueue] = useState<Queue>('all');
  const [industry, setIndustry] = useState('all');
  const [sortBy, setSortBy] = useState<LeadSort>('recommended');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const requestSeq = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const refresh = useCallback((quiet = false) => {
    if (quiet) setRefreshing(true);
    else setView('loading');
    setReloadKey((value) => value + 1);
  }, []);

  // All filtering and sorting happens in PostgreSQL, not just within the first page.
  useEffect(() => {
    const requestId = ++requestSeq.current;
    setRefreshing(true);
    setLoadingMore(false);
    const url = leadPageUrl({ queue, industry, sortBy, query: debouncedQuery });
    void api<Response>(url).then((response) => {
      if (requestId !== requestSeq.current) return;
      setData(response);
      setView('ready');
      setError('');
    }).catch((err) => {
      if (requestId !== requestSeq.current) return;
      const status = (err as Error & {status?: number}).status;
      setData(null);
      if (status === 403) setView('denied');
      else if (status === 401) {
        const accessDenied = new URLSearchParams(window.location.search).get('error') === 'AccessDenied';
        setView(accessDenied ? 'denied' : 'signed-out');
        setError(accessDenied ? 'Unable to access your personal CRM. Please sign in again.' : '');
      } else {
        setError(errText(err));
        setView('error');
      }
    }).finally(() => {
      if (requestId === requestSeq.current) setRefreshing(false);
    });
    return () => {
      if (requestId === requestSeq.current) requestSeq.current++;
    };
  }, [queue, industry, sortBy, debouncedQuery, reloadKey]);

  async function loadMore() {
    if (!data?.has_more || refreshing || loadingMore || query.trim() !== debouncedQuery) return;
    const requestId = requestSeq.current;
    const url = leadPageUrl({ queue, industry, sortBy, query: debouncedQuery }, data.leads.length);
    setLoadingMore(true);
    try {
      const next = await api<Response>(url);
      if (requestId !== requestSeq.current) return;
      setData((current) => current ? { ...next, leads: [...current.leads, ...next.leads] } : next);
      setError('');
    } catch (err) {
      if (requestId === requestSeq.current) setError(errText(err));
    } finally {
      if (requestId === requestSeq.current) setLoadingMore(false);
    }
  }

  async function signIn() {
    setGoogleLoading(true); setError('');
    try {
      await authSignIn('google', { redirectTo: '/crm' }, { prompt: 'select_account' });
    } catch (err) {
      setError(errText(err)); setGoogleLoading(false);
    }
  }

  async function signOut() {
    requestSeq.current++;
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
  // Category names and counts include all assigned leads, not just the current page.
  const industries = useMemo(
    () => Array.from(new Set([...CRM_INDUSTRIES, ...(data?.industries || [])])).filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
    [data?.industries],
  );
  const industryCounts = useMemo(
    () => new Map<string, number>(Object.entries(data?.industry_counts || {})),
    [data?.industry_counts],
  );
  const filtered = leads;
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
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Personal CRM</p>
            </div>
          </div>
          {view === 'ready' && (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-700/50">
                  {(data?.user.name || 'A').trim().slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-32 truncate text-xs font-semibold text-[#0A2836] dark:text-slate-200">{data?.user.name}</span>
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
                  ? 'Sign in with Google to access your personal CRM.'
                  : view === 'error' ? 'We could not load your leads. Check the connection and try again.'
                    : 'Continue with Google to create an account or open your CRM.'}
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
                New to JoelTechGeek CRM? Your account will be created automatically.
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
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {data?.user.name || 'My'}&apos;s CRM
              </span>
              <button type="button" onClick={() => setAdding(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#059669] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#047857] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                <Plus className="h-4 w-4" /> Add lead
              </button>
            </div>
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
              <span className="text-xs text-slate-500 dark:text-slate-400">{stats.total} assigned</span>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search leads</span>
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search company, contact or location"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFB] pl-10 pr-3 text-sm text-[#0A2836] outline-none placeholder:text-slate-400 focus:border-[#059669] focus:ring-2 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#0A1724] dark:text-slate-100 dark:focus:ring-emerald-900/40" />
              </label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} aria-label="Filter by business category"
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFB] px-3 text-sm font-medium text-[#0A2836] outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#0A1724] dark:text-slate-100 dark:focus:ring-emerald-900/40 lg:w-52">
                <option value="all">All categories</option>
                <option value="__uncategorized__">No category</option>
                {industries.map((name) => (
                  <option key={name} value={name}>{name} ({industryCounts.get(name) ?? 0})</option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as LeadSort)} aria-label="Sort leads"
                className="h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFB] px-3 text-sm font-medium text-[#0A2836] outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#0A1724] dark:text-slate-100 dark:focus:ring-emerald-900/40 lg:w-52">
                <option value="recommended">Sort: Recommended</option>
                <option value="follow_up">Follow-up: Earliest first</option>
                <option value="priority">Priority: Highest first</option>
                <option value="recent">Recently updated</option>
                <option value="industry">Category: A–Z</option>
                <option value="company">Company: A–Z</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 px-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{filtered.length} of {data?.filtered_total ?? 0} lead{data?.filtered_total === 1 ? '' : 's'} shown{refreshing || query.trim() !== debouncedQuery ? ' · Updating…' : ''}</span>
            {(queue !== 'all' || industry !== 'all' || query || sortBy !== 'recommended') && (
              <button type="button" onClick={() => { setQueue('all'); setIndustry('all'); setQuery(''); setSortBy('recommended'); }}
                className="font-semibold text-[#059669] hover:underline dark:text-[#34D399]">Clear filters</button>
            )}
          </div>
          {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200" role="alert">{error}</p>}
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm dark:border-white/15 dark:bg-[#0E1D2A] sm:py-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/60 dark:border-emerald-800/30 dark:bg-emerald-900/20">
                {stats.total === 0 ? (
                  <>
                    <span className="dark:hidden"><BrandSymbol size={40} /></span>
                    <span className="hidden dark:block"><BrandSymbol size={40} onDark /></span>
                  </>
                ) : <Search className="h-7 w-7 text-[#059669] dark:text-emerald-300" />}
              </div>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#059669] dark:text-[#34D399]">
                {stats.total === 0 ? 'Ready for your first leads' : 'No matching results'}
              </p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-[#0A2836] dark:text-white">
                {stats.total === 0 ? 'No leads assigned yet' : 'No leads match these filters'}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
                {stats.total === 0
                  ? 'Once prospects are assigned to your account, they will appear here with their contact details and next actions.'
                  : 'Try another category, search term or queue to find the prospect you need.'}
              </p>
              {stats.total === 0 && (
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
          {data?.has_more && (
            <div className="flex justify-center">
              <button type="button" onClick={() => void loadMore()}
                disabled={loadingMore || refreshing || query.trim() !== debouncedQuery}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-800 dark:bg-[#0E1D2A] dark:text-emerald-300">
                {loadingMore && <RefreshCw className="h-4 w-4 animate-spin" />}
                {loadingMore ? 'Loading more…' : 'Load more (' + Math.max(0, data.filtered_total - leads.length) + ' remaining)'}
              </button>
            </div>
          )}
          <p className="pb-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Your workspace is private. Only leads assigned to your account appear here.
          </p>
        </div>
      )}
      {selected && <LeadDialog key={selected.id} lead={selected}
        onClose={() => setSelected(null)} onSaved={() => refresh(true)} />}
      {adding && (
        <AddLeadModal
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            setQueue('all');
            setIndustry('all');
            setQuery('');
            void refresh(true);
          }}
        />
      )}
    </main>
  );
}
