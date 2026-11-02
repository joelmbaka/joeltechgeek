import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Busy, Button, styles } from '@/components/ui';
import { SelectSheet, type SelectOption } from '@/components/SelectSheet';
import { LeadCardSkeleton } from '@/components/Skeleton';
import { COLORS } from '@/lib/config';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import type { Lead, LeadList, Stats } from '@/lib/types';

const PER_PAGE = 25;
const SORTS: SelectOption[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'recent', label: 'Recently updated' },
  { value: 'company', label: 'Company A–Z' },
  { value: 'priority', label: 'Priority' },
  { value: 'followup', label: 'Next follow-up' },
];

export default function HomeScreen() {
  const { ready, agent, login, error: authError } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [offset, setOffset] = useState(0);
  const [queue, setQueue] = useState('all');
  const [industry, setIndustry] = useState('all');
  const [sort, setSort] = useState('recommended');
  const [data, setData] = useState<LeadList | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => { setOffset(0); }, [debounced, queue, industry, sort]);

  const fetchPage = useCallback((signal: AbortSignal) => {
    if (!agent) return;
    const version = ++requestVersion.current;
    setLoading(true);
    setMessage(null);
    setData(null); // Never show a previous page as current during a new request.
    const params = new URLSearchParams({
      limit: String(PER_PAGE), offset: String(offset),
      q: debounced, queue, industry, sort,
    });
    void apiFetch<LeadList>('/api/agent-crm/leads?' + params, { signal })
      .then((result) => {
        if (!signal.aborted && version === requestVersion.current) setData(result);
      })
      .catch((reason: unknown) => {
        if (!signal.aborted && version === requestVersion.current) {
          setMessage(reason instanceof Error ? reason.message : 'Cannot load leads.');
        }
      })
      .finally(() => {
        if (!signal.aborted && version === requestVersion.current) {
          setLoading(false);
          setRefreshing(false);
        }
      });
  }, [agent?.id, offset, debounced, queue, industry, sort]);

  useFreshOnFocus(fetchPage, [fetchPage]);

  const refresh = () => {
    setRefreshing(true);
    fetchPage(new AbortController().signal);
  };
  const openLead = (id: string) => {
    // Clear while leaving the list. When Android back-navigation refocuses
    // this screen, the next fetch uses the unfiltered query immediately.
    setSearch('');
    setOffset(0);
    router.push({ pathname: '/leads/[id]', params: { id } });
  };

  if (!ready) return <SafeAreaView edges={['bottom']} style={styles.screen}>
    <Busy label="Restoring your session…"/>
  </SafeAreaView>;
  if (!agent) return <SafeAreaView edges={['left','right','bottom']} style={styles.screen}>
    <View style={{ padding: 22, gap: 16 }}>
      <Text style={styles.title}>JoelTechGeek CRM</Text>
      <Text style={styles.subtitle}>Sign in with your registered Google account.</Text>
      {authError ? <Text style={styles.error}>{authError}</Text> : null}
      <Button onPress={() => void login()}>Continue with Google</Button>
    </View>
  </SafeAreaView>;

  const stats = loading ? null : data?.stats || null;
  const queueOptions: SelectOption[] = [
    { value: 'all', label: 'All leads', count: stats?.total },
    { value: 'to_call', label: 'To call', count: stats?.to_call },
    { value: 'due', label: 'Follow-ups due', count: stats?.followups_due },
    { value: 'interested', label: 'Interested', count: stats?.interested },
  ];
  const industryOptions: SelectOption[] = [
    { value: 'all', label: 'All industries', count: stats?.total },
    ...(data?.industries || (industry === 'all' ? [] : [industry])).map((name) => ({
      value: name, label: name, count: data?.industry_counts?.[name],
    })),
  ];
  return <SafeAreaView edges={['left','right','bottom']} style={styles.screen}>
    <FlatList
      data={loading ? [] : (data?.leads || [])}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary}/>}
      contentContainerStyle={{ padding: 15, paddingBottom: 32, gap: 10 }}
      ListHeaderComponent={<View style={{ gap: 12 }}>
        <Text style={[styles.title, { fontSize: 21 }]}>Good day, {agent.name.split(' ')[0]}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {([
            ['Leads', stats?.total], ['To call', stats?.to_call],
            ['Follow-ups', stats?.followups_due], ['Interested', stats?.interested],
          ] as const).map(([label, count]) => <View key={label} style={[
            styles.card, { width: '47%', flexGrow: 1, padding: 12, gap: 5, minHeight: 74 },
          ]}>
            <Text style={styles.label}>{label}</Text>
            {loading ? <View style={{ height: 22, width: 37, borderRadius: 6,
              backgroundColor: '#DEE7EA' }}/> :
              <Text style={{ color: COLORS.ink, fontWeight: '800', fontSize: 21 }}>{count ?? 0}</Text>}
          </View>)}
        </View>
        <Button onPress={() => router.push('/leads/new')}>+ Add lead</Button>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search company, contact, phone or email"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none" autoCorrect={false}
            returnKeyType="search"
          />
          {search ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search"
            hitSlop={10} onPress={() => setSearch('')}>
            <Text style={{ color: COLORS.muted, fontSize: 22 }}>×</Text>
          </Pressable> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ flex: 1, minWidth: 132 }}>
            <SelectSheet title="Work queue" value={queue} options={queueOptions} onChange={setQueue}/>
          </View>
          <View style={{ flex: 1, minWidth: 132 }}>
            <SelectSheet title="Industry" value={industry} options={industryOptions}
              onChange={setIndustry} searchable />
          </View>
          <View style={{ flex: 1, minWidth: 120 }}>
            <SelectSheet title="Sort" value={sort} options={SORTS} onChange={setSort}/>
          </View>
        </View>
        {message ? <View style={styles.card}>
          <Text style={styles.error}>{message}</Text>
          <Button secondary onPress={refresh}>Retry loading leads</Button>
        </View> : null}
        {!loading && data && data.leads.length === 0 && !message ?
          <Text style={styles.subtitle}>No leads match your search or filters.</Text> : null}
      </View>}
      renderItem={({ item }) => <LeadRow lead={item} onPress={() => openLead(item.id)}/>}
      ListFooterComponent={<View style={{ gap: 12, paddingTop: 5 }}>
        {loading ? <LeadCardSkeleton count={5}/> : null}
        {!loading && data ? <>
          <Text style={styles.subtitle}>
            Page {Math.floor(offset / PER_PAGE) + 1} · {data.leads.length} leads shown
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button secondary disabled={offset === 0}
                onPress={() => setOffset((value) => Math.max(0, value - PER_PAGE))}>Previous</Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button secondary disabled={!data.has_more}
                onPress={() => setOffset((value) => value + PER_PAGE)}>Next</Button>
            </View>
          </View>
        </> : null}
      </View>}
    />
  </SafeAreaView>;
}

function LeadRow({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  return <Pressable accessibilityRole="button"
    accessibilityLabel={'Open ' + lead.company_name} onPress={onPress} style={styles.card}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
      <Text style={[styles.value, { flex: 1, fontSize: 16 }]}>{lead.company_name}</Text>
      <Text style={[styles.label, { color: lead.priority === 'high' ? COLORS.red : COLORS.muted }]}>
        {lead.priority.toUpperCase()}
      </Text>
    </View>
    <Text style={styles.subtitle}>{lead.contact_name || 'No contact'} · {lead.industry}</Text>
    {lead.phone ? <Text style={styles.subtitle}>{lead.phone}</Text> : null}
    <Text style={styles.subtitle}>Status: {lead.stage.replace(/_/g, ' ')}</Text>
    {lead.next_action ? <Text style={{ color: COLORS.primaryDark, fontWeight: '700' }}>
      Next: {lead.next_action}{lead.next_action_at ? ' · ' + lead.next_action_at : ''}
    </Text> : null}
  </Pressable>;
}
