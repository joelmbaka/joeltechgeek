import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Field, Page, ChoiceRow, styles } from '@/components/ui';
import { COLORS } from '@/lib/config';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import type { Lead } from '@/lib/types';

export default function AddLead() {
  const router = useRouter();
  const { agent } = useAuth();
  const [industries, setIndustries] = useState<string[]>([]);
  const [industrySearch, setIndustrySearch] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [city, setCity] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [priority, setPriority] = useState<'normal'|'high'|'low'>('normal');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadIndustries = useCallback((signal: AbortSignal) => {
    if (!agent) return;
    void apiFetch<{ ok: true; industries: string[] }>('/api/agent-crm/mobile/meta', { signal })
      .then((result) => { if (!signal.aborted) setIndustries(result.industries); })
      .catch((e: unknown) => { if (!signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load industries'); });
  }, [agent?.id]);
  useFreshOnFocus(loadIndustries, [loadIndustries]);
  const save = async () => {
    if (!company.trim() || !industry) { setError('Company and industry are required.'); return; }
    setBusy(true); setError(null);
    try {
      const result = await apiFetch<{ ok: true; lead: Lead }>('/api/agent-crm/leads', {
        method: 'POST', body: JSON.stringify({
          company_name: company.trim(), industry, country: country.trim(),
          city, contact_name: contact, contact_role: role, phone, email, website,
          priority, notes,
        }),
      });
      router.replace({ pathname: '/leads/[id]', params: { id: result.lead.id } });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create lead.'); }
    finally { setBusy(false); }
  };
  return <Page>
    <Text style={styles.title}>New lead</Text>
    <Text style={styles.subtitle}>The lead will be assigned to your registered agent account.</Text>
    <Field label="Company name *" value={company} onChangeText={setCompany}/>
    <Text style={styles.label}>Industry *</Text>
    <TextInput value={industrySearch} onChangeText={setIndustrySearch}
      style={styles.input} placeholder={industry || 'Filter industries…'}
      placeholderTextColor={COLORS.muted}/>
    {industry ? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
      Selected: {industry}</Text> : null}
    <View style={{ gap: 5 }}>
      {industries.filter((x) => x.toLowerCase().includes(industrySearch.toLowerCase()))
        .slice(0, industrySearch ? 25 : 12).map((value) =>
          <Pressable key={value} onPress={() => { setIndustry(value); setIndustrySearch(''); }}
            style={[styles.card, { padding: 11,
              borderColor: industry === value ? COLORS.primary : COLORS.border }]}>
            <Text style={styles.value}>{value}</Text>
          </Pressable>)}
      {!industries.length && <Text style={styles.subtitle}>Loading available industries…</Text>}
    </View>
    <Field label="Country *" value={country} onChangeText={setCountry}/>
    <Field label="City" value={city} onChangeText={setCity}/>
    <Field label="Contact name" value={contact} onChangeText={setContact}/>
    <Field label="Contact role" value={role} onChangeText={setRole}/>
    <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
    <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
    <Field label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none"/>
    <Text style={styles.label}>Priority</Text>
    <ChoiceRow options={[[ 'normal','Normal' ],[ 'high','High' ],[ 'low','Low' ]] as const}
      selected={priority} onChange={setPriority}/>
    <Field label="Initial notes" value={notes} onChangeText={setNotes} multiline/>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Button disabled={busy} onPress={() => void save()}>{busy ? 'Saving…' : 'Create lead'}</Button>
  </Page>;
}
