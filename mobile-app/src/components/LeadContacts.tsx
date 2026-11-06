import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LeadContactActions } from './LeadContactActions';
import { useAppDialog } from '@/components/AppDialog';
import { Button, Field, useUIStyles } from '@/components/ui';
import { useTheme } from '@/lib/config';
import { apiFetch } from '@/lib/api';
import type { Lead, LeadContact } from '@/lib/types';

type Form = { name: string; role: string; phone: string; email: string };
const EMPTY: Form = { name: '', role: '', phone: '', email: '' };
const toForm = (c: LeadContact): Form => ({
  name: c.name || '', role: c.role || '', phone: c.phone || '', email: c.email || '',
});

export function LeadContacts({ lead, contacts, onRefresh }: {
  lead: Lead; contacts: LeadContact[]; onRefresh: () => void;
}) {
  const styles = useUIStyles();
  const theme = useTheme();
  const dialog = useAppDialog();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = lead.do_not_contact || ['competitor','do_not_contact','won','lost'].includes(lead.stage);
  const base = '/api/agent-crm/leads/' + encodeURIComponent(lead.id) + '/contacts';

  const begin = (id: string, contact?: LeadContact) => {
    setEditing(id);
    setForm(contact ? toForm(contact) : { ...EMPTY });
    setError('');
  };
  const save = async () => {
    if (busy || !Object.values(form).some((value) => value.trim())) return;
    setBusy(true); setError('');
    try {
      const isNew = editing === 'new';
      await apiFetch(isNew ? base : base + '/' + encodeURIComponent(editing || ''), {
        method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(form),
      });
      setEditing(null);
      onRefresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save contact.');
    } finally { setBusy(false); }
  };
  const makePrimary = async (contact: LeadContact) => {
    if (busy || locked) return;
    setBusy(true); setError('');
    try {
      await apiFetch(base + '/' + encodeURIComponent(contact.id), {
        method: 'PATCH', body: JSON.stringify({ ...toForm(contact), make_primary: true }),
      });
      onRefresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update primary contact.');
    } finally { setBusy(false); }
  };
  const remove = (contact: LeadContact) => dialog({
    title: 'Remove contact?',
    message: 'Remove this contact from this lead? Other contacts and the lead history will remain.',
    cancelLabel: 'Cancel',
    confirmLabel: 'Remove',
    onConfirm: () => {
      if (busy) return;
      setBusy(true); setError('');
      void apiFetch(base + '/' + encodeURIComponent(contact.id), { method: 'DELETE' })
        .then(() => onRefresh())
        .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not remove contact.'))
        .finally(() => setBusy(false));
    },
  });

  return <View style={[styles.card, { gap: 12 }]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <Text style={[styles.title, { fontSize: 19 }]}>Contacts ({contacts.length})</Text>
      {!locked && editing === null ? <Pressable accessibilityRole="button" disabled={busy}
        onPress={() => begin('new')} style={{ paddingVertical: 9, paddingHorizontal: 10 }}>
        <Text style={{ color: theme.primaryDark, fontWeight: '800' }}>+ Add contact</Text>
      </Pressable> : null}
    </View>
    {lead.website ? <Text selectable style={styles.subtitle}>Website: {lead.website}</Text> : null}
    {contacts.length === 0 ? <Text style={styles.subtitle}>No contacts yet. Add your first contact.</Text> : null}
    {contacts.map((c) => <View key={c.id} style={{ borderTopWidth: 1, borderColor: theme.border, paddingTop: 12, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[styles.value, { flex: 1, fontSize: 16 }]}>{c.name || c.phone || c.email || 'Unnamed contact'}</Text>
        {c.is_primary ? <Text style={{ color: theme.primaryDark, fontSize: 12, fontWeight: '800' }}>Primary</Text> : null}
      </View>
      {c.role ? <Text style={styles.subtitle}>{c.role}</Text> : null}
      {c.phone ? <Text selectable style={styles.subtitle}>{c.phone}</Text> : null}
      {c.email ? <Text selectable style={styles.subtitle}>{c.email}</Text> : null}
      <LeadContactActions phone={c.phone} email={c.email} country={lead.country}
        disabled={locked || busy}/>

      {!locked && editing === null ? <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', paddingTop: 4 }}>
        <Pressable accessibilityRole="button" onPress={() => begin(c.id, c)} disabled={busy}>
          <Text style={{ color: theme.primaryDark, fontWeight: '700' }}>Edit</Text>
        </Pressable>
        {!c.is_primary ? <Pressable accessibilityRole="button" onPress={() => void makePrimary(c)} disabled={busy}>
          <Text style={{ color: theme.primaryDark, fontWeight: '700' }}>Make primary</Text>
        </Pressable> : null}
        <Pressable accessibilityRole="button" onPress={() => remove(c)} disabled={busy}>
          <Text style={{ color: theme.warning, fontWeight: '700' }}>Remove</Text>
        </Pressable>
      </View> : null}
      {editing === c.id ? <View style={{ gap: 9, paddingTop: 8 }}>
        <Field label="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}/>
        <Field label="Role" value={form.role} onChangeText={(v) => setForm((p) => ({ ...p, role: v }))}/>
        <Field label="Phone" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad"/>
        <Field label="Email" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} keyboardType="email-address"/>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button disabled={busy || !Object.values(form).some((value) => value.trim())} onPress={() => void save()}>{busy ? 'Saving…' : 'Save contact'}</Button>
        <Button secondary disabled={busy} onPress={() => setEditing(null)}>Cancel</Button>
      </View> : null}
    </View>)}
    {editing === 'new' ? <View style={{ borderTopWidth: 1, borderColor: theme.border, paddingTop: 12, gap: 9 }}>
      <Text style={[styles.value, { fontSize: 16 }]}>New contact</Text>
      <Field label="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}/>
      <Field label="Role" value={form.role} onChangeText={(v) => setForm((p) => ({ ...p, role: v }))}/>
      <Field label="Phone" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad"/>
      <Field label="Email" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} keyboardType="email-address"/>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button disabled={busy || !Object.values(form).some((value) => value.trim())} onPress={() => void save()}>{busy ? 'Saving…' : 'Add contact'}</Button>
      <Button secondary disabled={busy} onPress={() => setEditing(null)}>Cancel</Button>
    </View> : null}
    {error && editing === null ? <Text style={styles.error}>{error}</Text> : null}
  </View>;
}
