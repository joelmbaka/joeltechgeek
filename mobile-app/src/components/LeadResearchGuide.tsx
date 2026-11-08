import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/config';

export const LEAD_BRIEF_EXAMPLE =
  'e.g. Mombasa-based cargo transporter serving regional routes.';
export const LEAD_DETAILS_EXAMPLE =
  'e.g. Says it uses GPS tracking; vendor and management app are unverified. Ask how dispatch works.';
export const LEAD_FACT_LABEL_EXAMPLE = 'e.g. Fleet size';
export const LEAD_FACT_VALUE_EXAMPLE = 'e.g. 100+ trucks — company-reported';

/** Compact, opt-in guidance for anyone researching leads, regardless of business category. */
export function LeadResearchGuide() {
  const theme = useTheme();
  const [open,setOpen] = useState(false);
  return <View style={{gap:8}}>
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open}}
      onPress={()=>setOpen(value=>!value)}
      style={{paddingVertical:8,minHeight:40,justifyContent:'center'}}>
      <Text style={{color:theme.primaryDark,fontSize:13,fontWeight:'700'}}>
        {open ? '▴ Hide research examples' : '▾ Research guide & examples'}
      </Text>
    </Pressable>
    {open ? <View style={{gap:7,padding:10,borderWidth:1,borderColor:theme.border,borderRadius:10}}>
      <Text style={{color:theme.ink,fontSize:13}}>
        Brief: one sentence about what the business does and where it operates.
      </Text>
      <Text style={{color:theme.muted,fontSize:12}}>
        Example: Mombasa-based cargo transporter serving regional routes.
      </Text>
      <Text style={{color:theme.ink,fontSize:13}}>
        Important details: 2–4 short sentences on operations, existing technology, uncertainty
        and what to establish before calling.
      </Text>
      <Text style={{color:theme.muted,fontSize:12}}>
        Example: Reports GPS tracking. Provider and mobile management app unverified.
        Ask about current dispatch and documents workflow.
      </Text>
      <Text style={{color:theme.ink,fontSize:13}}>
        Facts: one label/value per measured or reported attribute. Examples: Founded — 1993
        (company-reported); Fleet — 100+ trucks (company-reported); Employees — 150
        (company-reported); Software — vendor unverified.
      </Text>
      <Text style={{color:theme.muted,fontSize:12}}>
        Evidence: distinguish independently verified, company-reported, third-party-reported,
        unverified and unknown. A responsive website is not proof of a native mobile app.
        No app found does not mean no app exists. Never confuse owned fleet with partner network.
      </Text>
    </View> : null}
  </View>;
}
