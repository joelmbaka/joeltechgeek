import { useEffect, useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, View, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Field, useUIStyles } from './ui';
import { NativeSchedulePicker } from './NativeSchedulePicker';
import { SelectSheet } from './SelectSheet';
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
  {value:'call',label:'Call'}, {value:'email',label:'Email'},
  {value:'whatsapp',label:'WhatsApp'}, {value:'meeting',label:'Meeting'},
  {value:'other',label:'Other'},
];
const CHANNELS = [
  {value:'',label:'No interaction (note or follow-up only)'},
  {value:'call',label:'Call'}, {value:'whatsapp',label:'WhatsApp'},
  {value:'email',label:'Email'}, {value:'other',label:'Other'},
];
const DISPOSITIONS = [
  {value:'keep',label:'Keep active'},
  {value:'do_not_contact',label:'Mark Do Not Contact'},
  {value:'competitor',label:'Classify as competitor'},
];
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
const pad2 = (value: number) => String(value).padStart(2, '0');
// Prefill a practical upcoming local time. Crossing midnight advances the date too.
function defaultFollowupClock() {
  const next = new Date(Date.now() + 15 * 60 * 1000);
  next.setMinutes(Math.ceil(next.getMinutes() / 5) * 5, 0, 0);
  return {
    date: [next.getFullYear(), pad2(next.getMonth() + 1), pad2(next.getDate())].join('-'),
    time: pad2(next.getHours()) + ':' + pad2(next.getMinutes()),
  };
}

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
  const dialog = useAppDialog();
  const [channel, setChannel] = useState('call');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState<'keep'|'do_not_contact'|'competitor'>('keep');
  const [includeFollowup, setIncludeFollowup] = useState(true);
  const [nextAction, setNextAction] = useState('');
  const [actionType, setActionType] = useState('call');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [scheduleTouched, setScheduleTouched] = useState(false);
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
    setChannel('call');setOutcome('');setNotes('');setStage('');setError('');
    setDisposition('keep');setIncludeFollowup(true);setScheduleTouched(false);
    setNextAction(lead.next_action || '');
    setActionType(lead.next_action_type || 'call');
    const clock = defaultFollowupClock();
    setDate(lead.next_action ? (lead.next_action_at || '') : clock.date);
    setTime(lead.next_action ? (lead.next_action_time?.slice(0,5) || '') : clock.time);
    setInteractionContact(primary);
    // Preserve an explicitly company-level task; never silently select primary.
    setFollowupContact(lead.next_action ? (lead.next_action_contact_id || '') : primary);
  }, [visible, lead.id, primary]);

  const choices = [
    {value:'',label:'Company / unspecified contact'},
    ...contacts.map(c=>({value:c.id,label:
      (c.name || c.phone || c.email || 'Contact') + (c.is_primary?' (Primary)':'')})),
  ];
  const hasInteraction = !!channel;
  // Closed dispositions and outcomes must never create an outreach reminder.
  const completingSale = stage === 'won' || stage === 'lost' ||
    outcome === 'onboarding_completed' || outcome === 'not_interested';
  const followupOpen = includeFollowup && disposition === 'keep' && !completingSale;
  // Prefilled date/time are suggestions, not an instruction to schedule.
  // A note/outcome must never silently overwrite a saved reminder.
  const followupFieldsChanged = nextAction.trim() !== (lead.next_action || '').trim() ||
    date !== (lead.next_action_at || '') ||
    time !== (lead.next_action_time?.slice(0, 5) || '') ||
    actionType !== (lead.next_action_type || 'call') ||
    (followupContact || null) !== (lead.next_action_contact_id || null);
  const scheduling = followupOpen && (lead.next_action
    ? scheduleTouched && followupFieldsChanged
    : scheduleTouched || !!nextAction.trim());
  const validSchedule = !scheduling || (!!nextAction.trim() && !!date);
  const changedFollowup = scheduling && followupFieldsChanged;
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
      channel: channel && outcome ? channel as ActivityChannel : null,
      outcome: channel && outcome ? outcome : null,
      notes: notes.trim(),
      contact_id: interactionContact || null,
      disposition,
      ...(stage && channel && outcome ? {stage} : {}),
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
                <Text style={[styles.label,{fontWeight:'500'}]}>Record an outcome or leave a note</Text>
              </View>
            </View>
            <View style={{padding:15,gap:13}}>
              <Text style={styles.label}>Activity type</Text>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>
                {CHANNELS.map(option => <Pressable key={option.value || 'none'} accessibilityRole="button"
                  accessibilityState={{selected:channel===option.value}}
                  onPress={() => { Keyboard.dismiss();setChannel(option.value);setOutcome('');setStage('');
                    if (option.value && disposition==='competitor') setDisposition('keep'); }}
                  style={{paddingHorizontal:13,minHeight:42,alignItems:'center',justifyContent:'center',
                    borderRadius:11,borderWidth:1,
                    borderColor:channel===option.value?theme.primary:theme.border,
                    backgroundColor:channel===option.value?theme.chipHighBg:theme.white}}>
                  <Text style={{color:channel===option.value?theme.chipHighText:theme.ink,
                    fontWeight:channel===option.value?'800':'600',fontSize:13}}>
                    {option.value ? option.label : 'Note only'}
                  </Text>
                </Pressable>)}
              </View>
            {hasInteraction ? <>
              {contacts.length>1 ? <SelectSheet title="Contact" value={interactionContact}
                options={choices} searchable dismissKeyboardOnOpen onChange={setInteractionContact}/> : null}
              <SelectSheet title="Outcome (optional for note or follow-up only)" value={outcome}
                placeholder="Choose outcome" dismissKeyboardOnOpen
                options={OUTCOMES_BY_CHANNEL[channel as ActivityChannel].map(([value,label])=>({value,label}))}
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
                  {lead.next_action ? 'Edit the saved reminder' : 'Choose the next action and when to do it'}
                </Text>
              </View>
              <SymbolView name={{ios:followupOpen?'checkmark.circle.fill':'circle',
                android:followupOpen?'check_circle':'radio_button_unchecked',
                web:'check_circle'}} size={25} tintColor={theme.primaryDark}/>
            </Pressable>
            {followupOpen ? <View style={{padding:15,gap:13,borderTopWidth:1,borderTopColor:theme.border}}>
              {contacts.length>1 ? <SelectSheet title="Follow-up contact"
                value={followupContact} options={choices} searchable dismissKeyboardOnOpen
                onChange={(value)=>{setFollowupContact(value);setScheduleTouched(true);}}/> : null}
              <SelectSheet title="Action type" value={actionType} dismissKeyboardOnOpen
                options={ACTION_TYPES} onChange={(value)=>{setActionType(value);setScheduleTouched(true);}}/>
              <Field label="Next action (required)" value={nextAction}
                onChangeText={(value)=>{setNextAction(value);setScheduleTouched(true);}}
                placeholder="e.g. Call to confirm proposal"/>
              <View style={{backgroundColor:theme.surfaceMuted,borderRadius:15,
                borderWidth:1,borderColor:theme.border,padding:12,gap:11}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                  <SymbolView name={{ios:'calendar',android:'event',web:'event'}}
                    size={19} tintColor={theme.primaryDark}/>
                  <Text style={[styles.value,{fontSize:14}]}>Reminder</Text>
                  <View style={{flex:1}}/>
                  {!lead.next_action ? <Text style={[styles.label,{fontSize:11}]}>Suggested time</Text> : null}
                </View>
                <View style={{flexDirection:'row',gap:10}}>
                  <NativeSchedulePicker label="Date" mode="date" value={date} decorated
                    onChange={(v)=>{setDate(v);setScheduleTouched(true);if(!v)setTime('');}}/>
                  <NativeSchedulePicker label="Time" mode="time" value={time} decorated
                    disabled={!date} onChange={(v)=>{setTime(v);setScheduleTouched(true);}}/>
                </View>
              </View>
              {!lead.next_action ? <Text style={[styles.label,{fontWeight:'500'}]}>
                The suggested date and time are not scheduled until you enter a next action and save.
              </Text> : null}
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
                if (next==='competitor') {setChannel('');setOutcome('');}
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
