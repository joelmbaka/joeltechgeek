import { Stack } from 'expo-router';
import { AuthProvider } from '@/lib/AuthProvider';
import { COLORS } from '@/lib/config';

export default function RootLayout() {
  return <AuthProvider>
    <Stack screenOptions={{
      headerStyle: { backgroundColor: COLORS.white },
      headerTintColor: COLORS.ink,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: COLORS.background },
    }}>
      <Stack.Screen name="index" options={{ title: 'Agent CRM' }}/>
      <Stack.Screen name="leads/new" options={{ title: 'Add lead' }}/>
      <Stack.Screen name="leads/[id]" options={{ title: 'Lead details' }}/>
    </Stack>
  </AuthProvider>;
}
