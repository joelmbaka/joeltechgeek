import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Field, useUIStyles } from './ui';
import { SelectSheet } from './SelectSheet';
import { NativeSchedulePicker } from './NativeSchedulePicker';
import type { Lead, LeadContact } from '@/lib/types';

export type InlineFollowupUpdate =
  | { kind: 'edit'; action: string; actionType: string; date: string;
      time: string | null; timezone: string; contactId: string | null }
  | { kind: 'complete'; notes: string };

const ACTION_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
] as const;
type ActionType = typeof ACTION_TYPES[number]['value'];

export function InlineFollowupEditor({
  lead, contacts, mode, onSave, onCancel,
}: {
  lead: Lead;
  contacts: LeadContact[];
  mode: 'edit' | 'complete';
  onSave: (update: InlineFollowupUpdate) => Promise<void>;
  onCancel: () => void;
}) {
  const styles = useUIStyles();
  const [action, setAction] = useState(lead.next_action || '');
  const [actionType, setActionType] = useState<ActionType>(
    (lead.next_action_type as ActionType | null) || 'call',
  );
  const [date, setDate] = useState(lead.next_action_at || '');
  const [time, setTime] = useState(lead.next_action_time?.slice(0, 5) || '');
  const [contactId, setContactId] = useState(
    lead.next_action ? (lead.next_action_contact_id || '') :
      (contacts.find(c => c.is_primary)?.id || contacts[0]?.id || ''),
  );
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAction(lead.next_action || '');
    setActionType(lead.next_action_type || 'call');
    setDate(lead.next_action_at || '');
    setTime(lead.next_action_time?.slice(0, 5) || '');
    setContactId(lead.next_action ? (lead.next_action_contact_id || '') :
      (contacts.find(c => c.is_primary)?.id || contacts[0]?.id || ''));
    setNotes('');
    setError('');
  }, [lead.id, mode]);

  const choices = [
    {value:'',label:'Company / unspecified contact'},
    ...contacts.map(c=>({value:c.id,label:
      (c.name || c.phone || c.email || 'Contact') + (c.is_primary ? ' (Primary)' : '')})),
  ];
  const changed = action.trim() !== (lead.next_action || '') ||
    date !== (lead.next_action_at || '') ||
    time !== (lead.next_action_time?.slice(0, 5) || '') ||
    actionType !== (lead.next_action_type || 'call') ||
    (contactId || null) !== (lead.next_action_contact_id || null);

  const submit = async () => {
    if (busyRef.current) return;
    if (mode === 'edit' && (!action.trim() || !date || !changed)) return;
    busyRef.current = true;
    setBusy(true);setError('');
    try {
      if (mode === 'complete') {
        await onSave({ kind:'complete',notes:notes.trim() });
      } else {
        await onSave({
          kind:'edit',action:action.trim(),actionType,date,
          time:time || null,
          timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC',
          contactId:contactId || null,
        });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update follow-up.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return <View style={{gap:12,paddingTop:5}}>
    <Text style={[styles.value,{fontSize:16}]}>
      {mode === 'edit' ? (lead.next_action ? 'Edit follow-up' : 'Schedule follow-up')
        : 'Complete follow-up'}
    </Text>
    {mode === 'edit' ? <>
      {contacts.length > 1 ? <SelectSheet title="Contact" value={contactId}
        options={choices} searchable disabled={busy} onChange={setContactId}/> : null}
      <SelectSheet title="Action type" value={actionType} options={ACTION_TYPES}
        disabled={busy} onChange={value=>{
          if (ACTION_TYPES.some(option=>option.value===value)) setActionType(value as ActionType);
        }}/>
      <Field label="Next action" value={action} onChangeText={setAction}
        placeholder="e.g. Call to confirm requirements"/>
      <View style={{flexDirection:'row',gap:12}}>
        <NativeSchedulePicker label="Date" mode="date" value={date}
          disabled={busy} onChange={value=>{setDate(value);if(!value)setTime('');}}/>
        <NativeSchedulePicker label="Time (optional)" mode="time" value={time}
          disabled={busy || !date} onChange={setTime}/>
      </View>
      <Text style={styles.subtitle}>Without a time, the reminder defaults to 9:00 AM
        or the next available same-day time.</Text>
    </> : <>
      <Text style={styles.subtitle}>
        Completing this task clears its reminder and records the completion in activity history.
      </Text>
      <Field label="Completion notes (optional)" value={notes} onChangeText={setNotes} multiline/>
    </>}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={{flexDirection:'row',gap:10}}>
      <View style={{flex:1}}>
        <Button disabled={busy || (mode === 'edit' && (!action.trim() || !date || !changed))}
          onPress={()=>void submit()}>
          {busy ? 'Saving…' : mode === 'edit' ? 'Save follow-up' : 'Mark completed'}
        </Button>
      </View>
      <View style={{flex:1}}>
        <Button secondary disabled={busy} onPress={onCancel}>Cancel</Button>
      </View>
    </View>
  </View>;
}
