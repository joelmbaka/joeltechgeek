import { Text, View } from 'react-native';
import { useTheme } from '@/lib/config';

type Props = {
  label: string;
  fullScreen?: boolean;
};

/** Shared non-spinner placeholder for any remaining inline loading states. */
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
      width: '100%', maxWidth: 280, borderRadius: 14, padding: 17, gap: 10,
      backgroundColor: theme.white, borderWidth: 1, borderColor: theme.border,
    }}>
      <View style={{ width: '58%', height: 16, borderRadius: 6, backgroundColor: theme.surfaceMuted }}/>
      <View style={{ width: '82%', height: 12, borderRadius: 6, backgroundColor: theme.surfaceMuted }}/>
    </View>
    <Text style={{ color: theme.ink, fontSize: 15,
      fontWeight: '700', textAlign: 'center' }}>{label}</Text>
  </View>;
}
