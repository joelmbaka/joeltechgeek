import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button, Page, useUIStyles } from '@/components/ui';
import { NotificationCardSkeleton } from '@/components/Skeleton';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import {
  listCrmNotifications, markCrmNotificationRead,
  type CrmInboxNotification, type InboxSection,
} from '@/lib/notification-inbox';

const PAGE_SIZE = 25;

type InboxRow =
  | { kind: 'notification'; key: string; section: InboxSection; item: CrmInboxNotification }
  | { kind: 'read-header'; key: string }
  | { kind: 'empty' | 'loading' | 'error' | 'more'; key: string; section: InboxSection };

function appendUnique(
  existing: CrmInboxNotification[], incoming: CrmInboxNotification[],
): CrmInboxNotification[] {
  const seen = new Set(existing.map(item => item.id));
  return [...existing, ...incoming.filter(item => !seen.has(item.id))];
}

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }) : 'Follow-up';
}

/** Due reminders stay unread until opened; read history is available for seven days. */
export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const styles = useUIStyles();
  const theme = useTheme();

  const [unreadItems, setUnreadItems] = useState<CrmInboxNotification[]>([]);
  const [readItems, setReadItems] = useState<CrmInboxNotification[]>([]);
  const [readExpanded, setReadExpanded] = useState(false);
  const [unreadHasMore, setUnreadHasMore] = useState(false);
  const [readHasMore, setReadHasMore] = useState(false);
  const [unreadLoading, setUnreadLoading] = useState(true);
  const [readLoading, setReadLoading] = useState(false);
  const [unreadError, setUnreadError] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Ignore responses from previous focus, page, or foreground requests.
  const requests = useRef({ unread: 0, read: 0 });

  const fetchPage = useCallback((
    section: InboxSection, offset = 0, signal?: AbortSignal,
  ) => {
    if (!user) return;
    const version = ++requests.current[section];
    const setItems = section === 'unread' ? setUnreadItems : setReadItems;
    const setLoading = section === 'unread' ? setUnreadLoading : setReadLoading;
    const setError = section === 'unread' ? setUnreadError : setReadError;
    const setHasMore = section === 'unread' ? setUnreadHasMore : setReadHasMore;
    setLoading(true);
    setError(null);
    void listCrmNotifications(section, PAGE_SIZE, offset, signal)
      .then(result => {
        if (signal?.aborted || version !== requests.current[section]) return;
        setItems(current => offset === 0
          ? result.notifications : appendUnique(current, result.notifications));
        setHasMore(result.has_more);
      })
      .catch(() => {
        if (signal?.aborted || version !== requests.current[section]) return;
        setError(section === 'unread'
          ? 'Could not load unread reminders.' : 'Could not load recently read reminders.');
      })
      .finally(() => {
        if (!signal?.aborted && version === requests.current[section]) setLoading(false);
      });
  }, [user?.id]);

  const refresh = useCallback((signal: AbortSignal) => {
    fetchPage('unread', 0, signal);
    if (readExpanded) fetchPage('read', 0, signal);
  }, [fetchPage, readExpanded]);
  useFreshOnFocus(refresh, [refresh]);

  const open = async (item: CrmInboxNotification) => {
    if (busy) return;
    setBusy(item.id);
    try {
      if (!item.read_at) {
        await markCrmNotificationRead(item.id);
        setUnreadItems(current => current.filter(row => row.id !== item.id));
      }
    } catch {
      // Do not block navigation during a temporary connection failure.
      // The server remains authoritative; the item will be shown on refresh.
    } finally {
      setBusy(null);
      router.push({ pathname: '/leads/[id]', params: { id: item.lead_id } });
    }
  };

  const more = (section: InboxSection) => {
    if (busy) return;
    if (section === 'unread') {
      if (!unreadLoading && unreadHasMore) fetchPage('unread', unreadItems.length);
    } else if (!readLoading && readHasMore) {
      fetchPage('read', readItems.length);
    }
  };

  const rows: InboxRow[] = unreadItems.map(item => ({
    kind: 'notification', section: 'unread', item, key: 'unread:' + item.id,
  }));
  if (unreadError) rows.push({ kind: 'error', section: 'unread', key: 'unread:error' });
  else if (unreadLoading && unreadItems.length === 0)
    rows.push({ kind: 'loading', section: 'unread', key: 'unread:loading' });
  else if (!unreadLoading && unreadItems.length === 0)
    rows.push({ kind: 'empty', section: 'unread', key: 'unread:empty' });
  if (unreadHasMore) rows.push({ kind: 'more', section: 'unread', key: 'unread:more' });

  rows.push({ kind: 'read-header', key: 'read-header' });
  if (readExpanded) {
    rows.push(...readItems.map(item => ({
      kind: 'notification' as const, section: 'read' as const,
      item, key: 'read:' + item.id,
    })));
    if (readError) rows.push({ kind: 'error', section: 'read', key: 'read:error' });
    else if (readLoading && readItems.length === 0)
      rows.push({ kind: 'loading', section: 'read', key: 'read:loading' });
    else if (!readLoading && readItems.length === 0)
      rows.push({ kind: 'empty', section: 'read', key: 'read:empty' });
    if (readHasMore) rows.push({ kind: 'more', section: 'read', key: 'read:more' });
  }

  const renderRow = (row: InboxRow) => {
    if (row.kind === 'read-header') return <Pressable
      accessibilityRole="button"
      accessibilityLabel={readExpanded ? 'Hide recently read notifications' : 'Show recently read notifications'}
      onPress={() => setReadExpanded(expanded => !expanded)}
      style={[styles.card, { marginHorizontal: 18, marginTop: 12,
        marginBottom: 12, paddingVertical: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={[styles.value, { fontSize: 17, flex: 1 }]}>Recently read</Text>
        <Text style={{ color: theme.primaryDark, fontWeight: '800' }}>
          {readExpanded ? 'Hide  ⌃' : 'Show  ⌄'}
        </Text>
      </View>
    </Pressable>;

    if (row.kind === 'notification') {
      const unread = row.section === 'unread';
      return <Pressable
        accessibilityRole="button"
        accessibilityLabel={(unread ? 'Unread. ' : 'Read. ') + row.item.title + '. ' + row.item.body}
        onPress={() => void open(row.item)}
        disabled={busy !== null}
        style={[styles.card, { marginHorizontal: 18, marginBottom: 10,
          opacity: unread ? 1 : 0.72 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          {unread ? <View style={{ width: 8, height: 8, borderRadius: 5,
            backgroundColor: theme.primary }} /> : null}
          <Text style={[styles.value, { flex: 1 }]}>{row.item.title}</Text>
        </View>
        <Text style={styles.subtitle}>{row.item.body}</Text>
        <Text style={styles.label}>
          {dateLabel(row.item.due_at)} · {unread ? 'Unread' : 'Read'}
        </Text>
      </Pressable>;
    }

    if (row.kind === 'more') return <View style={{ marginHorizontal: 18,
      marginBottom: 12 }}>
      <Button secondary onPress={() => more(row.section)}
        disabled={row.section === 'unread' ? unreadLoading : readLoading}>
        {(row.section === 'unread' ? unreadLoading : readLoading)
          ? 'Loading…' : 'Load more'}
      </Button>
    </View>;

    if (row.kind === 'error') return <View style={[styles.card,
      { marginHorizontal: 18, marginBottom: 10 }]}>
      <Text style={styles.error}>
        {row.section === 'unread' ? unreadError : readError}
      </Text>
      <Button secondary onPress={() => fetchPage(row.section, 0)}>Retry</Button>
    </View>;

    if (row.kind === 'loading') return <View style={{marginHorizontal:18,marginBottom:12}}>
      <NotificationCardSkeleton count={row.section === 'unread' ? 3 : 2}/>
    </View>;

    return <Text style={[styles.subtitle,{marginHorizontal:20,
      marginBottom:18,marginTop:4}]}>
      {row.section === 'unread' ? 'You’re all caught up — no unread reminders.'
        : 'No notifications read in the last 7 days.'}
    </Text>;
  };

  if (!user) return <Page>
    <Text style={styles.subtitle}>Sign in to view notifications.</Text>
  </Page>;

  return <Page scroll={false}>
    <FlatList
      style={{ flex: 1 }}
      data={rows}
      keyExtractor={row => row.key}
      renderItem={({ item }) => renderRow(item)}
      contentContainerStyle={{ paddingBottom: 38 }}
      ListHeaderComponent={<View style={{ paddingHorizontal: 18,
        paddingTop: 18, paddingBottom: 12 }}>
        <Text style={[styles.value, { fontSize: 17 }]}>Unread</Text>
        <Text style={styles.subtitle}>Oldest due first</Text>
      </View>}
    />
  </Page>;
}
