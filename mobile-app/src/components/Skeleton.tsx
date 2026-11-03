import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@/lib/config';

function usePulse() {
  const value = useRef(new Animated.Value(.47)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: .9, duration: 680, useNativeDriver: true }),
      Animated.timing(value, { toValue: .47, duration: 680, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [value]);
  return value;
}
function Bar({ width, height, pulse }: {
  width: number | string; height: number; pulse: Animated.Value;
}) {
  const theme = useTheme();
  return <Animated.View style={{
    width: width as never, height, borderRadius: 7,
    backgroundColor: theme.surfaceMuted, opacity: pulse,
  }} />;
}
export function LeadCardSkeleton({ count = 5 }: { count?: number }) {
  const theme = useTheme();
  const pulse = usePulse();
  return <View accessible accessibilityLabel="Loading leads" style={{ gap: 10 }}>
    {Array.from({ length: count }, (_, index) => <View key={index}
      style={{ borderRadius: 16, backgroundColor: theme.white,
        borderColor: theme.border, borderWidth: 1, padding: 16,
        minHeight: 132, gap: 12 }}>
      <Bar width="72%" height={18} pulse={pulse}/>
      <Bar width="54%" height={13} pulse={pulse}/>
      <Bar width="38%" height={13} pulse={pulse}/>
    </View>)}
  </View>;
}
export function LeadDetailSkeleton() {
  const theme = useTheme();
  const pulse = usePulse();
  return <View accessible accessibilityLabel="Loading lead details" style={{ gap: 14 }}>
    <Bar pulse={pulse} width="67%" height={25}/>
    <Bar pulse={pulse} width="43%" height={14}/>
    {[0, 1, 2].map(item => <View key={item}
      style={{ padding: 17, backgroundColor: theme.white,
        borderWidth: 1, borderColor: theme.border, borderRadius: 16, gap: 14 }}>
      <Bar pulse={pulse} width="72%" height={18}/>
      <Bar pulse={pulse} width="55%" height={14}/>
      <Bar pulse={pulse} width="84%" height={14}/>
    </View>)}
  </View>;
}
