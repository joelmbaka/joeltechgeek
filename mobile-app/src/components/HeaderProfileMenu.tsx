import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Platform, Pressable, StatusBar, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';
import { AgentAvatar } from './AgentAvatar';

export function HeaderProfileMenu() {
  const { agent } = useAuth();
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  if (!agent) return null;

  const displayName = (agent.name || agent.email || 'Agent').trim();
  // Non-translucent Android modals begin below the system status bar.
  // An Android native-stack header is 56dp high; keep the menu below it.
  // On iOS modal coordinates include the top safe-area inset.
  const menuTop = Platform.OS === 'android' ? 66 : insets.top + 52;
  return <>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open account menu"
      hitSlop={8}
      onPress={() => setVisible(true)}
      style={{
        marginRight: 8, width: 40, height: 40, borderRadius: 22,
        borderWidth: 1, borderColor: theme.border,
        backgroundColor: theme.white,
        alignItems: 'center', justifyContent: 'center',
      }}>
      <AgentAvatar name={displayName} pictureUrl={agent.picture_url} size={34} />
    </Pressable>
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent={false}
      onRequestClose={() => setVisible(false)}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor={dark ? '#0A2836' : '#FFFFFF'} translucent={false}/>
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Close account menu"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: 'transparent' }}
          onPress={() => setVisible(false)} />
        <View style={{
          position: 'absolute', top: menuTop, right: 12, width: 176,
          backgroundColor: theme.white, borderRadius: 15,
          borderWidth: 1, borderColor: theme.border,
          elevation: 7, paddingVertical: 2, shadowColor: '#000',
          shadowOpacity: dark ? .35 : .12, shadowRadius: 12,
        }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => { setVisible(false); router.push('/profile'); }}
            style={{ flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 15,
              minHeight: 50, justifyContent: 'space-between' }}>
            <Text style={{ color: theme.ink, fontWeight: '700' }}>Profile</Text>
            <Text style={{ color: theme.muted, fontSize: 17 }}>›</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>;
}
