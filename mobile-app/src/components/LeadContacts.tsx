import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
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

function whatsappNumber(phone: string, country: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (phone.startsWith('+')) return digits;
  if (country.toLowerCase() === 'kenya') {
    if (digits.length === 10 && digits.startsWith('0')) return '254' + digits.slice(1);
    if (digits.length === 12 && digits.startsWith('254')) return digits;
    if (digits.length === 9 && /^[17]/.test(digits)) return '254' + digits;
  }
  return null;
}

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
  const locked = lead.do_not_contact || lead.stage === 'competitor';
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
  const callContact = (phone: string) => {
    const number = phone.replace(/[^\d+]/g, '');
    if (number) void Linking.openURL('tel:' + number);
  };
  const messageContact = (phone: string) => {
    const number = whatsappNumber(phone, lead.country);
    if (!number) {
      dialog({ title: 'Number needs country code', message: 'Add an international country code to use WhatsApp.' });
      return;
    }
    void Linking.openURL('https://wa.me/' + number).catch(() => {
      dialog({ title: 'WhatsApp unavailable', message: 'Could not open WhatsApp.' });
    });
  };

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
      {c.phone && !locked ? <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Button secondary disabled={busy} onPress={() => callContact(c.phone!)}>Call</Button></View>
        <View style={{ flex: 1 }}><Button secondary disabled={busy} onPress={() => messageContact(c.phone!)}>WhatsApp</Button></View>
      </View> : null}
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
        <Button disabled={busy || !Object.values(form).some(Boolean)} onPress={() => void save()}>{busy ? 'Saving…' : 'Save contact'}</Button>
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
      <Button disabled={busy || !Object.values(form).some(Boolean)} onPress={() => void save()}>{busy ? 'Saving…' : 'Add contact'}</Button>
      <Button secondary disabled={busy} onPress={() => setEditing(null)}>Cancel</Button>
    </View> : null}
    {error && editing === null ? <Text style={styles.error}>{error}</Text> : null}
  </View>;
}
