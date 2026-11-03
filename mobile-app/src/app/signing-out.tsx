import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';
import { LoadingState } from '@/components/LoadingState';

/** Dedicated transition screen: keep progress visible until auth is restored. */
export default function SigningOutScreen() {
  const { logout } = useAuth();
  const theme = useTheme();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void logout();
  }, [logout]);
  return <View style={{ flex: 1, backgroundColor: theme.background }}>
    <LoadingState label="Signing out securely…" fullScreen/>
  </View>;
}
