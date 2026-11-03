import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useState } from 'react';
import { Button, useUIStyles } from '@/components/ui';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';
import { LoadingState } from '@/components/LoadingState';

/** Dedicated transition screen: keep progress visible until auth is restored. */
export default function SigningOutScreen() {
  const { logout } = useAuth();
  const theme = useTheme();
  const styles = useUIStyles();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const finish = async () => {
    setError(null);
    try { await logout(); }
    catch {
      setError('Unable to finish signing out. Please try again.');
    }
  };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void finish();
  }, []);
  return <View style={{ flex: 1, backgroundColor: theme.background }}>
    {error ? <View style={{ flex: 1, justifyContent: 'center',
      padding: 24, gap: 14 }}>
      <Text style={[styles.error, { textAlign: 'center' }]}>{error}</Text>
      <Button onPress={() => void finish()}>Retry sign out</Button>
    </View> : <LoadingState label="Signing out securely…" fullScreen/>}
  </View>;
}
