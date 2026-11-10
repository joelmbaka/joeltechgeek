import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/config';
import { useAppDialog } from '@/components/AppDialog';

type Kind = 'call' | 'whatsapp' | 'email';
type Props = {
  phone?: string | null;
  email?: string | null;
  country: string;
  disabled?: boolean;
};
function whatsappNumber(phone: string, country: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (phone.trim().startsWith('+') && digits.length >= 8) return digits;
  if (country.toLowerCase() === 'kenya') {
    if (digits.length === 10 && digits.startsWith('0')) return '254' + digits.slice(1);
    if (digits.length === 12 && digits.startsWith('254')) return digits;
    if (digits.length === 9 && /^[17]/.test(digits)) return '254' + digits;
  }
  return null;
}
export function LeadContactActions({phone, email, country, disabled = false}: Props) {
  const theme = useTheme();
  const dialog = useAppDialog();
  const [opening, setOpening] = useState<Kind | null>(null);
  const dial = phone?.trim() || '';
  const number = dial.replace(/[^\d+]/g,'');
  const whatsapp = dial ? whatsappNumber(dial,country) : null;
  const address = email?.trim() || '';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
  const actions: {kind:Kind;label:string;icon:string;url:string|null}[] = [
    {kind:'call',label:'Call',icon:'☎',url:number.replace(/\D/g,'').length>=7?'tel:'+number:null},
    {kind:'whatsapp',label:'WhatsApp',icon:'◉',url:whatsapp?'https://wa.me/'+whatsapp:null},
    {kind:'email',label:'Email',icon:'✉',url:emailValid?'mailto:'+address:null},
  ];
  const open = async (kind: Kind,url:string) => {
    if (opening) return;
    setOpening(kind);
    try { await Linking.openURL(url); }
    catch { dialog({title:'Unable to open '+kind,message:'Check the contact details and available apps.'}); }
    finally { setOpening(null); }
  };
  return <View style={{flexDirection:'row',gap:9}}>
    {actions.map((item)=>{
      const enabled = !disabled && !!item.url;
      return <Pressable key={item.kind} accessibilityRole="button"
        accessibilityLabel={item.label + (enabled ? '' : ', unavailable')}
        accessibilityState={{disabled:!enabled}}
        disabled={!enabled || opening!==null}
        onPress={()=>{ if(item.url) void open(item.kind,item.url); }}
        style={{flex:1,minWidth:0,minHeight:62,alignItems:'center',justifyContent:'center',
          paddingVertical:9,gap:3,borderRadius:12,borderWidth:1,
          borderColor:enabled?theme.border:theme.surfaceMuted,
          backgroundColor:enabled?theme.white:theme.surfaceMuted,opacity:enabled?1:0.55}}>
        <Text style={{fontSize:20,color:enabled?theme.primaryDark:theme.muted}}>{item.icon}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}
          style={{fontSize:12,fontWeight:'800',color:enabled?theme.ink:theme.muted}}>{item.label}</Text>
      </Pressable>;
    })}
  </View>;
}
