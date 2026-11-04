'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { CRM_INDUSTRIES } from '@/lib/agent-crm/industries';
import { CHANNEL_OUTCOMES, CALL_OUTCOME_LABELS, LEAD_STAGES } from '@/lib/agent-crm/types';
import type { ActivityChannel } from '@/lib/agent-crm/types';

type FormState = {
  company_name: string;
  industry: string;
  country: string;
  city: string;
  contact_name: string;
  contact_role: string;
  phone: string;
  email: string;
  website: string;
  existing_system: string;
  problem_summary: string;
  qualification_reason: string;
  source_url: string;
  priority: 'high' | 'normal' | 'low';
  stage: string;
  outcome: string;
  channel: ActivityChannel;
  notes: string;
  next_action: string;
  next_action_at: string;
  next_action_time: string;
};

const defaults: FormState = {
  company_name: '', industry: '', country: 'Kenya', city: '',
  contact_name: '', contact_role: '', phone: '', email: '', website: '',
  existing_system: '', problem_summary: '', qualification_reason: '',
  source_url: '', priority: 'normal', stage: 'new', outcome: '', channel: 'call',
  notes: '', next_action: '', next_action_at: '', next_action_time: '',
};

const title = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase());
const fieldClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-[#0A2836] outline-none transition focus:border-[#059669] focus:ring-2 focus:ring-emerald-100 dark:border-white/15 dark:bg-[#0A1724] dark:text-white dark:focus:ring-emerald-900/40';
const labelClass = 'block text-sm font-semibold text-[#0A2836] dark:text-slate-100';

export function AddLeadModal({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<FormState>(defaults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>([...CRM_INDUSTRIES]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const hasName = Boolean(form.company_name.trim() || form.contact_name.trim());
  const validEmail = !form.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const validFollowup = (!form.next_action_at || Boolean(form.next_action.trim())) &&
    (!form.next_action_time || Boolean(form.next_action_at));
  const canCreate = !saving && !categoryBusy && hasName && Boolean(form.country.trim()) &&
    Boolean(form.priority) && validEmail && validFollowup;

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/agent-crm/categories', { credentials: 'same-origin', signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load saved categories.');
        return res.json() as Promise<{ categories: string[] }>;
      })
      .then((data) => { if (!controller.signal.aborted) setCategories(data.categories); })
      .catch(() => { if (!controller.signal.aborted) setCategoryError('Could not load saved categories.'); });
    return () => controller.abort();
  }, []);

  async function saveCategory() {
    const name = newCategory.trim().replace(/\s+/g, ' ');
    if (!name || categoryBusy) return;
    setCategoryBusy(true);
    setCategoryError('');
    try {
      const res = await fetch('/api/agent-crm/categories', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      });
      const data: { category?: string; error?: string } = await res.json();
      if (!res.ok || !data.category) throw new Error(data.error || 'Could not save category.');
      setCategories((current) => [...new Set([...current, data.category!])].sort((a, b) => a.localeCompare(b)));
      change('industry', data.category);
      setAddingCategory(false);
      setNewCategory('');
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Could not save category.');
    } finally { setCategoryBusy(false); }
  }

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onClose();
    }
    document.addEventListener('keydown', keydown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, saving]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate) return;
    if (form.next_action_at && !form.next_action.trim()) {
      setError('Enter a next action for the follow-up date.');
      return;
    }
    if (form.next_action_time && !form.next_action_at) {
      setError('Choose a follow-up date before selecting a time.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/agent-crm/leads', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          outcome: form.outcome || null,
          next_action_at: form.next_action_at || null,
          next_action_time: form.next_action_time || null,
          next_action_timezone: form.next_action_at
            ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi'
            : null,
        }),
      });
      const data: { ok?: boolean; error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not add this lead. Please try again.');
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this lead.');
    } finally {
      setSaving(false);
    }
  }

  function input(key: keyof FormState, placeholder: string, maxLength = 180) {
    return (
      <input
        className={fieldClass}
        value={form[key]}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event: ChangeEvent<HTMLInputElement>) => change(key, event.target.value)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-[#051522]/75 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-crm-lead-title"
        className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0E1D2A] sm:max-h-[92dvh] sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10 sm:px-7 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-300">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#059669] dark:text-emerald-300">Your sales pipeline</p>
              <h2 id="new-crm-lead-title" className="mt-1 text-xl font-bold tracking-tight text-[#0A2836] dark:text-white">
                Add new lead
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Every agent can add leads. This one will appear in your workspace.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close add lead"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(event) => void submit(event)} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 px-5 py-5 sm:px-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:col-span-2">
                Company or contact name required.
              </p>
              <label className={labelClass}>
                Company name
                <input autoFocus className={fieldClass} maxLength={180}
                  placeholder="e.g. ABC Logistics" value={form.company_name}
                  onChange={(event) => change('company_name', event.target.value)} />
              </label>
              <label className={labelClass}>
                Primary contact name
                <input className={fieldClass} maxLength={150}
                  placeholder="e.g. John Mwangi" value={form.contact_name}
                  onChange={(event) => change('contact_name', event.target.value)} />
              </label>
              <div>
                <label className={labelClass} htmlFor="new-lead-category">Business category (optional)</label>
                <select id="new-lead-category" className={fieldClass} value={form.industry}
                  onChange={(event) => {
                    if (event.target.value === '__add_new__') {
                      setAddingCategory(true);
                      setCategoryError('');
                    } else { change('industry', event.target.value); }
                  }}>
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="__add_new__">+ Add new category…</option>
                </select>
                {addingCategory && <div className="mt-2 flex flex-col gap-2">
                  <input className={fieldClass} value={newCategory} maxLength={100}
                    placeholder="e.g. Fleet Operators" aria-label="New business category"
                    onChange={(event) => setNewCategory(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void saveCategory(); } }} />
                  <div className="flex gap-2">
                    <button type="button" disabled={categoryBusy} onClick={() => setAddingCategory(false)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Cancel</button>
                    <button type="button" disabled={categoryBusy || !newCategory.trim()}
                      onClick={() => void saveCategory()}
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      {categoryBusy ? 'Saving…' : 'Save category'}
                    </button>
                  </div>
                </div>}
                {categoryError && <p role="alert" className="mt-2 text-xs text-rose-700">{categoryError}</p>}
              </div>
              <label className={labelClass}>Phone / WhatsApp {input('phone', '07... or +254...', 40)}</label>
              <label className={labelClass}>Contact role {input('contact_role', 'Owner, manager, director...', 120)}</label>
              <label className={labelClass}>
                Email
                <input type="email" className={fieldClass} maxLength={254}
                  value={form.email} placeholder="contact@company.com"
                  onChange={(event) => change('email', event.target.value)} />
              </label>
              <label className={labelClass}>City / region {input('city', 'Nairobi, Kisii, Mombasa...', 120)}</label>
              <label className={labelClass}>
                Country
                <input className={fieldClass} maxLength={80} required
                  value={form.country} onChange={(event) => change('country', event.target.value)} />
              </label>
              <label className={labelClass}>
                Priority
                <select className={fieldClass} value={form.priority}
                  onChange={(event) => change('priority', event.target.value as FormState['priority'])}>
                  <option value="normal">Normal</option>
                  <option value="high">High — warm lead</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label className={labelClass}>
                Lead stage
                <select className={fieldClass} value={form.stage}
                  onChange={(event) => change('stage', event.target.value)}>
                  {LEAD_STAGES.filter((stage) => stage !== 'do_not_contact' && stage !== 'competitor').map((stage) => (
                    <option key={stage} value={stage}>{title(stage)}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>Website {input('website', 'https://company.com', 1000)}</label>
              <label className={labelClass}>Source URL {input('source_url', 'https://... (optional)', 1000)}</label>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-white/10">
              <h3 className="text-sm font-bold text-[#0A2836] dark:text-white">Qualification and conversation</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Optional details help you remember why the prospect is a good fit.</p>
              <div className="mt-4 grid gap-4">
                <label className={labelClass}>
                  What they need
                  <textarea rows={2} className={fieldClass + ' min-h-20 py-3'} maxLength={2500}
                    value={form.problem_summary} placeholder="Potential software need or operational problem"
                    onChange={(event) => change('problem_summary', event.target.value)} />
                </label>
                <label className={labelClass}>
                  Why this lead fits
                  <textarea rows={2} className={fieldClass + ' min-h-20 py-3'} maxLength={2500}
                    value={form.qualification_reason} placeholder="Capacity, technology gap, decision maker..."
                    onChange={(event) => change('qualification_reason', event.target.value)} />
                </label>
                <label className={labelClass}>
                  Existing system
                  <select className={fieldClass} value={form.existing_system}
                    onChange={(event) => change('existing_system', event.target.value)}>
                    <option value="">Not assessed</option>
                    <option value="Unknown">Unknown</option>
                    <option value="Manual / Paper">Manual / paper</option>
                    <option value="Spreadsheets">Spreadsheets</option>
                    <option value="Web Only">Web only</option>
                    <option value="Mobile App">Mobile app</option>
                    <option value="Integrated System">Integrated system</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-white/10">
              <h3 className="text-sm font-bold text-[#0A2836] dark:text-white">Already contacted?</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Record the first call, email, or WhatsApp interaction here. Notes and next actions are saved to history.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Activity type
                  <select className={fieldClass} value={form.channel}
                    onChange={(event) => setForm((current) => ({
                      ...current, channel: event.target.value as ActivityChannel, outcome: '',
                    }))}>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Activity result
                  <select className={fieldClass} value={form.outcome}
                    onChange={(event) => change('outcome', event.target.value)}>
                    <option value="">Not contacted yet</option>
                    {CHANNEL_OUTCOMES[form.channel].map((value) => (
                      <option key={value} value={value}>{CALL_OUTCOME_LABELS[value]}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Follow-up date
                  <input type="date" className={fieldClass} value={form.next_action_at}
                    onChange={(event) => {
                      change('next_action_at', event.target.value);
                      if (!event.target.value) change('next_action_time', '');
                    }} />
                </label>
                <label className={labelClass + ' sm:col-span-2'}>
                  Follow-up time <span className="font-normal text-slate-500">(optional; your timezone)</span>
                  <input type="time" className={fieldClass} disabled={!form.next_action_at}
                    value={form.next_action_time}
                    onChange={(event) => change('next_action_time', event.target.value)} />
                </label>
              </div>
              <div className="mt-4 grid gap-4">
                <label className={labelClass}>
                  Conversation notes
                  <textarea rows={2} className={fieldClass + ' min-h-20 py-3'} maxLength={2500}
                    value={form.notes} placeholder="What was discussed? What did they request?"
                    onChange={(event) => change('notes', event.target.value)} />
                </label>
                <label className={labelClass}>
                  Next action
                  <input className={fieldClass} maxLength={300} value={form.next_action}
                    placeholder="Send WhatsApp demo, call tomorrow, arrange meeting..."
                    onChange={(event) => change('next_action', event.target.value)} />
                </label>
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#0E1D2A] sm:px-7">
            {error && <p role="alert" className="mr-auto max-w-xs text-xs leading-5 text-rose-700 dark:text-rose-300">{error}</p>}
            <button type="button" onClick={onClose} disabled={saving}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={!canCreate}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#059669] px-5 text-sm font-semibold text-white transition hover:bg-[#047857] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50">
              <Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Add lead'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
