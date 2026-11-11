import { useCallback, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Text, View } from 'react-native';
import { Button, Field, Page, useUIStyles } from '@/components/ui';
import { EditLeadSkeleton } from '@/components/Skeleton';
import { COUNTRIES, countryCode } from '../../../../../lib/agent-crm/countries';
import { LeadResearchGuide, getLeadResearchExamples } from '@/components/LeadResearchGuide';
import { SelectSheet } from '@/components/SelectSheet';
import { useTheme } from '@/lib/config';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import type { Lead, LeadDetails } from '@/lib/types';

const PRIORITIES = [
  {value:'normal',label:'Normal'}, {value:'high',label:'High'}, {value:'low',label:'Low'},
];
export default function EditLead() {
  const {id} = useLocalSearchParams<{id:string}>();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const styles = useUIStyles();
  const theme = useTheme();
  const {user} = useAuth();
  const [original,setOriginal] = useState<Lead|null>(null);
  const [industries,setIndustries] = useState<string[]>([]);
  const [company,setCompany] = useState('');
  const [industry,setIndustry] = useState('');
  const [country,setCountry] = useState('');
  const [city,setCity] = useState('');
  const [website,setWebsite] = useState('');
  const [priority,setPriority] = useState('normal');
  const [brief,setBrief] = useState('');
  const [details,setDetails] = useState('');
  const [busy,setBusy] = useState(false);
  const [loaded,setLoaded] = useState(false);
  const [categoriesLoading,setCategoriesLoading] = useState(true);
  const [categoriesError,setCategoriesError] = useState<string|null>(null);
  const [error,setError] = useState('');

  const load = useCallback((signal:AbortSignal) => {
    if (!user || !id) return;
    setLoaded(false);setError('');
    setCategoriesLoading(true);setCategoriesError(null);
    // The edit form should not wait for the separate category request.
    void apiFetch<LeadDetails>('/api/agent-crm/leads/'+encodeURIComponent(id),{signal})
      .then(details=>{
        if(signal.aborted)return;
        const lead=details.lead;
        setOriginal(lead);setCompany(lead.company_name||'');setIndustry(lead.industry||'');
        setCountry(countryCode(lead.country)||lead.country||'');setCity(lead.city||'');setWebsite(lead.website||'');
        setPriority(lead.priority||'normal');setBrief(lead.lead_brief||'');
        setDetails(lead.important_details||'');setLoaded(true);
      }).catch((reason:unknown)=>{
        if(!signal.aborted){setError(reason instanceof Error?reason.message:'Unable to load lead.');setLoaded(true);}
      });
    void apiFetch<{ok:true;categories:string[]}>('/api/agent-crm/categories',{signal})
      .then(categories=>{
        if(!signal.aborted)setIndustries(categories.categories);
      }).catch((reason:unknown)=>{
        if(!signal.aborted)setCategoriesError(reason instanceof Error?reason.message:'Unable to load categories.');
      }).finally(()=>{if(!signal.aborted)setCategoriesLoading(false);});
  },[id,user?.id]);

  useFreshOnFocus(load,[load]);
  const createCategory = async(name:string):Promise<string>=>{
    const result=await apiFetch<{ok:true;category:string}>('/api/agent-crm/categories',{
      method:'POST',body:JSON.stringify({name}),
    });
    setIndustries(current=>[...new Set([...current,result.category])].sort((a,b)=>a.localeCompare(b)));
    return result.category;
  };
  const changed=!!original && (
    company.trim()!==(original.company_name||'') || industry!==(original.industry||'') ||
    country!==(countryCode(original.country)||original.country||'') || city.trim()!==(original.city||'') ||
    website.trim()!==(original.website||'') || priority!==original.priority ||
    brief.trim()!==(original.lead_brief||'') ||
    details.trim()!==(original.important_details||'')
  );
  const valid=!!original && !busy && changed &&
    (!!company.trim() || !!original.contact_name?.trim()) &&
    company.length<=180 && country.length<=80 && city.length<=120 && website.length<=1000 &&
    brief.length<=220 && details.length<=5000;
  const save=async()=>{
    if(!valid||!id)return;
    setBusy(true);setError('');
    try {
      await apiFetch('/api/agent-crm/leads/'+encodeURIComponent(id)+'/identity',{
        method:'PATCH',body:JSON.stringify({
          company_name:company.trim(),industry,
          ...(country !== (countryCode(original?.country)||original?.country||'') ? {country} : {}),
          city:city.trim(),
          website:website.trim(),priority,lead_brief:brief.trim(),
          important_details:details.trim(),
        }),
      });
      router.back();
    }catch(reason){setError(reason instanceof Error?reason.message:'Unable to update lead.');}
    finally{setBusy(false);}
  };
  return <Page keyboardAware keyboardVerticalOffset={headerHeight}>
    <Stack.Screen options={{title:'Edit lead'}}/>
    {!loaded && !original ? <EditLeadSkeleton/> : null}
    {loaded&&!original ? <Text style={styles.error}>{error||'Lead not found.'}</Text> : null}
    {original ? <>
      <Field label="Company name" value={company} onChangeText={setCompany} inline/>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:48}}>
        <Text style={[styles.label,{width:112,fontSize:13,color:theme.ink}]}>Business category</Text>
        <View style={{flex:1,minWidth:0}}>
          <SelectSheet title="Business category" value={industry} hideTriggerLabel
            placeholder="Other"
            options={[...new Set([...industries, ...(industry ? [industry] : [])])]
              .filter(name=>name!=='Other').map(value=>({value,label:value})).concat([{value:'',label:'Other'}])}
            onChange={setIndustry} onCreateOption={createCategory} searchable dismissKeyboardOnOpen
            loading={categoriesLoading} loadingError={categoriesError}/>
        </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:48}}>
        <Text style={[styles.label,{width:112,fontSize:13,color:theme.ink}]}>Country</Text>
        <View style={{flex:1,minWidth:0}}>
          <SelectSheet title="Country" value={country} hideTriggerLabel
            placeholder="Not specified"
            options={[
              {value:'',label:'Not specified'},
              ...COUNTRIES.map(({code,name})=>({value:code,label:name})),
              ...(country && !countryCode(country)
                ? [{value:country,label:country+' (unrecognized)'}] : []),
            ]}
            onChange={setCountry} searchable autoFocusSearch dismissKeyboardOnOpen/>
        </View>
      </View>
      <Field label="City" value={city} onChangeText={setCity} placeholder="Optional" inline/>
      <Field label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" inline/>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:48}}>
        <Text style={[styles.label,{width:112,fontSize:13,color:theme.ink}]}>Priority</Text>
        <View style={{flex:1,minWidth:0}}>
          <SelectSheet title="Priority" value={priority} options={PRIORITIES}
            onChange={setPriority} hideTriggerLabel dismissKeyboardOnOpen/>
        </View>
      </View>
      <LeadResearchGuide category={industry}/>
      <Field label="Lead brief (max 220 characters)" value={brief}
        placeholder={getLeadResearchExamples(industry).brief} onChangeText={setBrief} multiline/>
      <Field label="Important details" value={details}
        placeholder={getLeadResearchExamples(industry).details} onChangeText={setDetails} multiline/>
      <Text style={styles.subtitle}>Edit contact names, phone numbers and emails in Lead Details → Contacts.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button disabled={!valid} onPress={()=>void save()}>{busy?'Saving…':'Save changes'}</Button>
    </> : null}
  </Page>;
}
