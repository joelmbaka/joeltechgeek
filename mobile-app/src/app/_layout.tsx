import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/AuthProvider';
import { HeaderProfileMenu } from '@/components/HeaderProfileMenu';
import { COLORS } from '@/lib/config';

function Navigation() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const headerBackground = dark ? COLORS.ink : COLORS.white;
  return <>
    <StatusBar style="auto" hidden={false} backgroundColor={headerBackground} />
    <Stack screenOptions={{
      headerStyle: { backgroundColor: headerBackground },
      headerTintColor: dark ? COLORS.white : COLORS.ink,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: COLORS.background },
    }}>
      <Stack.Screen name="index" options={{
        title: 'JoelTechGeek CRM',
        headerBackVisible: false,
        headerLeft: () => null,
        headerRight: () => <HeaderProfileMenu />,
      }}/>
      <Stack.Screen name="profile" options={{ title: 'Profile' }}/>
      <Stack.Screen name="auth-callback" options={{ title: 'Google sign-in' }}/>
      <Stack.Screen name="leads/new" options={{ title: 'Add lead' }}/>
      <Stack.Screen name="leads/[id]" options={{ title: 'Lead details' }}/>
    </Stack>
  </>;
}

export default function RootLayout() {
  return <SafeAreaProvider>
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  </SafeAreaProvider>;
}
