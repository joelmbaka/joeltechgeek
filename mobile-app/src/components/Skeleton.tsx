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

/** Mirrors the compact inline fields in Edit Lead without mounting real editable controls. */
export function EditLeadSkeleton() {
  const theme = useTheme();
  const pulse = usePulse();
  return <View accessible accessibilityLabel="Loading edit lead form" style={{gap:12}}>
    {Array.from({length:6},(_,index)=><View key={index}
      style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:48}}>
      <Bar pulse={pulse} width={112} height={14}/>
      <View style={{flex:1,minHeight:44,backgroundColor:theme.white,borderRadius:10,
        borderColor:theme.border,borderWidth:1,paddingHorizontal:12,justifyContent:'center'}}>
        <Bar pulse={pulse} width={index===1?'70%':'55%'} height={14}/>
      </View>
    </View>)}
    {[0,1].map(index=><View key={index} style={{gap:8}}>
      <Bar pulse={pulse} width={index===0?'55%':'38%'} height={14}/>
      <View style={{minHeight:88,backgroundColor:theme.white,borderRadius:10,
        borderColor:theme.border,borderWidth:1,padding:12,gap:12}}>
        <Bar pulse={pulse} width="78%" height={14}/>
        <Bar pulse={pulse} width="52%" height={14}/>
      </View>
    </View>)}
    <View style={{borderRadius:10,backgroundColor:theme.surfaceMuted,minHeight:44}}/>
  </View>;
}
