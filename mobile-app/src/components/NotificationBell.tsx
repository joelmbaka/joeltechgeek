import { useEffect, useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { AppState, Pressable, Text, View } from 'react-native';
import { useAuth } from '@/lib/AuthProvider';
import { getCrmUnreadCount, subscribeInboxChanges } from '@/lib/notification-inbox';
import { useTheme } from '@/lib/config';

/** Server-authoritative badge: only reminders that are due and unread. */
export function NotificationBell() {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    let active = true;
    const refresh = () => {
      if (AppState.currentState === 'background') return;
      void getCrmUnreadCount()
        .then((value) => {
          if (active) setCount(Number.isFinite(value) ? Math.max(0, value) : 0);
        })
        .catch(() => { /* Keep last confirmed count during an access/network race. */ });
    };
    refresh();
    const unsubscribe = subscribeInboxChanges(refresh);
    const timer = setInterval(refresh, 60_000);
    const state = AppState.addEventListener('change', (value) => {
      if (value === 'active') refresh();
    });
    return () => {
      active = false;
      clearInterval(timer);
      state.remove();
      unsubscribe();
    };
  }, [user?.id]);

  if (!user) return null;
  return <Pressable accessibilityRole="button"
    accessibilityLabel={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
    hitSlop={8}
    // This screen exists in src/app and the Stack; Expo's generated route types
    // can lag until Metro regenerates .expo/types after a new route is added.
    onPress={() => router.push('/notifications' as Href)}
    style={{ width: 42, height: 42, marginRight: 4,
      alignItems: 'center', justifyContent: 'center' }}>
    <SymbolView
      name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
      tintColor={theme.ink} size={25}
      fallback={<Text style={{ color: theme.ink, fontSize: 23 }}>🔔</Text>}
    />
    {count > 0 ? <View style={{
      position: 'absolute', top: 0, right: -1, minWidth: 19,
      height: 19, borderRadius: 10, paddingHorizontal: 3,
      borderWidth: 2, borderColor: theme.white,
      backgroundColor: '#DC2626',
      justifyContent: 'center', alignItems: 'center',
    }}>
      <Text style={{ color: '#FFFFFF', fontSize: 9, lineHeight: 12,
        fontWeight: '900', fontVariant: ['tabular-nums'] }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View> : null}
  </Pressable>;
}
