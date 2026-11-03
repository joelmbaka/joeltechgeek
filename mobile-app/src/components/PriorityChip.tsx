import { Text, View } from 'react-native';
import { useTheme } from '@/lib/config';
import type { Lead } from '@/lib/types';

export function PriorityChip({ priority }: { priority: Lead['priority'] }) {
  const theme = useTheme();
  const colors = priority === 'high'
    ? [theme.chipHighBg, theme.chipHighBorder, theme.chipHighText]
    : priority === 'normal'
      ? [theme.chipNormalBg, theme.chipNormalBorder, theme.chipNormalText]
      : [theme.chipLowBg, theme.chipLowBorder, theme.chipLowText];
  return <View style={{
    borderRadius: 30, borderWidth: 1,
    backgroundColor: colors[0], borderColor: colors[1],
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
  }}>
    <Text style={{
      color: colors[2], fontSize: 11, fontWeight: '800', letterSpacing: .45,
    }}>{priority.toUpperCase()}</Text>
  </View>;
}
