import { useCallback, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAppDialog } from '@/components/AppDialog';
import { Button, Field, Page, useUIStyles } from '@/components/ui';
import { SelectSheet } from '@/components/SelectSheet';
import { NativeSchedulePicker } from '@/components/NativeSchedulePicker';
import { LeadDetailSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/lib/config';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import { reconcileReminders } from '@/lib/notifications';
import type { Lead, LeadContact, LeadDetails, LeadEvent } from '@/lib/types';
import { LeadContacts } from '@/components/LeadContacts';
import { OUTCOMES, outcomeLabel } from '@/lib/types';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi';
// This is an administrative classification, not a call outcome sent to the outreach API.
const outcomeOptions = [
  ...OUTCOMES.map(([value, label]) => ({ value, label })),
  { value: 'mark_competitor', label: 'Mark as competitor' },
];

export default function LeadScreen() {
  const styles = useUIStyles();
  const theme = useTheme();
  const showDialog = useAppDialog();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { agent } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<LeadEvent[]>([]);
  const [contacts, setContacts] = useState<LeadContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [optOut, setOptOut] = useState(false);
  const dirty = useRef(false);
  const requestVersion = useRef(0);
  const edit = (apply: () => void) => { dirty.current = true; apply(); };

  const load = useCallback((signal: AbortSignal) => {
    if (!agent || !id) return;
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    setLead(null);
    void apiFetch<LeadDetails>('/api/agent-crm/leads/' + encodeURIComponent(id), { signal })
      .then((data) => {
        if (signal.aborted || version !== requestVersion.current) return;
        setLead(data.lead);
        setHistory(data.history);
        setContacts(data.contacts);
        if (!dirty.current) {
          // Blank forms prevent accidentally re-submitting a historical outcome
          // or replacing a scheduled follow-up with stale existing values.
          setOutcome('');
          setNextAction('');
          setDate('');
          setTime('');
          setNotes('');
          setCompletionNotes('');
          setOptOut(false);
        }
      })
      .catch((reason: unknown) => {
        if (!signal.aborted && version === requestVersion.current) {
          setError(reason instanceof Error ? reason.message : 'Unable to load lead.');
        }
      })
      .finally(() => {
        if (!signal.aborted && version === requestVersion.current) setLoading(false);
      });
  }, [agent?.id, id]);
  useFreshOnFocus(load, [load]);
  const reload = () => load(new AbortController().signal);

  const schedule = () => ({
    next_action: nextAction.trim(),
    next_action_at: date.trim() || null,
    next_action_time: time.trim() || null,
    next_action_timezone: timezone,
  });
  const canSaveCall = !saving && !!outcome && !!lead && !lead.do_not_contact && lead.stage !== 'competitor';
  const canSaveFollowup = !saving && !!nextAction.trim() && !!date && !!lead && !lead.do_not_contact && lead.stage !== 'competitor';
  const canComplete = !saving && !!lead?.next_action && !!completionNotes.trim() && !lead?.do_not_contact && lead?.stage !== 'competitor';
  const save = async (kind: 'call' | 'followup' | 'complete') => {
    if (!lead || !id) return;
    if (kind === 'call' && !canSaveCall) return;
    if (kind === 'followup' && !canSaveFollowup) return;
    if (kind === 'complete' && !canComplete) return;
    if (kind !== 'call' && date && !nextAction.trim()) {
      setError('Choose a next action for the selected date.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const base = '/api/agent-crm/leads/' + encodeURIComponent(id);
      const path = kind === 'call' ? base : base + (kind === 'complete' ? '/actions' : '/followup');
      const method = kind === 'complete' ? 'POST' : 'PATCH';
      const unchangedAction = kind === 'complete' &&
        nextAction.trim() === (lead.next_action || '') &&
        date.trim() === (lead.next_action_at || '') &&
        time.trim() === (lead.next_action_time?.slice(0, 5) || '');
      const completionSchedule = unchangedAction
        ? { next_action: '', next_action_at: null, next_action_time: null,
          next_action_timezone: timezone }
        : schedule();
      const payload = kind === 'call'
        // Logging a call must not erase an existing follow-up. Edits to
        // scheduling are submitted through the separate Follow-up section.
        ? { outcome, notes,
          next_action: lead.next_action || '',
          next_action_at: lead.next_action_at || null,
          next_action_time: lead.next_action_time?.slice(0, 5) || null,
          next_action_timezone: lead.next_action_timezone || timezone,
          do_not_contact: optOut }
        : kind === 'complete'
          ? { notes: completionNotes, ...completionSchedule }
          : schedule();
      await apiFetch(path, { method, body: JSON.stringify(payload) });
      dirty.current = false;
      setOptOut(false);
      setOutcome('');
      setNotes('');
      setNextAction('');
      setDate('');
      setTime('');
      setCompletionNotes('');
      reload();
      if (agent) void reconcileReminders(agent).catch(() => {});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save update.');
    } finally { setSaving(false); }
  };

  const updateClassification = async (status: 'competitor' | 'new') => {
    if (!id || saving) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/agent-crm/leads/' + encodeURIComponent(id) + '/classification', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      dirty.current = false;
      reload();
      if (agent) void reconcileReminders(agent).catch(() => {});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update classification.');
    } finally { setSaving(false); }
  };

  if (!agent) return <Page><Text style={styles.error}>Sign in to access lead details.</Text></Page>;
  return <Page>
    {loading ? <LeadDetailSkeleton/> : null}
    {error ? <View style={styles.card}>
      <Text style={styles.error}>{error}</Text>
      {!lead ? <Button secondary onPress={reload}>Retry loading lead</Button> : null}
    </View> : null}
    {lead ? <>
      <Text style={styles.title}>{lead.company_name}</Text>
      <Text style={styles.subtitle}>{lead.industry ? lead.industry + ' · ' : ''}{lead.stage.replace(/_/g, ' ')}</Text>
      <LeadContacts lead={lead} contacts={contacts} onRefresh={reload}/>
      <View style={styles.card}>
        <Text style={styles.label}>Last outcome</Text>
        <Text style={styles.value}>{outcomeLabel(lead.last_outcome)}</Text>
        <Text style={styles.label}>Next action</Text>
        <Text style={styles.value}>{lead.next_action || 'No action scheduled'}</Text>
        {lead.next_action_at ? <Text style={styles.subtitle}>
          {lead.next_action_at}
          {lead.next_action_time ? ' at ' + lead.next_action_time.slice(0, 5) : ' (date only)'}
        </Text> : null}
        {lead.last_notes ? <Text style={styles.subtitle}>Notes: {lead.last_notes}</Text> : null}
      </View>
      {lead.stage === 'competitor' ? <View style={styles.card}>
        <Text style={[styles.title, { fontSize: 18 }]}>Competitor — outreach paused</Text>
        <Text style={styles.subtitle}>
          Retained for competitor research. Calls and follow-up reminders are disabled.
        </Text>
        <Button secondary disabled={saving} onPress={() => showDialog({
          title: 'Reopen as prospect?',
          message: 'Return this business to the new-lead queue?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Reopen',
          onConfirm: () => void updateClassification('new'),
        })}>
          {saving ? 'Saving…' : 'Reopen as prospect'}
        </Button>
      </View> : null}
      {!lead.do_not_contact && lead.stage !== 'competitor' ? <>
        <View style={styles.card}>
          <Text style={[styles.title, { fontSize: 19 }]}>Log call outcome</Text>
          <SelectSheet title="Call outcome" value={outcome} options={outcomeOptions}
            disabled={saving} placeholder="Select outcome"
            onChange={(value) => {
              if (value === 'mark_competitor') {
                showDialog({
                  title: 'Mark as competitor?',
                  message: 'Keep this company for research, but exclude it from outreach and reminders. No call will be recorded.',
                  cancelLabel: 'Cancel',
                  confirmLabel: 'Mark as competitor',
                  onConfirm: () => void updateClassification('competitor'),
                });
                return;
              }
              edit(() => setOutcome(value));
            }}/>
          <Field label="Conversation notes" value={notes}
            onChangeText={(value) => edit(() => setNotes(value))} multiline/>
          <Pressable onPress={() => edit(() => setOptOut(!optOut))}
            accessibilityRole="checkbox" accessibilityState={{ checked: optOut }}
            style={styles.row}>
            <Text style={{ color: optOut ? theme.warning : theme.muted }}>
              {optOut ? '☑' : '□'} Mark Do Not Contact
            </Text>
          </Pressable>
          <Button disabled={!canSaveCall} onPress={() => {
            if (optOut) {
              showDialog({
                title: 'Mark as Do Not Contact?',
                message: 'This lead will be excluded from future outreach and follow-up actions. You can still view its history.',
                cancelLabel: 'Keep active',
                confirmLabel: 'Mark Do Not Contact',
                onConfirm: () => void save('call'),
              });
            } else void save('call');
          }}>{saving ? 'Saving…' : 'Save call outcome'}</Button>
        </View>
        <View style={styles.card}>
          <Text style={[styles.title, { fontSize: 19 }]}>Follow-up</Text>
          <Field label="Next action" value={nextAction}
            onChangeText={(value) => edit(() => setNextAction(value))}
            placeholder="e.g. Call decision maker"/>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <NativeSchedulePicker label="Date" mode="date" value={date}
              onChange={(value) => edit(() => { setDate(value); if (!value) setTime(''); })}/>
            <NativeSchedulePicker label="Time (optional)" mode="time" value={time}
              disabled={!date}
              onChange={(value) => edit(() => setTime(value))}/>
          </View>
          <Text style={styles.subtitle}>
            Add a next action and date to save a follow-up. Time is optional.
          </Text>
          <Button disabled={!canSaveFollowup} onPress={() => void save('followup')}>
            Save follow-up
          </Button>
          {lead.next_action ? <>
            <Field label="Completion notes" value={completionNotes}
              multiline onChangeText={(value) => edit(() => setCompletionNotes(value))}/>
            <Button secondary disabled={!canComplete} onPress={() => void save('complete')}>
              Mark action completed
            </Button>
          </> : null}
        </View>
      </> : <Text style={styles.subtitle}>{lead.stage === 'competitor' ? 'Competitor: no sales outreach.' : 'This lead is marked Do Not Contact.'}</Text>}
      <Text style={[styles.title, { fontSize: 20 }]}>Activity history</Text>
      {history.length === 0 ? <Text style={styles.subtitle}>No activity recorded.</Text> :
        history.map((event) => <View key={event.id} style={styles.card}>
          <Text style={styles.value}>{event.event_type.replace(/_/g, ' ')}</Text>
          <Text style={styles.subtitle}>{new Date(event.created_at).toLocaleString()}</Text>
          {event.outcome ? <Text style={styles.subtitle}>Outcome: {outcomeLabel(event.outcome)}</Text> : null}
          {event.action ? <Text style={styles.subtitle}>Action: {event.action}</Text> : null}
          {event.notes ? <Text style={styles.subtitle}>{event.notes}</Text> : null}
        </View>)}
      <Button secondary onPress={() => router.back()}>Back to leads</Button>
    </> : null}
  </Page>;
}
