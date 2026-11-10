import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, useUIStyles } from '@/components/ui';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';

/** Backward-compatible fallback for an existing sign-out route; profile signs out in place. */
export default function SigningOutScreen() {
  const { logout } = useAuth();
  const theme = useTheme();
  const styles = useUIStyles();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const finish = useCallback(async () => {
    setError(null);
    try { await logout(); }
    catch {
      setError('Unable to finish signing out. Please try again.');
    }
  }, [logout]);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void finish();
  }, [finish]);
  return <View style={{ flex: 1, backgroundColor: theme.background }}>
    {error ? <View style={{ flex: 1, justifyContent: 'center',
      padding: 24, gap: 14 }}>
      <Text style={[styles.error, { textAlign: 'center' }]}>{error}</Text>
      <Button onPress={() => void finish()}>Retry sign out</Button>
    </View> : <View accessible accessibilityLabel="Signing out securely"
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={[styles.subtitle, { textAlign: 'center' }]}>Signing out securely…</Text>
    </View>}
  </View>;
}
