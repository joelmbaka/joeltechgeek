import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Image, Linking, Pressable, RefreshControl, Text, TextInput, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Busy, Button, styles } from '@/components/ui';
import { SelectSheet, type SelectOption } from '@/components/SelectSheet';
import { LeadCardSkeleton } from '@/components/Skeleton';
import { COLORS, API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import type { Lead, LeadList } from '@/lib/types';

const PER_PAGE = 25;
const SORTS: SelectOption[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'recent', label: 'Recently updated' },
  { value: 'company', label: 'Company A–Z' },
  { value: 'priority', label: 'Priority' },
  { value: 'followup', label: 'Next follow-up' },
];

function BrandMark({ dark }: { dark: boolean }) {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source={dark ? require('../../assets/images/auth-logo-dark.png') : require('../../assets/images/auth-logo.png')}
    style={{ width: 108, height: 108, alignSelf: 'center' }}
    resizeMode="contain"
    accessibilityLabel="JoelTechGeek logo" />;
}

export default function HomeScreen() {
  const brandScheme = useColorScheme();
  const { ready, agent, login, reviewLogin, error: authError } = useAuth();
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
  const [reviewAvailable, setReviewAvailable] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => { setOffset(0); }, [debounced, queue, industry, sort]);

  // The backend controls whether to display review access. No account
  // credentials or privileged tokens are embedded in the Android app.
  useEffect(() => {
    if (!ready || agent) { setReviewAvailable(false); return; }
    const controller = new AbortController();
    void fetch(API_BASE_URL + '/api/agent-crm/mobile/review', {
      signal: controller.signal, cache: 'no-store',
    }).then((response) => response.ok ? response.json() : null)
      .then((body: { enabled?: boolean } | null) => {
        if (!controller.signal.aborted) setReviewAvailable(body?.enabled === true);
      }).catch(() => {
        if (!controller.signal.aborted) setReviewAvailable(false);
      });
    return () => controller.abort();
  }, [ready, agent?.id]);

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
    // Prepare the list's loading state BEFORE navigating. The underlying
    // screen remains mounted in the stack; when Android Back returns, users
    // immediately see skeleton cards, not stale results or an empty viewport.
    setLoading(true);
    setData(null);
    setMessage(null);
    // Returning from a searched lead should show the ordinary lead list.
    setSearch('');
    setOffset(0);
    router.push({ pathname: '/leads/[id]', params: { id } });
  };

  const openReview = async () => {
    if (reviewBusy) return;
    setReviewBusy(true);
    try { await reviewLogin(); } finally { setReviewBusy(false); }
  };

  if (!ready) return <SafeAreaView edges={['bottom']} style={styles.screen}>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <BrandMark dark={brandScheme === 'dark'}/>
      <Busy label="Restoring your session…"/>
    </View>
  </SafeAreaView>;
  if (!agent) return <SafeAreaView edges={['left','right','bottom']} style={styles.screen}>
    <View style={{ padding: 22, gap: 16 }}>
      <BrandMark dark={brandScheme === 'dark'}/>
      <Text style={[styles.title, { textAlign: 'center' }]}>JoelTechGeek CRM</Text>
      <Text style={styles.subtitle}>Sign in with your registered Google account.</Text>
      {authError ? <Text style={styles.error}>{authError}</Text> : null}
      <Button onPress={() => void login()}>Continue with Google</Button>
      {reviewAvailable ? <>
        <Button secondary disabled={reviewBusy} onPress={() => void openReview()}>
          {reviewBusy ? 'Opening review workspace…' : 'Review access'}
        </Button>
        <Text style={styles.subtitle}>Explore the CRM with fictional sample leads.</Text>
      </> : null}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Read Privacy Policy"
        onPress={() => void Linking.openURL('https://joeltechgeek.com/privacy')
          .catch(() => Alert.alert('Unable to open', 'Please visit joeltechgeek.com/privacy in your browser.'))}
        style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: COLORS.primaryDark, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' }}>Privacy Policy</Text>
      </Pressable>
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
      contentContainerStyle={{ padding: 14, paddingBottom: 30, gap: 9 }}
      ListHeaderComponent={<View style={{ gap: 10 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          minHeight: 38, gap: 10,
        }}>
          <Text style={{
            color: COLORS.muted, fontSize: 12, fontWeight: '800', letterSpacing: .6,
          }}>MY WORK</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add lead"
            hitSlop={4}
            onPress={() => router.push('/leads/new')}
            style={{
              backgroundColor: COLORS.primary, borderRadius: 10, minHeight: 36,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              paddingHorizontal: 14, gap: 6,
            }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>+</Text>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Add lead</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 9 }}>
          {([
            { label: 'To call', value: stats?.to_call, queue: 'to_call' },
            { label: 'Follow-ups due', value: stats?.followups_due, queue: 'due' },
          ] as const).map((metric) => (
            <Pressable key={metric.queue}
              accessibilityRole="button"
              accessibilityLabel={metric.label + ', ' + (metric.value ?? 'loading') + ' leads'}
              onPress={() => setQueue(metric.queue)}
              style={[styles.card, {
                flex: 1, minWidth: 0, minHeight: 70, paddingHorizontal: 13,
                paddingVertical: 10, gap: 5,
                borderColor: queue === metric.queue ? COLORS.primary : COLORS.border,
              }]}>
              <Text numberOfLines={1} style={[styles.label, { fontSize: 12 }]}>
                {metric.label}
              </Text>
              {loading ? <View style={{
                height: 23, width: 36, borderRadius: 6, backgroundColor: '#DEE7EA',
              }}/> : <Text style={{
                color: COLORS.ink, fontSize: 24, lineHeight: 27,
                fontWeight: '800', fontVariant: ['tabular-nums'],
              }}>{metric.value ?? 0}</Text>}
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 9 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <SelectSheet title="Work queue" value={queue}
              options={queueOptions} onChange={setQueue}/>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <SelectSheet title="Industry" value={industry}
              options={industryOptions} onChange={setIndustry} searchable/>
          </View>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', marginTop: 2, gap: 8,
        }}>
          <Text style={{ color: COLORS.ink, fontSize: 16, fontWeight: '800' }}>
            Leads{!loading && stats ? ' (' + stats.total + ')' : ''}
          </Text>
          <SelectSheet title="Sort" value={sort}
            options={SORTS} onChange={setSort} compact/>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search leads"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none" autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search company, contact, phone or email"
          />
          {search ? <Pressable accessibilityRole="button"
            accessibilityLabel="Clear search" hitSlop={10}
            onPress={() => setSearch('')}>
            <Text style={{ color: COLORS.muted, fontSize: 22 }}>×</Text>
          </Pressable> : null}
        </View>
        {message ? <View style={styles.card}>
          <Text style={styles.error}>{message}</Text>
          <Button secondary onPress={refresh}>Retry loading leads</Button>
        </View> : null}
        {!loading && data && data.leads.length === 0 && !message ?
          <Text style={styles.subtitle}>No leads match your search or filters.</Text> : null}
      </View>}
      renderItem={({ item }) => <LeadRow lead={item} onPress={() => openLead(item.id)}/>}
      ListEmptyComponent={loading ? <LeadCardSkeleton count={PER_PAGE}/> : undefined}
      ListFooterComponent={<View style={{ gap: 12, paddingTop: 5 }}>
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
