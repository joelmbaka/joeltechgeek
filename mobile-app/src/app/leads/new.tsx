import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Text, View } from 'react-native';
import { Button, Field, Page, useUIStyles } from '@/components/ui';
import { SelectSheet } from '@/components/SelectSheet';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';
import { apiFetch } from '@/lib/api';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import type { Lead } from '@/lib/types';

export default function AddLead() {
  const styles = useUIStyles();
  const theme = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { user } = useAuth();
  const [industries, setIndustries] = useState<string[]>([]);
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIndustries = useCallback((signal: AbortSignal) => {
    if (!user) return;
    void apiFetch<{ ok: true; categories: string[] }>('/api/agent-crm/categories', { signal })
      .then((result) => { if (!signal.aborted) setIndustries(result.categories); })
      .catch((reason: unknown) => {
        if (!signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not load industries.');
      });
  }, [user?.id]);
  useFreshOnFocus(loadIndustries, [loadIndustries]);

  const createCategory = async (name: string): Promise<string> => {
    const result = await apiFetch<{ ok: true; category: string }>('/api/agent-crm/categories', {
      method: 'POST', body: JSON.stringify({ name }),
    });
    setIndustries((current) => [...new Set([...current, result.category])].sort((a, b) => a.localeCompare(b)));
    return result.category;
  };

  const canCreate = !busy && brief.length <= 220 && Boolean(company.trim() || contact.trim()) &&
    Boolean(priority) &&
    (!email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
  const save = async () => {
    if (!canCreate) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<{ ok: true; lead: Lead }>('/api/agent-crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          company_name: company.trim(), industry, country: country.trim(),
          city, contact_name: contact, contact_role: role, phone, email, website,
          priority, notes, lead_brief: brief.trim(),
        }),
      });
      router.replace({ pathname: '/leads/[id]', params: { id: result.lead.id } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create lead.');
    } finally { setBusy(false); }
  };

  return <Page keyboardAware keyboardVerticalOffset={headerHeight}>
    <Field label="Company name" value={company} onChangeText={setCompany} autoFocus inline/>
    <Field label="Primary contact name" value={contact} onChangeText={setContact} inline/>
    <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" inline/>
    <Field label="Email" value={email} onChangeText={setEmail}
      keyboardType="email-address" autoCapitalize="none" inline/>
    <View style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:48}}>
      <Text style={[styles.label,{width:112,fontSize:13,color:theme.ink}]}>Business category</Text>
      <View style={{flex:1,minWidth:0}}>
        <SelectSheet
          title="Business category" value={industry} hideTriggerLabel
          placeholder="No category"
          options={[{ value: '', label: 'No category' }, ...industries.map((value) => ({ value, label: value }))]}
          onChange={setIndustry} onCreateOption={createCategory} searchable dismissKeyboardOnOpen
        />
      </View>
    </View>
    <Field label="Country" value={country} onChangeText={setCountry} placeholder="Optional" inline/>
    <Field label="City" value={city} onChangeText={setCity} placeholder="Optional" inline/>
    <Field label="Contact role" value={role} onChangeText={setRole} inline/>
    <Field label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" inline/>
    <View style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:48}}>
      <Text style={[styles.label,{width:112,fontSize:13,color:theme.ink}]}>Priority</Text>
      <View style={{flex:1,minWidth:0}}>
        <SelectSheet title="Priority" value={priority} onChange={setPriority}
          hideTriggerLabel dismissKeyboardOnOpen placeholder="Select priority"
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'High' },
            { value: 'low', label: 'Low' },
          ]}/>
      </View>
    </View>
    <Field label="Lead brief (optional, 220 characters)" value={brief} onChangeText={setBrief} multiline/>
    <Field label="Initial activity notes (optional)" value={notes} onChangeText={setNotes} multiline/>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Button disabled={!canCreate}
      onPress={() => void save()}>
      {busy ? 'Saving…' : 'Create lead'}
    </Button>
  </Page>;
}
