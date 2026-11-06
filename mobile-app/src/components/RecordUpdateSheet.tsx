import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Field, useUIStyles } from './ui';
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
  const [stage, setStage] = useState('');
  const [interactionContact, setInteractionContact] = useState('');
  const [followupContact, setFollowupContact] = useState('');
  const [error, setError] = useState('');

  const primary = contacts.find((c)=>c.is_primary)?.id || contacts[0]?.id || '';
  useEffect(() => {
    if (!visible) return;
    setChannel('call');setOutcome('');setNotes('');setStage('');setError('');
    setDisposition('keep');setIncludeFollowup(true);
    setNextAction(lead.next_action || '');
    setActionType(lead.next_action_type || 'call');
    setDate(lead.next_action_at || '');
    setTime(lead.next_action_time?.slice(0,5) || '');
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
  // An expanded, untouched follow-up is not mandatory for a note-only or
  // outcome-only update. Validate and save it only once any field is filled.
  const scheduling = followupOpen && !!(nextAction.trim() || date || time);
  const validSchedule = !scheduling || (!!nextAction.trim() && !!date);
  const changedFollowup = scheduling && (
    nextAction.trim() !== (lead.next_action || '') ||
    date !== (lead.next_action_at || '') ||
    time !== (lead.next_action_time?.slice(0, 5) || '') ||
    actionType !== (lead.next_action_type || 'call') ||
    (followupContact || null) !== (lead.next_action_contact_id || null)
  );
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
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <View style={{paddingHorizontal:18,paddingVertical:13,
          borderBottomWidth:1,borderColor:theme.border,flexDirection:'row',
          alignItems:'center',justifyContent:'space-between'}}>
          <View style={{flex:1,gap:2}}>
            <Text style={[styles.title,{fontSize:20}]}>Record update</Text>
            <Text style={styles.subtitle}>One save for activity, notes and next steps</Text>
          </View>
          <Pressable accessibilityRole="button" disabled={!!savingKind} onPress={onClose}
            style={{padding:9}}>
            <Text style={{color:theme.primaryDark,fontWeight:'800'}}>Cancel</Text>
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled"
          contentContainerStyle={{padding:18,paddingBottom:40,gap:14}}>
          <Text style={[styles.value,{fontSize:16}]}>{lead.company_name || lead.contact_name || 'Lead'}</Text>
          <View style={styles.card}>
            <Text style={[styles.value,{fontSize:17}]}>1 · Interaction</Text>
            <Text style={styles.subtitle}>Skip this if you only need a note or follow-up.</Text>
            <SelectSheet title="Activity type (optional)" value={channel} options={CHANNELS}
              onChange={(v)=>{setChannel(v);setOutcome('');setStage('');
                if (v && disposition==='competitor') setDisposition('keep'); }}/>
            {hasInteraction ? <>
              {contacts.length>1 ? <SelectSheet title="Contact" value={interactionContact}
                options={choices} searchable onChange={setInteractionContact}/> : null}
              <SelectSheet title="Outcome (optional for note or follow-up only)" value={outcome}
                placeholder="Choose outcome"
                options={OUTCOMES_BY_CHANNEL[channel as ActivityChannel].map(([value,label])=>({value,label}))}
                onChange={(value)=>{setOutcome(value);setStage('');}}/>
              {outcome ? <SelectSheet title="Lead stage (optional)" value={stage}
                options={[{value:'',label:'Suggested automatically'},
                  ...STAGE_OPTIONS.map(value=>({value,label:value.replaceAll('_',' ')}))]}
                onChange={setStage}/> : null}
            </> : null}
            <Field label="Notes (optional)" value={notes} onChangeText={setNotes}
              placeholder="Conversation details, research, or a standalone note" multiline/>
          </View>
          <View style={styles.card}>
            <Pressable accessibilityRole="checkbox"
              accessibilityState={{checked:followupOpen,disabled:disposition!=='keep'||completingSale}}
              disabled={!!savingKind || disposition!=='keep' || completingSale}
              onPress={()=>setIncludeFollowup(value=>!value)}
              style={{flexDirection:'row',alignItems:'center',gap:10,minHeight:44}}>
              <Text style={{fontSize:22,color:theme.primaryDark}}>
                {followupOpen ? '☑' : '☐'}
              </Text>
              <View style={{flex:1,gap:3}}>
                <Text style={[styles.value,{fontSize:17}]}>2 · Schedule follow-up</Text>
                <Text style={styles.subtitle}>
                  {lead.next_action ? 'Edit the next task, or turn off to keep the existing reminder.'
                    : 'Plan your next action, or leave these fields blank to save only an outcome or note.'}
                </Text>
              </View>
            </Pressable>
            {followupOpen ? <>
              {contacts.length>1 ? <SelectSheet title="Follow-up contact"
                value={followupContact} options={choices} searchable onChange={setFollowupContact}/> : null}
              <SelectSheet title="Action type" value={actionType}
                options={ACTION_TYPES} onChange={setActionType}/>
              <Field label="Next action (required)" value={nextAction}
                onChangeText={setNextAction} placeholder="e.g. Call to confirm proposal"/>
              <View style={{flexDirection:'row',gap:12}}>
                <NativeSchedulePicker label="Date (required)" mode="date" value={date}
                  onChange={(v)=>{setDate(v);if(!v)setTime('');}}/>
                <NativeSchedulePicker label="Time (optional)" mode="time" value={time}
                  disabled={!date} onChange={setTime}/>
              </View>
              <Text style={styles.subtitle}>
                If no time is selected, the reminder defaults to 9:00 AM
                or the next available same-day time.
              </Text>
            </> : lead.next_action && disposition==='keep' && !completingSale ?
              <Text style={styles.subtitle}>Existing follow-up remains unchanged.</Text> : null}
          </View>
          <View style={styles.card}>
            <Text style={[styles.value,{fontSize:17}]}>3 · Classification</Text>
            <SelectSheet title="Lead status" value={disposition}
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
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={{flexDirection:'row',gap:10}}>
            <View style={{flex:1}}>
              <Button disabled={!canSave} onPress={()=>void submit(false)}>
                {savingKind==='stay'?'Saving…':'Save & Stay'}
              </Button>
            </View>
            <View style={{flex:1}}>
              <Button secondary disabled={!canSave} onPress={()=>void submit(true)}>
                {savingKind==='next'?'Saving…':'Save & Next'}
              </Button>
            </View>
          </View>
          {!hasInteraction && !notes.trim() && !changedFollowup && disposition==='keep' ?
            <Text style={styles.subtitle}>Record an outcome, add a note, or change a follow-up to enable Save.</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
