import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '@/lib/config';

type Props = {
  label: string;
  fullScreen?: boolean;
};

/** Shared, centered progress indicator for OAuth, restoration and sign-out. */
export function LoadingState({ label, fullScreen = false }: Props) {
  const theme = useTheme();
  return <View
    accessible accessibilityRole="progressbar" accessibilityLabel={label}
    style={{
      flex: fullScreen ? 1 : undefined,
      minHeight: fullScreen ? undefined : 142,
      padding: 24, alignItems: 'center', justifyContent: 'center',
      backgroundColor: fullScreen ? theme.background : 'transparent',
      gap: 16,
    }}>
    <View style={{
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: theme.white, borderWidth: 1, borderColor: theme.border,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000000', shadowOpacity: .07, shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 }, elevation: 2,
    }}>
      <ActivityIndicator size="large" color={theme.primary}/>
    </View>
    <Text style={{ color: theme.ink, fontSize: 15,
      fontWeight: '700', textAlign: 'center' }}>{label}</Text>
  </View>;
}
