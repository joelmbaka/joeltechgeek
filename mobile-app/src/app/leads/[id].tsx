import { useCallback, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Button, Busy, ChoiceRow, Field, Page, styles } from '@/components/ui';
import { COLORS } from '@/lib/config';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import { reconcileReminders } from '@/lib/notifications';
import type { Lead, LeadDetails, LeadEvent } from '@/lib/types';
import { OUTCOMES, outcomeLabel } from '@/lib/types';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi';

export default function LeadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { agent } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<string>('no_answer');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [optOut, setOptOut] = useState(false);
  const dirty = useRef(false);
  const edit = (apply: () => void) => { dirty.current = true; apply(); };

  const load = useCallback((signal: AbortSignal) => {
    if (!agent || !id) return;
    setLoading(true); setError(null); setLead(null);
    void apiFetch<LeadDetails>('/api/agent-crm/leads/' + encodeURIComponent(id), { signal })
      .then((data) => {
        if (signal.aborted) return;
        setLead(data.lead); setHistory(data.history);
        if (!dirty.current) {
          setNextAction(data.lead.next_action || '');
          setDate(data.lead.next_action_at || '');
          setTime(data.lead.next_action_time?.slice(0,5) || '');
          setNotes(''); setCompletionNotes('');
        }
      })
      .catch((e: unknown) => { if (!signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load lead'); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
  }, [agent?.id, id]);
  useFreshOnFocus(load, [load]);
  const reload = () => load(new AbortController().signal);
  const schedule = () => ({
    next_action: nextAction.trim(), next_action_at: date.trim() || null,
    next_action_time: time.trim() || null,
    next_action_timezone: timezone,
  });
  const save = async (kind: 'call'|'followup'|'complete') => {
    if (!lead || !id) return;
    if (date && !nextAction.trim()) { setError('Choose a next action for the selected date.'); return; }
    setError(null); setSaving(true);
    try {
      const base = '/api/agent-crm/leads/' + encodeURIComponent(id);
      const path = kind === 'call' ? base : base + (kind === 'complete' ? '/actions' : '/followup');
      const method = kind === 'complete' ? 'POST' : 'PATCH';
      const unchangedAction = kind === 'complete' &&
        nextAction.trim() === (lead.next_action || '') &&
        date.trim() === (lead.next_action_at || '') &&
        time.trim() === (lead.next_action_time?.slice(0,5) || '');
      const completionSchedule = unchangedAction ?
        { next_action: '', next_action_at: null, next_action_time: null,
          next_action_timezone: timezone } : schedule();
      const payload = kind === 'call'
        ? { outcome, notes, ...schedule(), do_not_contact: optOut }
        : kind === 'complete' ? { notes: completionNotes, ...completionSchedule } : schedule();
      await apiFetch(path, { method, body: JSON.stringify(payload) });
      dirty.current = false; setOptOut(false);
      // Refetch authoritative server state after every mutation.
      reload();
      if (agent) void reconcileReminders(agent).catch(() => {});
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save update.'); }
    finally { setSaving(false); }
  };
  const call = () => {
    if (!lead?.phone) return;
    const number = lead.phone.replace(/[^\d+]/g, '');
    if (number) void Linking.openURL('tel:' + number);
  };
  if (!agent) return <Page><Text style={styles.error}>Sign in to access lead details.</Text></Page>;
  return <Page>
    {loading ? <Busy label="Fetching the latest lead details…"/> : null}
    {error ? <>
      <Text style={styles.error}>{error}</Text>
      {!lead ? <Button secondary onPress={reload}>Retry</Button> : null}
    </> : null}
    {lead ? <>
      <Text style={styles.title}>{lead.company_name}</Text>
      <Text style={styles.subtitle}>{lead.industry} · {lead.stage.replace(/_/g, ' ')}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Primary contact</Text>
        <Text style={styles.value}>{lead.contact_name || 'No contact specified'}</Text>
        <Text style={styles.subtitle}>{lead.contact_role || ''}</Text>
        {lead.phone ? <Button onPress={call}>Call {lead.phone}</Button> : null}
        {lead.email ? <Pressable onPress={() => void Linking.openURL('mailto:' + lead.email)}>
          <Text style={{ color: COLORS.primary }}>{lead.email}</Text></Pressable> : null}
        {lead.website ? <Text style={styles.subtitle}>{lead.website}</Text> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Last outcome</Text>
        <Text style={styles.value}>{outcomeLabel(lead.last_outcome)}</Text>
        <Text style={styles.label}>Next action</Text>
        <Text style={styles.value}>{lead.next_action || 'No action scheduled'}</Text>
        {lead.next_action_at ? <Text style={styles.subtitle}>
          {lead.next_action_at}{lead.next_action_time ? ' at ' + lead.next_action_time.slice(0,5) : ' (date only)'}
        </Text> : null}
        {lead.last_notes ? <Text style={styles.subtitle}>Notes: {lead.last_notes}</Text> : null}
      </View>
      {!lead.do_not_contact ? <>
        <View style={styles.card}>
          <Text style={styles.title}>Log call outcome</Text>
          <Text style={styles.subtitle}>Calls use the Android dialer. Record the result manually.</Text>
          <ChoiceRow options={OUTCOMES} selected={outcome} onChange={(v) => edit(() => setOutcome(v))}/>
          <Field label="Conversation notes" value={notes} onChangeText={(v) => edit(() => setNotes(v))} multiline/>
          <Pressable onPress={() => edit(() => setOptOut(!optOut))}
            style={styles.row}>
            <Text style={{ color: optOut ? COLORS.red : COLORS.muted }}>
              {optOut ? '☑' : '□'} Mark Do Not Contact</Text>
          </Pressable>
          <Button disabled={saving} onPress={() => {
            if (optOut) Alert.alert('Mark Do Not Contact?', 'Future calls and actions will be blocked.', [
              { text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => void save('call') },
            ]); else void save('call');
          }}>{saving ? 'Saving…' : 'Save call outcome'}</Button>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Follow-up</Text>
          <Field label="Next action" value={nextAction}
            onChangeText={(v) => edit(() => setNextAction(v))} placeholder="e.g. Call decision maker"/>
          <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={(v) => edit(() => setDate(v))}
            placeholder="2026-11-05"/>
          <Field label="Time (HH:MM, optional)" value={time} onChangeText={(v) => edit(() => setTime(v))}
            placeholder="14:30"/>
          <Text style={styles.subtitle}>Dates without a time appear in the due queue but do not create an alarm.</Text>
          <Button secondary disabled={saving} onPress={() => void save('followup')}>Save follow-up</Button>
          {lead.next_action ? <>
            <Field label="Completion notes" value={completionNotes} multiline
              onChangeText={(v) => edit(() => setCompletionNotes(v))}/>
            <Button secondary disabled={saving} onPress={() => void save('complete')}>
              Mark current action completed
            </Button>
          </> : null}
        </View>
      </> : <Text style={styles.error}>This lead is marked Do Not Contact.</Text>}
      <Text style={styles.title}>Activity history</Text>
      {history.length === 0 ? <Text style={styles.subtitle}>No activity recorded.</Text> :
        history.map((event) => <View key={event.id} style={styles.card}>
          <Text style={styles.value}>{event.event_type.replace(/_/g,' ')}</Text>
          <Text style={styles.subtitle}>{new Date(event.created_at).toLocaleString()}</Text>
          {event.outcome ? <Text style={styles.subtitle}>Outcome: {outcomeLabel(event.outcome)}</Text> : null}
          {event.action ? <Text style={styles.subtitle}>Action: {event.action}</Text> : null}
          {event.notes ? <Text style={styles.subtitle}>{event.notes}</Text> : null}
        </View>)}
      <Button secondary onPress={() => router.back()}>Back to leads</Button>
    </> : null}
  </Page>;
}
