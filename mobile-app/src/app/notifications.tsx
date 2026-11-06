import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Page, useUIStyles } from '@/components/ui';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import {
  listCrmNotifications, markCrmNotificationRead,
  type CrmInboxNotification,
} from '@/lib/notification-inbox';

const PAGE_SIZE = 50;

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const styles = useUIStyles();
  const theme = useTheme();
  const [items, setItems] = useState<CrmInboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((signal: AbortSignal) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    void listCrmNotifications(PAGE_SIZE).then((result) => {
      if (signal.aborted) return;
      setItems(result.notifications);
      setHasMore(result.has_more);
    }).catch(() => {
      if (!signal.aborted) setError('Could not load notifications.');
    }).finally(() => {
      if (!signal.aborted) setLoading(false);
    });
  }, [user?.id]);
  useFreshOnFocus(load, [load]);

  const open = async (item: CrmInboxNotification) => {
    if (busy) return;
    setBusy(item.id);
    try {
      if (!item.read_at) {
        await markCrmNotificationRead(item.id);
        setItems((old) => old.map((row) => row.id === item.id
          ? { ...row, read_at: new Date().toISOString() } : row));
      }
    } catch {
      // Continue to the lead even if the read-state API is temporarily offline.
    } finally {
      setBusy(null);
      router.push({ pathname: '/leads/[id]', params: { id: item.lead_id } });
    }
  };

  const more = async () => {
    if (loading || busy || !hasMore) return;
    setLoading(true);
    try {
      const result = await listCrmNotifications(PAGE_SIZE, items.length);
      setItems((old) => {
        const seen = new Set(old.map((item) => item.id));
        return [...old, ...result.notifications.filter((item) => !seen.has(item.id))];
      });
      setHasMore(result.has_more);
    } catch { setError('Could not load more notifications.'); }
    finally { setLoading(false); }
  };

  if (!user) return <Page><Text style={styles.subtitle}>Sign in to view notifications.</Text></Page>;
  return <Page>
    <Text style={styles.title}>Notifications</Text>
    <Text style={styles.subtitle}>Follow-up reminders. Opening a reminder marks it as read.</Text>
    {error ? <View style={styles.card}>
      <Text style={styles.error}>{error}</Text>
      <Button secondary onPress={() => load(new AbortController().signal)}>Retry</Button>
    </View> : null}
    {loading && items.length === 0 ? <Text style={styles.subtitle}>Loading notifications…</Text> : null}
    {!loading && items.length === 0 && !error ?
      <Text style={styles.subtitle}>No notifications yet. Due follow-ups will appear here.</Text> : null}
    {items.map((item) => {
      const unread = !item.read_at;
      const time = new Date(item.due_at);
      return <Pressable key={item.id} accessibilityRole="button"
        accessibilityLabel={(unread ? 'Unread. ' : 'Read. ') + item.title + '. ' + item.body}
        onPress={() => void open(item)}
        disabled={busy !== null}
        style={[styles.card, { opacity: unread ? 1 : 0.72 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          {unread ? <View style={{ width: 8, height: 8, borderRadius: 5,
            backgroundColor: theme.primary }} /> : null}
          <Text style={[styles.value, { flex: 1 }]}>{item.title}</Text>
        </View>
        <Text style={styles.subtitle}>{item.body}</Text>
        <Text style={styles.label}>
          {Number.isFinite(time.getTime()) ? time.toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
          }) : 'Follow-up'}
          {unread ? ' · Unread' : ' · Read'}
        </Text>
      </Pressable>;
    })}
    {hasMore ? <Button secondary disabled={loading} onPress={() => void more()}>
      {loading ? 'Loading…' : 'Load more'}
    </Button> : null}
  </Page>;
}
