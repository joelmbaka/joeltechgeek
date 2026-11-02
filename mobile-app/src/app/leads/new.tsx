import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Button, Field, Page, styles } from '@/components/ui';
import { SelectSheet } from '@/components/SelectSheet';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import type { Lead } from '@/lib/types';

export default function AddLead() {
  const router = useRouter();
  const { agent } = useAuth();
  const [industries, setIndustries] = useState<string[]>([]);
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [city, setCity] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIndustries = useCallback((signal: AbortSignal) => {
    if (!agent) return;
    void apiFetch<{ ok: true; industries: string[] }>('/api/agent-crm/mobile/meta', { signal })
      .then((result) => { if (!signal.aborted) setIndustries(result.industries); })
      .catch((reason: unknown) => {
        if (!signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not load industries.');
      });
  }, [agent?.id]);
  useFreshOnFocus(loadIndustries, [loadIndustries]);

  const save = async () => {
    if (!company.trim() || !industry) { setError('Company and industry are required.'); return; }
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<{ ok: true; lead: Lead }>('/api/agent-crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          company_name: company.trim(), industry, country: country.trim(),
          city, contact_name: contact, contact_role: role, phone, email, website,
          priority, notes,
        }),
      });
      router.replace({ pathname: '/leads/[id]', params: { id: result.lead.id } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create lead.');
    } finally { setBusy(false); }
  };

  return <Page>
    <Text style={styles.title}>New lead</Text>
    <Field label="Company name *" value={company} onChangeText={setCompany}/>
    <SelectSheet
      title="Industry *" value={industry}
      placeholder={industries.length ? 'Choose industry' : 'Loading industries…'}
      options={industries.map((value) => ({ value, label: value }))}
      onChange={setIndustry} searchable disabled={!industries.length}
    />
    <Field label="Country *" value={country} onChangeText={setCountry}/>
    <Field label="City" value={city} onChangeText={setCity}/>
    <Field label="Contact name" value={contact} onChangeText={setContact}/>
    <Field label="Contact role" value={role} onChangeText={setRole}/>
    <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
    <Field label="Email" value={email} onChangeText={setEmail}
      keyboardType="email-address" autoCapitalize="none"/>
    <Field label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none"/>
    <SelectSheet title="Priority" value={priority} onChange={setPriority}
      options={[
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'High' },
        { value: 'low', label: 'Low' },
      ]}/>
    <Field label="Initial notes" value={notes} onChangeText={setNotes} multiline/>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Button disabled={busy} onPress={() => void save()}>
      {busy ? 'Saving…' : 'Create lead'}
    </Button>
  </Page>;
}
