import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Platform, Pressable, StatusBar as NativeStatusBar, Text, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';
import { AgentAvatar } from './AgentAvatar';

export function HeaderProfileMenu() {
  const { agent } = useAuth();
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const theme = useTheme();
  const anchor = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [menuTop, setMenuTop] = useState(62);
  if (!agent) return null;

  const displayName = (agent.name || agent.email || 'Agent').trim();
  const showMenu = () => {
    // measureInWindow includes the status bar. Non-translucent Android modals
    // begin below it, so subtract the inset to avoid overlapping the header.
    anchor.current?.measureInWindow((_x, y, _width, height) => {
      setMenuTop(Math.max(0, y + height - (Platform.OS === 'android' ? (NativeStatusBar.currentHeight || 0) : 0) + 8));
    });
    setVisible(true);
  };
  return <>
    <View ref={anchor} collapsable={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open account menu for ${displayName}`}
        hitSlop={8}
        onPress={showMenu}
        style={{
          marginRight: 7, height: 40, maxWidth: 172, borderRadius: 22,
          borderWidth: 1, borderColor: theme.border,
          backgroundColor: theme.white,
          flexDirection: 'row', alignItems: 'center',
          paddingLeft: 10, paddingRight: 4, gap: 8,
        }}>
        <Text numberOfLines={1} ellipsizeMode="tail"
          style={{ color: theme.ink,
            fontSize: 13, fontWeight: '700', flexShrink: 1 }}>
          {displayName}
        </Text>
        <AgentAvatar name={displayName} pictureUrl={agent.picture_url} size={32} />
      </Pressable>
    </View>
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent={false}
      onRequestClose={() => setVisible(false)}>
      <StatusBar style={dark ? 'light' : 'dark'} translucent={false}
        backgroundColor={dark ? '#0A2836' : '#FFFFFF'}/>
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
              paddingHorizontal: 16, paddingVertical: 15, minHeight: 50, justifyContent: 'space-between' }}>
            <Text style={{ color: theme.ink, fontWeight: '700' }}>Profile</Text>
            <Text style={{ color: theme.muted, fontSize: 17 }}>›</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>;
}
