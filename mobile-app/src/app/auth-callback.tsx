import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Page, Busy, Button, styles } from '@/components/ui';
import { exchangeMobileCode, getAgent } from '@/lib/session';

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const consumed = useRef(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;
    if (getAgent()) { router.replace('/'); return; }
    if (!code || typeof code !== 'string') {
      setError('Missing Google sign-in code. Please restart sign-in.');
      return;
    }
    void exchangeMobileCode(code).then(() => router.replace('/'))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not sign in.'));
  }, [code, router]);
  return <Page>
    {error ? <>
      <Text style={styles.error}>{error}</Text>
      <Button onPress={() => router.replace('/')}>Back to sign in</Button>
    </> : <Busy label="Verifying your registered Google account…"/>}
  </Page>;
}
