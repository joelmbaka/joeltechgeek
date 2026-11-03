import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDialog } from '@/components/AppDialog';
import { Page, useUIStyles } from '@/components/ui';
import { useAuth } from '@/lib/AuthProvider';
import { useTheme } from '@/lib/config';
import { AgentAvatar } from '@/components/AgentAvatar';

function DetailRow({ title, value }: { title: string; value: string }) {
  const styles = useUIStyles();
  return <View style={{ paddingVertical: 13, gap: 5 }}>
    <Text style={styles.label}>{title}</Text>
    <Text selectable style={styles.value}>{value}</Text>
  </View>;
}
export default function ProfileScreen() {
  const theme = useTheme();
  const styles = useUIStyles();
  const { agent } = useAuth();
  const router = useRouter();
  const showDialog = useAppDialog();
  if (!agent) return <Page><Text style={styles.subtitle}>Sign in to view your profile.</Text></Page>;
  const signOut = () => showDialog({
    title: 'Sign out of CRM?',
    message: 'Your session on this device will end. To access your workspace again, sign in with your authorized Google account.',
    cancelLabel: 'Stay signed in',
    confirmLabel: 'Sign out',
    onConfirm: () => router.replace('/signing-out'),
  });
  return <Page>
    <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
      <AgentAvatar name={agent.name || agent.email} pictureUrl={agent.picture_url} size={50} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.value, { fontSize: 18 }]}>{agent.name}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{agent.email}</Text>
      </View>
    </View>
    <Text style={styles.label}>ACCOUNT DETAILS</Text>
    <View style={[styles.card, { gap: 0 }]}>
      <DetailRow title="Name" value={agent.name}/>
      <View style={{ height: 1, backgroundColor: theme.border }}/>
      <DetailRow title="Email" value={agent.email}/>
      <View style={{ height: 1, backgroundColor: theme.border }}/>
      <DetailRow title="Phone" value={agent.phone || 'Not provided'}/>
    </View>
    <Text style={styles.label}>PRIVACY</Text>
    <View style={[styles.card, { padding: 0 }]}>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://joeltechgeek.com/privacy')
        .catch(() => showDialog({ title: 'Privacy Policy unavailable', message: 'Unable to open the link. You can read the policy at joeltechgeek.com/privacy.' }))}
        style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', color: theme.primaryDark }}>Privacy Policy</Text>
        <Text style={{ color: theme.muted, fontSize: 20 }}>›</Text>
      </Pressable>
      <View style={{ height: 1, backgroundColor: theme.border }}/>
      <Pressable accessibilityRole="button" onPress={() => void Linking.openURL('mailto:mbakajoe26@gmail.com?subject=JoelTechGeek%20CRM%20account%20and%20data%20deletion')
        .catch(() => showDialog({ title: 'Email app unavailable', message: 'Please email mbakajoe26@gmail.com to request account or data deletion.' }))}
        style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', color: theme.ink }}>Request account/data deletion</Text>
        <Text style={{ color: theme.muted, fontSize: 20 }}>›</Text>
      </Pressable>
    </View>
    <Text style={styles.label}>ACCESS</Text>
    <View style={[styles.card, { padding: 0 }]}>
      <Pressable accessibilityRole="button" onPress={signOut}
        style={{ minHeight: 58, paddingHorizontal: 16, flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', color: theme.ink }}>Sign out</Text>
        <Text style={{ color: theme.muted, fontSize: 20 }}>›</Text>
      </Pressable>
    </View>
  </Page>;
}
