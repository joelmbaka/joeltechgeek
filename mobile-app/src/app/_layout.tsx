import { Stack } from 'expo-router';
import { Image, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { HeaderProfileMenu } from '@/components/HeaderProfileMenu';
import { COLORS } from '@/lib/config';

function Navigation() {
  const { agent } = useAuth();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const headerBackground = dark ? COLORS.ink : COLORS.white;
  return <>
    <StatusBar style="auto" hidden={false} />
    <Stack screenOptions={{
      headerStyle: { backgroundColor: headerBackground },
      headerTintColor: dark ? COLORS.white : COLORS.ink,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: COLORS.background },
    }}>
      <Stack.Screen name="index" options={{
        title: '',
        headerShown: !!agent,
        headerTitleAlign: 'left',
        // eslint-disable-next-line jsx-a11y/alt-text
        headerTitle: () => <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={dark ? require('../../assets/images/header-logo-dark.png') : require('../../assets/images/header-logo.png')}
          style={{ width: 34, height: 34 }}
          resizeMode="contain"
          accessibilityLabel="JoelTechGeek" />,
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
  const scheme = useColorScheme();
  const backgroundColor = scheme === 'dark' ? COLORS.ink : COLORS.white;
  return <SafeAreaProvider style={{ flex: 1, backgroundColor }}>
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  </SafeAreaProvider>;
}
