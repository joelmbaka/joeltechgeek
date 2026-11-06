import { Stack } from 'expo-router';
import { Image, Text, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/AuthProvider';
import { HeaderProfileMenu } from '@/components/HeaderProfileMenu';
import { NotificationBell } from '@/components/NotificationBell';
import { AppDialogProvider } from '@/components/AppDialog';
import { useTheme } from '@/lib/config';

function Navigation() {
  const { user } = useAuth();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const theme = useTheme();
  const headerBackground = dark ? '#0A2836' : '#FFFFFF';
  return <>
    <StatusBar style={dark ? 'light' : 'dark'} hidden={false}/>
    <Stack screenOptions={{
      headerStyle: { backgroundColor: headerBackground },
      headerTintColor: theme.ink,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: theme.background },
    }}>
      <Stack.Screen name="index" options={{
        title: '',
        headerShown: !!user,
        headerTitleAlign: 'left',
        headerTitle: () => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 }}>
          <Image
            alt="JoelTechGeek"
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            source={dark ? require('../../assets/images/header-logo-dark.png') : require('../../assets/images/header-logo.png')}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
            accessibilityLabel="JoelTechGeek" />
          <Text numberOfLines={1} style={{ color: theme.ink, fontWeight: '800', fontSize: 16 }}>
            JoelTechGeek CRM
          </Text>
        </View>,
        headerBackVisible: false,
        headerLeft: () => null,
        headerRight: () => <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <NotificationBell />
          <HeaderProfileMenu />
        </View>,
      }}/>
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }}/>
      <Stack.Screen name="profile" options={{ title: 'Profile' }}/>
      <Stack.Screen name="signing-out" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}/>
      <Stack.Screen name="auth-callback" options={{ title: 'Google sign-in' }}/>
      <Stack.Screen name="leads/new" options={{ title: 'Add lead' }}/>
      <Stack.Screen name="leads/[id]" options={{ title: 'Lead details' }}/>
    </Stack>
  </>;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const backgroundColor = scheme === 'dark' ? '#0A2836' : '#FFFFFF';
  return <SafeAreaProvider style={{ flex: 1, backgroundColor }}>
    <AuthProvider>
      <AppDialogProvider>
        <Navigation />
      </AppDialogProvider>
    </AuthProvider>
  </SafeAreaProvider>;
}
