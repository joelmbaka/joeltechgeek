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
/** Matches LeadRow: title/priority, contact/category, brief, stage/activity and next step. */
export function LeadCardSkeleton({ count = 5 }: { count?: number }) {
  const theme = useTheme();
  const pulse = usePulse();
  return <View accessible accessibilityLabel="Loading leads" style={{ gap: 10 }}>
    {Array.from({ length: count }, (_, index) => <View key={index}
      style={{ borderRadius: 16, backgroundColor: theme.white,
        borderColor: theme.border, borderWidth: 1, padding: 16, gap: 10 }}>
      <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
        <View style={{flex:1}}><Bar width={index%2===0?'75%':'62%'} height={18} pulse={pulse}/></View>
        <Bar width={56} height={22} pulse={pulse}/>
      </View>
      <Bar width="67%" height={14} pulse={pulse}/>
      <Bar width="86%" height={13} pulse={pulse}/>
      <View style={{flexDirection:'row',alignItems:'center',gap:9}}>
        <Bar width={74} height={23} pulse={pulse}/>
        <Bar width="49%" height={13} pulse={pulse}/>
      </View>
      {index%2===0 ? <View style={{gap:7,paddingTop:2}}>
        <Bar width="71%" height={14} pulse={pulse}/>
        <Bar width="46%" height={12} pulse={pulse}/>
      </View> : null}
    </View>)}
  </View>;
}

/** Matches Lead Details: heading, follow-up, actions, overview, history and contacts. */
export function LeadDetailSkeleton() {
  const theme = useTheme();
  const pulse = usePulse();
  const card = {padding:16,backgroundColor:theme.white,borderWidth:1,
    borderColor:theme.border,borderRadius:16,gap:12} as const;
  return <View accessible accessibilityLabel="Loading lead details" style={{gap:12}}>
    <View style={{gap:7}}>
      <Bar pulse={pulse} width="67%" height={25}/>
      <Bar pulse={pulse} width="45%" height={14}/>
      <Bar pulse={pulse} width="36%" height={14}/>
    </View>
    <View style={card}>
      <Bar pulse={pulse} width="45%" height={18}/>
      <Bar pulse={pulse} width="79%" height={15}/>
      <Bar pulse={pulse} width="57%" height={13}/>
      <View style={{flexDirection:'row',gap:10}}>
        <View style={{flex:1}}><Bar pulse={pulse} width="100%" height={44}/></View>
        <View style={{flex:1}}><Bar pulse={pulse} width="100%" height={44}/></View>
      </View>
    </View>
    <View style={{flexDirection:'row',gap:10}}>
      <View style={{flex:1}}><Bar pulse={pulse} width="100%" height={44}/></View>
      <View style={{flex:1}}><Bar pulse={pulse} width="100%" height={44}/></View>
    </View>
    <View style={card}>
      <Bar pulse={pulse} width="39%" height={18}/>
      <Bar pulse={pulse} width="92%" height={15}/>
      <Bar pulse={pulse} width="65%" height={14}/>
    </View>
    <View style={{backgroundColor:theme.surfaceMuted,borderRadius:10,minHeight:44}}/>
    <View style={card}>
      <Bar pulse={pulse} width="56%" height={18}/>
      <Bar pulse={pulse} width="83%" height={14}/>
      <Bar pulse={pulse} width="51%" height={12}/>
    </View>
    <View style={card}>
      <Bar pulse={pulse} width="46%" height={18}/>
      <Bar pulse={pulse} width="75%" height={14}/>
      <Bar pulse={pulse} width="55%" height={14}/>
    </View>
  </View>;
}

/** Matches a notification card: unread dot, title, message and due date. */
export function NotificationCardSkeleton({count=3}: {count?:number}) {
  const theme = useTheme();
  const pulse = usePulse();
  return <View accessible accessibilityLabel="Loading notifications" style={{gap:10}}>
    {Array.from({length:count},(_,index)=><View key={index}
      style={{backgroundColor:theme.white,borderRadius:16,borderWidth:1,
        borderColor:theme.border,padding:16,gap:10}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:9}}>
        <View style={{height:8,width:8,borderRadius:4,backgroundColor:theme.surfaceMuted}}/>
        <Bar pulse={pulse} width={index%2===0?'58%':'72%'} height={17}/>
      </View>
      <Bar pulse={pulse} width="90%" height={14}/>
      <Bar pulse={pulse} width="69%" height={14}/>
      <Bar pulse={pulse} width="44%" height={12}/>
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
