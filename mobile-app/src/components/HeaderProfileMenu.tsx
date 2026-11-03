import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Pressable, Text, View, useColorScheme } from 'react-native';
import { useAuth } from '@/lib/AuthProvider';
import { COLORS } from '@/lib/config';

export function HeaderProfileMenu() {
  const { agent } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const [visible, setVisible] = useState(false);
  if (!agent) return null;

  const displayName = (agent.name || agent.email || 'Agent').trim();
  const initial = displayName.slice(0, 1).toUpperCase();
  const dark = scheme === 'dark';

  return <>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open account menu for ${displayName}`}
      hitSlop={8}
      onPress={() => setVisible(true)}
      style={{
        marginRight: 7, height: 40, maxWidth: 172, borderRadius: 22,
        borderWidth: 1, borderColor: dark ? '#456071' : COLORS.border,
        backgroundColor: dark ? '#103647' : COLORS.white,
        flexDirection: 'row', alignItems: 'center',
        paddingLeft: 10, paddingRight: 4, gap: 8,
      }}>
      <Text numberOfLines={1} ellipsizeMode="tail"
        style={{ color: dark ? COLORS.white : COLORS.ink,
          fontSize: 13, fontWeight: '700', flexShrink: 1 }}>
        {displayName}
      </Text>
      <View style={{
        width: 32, height: 32, borderRadius: 16,
        borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#E6F5EF',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.primaryDark }}>
          {initial}
        </Text>
      </View>
    </Pressable>
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent={false}
      onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Close account menu"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: 'transparent' }}
          onPress={() => setVisible(false)} />
        <View style={{
          position: 'absolute', top: 53, right: 12, width: 176,
          backgroundColor: COLORS.white, borderRadius: 15,
          borderWidth: 1, borderColor: COLORS.border,
          elevation: 7, paddingVertical: 2, shadowColor: '#000',
          shadowOpacity: .12, shadowRadius: 12,
        }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => { setVisible(false); router.push('/profile'); }}
            style={{ flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 15, minHeight: 50, justifyContent: 'space-between' }}>
            <Text style={{ color: COLORS.ink, fontWeight: '700' }}>Profile</Text>
            <Text style={{ color: COLORS.muted, fontSize: 17 }}>›</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>;
}
