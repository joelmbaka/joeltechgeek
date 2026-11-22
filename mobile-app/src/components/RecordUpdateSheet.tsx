import { useEffect, useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, View, useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Field, useUIStyles } from './ui';
import { NativeSchedulePicker } from './NativeSchedulePicker';
import { SelectSheet } from './SelectSheet';
import { WhatsAppIcon } from './WhatsAppIcon';
import { useTheme } from '@/lib/config';
import { useAppDialog } from '@/components/AppDialog';
import {
  OUTCOMES_BY_CHANNEL, STAGE_OPTIONS,
} from '@/lib/types';
import type { ActivityChannel, Lead, LeadContact } from '@/lib/types';

export type FollowupChoice = 'keep'|'set'|'complete'|'cancel';
export type UnifiedUpdate = {
  channel: ActivityChannel | null;
  outcome: string | null;
  notes: string;
  contact_id: string | null;
  disposition: 'keep'|'do_not_contact'|'competitor';
  stage?: string;
  followup: {
    mode: FollowupChoice;
    next_action?: string;
    next_action_type?: string;
    next_action_at?: string | null;
    next_action_time?: string | null;
    next_action_timezone?: string;
    contact_id?: string | null;
  };
};
const ACTION_TYPES = [
  {value:'call',label:'Call',icon:'📞'}, {value:'email',label:'Email',icon:'✉️'},
  {value:'whatsapp',label:'WhatsApp',icon:''}, {value:'meeting',label:'Meeting',icon:'📅'},
  {value:'other',label:'Other',icon:'⚡'},
];
// Emoji is presentation-only: option values remain unchanged for the API and history.
const OUTCOME_ICONS: Record<string, string> = {
  number_unavailable:'🚫', switched_off:'📵', no_answer:'📵', busy:'☎️',
  wrong_number:'❌', spoke_to_contact:'🗣️', referred_to_contact:'👥',
  information_requested:'📄', call_back:'🔁', decision_pending:'⏳',
  demo_requested:'📱', meeting_booked:'📅', proposal_requested:'📋',
  trial_started:'🚀', onboarding_completed:'✅', not_interested:'👎',
  sent:'📤', reply_received:'💬', other:'📝',
};
const CHANNELS = [
  {value:'call',label:'Call',icon:'📞'},
  {value:'whatsapp',label:'WhatsApp',icon:''},
  {value:'email',label:'Email',icon:'✉️'},
  {value:'other',label:'Other',icon:'⚡'},
];
const DISPOSITIONS = [
  {value:'keep',label:'Keep active',icon:'✅'},
  {value:'do_not_contact',label:'Do Not Contact',icon:'🚫'},
  {value:'competitor',label:'Competitor',icon:'🏢'},
];
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
export function RecordUpdateSheet({
  visible, lead, contacts, onClose, onSave, savingKind,
}: {
  visible: boolean;
  lead: Lead;
  contacts: LeadContact[];
  onClose: () => void;
  onSave: (payload: UnifiedUpdate, advance: boolean) => Promise<void>;
  savingKind: 'stay'|'next'|null;
}) {
  const styles = useUIStyles();
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const singleActivityRow = screenWidth >= 480;
  const dialog = useAppDialog();
  const [channel, setChannel] = useState('call');
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState<'keep'|'do_not_contact'|'competitor'>('keep');
  const [includeFollowup, setIncludeFollowup] = useState(false);
  const [nextAction, setNextAction] = useState('');
  const [actionType, setActionType] = useState('call');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [stage, setStage] = useState('');
  const [interactionContact, setInteractionContact] = useState('');
  const [followupContact, setFollowupContact] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const primary = contacts.find((c)=>c.is_primary)?.id || contacts[0]?.id || '';
  useEffect(() => {
    if (!visible) return;
    setChannel('call');setShowOutcome(false);setOutcome('');setNotes('');setStage('');setError('');
    setDisposition('keep');setIncludeFollowup(false);
    // This modal records a new update, not an edit of the saved follow-up.
    setNextAction('');setActionType('call');setDate('');setTime('');
    setInteractionContact(primary);setFollowupContact(primary);
  // Do not erase typed drafts if contact data refreshes while the sheet is open.
  }, [visible, lead.id]);

  const choices = [
    {value:'',label:'Company / unspecified contact'},
    ...contacts.map(c=>({value:c.id,label:
      (c.name || c.phone || c.email || 'Contact') + (c.is_primary?' (Primary)':'')})),
  ];
  const hasInteraction = showOutcome && !!channel && !!outcome;
  // Closed dispositions and outcomes must never create an outreach reminder.
  const completingSale = stage === 'won' || stage === 'lost' ||
    outcome === 'onboarding_completed' || outcome === 'not_interested';
  const followupOpen = includeFollowup && disposition === 'keep' && !completingSale;
  // Scheduling is always an explicit opt-in, and 'keep' preserves existing reminders.
  const scheduling = followupOpen;
  const validSchedule = !scheduling || (!!nextAction.trim() && !!date);
  const changedFollowup = scheduling;
  const hasChange = !!(hasInteraction && outcome) || !!notes.trim() ||
    changedFollowup || disposition !== 'keep';
  const canSave = !savingKind && validSchedule && hasChange &&
    !(disposition === 'competitor' && hasInteraction);
  const submit = async (advance: boolean, confirmed = false) => {
    if (!canSave) return;
    if (disposition !== 'keep' && !confirmed) {
      dialog({
        title: disposition === 'do_not_contact' ? 'Mark Do Not Contact?' : 'Classify as competitor?',
        message: 'This will exclude the lead from ordinary outreach, cancel its reminders, and retain the record for reference.',
        cancelLabel: 'Cancel', confirmLabel: 'Confirm classification',
        onConfirm: () => { void submit(advance, true); },
      });
      return;
    }
    setError('');
    const payload: UnifiedUpdate = {
      channel: hasInteraction ? channel as ActivityChannel : null,
      outcome: hasInteraction ? outcome : null,
      notes: notes.trim(),
      contact_id: interactionContact || null,
      disposition,
      ...(stage && hasInteraction ? {stage} : {}),
      followup: {
        mode: scheduling ? 'set' : 'keep',
        ...(scheduling ? {
          next_action:nextAction.trim(),next_action_type:actionType,
          next_action_at:date,next_action_time:time || null,
          next_action_timezone:zone,contact_id:followupContact || null,
        } : {}),
      },
    };
    try { await onSave(payload, advance); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save update.'); }
  };
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen"
    statusBarTranslucent={false}
    onRequestClose={() => { if (!savingKind) onClose(); }}>
    <StatusBar style={dark ? 'light' : 'dark'} hidden={false}/>
    <SafeAreaView style={{flex:1,backgroundColor:theme.background}}>
      <KeyboardAvoidingView style={{flex:1}} behavior="padding">
        <View style={{paddingHorizontal:18,paddingVertical:12,
          backgroundColor:theme.white,borderBottomWidth:1,borderColor:theme.border,
          flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <View style={{flex:1,gap:3}}>
            <Text style={[styles.title,{fontSize:21}]}>Record update</Text>
            <Text numberOfLines={1} style={[styles.subtitle,{fontSize:13}]}>
              {lead.company_name || lead.contact_name || 'Lead'}
            </Text>
          </View>
          <Pressable accessibilityRole="button" disabled={!!savingKind} onPress={onClose}
            style={{padding:9,minHeight:44,justifyContent:'center'}}>
            <Text style={{color:theme.primaryDark,fontWeight:'800'}}>Cancel</Text>
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled"
          contentContainerStyle={{paddingHorizontal:16,paddingTop:16,paddingBottom:24,gap:14}}>
          <View style={{backgroundColor:theme.white,borderRadius:18,borderWidth:1,
            borderColor:theme.border,overflow:'hidden'}}>
            <View style={{padding:15,borderBottomWidth:1,borderBottomColor:theme.border,
              backgroundColor:theme.surfaceMuted,flexDirection:'row',alignItems:'center',gap:11}}>
              <View style={{width:34,height:34,borderRadius:11,backgroundColor:theme.ink,
                alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:theme.background,fontWeight:'900'}}>01</Text>
              </View>
              <View style={{flex:1,gap:2}}>
                <Text style={[styles.value,{fontSize:17}]}>Interaction</Text>
                <Text style={[styles.label,{fontWeight:'500'}]}>Add a note; record an outcome only when needed</Text>
              </View>
            </View>
            <View style={{padding:15,gap:13}}>
              <Pressable accessibilityRole="button" accessibilityLabel="Record outcome (optional)"
                 accessibilityState={{expanded:showOutcome}}
                 onPress={() => { Keyboard.dismiss();setShowOutcome(v=>!v);setOutcome('');setStage(''); }}
                 style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',
                   minHeight:44,paddingHorizontal:12,borderRadius:10,borderWidth:1,
                   borderColor:theme.border,backgroundColor:theme.surfaceMuted}}>
                 <Text style={[styles.value,{fontSize:14}]}>Record outcome (optional)</Text>
                 <Text style={{color:theme.primaryDark,fontSize:15,fontWeight:'800'}}>
                   {showOutcome ? 'Hide −' : 'Add +'}
                 </Text>
               </Pressable>
               {showOutcome ? <>
                 <Text style={styles.label}>Activity type</Text>
                 <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
                   {CHANNELS.map(option => <Pressable key={option.value} accessibilityRole="button"
                     accessibilityLabel={option.label}
                     accessibilityState={{selected:channel===option.value}}
                     onPress={() => { Keyboard.dismiss();setChannel(option.value);setOutcome('');setStage('');
                       if (disposition==='competitor') setDisposition('keep'); }}
                     style={{flexGrow:1,flexBasis:singleActivityRow?'0%':'47%',
                       flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,
                       paddingHorizontal:8,minHeight:44,borderRadius:11,borderWidth:1,
                       borderColor:channel===option.value?theme.primary:theme.border,
                       backgroundColor:channel===option.value?theme.chipHighBg:theme.white}}>
                     {option.value==='whatsapp' ? <WhatsAppIcon size={17}/> :
                       <Text style={{fontSize:16}}>{option.icon}</Text>}
                     <Text numberOfLines={1} style={{color:channel===option.value?theme.chipHighText:theme.ink,
                       fontWeight:channel===option.value?'800':'600',fontSize:13}}>
                       {option.label}
                     </Text>
                   </Pressable>)}
                 </View>
                 {contacts.length>1 ? <SelectSheet title="Contact" value={interactionContact}
                   options={choices} searchable dismissKeyboardOnOpen onChange={setInteractionContact}/> : null}
                 <SelectSheet title="Outcome" value={outcome}
                   placeholder="Choose outcome" dismissKeyboardOnOpen
                   options={OUTCOMES_BY_CHANNEL[channel as ActivityChannel].map(([value,label])=>({
                     value,label,icon:OUTCOME_ICONS[value] || '📝',
                   }))}
                   onChange={(value)=>{setOutcome(value);setStage('');}}/>
                 {outcome ? <SelectSheet title="Lead stage (optional)" value={stage} dismissKeyboardOnOpen
                   options={[{value:'',label:'Suggested automatically'},
                     ...STAGE_OPTIONS.map(value=>({value,label:value.replaceAll('_',' ')}))]}
                   onChange={setStage}/> : null}
               </> : null}
               <Field label="Notes (optional)" value={notes} onChangeText={setNotes}
                placeholder="Conversation details, research, or a standalone note" multiline/>
            </View>
          </View>
          <View style={{backgroundColor:theme.white,borderRadius:18,borderWidth:1,
            borderColor:followupOpen?theme.primary:theme.border,overflow:'hidden'}}>
            <Pressable accessibilityRole="checkbox"
              accessibilityState={{checked:followupOpen,disabled:disposition!=='keep'||completingSale}}
              disabled={!!savingKind || disposition!=='keep' || completingSale}
              onPress={()=>setIncludeFollowup(value=>!value)}
              style={{flexDirection:'row',alignItems:'center',gap:11,minHeight:64,padding:15,
                backgroundColor:followupOpen?theme.chipHighBg:theme.surfaceMuted}}>
              <View style={{width:34,height:34,borderRadius:11,backgroundColor:theme.primary,
                alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:theme.onPrimary,fontWeight:'900'}}>02</Text>
              </View>
              <View style={{flex:1,gap:3}}>
                <Text style={[styles.value,{fontSize:17}]}>Schedule follow-up</Text>
                <Text style={[styles.label,{fontWeight:'500'}]}>
                  {lead.next_action ? 'Schedule a replacement; existing reminder stays until Save' : 'Off by default; opt in to schedule a reminder'}
                </Text>
              </View>
              <SymbolView name={{ios:followupOpen?'checkmark.circle.fill':'circle',
                android:followupOpen?'check_circle':'radio_button_unchecked',
                web:'check_circle'}} size={25} tintColor={theme.primaryDark}/>
            </Pressable>
            {followupOpen ? <View style={{padding:15,gap:13,borderTopWidth:1,borderTopColor:theme.border}}>
              {contacts.length>1 ? <SelectSheet title="Follow-up contact"
                value={followupContact} options={choices} searchable dismissKeyboardOnOpen
                onChange={(value)=>{setFollowupContact(value);}}/> : null}
              <SelectSheet title="Action type" value={actionType} dismissKeyboardOnOpen
                options={ACTION_TYPES} onChange={(value)=>{setActionType(value);}}/>
              <Field label="Next action (required)" value={nextAction}
                onChangeText={(value)=>{setNextAction(value);}}
                placeholder="e.g. Call to confirm proposal"/>
              <View style={{backgroundColor:theme.surfaceMuted,borderRadius:15,
                borderWidth:1,borderColor:theme.border,padding:12,gap:11}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                  <SymbolView name={{ios:'calendar',android:'event',web:'event'}}
                    size={19} tintColor={theme.primaryDark}/>
                  <Text style={[styles.value,{fontSize:14}]}>Reminder</Text>
                  <View style={{flex:1}}/>

                </View>
                <View style={{flexDirection:'row',gap:10}}>
                  <NativeSchedulePicker label="Date" mode="date" value={date} decorated
                    onChange={(v)=>{setDate(v);if(!v)setTime('');}}/>
                  <NativeSchedulePicker label="Time" mode="time" value={time} decorated
                    disabled={!date} onChange={(v)=>{setTime(v);}}/>
                </View>
              </View>
              <Text style={[styles.label,{fontWeight:'500'}]}>
                 Choose a date and enter a next action. Time is optional.
               </Text>
            </View> : lead.next_action && disposition==='keep' && !completingSale ?
              <Text style={[styles.subtitle,{padding:15}]}>Existing follow-up remains unchanged.</Text> : null}
          </View>
          <View style={{backgroundColor:theme.white,borderRadius:18,borderWidth:1,
            borderColor:theme.border,overflow:'hidden'}}>
            <View style={{backgroundColor:theme.surfaceMuted,padding:15,
              flexDirection:'row',alignItems:'center',gap:11}}>
              <View style={{width:34,height:34,borderRadius:11,backgroundColor:theme.ink,
                alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:theme.background,fontWeight:'900'}}>03</Text>
              </View>
              <Text style={[styles.value,{fontSize:17}]}>Classification</Text>
            </View>
            <View style={{padding:15,gap:10}}>
            <SelectSheet title="Lead status" value={disposition} dismissKeyboardOnOpen
              options={DISPOSITIONS} onChange={(v)=>{
                const next=v as 'keep'|'do_not_contact'|'competitor';
                setDisposition(next);
                if (next!=='keep') { setIncludeFollowup(false);setStage(''); }
                if (next==='competitor') {setShowOutcome(false);setChannel('');setOutcome('');}
              }}/>
              {disposition !== 'keep' ? <Text style={styles.subtitle}>
                Outreach will be blocked and outstanding reminders canceled.
                The classification is retained in activity history.
              </Text> : null}
            </View>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!hasInteraction && !notes.trim() && !changedFollowup && disposition==='keep' ?
            <Text style={styles.subtitle}>Record an outcome, add a note, or change a follow-up to enable Save.</Text> : null}
        </ScrollView>
        {!keyboardVisible ? <View style={{flexDirection:'row',gap:10,paddingHorizontal:16,
          paddingTop:12,paddingBottom:12,backgroundColor:theme.white,
          borderTopWidth:1,borderTopColor:theme.border}}>
          <Pressable accessibilityRole="button" disabled={!canSave}
            onPress={()=>void submit(false)} style={{flex:1,minHeight:48,borderRadius:12,
              backgroundColor:theme.surfaceMuted,borderWidth:1,borderColor:theme.border,
              alignItems:'center',justifyContent:'center',opacity:canSave?1:.5}}>
            <Text style={{color:theme.ink,fontWeight:'800'}}>
              {savingKind==='stay'?'Saving…':'Save & Stay'}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={!canSave}
            onPress={()=>void submit(true)} style={{flex:1,minHeight:48,borderRadius:12,
              backgroundColor:theme.primary,alignItems:'center',justifyContent:'center',
              opacity:canSave?1:.5}}>
            <Text style={{color:theme.onPrimary,fontWeight:'800'}}>
              {savingKind==='next'?'Saving…':'Save & Next'}
            </Text>
          </Pressable>
        </View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
