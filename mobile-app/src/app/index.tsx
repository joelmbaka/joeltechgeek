import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { Busy, Button, ChoiceRow, Page, styles } from '@/components/ui';
import { COLORS } from '@/lib/config';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import { reconcileReminders, requestReminderPermissions } from '@/lib/notifications';
import type { Lead, LeadList, Stats } from '@/lib/types';

const PER_PAGE = 25;
const QUEUES = [
  ['all', 'All'], ['to_call', 'To call'], ['due', 'Follow-ups due'], ['interested', 'Interested'],
] as const;
const SORTS = [['recommended','Recommended'], ['recent','Recent'], ['company','Company'],
  ['priority','Priority'], ['followup','Next follow-up']] as const;

export default function HomeScreen() {
  const { ready, agent, login, logout, retry, error: authError } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [offset, setOffset] = useState(0);
  const [queue, setQueue] = useState<'all'|'to_call'|'due'|'interested'>('all');
  const [industry, setIndustry] = useState('all');
  const [sort, setSort] = useState<'recommended'|'recent'|'company'|'priority'|'followup'>('recommended');
  const [data, setData] = useState<LeadList | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reminderNotice, setReminderNotice] = useState('');

  useEffect(() => { setOffset(0); }, [debounced, queue, industry, sort]);
  const fetchPage = useCallback((signal: AbortSignal) => {
    if (!agent) return;
    setLoading(true);
    setMessage(null);
    setData(null); // Never display stale records as though they were current.
    const query = new URLSearchParams({
      limit: String(PER_PAGE), offset: String(offset),
      q: debounced, queue, industry, sort,
    });
    void apiFetch<LeadList>('/api/agent-crm/leads?' + query.toString(), { signal })
      .then((result) => { if (!signal.aborted) setData(result); })
      .catch((e: unknown) => {
        if (!signal.aborted) setMessage(e instanceof Error ? e.message : 'Cannot load leads.');
      })
      .finally(() => { if (!signal.aborted) { setLoading(false); setRefreshing(false); } });
  }, [agent?.id, offset, debounced, queue, industry, sort]);
  useFreshOnFocus(fetchPage, [fetchPage]);

  const manuallyRefresh = () => {
    const controller = new AbortController();
    setRefreshing(true);
    fetchPage(controller.signal);
  };
  const enableReminders = async () => {
    if (!agent) return;
    try {
      const granted = await requestReminderPermissions();
      if (!granted) { setReminderNotice('Allow notifications in Android settings to receive reminders.'); return; }
      await reconcileReminders(agent);
      setReminderNotice('Upcoming timed follow-ups are scheduled on this device.');
    } catch (e) { setReminderNotice(e instanceof Error ? e.message : 'Could not sync reminders.'); }
  };

  if (!ready) return <Page><Busy label="Restoring your session…"/></Page>;
  if (!agent) return <Page>
    <Text style={styles.title}>JoelTechGeek CRM</Text>
    <Text style={styles.subtitle}>Sign in using the Google account registered as a sales agent.</Text>
    {authError ? <Text style={styles.error}>{authError}</Text> : null}
    <Button onPress={() => void login()}>Continue with Google</Button>
    <Button secondary onPress={() => void retry()}>Retry session restoration</Button>
  </Page>;

  const stats = data?.stats as Stats | undefined;
  return <View style={styles.screen}>
    <FlatList
      keyExtractor={(item) => item.id}
      data={loading ? [] : (data?.leads || [])}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={manuallyRefresh}
        tintColor={COLORS.primary}/>}
      contentContainerStyle={{ padding: 16, paddingBottom: 55, gap: 10 }}
      ListHeaderComponent={<View style={{ gap: 12 }}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Good day, {agent.name.split(' ')[0]}</Text>
            <Text style={styles.subtitle}>Your assigned leads · updated on opening</Text>
          </View>
          <Pressable onPress={() => void logout()}>
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign out</Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          {([
            ['Leads', stats?.total], ['To call', stats?.to_call],
            ['Follow-ups', stats?.followups_due], ['Interested', stats?.interested],
          ] as const).map(([label, number]) => <View key={label}
            style={[styles.card, { width: '47%', flexGrow: 1 }]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.title, { fontSize: 24 }]}>{number ?? '—'}</Text>
          </View>)}
        </View>
        <Button onPress={() => router.push('/leads/new')}>+ Add lead</Button>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Search company, contact, phone or email"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none" autoCorrect={false}
        />
        <Text style={styles.label}>Work queue</Text>
        <ChoiceRow options={QUEUES} selected={queue} onChange={(value) => setQueue(value)}/>
        <Text style={styles.label}>Industry</Text>
        <ChoiceRow options={[['all','All'], ...(data?.industries || []).map((value) => [value,value] as const)]}
          selected={industry} onChange={setIndustry}/>
        <Text style={styles.label}>Sort</Text>
        <ChoiceRow options={SORTS} selected={sort} onChange={(value) => setSort(value)}/>
        <Button secondary onPress={() => void enableReminders()}>Enable / sync follow-up reminders</Button>
        {reminderNotice ? <Text style={styles.subtitle}>{reminderNotice}</Text> : null}
        {loading ? <Busy label="Fetching current leads…"/> : null}
        {message ? <>
          <Text style={styles.error}>{message}</Text>
          <Button secondary onPress={manuallyRefresh}>Retry</Button>
        </> : null}
        {!loading && data && !data.leads.length ?
          <Text style={styles.subtitle}>No leads match this search or queue.</Text> : null}
      </View>}
      renderItem={({ item }) => <LeadRow lead={item}
        onPress={() => router.push({ pathname: '/leads/[id]', params: { id: item.id } })}/>}
      ListFooterComponent={<View style={{ gap: 10, paddingVertical: 10 }}>
        {!loading && data ? <>
          <Text style={styles.subtitle}>Page {Math.floor(offset / PER_PAGE) + 1} · Showing {data.leads.length} leads</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Button secondary disabled={!offset} onPress={() =>
              setOffset((current) => Math.max(0,current-PER_PAGE))}>Previous</Button></View>
            <View style={{ flex: 1 }}><Button secondary disabled={!data.has_more} onPress={() =>
              setOffset((current) => current+PER_PAGE)}>Next</Button></View>
          </View>
        </> : null}
      </View>}
    />
  </View>;
}
function LeadRow({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.card}>
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <Text style={[styles.value, { flex: 1, fontSize: 16 }]}>{lead.company_name}</Text>
      <Text style={[styles.label, { color: lead.priority === 'high' ? COLORS.red : COLORS.muted }]}>
        {lead.priority.toUpperCase()}
      </Text>
    </View>
    <Text style={styles.subtitle}>{lead.contact_name || 'No contact'} · {lead.industry}</Text>
    {lead.phone ? <Text style={styles.subtitle}>{lead.phone}</Text> : null}
    <Text style={styles.subtitle}>Status: {lead.stage.replace(/_/g,' ')}</Text>
    {lead.next_action ? <Text style={{ color: COLORS.primaryDark, fontWeight: '600' }}>
      Next: {lead.next_action}{lead.next_action_at ? ' · ' + lead.next_action_at : ''}
    </Text> : null}
  </Pressable>;
}
