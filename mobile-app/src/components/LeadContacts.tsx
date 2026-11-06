import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
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
    {contacts.length === 0 ? <Text style={styles.subtitle}>No contacts yet. Add your first contact.</Text> : null}
    {contacts.map((c) => <View key={c.id} style={{ borderTopWidth: 1, borderColor: theme.border, paddingTop: 12, gap: 6 }}>
      <View style={{flexDirection:'row',alignItems:'center',gap:7}}>
        <Text numberOfLines={1} style={[styles.value,{flex:1,fontSize:16}]}>
          {c.name || c.phone || c.email || 'Unnamed contact'}
        </Text>
        {c.is_primary ? <View style={{borderWidth:1,borderColor:theme.primary,
          backgroundColor:theme.surfaceMuted,borderRadius:16,paddingHorizontal:9,paddingVertical:5}}>
          <Text style={{color:theme.primaryDark,fontSize:11,fontWeight:'800'}}>Primary</Text>
        </View> : !locked && editing===null ? <Pressable
          accessibilityRole="button" accessibilityLabel={'Make '+(c.name||'contact')+' primary'}
          onPress={()=>void makePrimary(c)} disabled={busy}
          style={{borderWidth:1,borderColor:theme.border,borderRadius:13,
            paddingHorizontal:8,paddingVertical:5}}>
          <Text style={{color:theme.primaryDark,fontSize:11,fontWeight:'700'}}>Set primary</Text>
        </Pressable> : null}
        {!locked && editing===null ? <>
          <Pressable accessibilityRole="button" accessibilityLabel={'Edit '+(c.name||'contact')}
            disabled={busy} onPress={()=>begin(c.id,c)}
            style={{width:36,height:36,borderRadius:10,borderWidth:1,borderColor:theme.border,
              alignItems:'center',justifyContent:'center'}}>
            <SymbolView name={{ios:'pencil',android:'edit',web:'edit'}}
              tintColor={theme.primaryDark} size={17}
              fallback={<Text style={{color:theme.primaryDark,fontSize:18}}>✎</Text>}/>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Remove '+(c.name||'contact')}
            disabled={busy} onPress={()=>remove(c)}
            style={{width:36,height:36,borderRadius:10,borderWidth:1,borderColor:theme.border,
              alignItems:'center',justifyContent:'center'}}>
            <SymbolView name={{ios:'trash',android:'delete',web:'delete'}}
              tintColor={theme.warning} size={17}
              fallback={<Text style={{color:theme.warning,fontSize:18}}>×</Text>}/>
          </Pressable>
        </> : null}
      </View>
      {c.role ? <Text style={styles.subtitle}>{c.role}</Text> : null}
      {c.phone ? <Text selectable style={styles.subtitle}>{c.phone}</Text> : null}
      {c.email ? <Text selectable style={styles.subtitle}>{c.email}</Text> : null}
      <LeadContactActions phone={c.phone} email={c.email} country={lead.country}
        disabled={locked || busy}/>

      {editing === c.id ? <View style={{ gap: 9, paddingTop: 8 }}>
        <Field label="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}/>
        <Field label="Role" value={form.role} onChangeText={(v) => setForm((p) => ({ ...p, role: v }))}/>
        <Field label="Phone" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad"/>
        <Field label="Email" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} keyboardType="email-address"/>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={{flexDirection:'row',gap:10}}>
          <View style={{flex:1}}>
            <Button disabled={busy || !Object.values(form).some((value) => value.trim())}
              onPress={() => void save()}>{busy ? 'Saving…' : 'Save contact'}</Button>
          </View>
          <View style={{flex:1}}>
            <Button secondary disabled={busy} onPress={() => setEditing(null)}>Cancel</Button>
          </View>
        </View>
      </View> : null}
    </View>)}
    {editing === 'new' ? <View style={{ borderTopWidth: 1, borderColor: theme.border, paddingTop: 12, gap: 9 }}>
      <Text style={[styles.value, { fontSize: 16 }]}>New contact</Text>
      <Field label="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}/>
      <Field label="Role" value={form.role} onChangeText={(v) => setForm((p) => ({ ...p, role: v }))}/>
      <Field label="Phone" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad"/>
      <Field label="Email" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} keyboardType="email-address"/>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{flexDirection:'row',gap:10}}>
        <View style={{flex:1}}>
          <Button disabled={busy || !Object.values(form).some((value) => value.trim())}
            onPress={() => void save()}>{busy ? 'Saving…' : 'Add contact'}</Button>
        </View>
        <View style={{flex:1}}>
          <Button secondary disabled={busy} onPress={() => setEditing(null)}>Cancel</Button>
        </View>
      </View>
    </View> : null}
    {error && editing === null ? <Text style={styles.error}>{error}</Text> : null}
  </View>;
}
