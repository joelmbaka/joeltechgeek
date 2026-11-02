import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthProvider';
import { COLORS } from '@/lib/config';

export function HeaderProfileMenu() {
  const { agent } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  if (!agent) return null;
  const initial = (agent.name || agent.email || 'A').slice(0, 1).toUpperCase();
  return <>
    <Pressable
      accessibilityRole="button" accessibilityLabel="Open account menu"
      hitSlop={8}
      onPress={() => setVisible(true)}
      style={{
        marginRight: 7, width: 38, height: 38, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#E6F5EF',
        justifyContent: 'center', alignItems: 'center',
      }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.primaryDark }}>{initial}</Text>
    </Pressable>
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent
      onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Close account menu"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: 'rgba(7,17,29,.12)' }}
          onPress={() => setVisible(false)} />
        <View style={{
          position: 'absolute', top: insets.top + 54, right: 12, width: 230,
          backgroundColor: COLORS.white, borderRadius: 15,
          borderWidth: 1, borderColor: COLORS.border,
          elevation: 7, paddingVertical: 7, shadowColor: '#000',
          shadowOpacity: .12, shadowRadius: 12,
        }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: COLORS.ink }}>
              {agent.name}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 12, color: COLORS.muted }}>
              {agent.email}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: COLORS.border }} />
          <Pressable
            accessibilityRole="button"
            onPress={() => { setVisible(false); router.push('/profile'); }}
            style={{ flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 14, paddingVertical: 13, justifyContent: 'space-between' }}>
            <Text style={{ color: COLORS.ink, fontWeight: '700' }}>Profile</Text>
            <Text style={{ color: COLORS.muted, fontSize: 17 }}>›</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>;
}
