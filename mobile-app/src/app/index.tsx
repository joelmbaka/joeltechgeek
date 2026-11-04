import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Image, Pressable, RefreshControl, Text, TextInput, View, useColorScheme } from 'react-native';
import { LoadingState } from '@/components/LoadingState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, useUIStyles } from '@/components/ui';
import { SelectSheet, type SelectOption } from '@/components/SelectSheet';
import { LeadCardSkeleton } from '@/components/Skeleton';
import { PriorityChip } from '@/components/PriorityChip';
import { useTheme, API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import { useDailyMantra } from '@/lib/dailyMantra';
import type { Lead, LeadList } from '@/lib/types';

// Keep the review login flow intact for future Play review submissions.
// Switch to true when reviewer access must be visible in a new Android build.
const SHOW_REVIEW_ACCESS_BUTTON = true;
const PER_PAGE = 25;
function todayLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(date).replace(',', '');
}
const SORTS: SelectOption[] = [
  { value: 'recommended', label: 'Default' },
  { value: 'recent', label: 'Recent' },
  { value: 'company', label: 'A–Z' },
  { value: 'priority', label: 'Priority' },
  { value: 'followup', label: 'Follow-up' },
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
  const theme = useTheme();
  const styles = useUIStyles();
  const { mantra, now } = useDailyMantra();
  const { ready, user, login, reviewLogin, error: authError } = useAuth();
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
  const listRef = useRef<FlatList<Lead>>(null);
  const listHeaderHeight = useRef(0);
  const pendingPageScroll = useRef(false);

  useEffect(() => { setOffset(0); }, [debounced, queue, industry, sort]);

  // The backend controls whether to display review access. No account
  // credentials or privileged tokens are embedded in the Android app.
  useEffect(() => {
    if (!ready || user) { setReviewAvailable(false); return; }
    const controller = new AbortController();
    void fetch(API_BASE_URL + '/api/user-crm/mobile/review', {
      signal: controller.signal, cache: 'no-store',
    }).then((response) => response.ok ? response.json() : null)
      .then((body: { enabled?: boolean } | null) => {
        if (!controller.signal.aborted) setReviewAvailable(body?.enabled === true);
      }).catch(() => {
        if (!controller.signal.aborted) setReviewAvailable(false);
      });
    return () => controller.abort();
  }, [ready, user?.id]);

  const fetchPage = useCallback((signal: AbortSignal) => {
    if (!user) return;
    const version = ++requestVersion.current;
    setLoading(true);
    setMessage(null);
    setData(null); // Never show a previous page as current during a new request.
    const params = new URLSearchParams({
      limit: String(PER_PAGE), offset: String(offset),
      q: debounced, queue, industry, sort,
    });
    void apiFetch<LeadList>('/api/user-crm/leads?' + params, { signal })
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
  }, [user?.id, offset, debounced, queue, industry, sort]);

  useFreshOnFocus(fetchPage, [fetchPage]);

  // Keep pagination anchored at the first lead rather than the previous page's footer.
  // FlatList includes the dashboard/search header before its rows, so offset 0
  // would put users above the leads instead of at the first record.
  const scrollToFirstLead = () => {
    listRef.current?.scrollToOffset({
      offset: listHeaderHeight.current + 14 + 9, // content top padding + row gap
      animated: false,
    });
  };
  const changePage = (nextOffset: number) => {
    if (nextOffset === offset) return;
    pendingPageScroll.current = true;
    scrollToFirstLead();
    setOffset(nextOffset);
  };

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
    <LoadingState label="Restoring your session…" fullScreen/>
  </SafeAreaView>;
  if (!user) return <SafeAreaView edges={['left','right','bottom']} style={styles.screen}>
    <View style={{ flex: 1, padding: 22, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: '100%', maxWidth: 360, padding: 24, gap: 14,
        backgroundColor: theme.white, borderColor: theme.border, borderWidth: 1,
        borderRadius: 24, elevation: 3,
        shadowColor: '#000', shadowOpacity: .08, shadowRadius: 16, shadowOffset: { width: 0, height: 5 },
      }}>
        <BrandMark dark={brandScheme === 'dark'}/>
        <Text style={[styles.title, { textAlign: 'center', fontSize: 22 }]}>JoelTechGeek CRM</Text>
        <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 6 }]}>Sign in to continue</Text>
        {authError ? <Text style={[styles.error, { textAlign: 'center' }]}>{authError}</Text> : null}
        <Button onPress={() => void login()}>Continue with Google</Button>
        {SHOW_REVIEW_ACCESS_BUTTON && reviewAvailable ? <Button secondary disabled={reviewBusy} onPress={() => void openReview()}>
          {reviewBusy ? 'Opening review workspace…' : 'Review access'}
        </Button> : null}
      </View>
    </View>
  </SafeAreaView>;

  const stats = loading ? null : data?.stats || null;
  const queueOptions: SelectOption[] = [
    { value: 'all', label: 'All leads' },
    { value: 'to_call', label: 'To call' },
    { value: 'due', label: 'Follow-ups due' },
    { value: 'interested', label: 'Interested' },
  ];
  const industryOptions: SelectOption[] = [
    { value: 'all', label: 'All categories' },
    { value: '__uncategorized__', label: 'No category' },
    ...(data?.industries || (industry === 'all' ? [] : [industry])).map((name) => ({
      value: name, label: name,
    })),
  ];
  return <SafeAreaView edges={['left','right','bottom']} style={styles.screen}>
    <FlatList
      ref={listRef}
      data={loading ? [] : (data?.leads || [])}
      onContentSizeChange={() => {
        // The new page's rows must be laid out before the final scroll correction.
        if (pendingPageScroll.current && !loading && data?.offset === offset) {
          pendingPageScroll.current = false;
          scrollToFirstLead();
        }
      }}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary}/>}
      contentContainerStyle={{ padding: 14, paddingBottom: 30, gap: 9 }}
      ListHeaderComponent={<View style={{ gap: 10 }}
        onLayout={(event) => { listHeaderHeight.current = event.nativeEvent.layout.height; }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          minHeight: 38, gap: 10,
        }}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}
            style={{
              color: theme.muted, fontSize: 12, fontWeight: '800',
              letterSpacing: .1, flexShrink: 1,
            }}>Today&apos;s Focus · {todayLabel(now)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add lead"
            hitSlop={4}
            onPress={() => router.push('/leads/new')}
            style={{
              backgroundColor: theme.primary, borderRadius: 10, minHeight: 36,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              paddingHorizontal: 14, gap: 6,
            }}>
            <Text style={{ color: theme.onPrimary, fontSize: 17, fontWeight: '600' }}>+</Text>
            <Text style={{ color: theme.onPrimary, fontSize: 13, fontWeight: '800' }}>Add lead</Text>
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
                borderColor: queue === metric.queue ? theme.primary : theme.border,
              }]}>
              <Text numberOfLines={1} style={[styles.label, { fontSize: 12 }]}>
                {metric.label}
              </Text>
              {loading ? <View style={{
                height: 23, width: 36, borderRadius: 6, backgroundColor: theme.surfaceMuted,
              }}/> : <Text style={{
                color: theme.ink, fontSize: 24, lineHeight: 27,
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
            <SelectSheet title="Business category" value={industry}
              options={industryOptions} onChange={setIndustry} searchable/>
          </View>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', gap: 8, marginTop: 2,
        }}>
          <Text accessibilityRole="header" numberOfLines={2}
            adjustsFontSizeToFit minimumFontScale={0.8}
            style={{
              color: theme.ink, fontSize: 17, fontWeight: '900',
              letterSpacing: .2, flex: 1, minWidth: 0,
            }}>
            {mantra}
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
            placeholderTextColor={theme.muted}
            autoCapitalize="none" autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search company, contact, phone or email"
          />
          {search ? <Pressable accessibilityRole="button"
            accessibilityLabel="Clear search" hitSlop={10}
            onPress={() => setSearch('')}>
            <Text style={{ color: theme.muted, fontSize: 22 }}>×</Text>
          </Pressable> : null}
        </View>
        {message ? <View style={styles.card}>
          <Text style={styles.error}>{message}</Text>
          <Button secondary onPress={refresh}>Retry loading leads</Button>
        </View> : null}
        {!loading && data?.leads.length === 0 && !message ?
          <Text style={styles.subtitle}>No leads match your search or filters.</Text> : null}
      </View>}
      renderItem={({ item }) => <LeadRow lead={item} onPress={() => openLead(item.id)}/>}
      ListEmptyComponent={loading ? <LeadCardSkeleton count={PER_PAGE}/> : undefined}
      ListFooterComponent={!loading && data && ((data?.leads.length ?? 0) > 0 || (data?.filtered_total ?? 0) > 0) ?
        <View style={[styles.card, { gap: 11, marginTop: 6, padding: 15 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <View style={{ gap: 4, flexShrink: 1 }}>
              <Text style={[styles.value, { fontSize: 13, fontVariant: ['tabular-nums'] }]}>
                Showing {offset + 1}–{offset + (data?.leads.length ?? 0)}
                {Number.isFinite(data?.filtered_total) ? ' of ' + data?.filtered_total : ''}
              </Text>
              <Text style={styles.subtitle}>
                {Number.isFinite(data?.filtered_total)
                  ? Math.max(0, (data?.filtered_total ?? 0) - offset - (data?.leads.length ?? 0)) + ' remaining'
                  : data?.has_more ? 'More leads available' : 'End of list'}
              </Text>
            </View>
            <View style={{ backgroundColor: theme.surfaceMuted, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 7 }}>
              <Text style={[styles.label, { color: theme.ink }]}>
                Page {Math.floor(offset / PER_PAGE) + 1}
                {Number.isFinite(data?.filtered_total) ? ' / ' + Math.ceil((data?.filtered_total ?? 0) / PER_PAGE) : ''}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button secondary disabled={offset === 0}
                onPress={() => changePage(Math.max(0, offset - PER_PAGE))}>‹ Previous</Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button secondary disabled={!data?.has_more}
                onPress={() => changePage(offset + PER_PAGE)}>Next ›</Button>
            </View>
          </View>
        </View> : undefined}
    />
  </SafeAreaView>;
}

function LeadRow({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  const theme = useTheme();
  const styles = useUIStyles();
  return <Pressable accessibilityRole="button"
    accessibilityLabel={'Open ' + (lead.company_name || lead.contact_name || 'Unnamed lead')} onPress={onPress} style={styles.card}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
      <Text style={[styles.value, { flex: 1, fontSize: 16 }]}>{lead.company_name || lead.contact_name || 'Unnamed lead'}</Text>
      <PriorityChip priority={lead.priority}/>
    </View>
    <Text style={styles.subtitle}>
      {lead.company_name ? (lead.contact_name || 'No contact') : (lead.contact_role || 'No company')}
      {lead.industry ? ' · ' + lead.industry : ''}
    </Text>
    {lead.phone ? <Text style={styles.subtitle}>{lead.phone}</Text> : null}
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5,
      backgroundColor: theme.surfaceMuted, borderColor: lead.stage === 'competitor' ? theme.warning : theme.border,
      borderWidth: 1, borderRadius: 20 }}>
      <Text style={[styles.label, { color: lead.stage === 'competitor' ? theme.warning : theme.muted, textTransform: 'capitalize' }]}>
        {lead.stage.replace(/_/g, ' ')}
      </Text>
    </View>
    {lead.next_action ? <Text style={{ color: theme.primaryDark, fontWeight: '700' }}>
      Next: {lead.next_action}{lead.next_action_at ? ' · ' + lead.next_action_at : ''}
    </Text> : null}
  </Pressable>;
}
