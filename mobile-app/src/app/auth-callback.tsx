import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Page, Button, useUIStyles } from '@/components/ui';
import { LoadingState } from '@/components/LoadingState';
import { exchangeGoogleCode, getAgent } from '@/lib/session';

const ERRORS: Record<string, string> = {
  access_denied: 'Google sign-in was cancelled.',
  account_not_invited: 'This Google account is not registered for CRM access. Choose another account.',
  google_email_unverified: 'This Google email address is not verified.',
  configuration_error: 'Google sign-in is not configured on the server.',
  provider_error: 'Google sign-in could not be completed.',
  invalid_response: 'Google sent an invalid sign-in response.',
};

export default function AuthCallback() {
  const styles = useUIStyles();
  const { code, error: authError } = useLocalSearchParams<{ code?: string; error?: string }>();
  const router = useRouter();
  const started = useRef('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (getAgent()) { router.replace('/'); return; }
    if (typeof authError === 'string' && authError) {
      setError(ERRORS[authError] || 'Google sign-in failed. Try another account.');
      return;
    }
    if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(code)) {
      setError('Google sign-in did not return a valid code. Please retry.');
      return;
    }
    if (started.current === code) return;
    started.current = code;
    let active = true;
    void exchangeGoogleCode(code).then(() => {
      if (active) router.replace('/');
    }).catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    });
    return () => { active = false; };
  }, [code, authError, router]);

  return <Page scroll={false}>
    {error ? <View style={{
      flex: 1, justifyContent: 'center', padding: 24, gap: 18,
    }}>
      <Text style={[styles.error, { fontSize: 15, textAlign: 'center' }]}>{error}</Text>
      <Button onPress={() => router.replace('/')}>Choose another Google account</Button>
    </View> : <LoadingState label="Completing Google sign-in…" fullScreen/>}
  </Page>;
}
