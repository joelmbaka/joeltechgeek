import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';
import { UserAvatar } from './UserAvatar';

export function HeaderProfileMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  if (!user) return null;

  const displayName = (user.name || user.email || 'CrmUser').trim();
  // Keep the popover below the native header, including the status bar.
  // Android modal coordinate origins vary by OS; use a conservative offset.
  // iOS uses the safe-area inset plus the navigation header height.
  const menuTop = Platform.OS === 'android' ? 88 : insets.top + 52;
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
      <UserAvatar name={displayName} pictureUrl={user.picture_url} size={34} />
    </Pressable>
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent={false}
      onRequestClose={() => setVisible(false)}>
      <StatusBar style={dark ? 'light' : 'dark'} hidden={false}/>
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
