'use client';

import { useState } from 'react';
import type { LeadContact } from '@/lib/agent-crm/types';

type ContactForm = { name: string; role: string; phone: string; email: string };
const EMPTY: ContactForm = { name: '', role: '', phone: '', email: '' };
const fromContact = (c: LeadContact): ContactForm => ({
  name: c.name || '', role: c.role || '', phone: c.phone || '', email: c.email || '',
});
const fieldStyle = 'min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';
const actionStyle = 'rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700';

export function LeadContactsPanel({ leadId, contacts, locked, onUpdated }: {
  leadId: string; contacts: LeadContact[]; locked: boolean; onUpdated: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const url = '/api/agent-crm/leads/' + encodeURIComponent(leadId) + '/contacts';

  async function request(path: string, method: 'POST' | 'PATCH' | 'DELETE', payload?: object) {
    const response = await fetch(path, {
      method, credentials: 'same-origin',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const body: { ok?: boolean; error?: string } = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) throw new Error(body.error || 'Could not update contact.');
  }
  function begin(id: string, contact?: LeadContact) {
    setEditing(id);
    setForm(contact ? fromContact(contact) : { ...EMPTY });
    setError('');
  }
  async function submit() {
    if (saving || !Object.values(form).some((value) => value.trim())) return;
    setSaving(true); setError('');
    try {
      const isNew = editing === 'new';
      await request(isNew ? url : url + '/' + encodeURIComponent(editing || ''),
        isNew ? 'POST' : 'PATCH', form);
      setEditing(null);
      await onUpdated();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save contact.'); }
    finally { setSaving(false); }
  }
  async function makePrimary(c: LeadContact) {
    if (saving || locked) return;
    setSaving(true); setError('');
    try {
      await request(url + '/' + encodeURIComponent(c.id), 'PATCH', { ...fromContact(c), make_primary: true });
      await onUpdated();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not change primary contact.'); }
    finally { setSaving(false); }
  }
  async function remove(c: LeadContact) {
    if (saving || locked || !window.confirm('Remove this contact from this lead?')) return;
    setSaving(true); setError('');
    try {
      await request(url + '/' + encodeURIComponent(c.id), 'DELETE');
      await onUpdated();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not remove contact.'); }
    finally { setSaving(false); }
  }
  const editor = (
    <div className="mt-3 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-800 dark:bg-emerald-950/20 sm:grid-cols-2">
      {(['name', 'role', 'phone', 'email'] as const).map((key) => (
        <label key={key} className="text-xs font-semibold capitalize">
          {key}
          <input className={fieldStyle + ' mt-1'} maxLength={{name:150,role:120,phone:40,email:254}[key]}
            type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
            value={form[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}/>
        </label>
      ))}
      {error && <p role="alert" className="text-xs text-rose-700 sm:col-span-2">{error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button type="button" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={saving || !Object.values(form).some((value) => value.trim())} onClick={() => void submit()}>
          {saving ? 'Saving…' : editing === 'new' ? 'Add contact' : 'Save changes'}
        </button>
        <button type="button" className={actionStyle} disabled={saving}
          onClick={() => { setEditing(null); setError(''); }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Contacts ({contacts.length})</h3>
        {!locked && editing === null && <button type="button" className={actionStyle}
          disabled={saving} onClick={() => begin('new')}>+ Add contact</button>}
      </div>
      {contacts.length === 0 && <p className="mt-2 text-sm text-slate-500">No contacts yet.</p>}
      <div className="mt-3 space-y-3">
        {contacts.map((c) => (
          <div key={c.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {c.name || c.phone || c.email || 'Unnamed contact'}
                  {c.is_primary && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Primary</span>}
                </p>
                {c.role && <p className="mt-1 text-xs text-slate-500">{c.role}</p>}
                {c.phone && <p className="mt-1 text-xs">{c.phone}</p>}
                {c.email && <p className="mt-1 break-all text-xs">{c.email}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {!locked && c.phone && <a className={actionStyle} href={'tel:' + c.phone.replace(/[^+\d]/g,'')}>Call</a>}
                {!locked && c.email && <a className={actionStyle} href={'mailto:' + c.email}>Email</a>}
                {!locked && editing === null && <>
                  <button type="button" className={actionStyle} disabled={saving} onClick={() => begin(c.id, c)}>Edit</button>
                  {!c.is_primary && <button type="button" className={actionStyle} disabled={saving}
                    onClick={() => void makePrimary(c)}>Make primary</button>}
                  <button type="button" className={actionStyle} disabled={saving}
                    onClick={() => void remove(c)}>Remove</button>
                </>}
              </div>
            </div>
            {editing === c.id && editor}
          </div>
        ))}
      </div>
      {editing === 'new' && editor}
      {error && editing === null && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
    </section>
  );
}
