import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Page, styles } from '@/components/ui';
import { useAuth } from '@/lib/AuthProvider';
import { COLORS } from '@/lib/config';

function DetailRow({ title, value }: { title: string; value: string }) {
  return <View style={{ paddingVertical: 13, gap: 5 }}>
    <Text style={styles.label}>{title}</Text>
    <Text selectable style={styles.value}>{value}</Text>
  </View>;
}
export default function ProfileScreen() {
  const { agent, logout } = useAuth();
  if (!agent) return <Page><Text style={styles.subtitle}>Sign in to view your profile.</Text></Page>;
  const signOut = () => {
    Alert.alert('Sign out?', 'You will need to choose your Google account to return.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);
  };
  return <Page>
    <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
      <View style={{ width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#E6F5EF', borderColor: COLORS.border, borderWidth: 1,
        justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.primaryDark, fontWeight: '900', fontSize: 20 }}>
          {(agent.name || agent.email).slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.value, { fontSize: 18 }]}>{agent.name}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{agent.email}</Text>
      </View>
    </View>
    <Text style={styles.label}>ACCOUNT DETAILS</Text>
    <View style={[styles.card, { gap: 0 }]}>
      <DetailRow title="Name" value={agent.name}/>
      <View style={{ height: 1, backgroundColor: COLORS.border }}/>
      <DetailRow title="Email" value={agent.email}/>
      <View style={{ height: 1, backgroundColor: COLORS.border }}/>
      <DetailRow title="Phone" value={agent.phone || 'Not provided'}/>
    </View>
    <Text style={styles.label}>PRIVACY</Text>
    <View style={[styles.card, { padding: 0 }]}>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://joeltechgeek.com/privacy')
        .catch(() => Alert.alert('Unable to open', 'Please visit joeltechgeek.com/privacy in your browser.'))}
        style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', color: COLORS.primaryDark }}>Privacy Policy</Text>
        <Text style={{ color: COLORS.muted, fontSize: 20 }}>›</Text>
      </Pressable>
      <View style={{ height: 1, backgroundColor: COLORS.border }}/>
      <Pressable accessibilityRole="button" onPress={() => void Linking.openURL('mailto:mbakajoe26@gmail.com?subject=JoelTechGeek%20CRM%20account%20and%20data%20deletion')
        .catch(() => Alert.alert('Email unavailable', 'Please email mbakajoe26@gmail.com to request deletion.'))}
        style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', color: COLORS.ink }}>Request account/data deletion</Text>
        <Text style={{ color: COLORS.muted, fontSize: 20 }}>›</Text>
      </Pressable>
    </View>
    <Text style={styles.label}>ACCESS</Text>
    <View style={[styles.card, { padding: 0 }]}>
      <Pressable accessibilityRole="button" onPress={signOut}
        style={{ minHeight: 58, paddingHorizontal: 16, flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', color: COLORS.red }}>Sign out</Text>
        <Text style={{ color: COLORS.muted, fontSize: 20 }}>›</Text>
      </Pressable>
    </View>
  </Page>;
}
