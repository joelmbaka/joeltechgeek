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
import { formatFollowupDue } from '@/lib/followup-display';
import type { Lead, LeadContact, LeadDetails, LeadEvent, LeadList } from '@/lib/types';
import { LeadContacts } from '@/components/LeadContacts';
import { OUTCOMES_BY_CHANNEL, outcomeLabel, suggestedStage, STAGE_OPTIONS, activityChannelLabel } from '@/lib/types';
import type { ActivityChannel } from '@/lib/types';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
const ACTION_OPTIONS = [
  {value:'call',label:'Call'}, {value:'email',label:'Email'},
  {value:'whatsapp',label:'WhatsApp'}, {value:'meeting',label:'Meeting'},
  {value:'other',label:'Other'},
];
// This is an administrative classification, not a call outcome sent to the outreach API.
const channelOptions = [
  {value:'call',label:'Call'}, {value:'email',label:'Email'},
  {value:'whatsapp',label:'WhatsApp'}, {value:'other',label:'Other'},
] as const;

export default function LeadScreen() {
  const styles = useUIStyles();
  const theme = useTheme();
  const showDialog = useAppDialog();
  const router = useRouter();
  const { id, view, industry } = useLocalSearchParams<{ id: string; view?: string; industry?: string }>();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<LeadEvent[]>([]);
  const [contacts, setContacts] = useState<LeadContact[]>([]);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [identityCompany, setIdentityCompany] = useState('');
  // null = use the automatic choice, '' = explicitly company/unspecified.
  const [callContactChoice, setCallContactChoice] = useState<string | null>(null);
  const [followupContactChoice, setFollowupContactChoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [channel, setChannel] = useState<ActivityChannel>('call');
  const [stageOverride, setStageOverride] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [actionType, setActionType] = useState('call');
  const [editingContext, setEditingContext] = useState(false);
  const [briefDraft, setBriefDraft] = useState('');
  const [detailsDraft, setDetailsDraft] = useState('');
  const [factsDraft, setFactsDraft] = useState<Array<{label:string;value:string}>>([]);
  const [newFactLabel, setNewFactLabel] = useState('');
  const [newFactValue, setNewFactValue] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [optOut, setOptOut] = useState(false);
  const dirty = useRef(false);
  const requestVersion = useRef(0);
  const edit = (apply: () => void) => { dirty.current = true; apply(); };

  const load = useCallback((signal: AbortSignal) => {
    if (!user || !id) return;
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
          setChannel('call');
          setStageOverride('');
          setNextAction('');
          setDate('');
          setTime('');
          setActionType('call');
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
  }, [user?.id, id]);
  useFreshOnFocus(load, [load]);
  const reload = () => load(new AbortController().signal);
  const beginIdentityEdit = () => {
    if (!lead) return;
    setIdentityCompany(lead.company_name);
    setEditingIdentity(true);
    setError(null);
  };
  const saveIdentity = async () => {
    if (!lead || !id || saving || !(identityCompany.trim() || lead.contact_name?.trim())) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/agent-crm/leads/' + encodeURIComponent(id) + '/identity', {
        method: 'PATCH',
        body: JSON.stringify({
          company_name: identityCompany.trim(),
        }),
      });
      setEditingIdentity(false);
      reload();
      if (user) void reconcileReminders(user).catch(() => {});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update lead details.');
    } finally { setSaving(false); }
  };

  const beginContextEdit = () => {
    if (!lead) return;
    setBriefDraft(lead.lead_brief || '');
    setDetailsDraft(lead.important_details || '');
    setFactsDraft(lead.lead_facts || []);
    setNewFactLabel('');setNewFactValue('');
    setEditingContext(true);
  };
  const saveContext = async () => {
    if (!lead || !id || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await apiFetch<{ok:true;lead:Lead}>(
        '/api/agent-crm/leads/' + encodeURIComponent(id) + '/brief',
        {method:'PATCH',body:JSON.stringify({
          lead_brief:briefDraft.trim(),important_details:detailsDraft.trim(),
          lead_facts:factsDraft,
        })});
      setLead(result.lead);
      setEditingContext(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update lead context.');
    } finally {setSaving(false);}
  };

  const primaryContactId = contacts.find((c) => c.is_primary)?.id || contacts[0]?.id || '';
  const validChoice = (choice: string | null, fallback: string) =>
    choice !== null && (choice === '' || contacts.some((c) => c.id === choice))
      ? choice : fallback;
  const callContactId = contacts.length === 1 ? contacts[0].id
    : contacts.length > 1 ? validChoice(callContactChoice, primaryContactId) : '';
  // Preserve an existing company-level follow-up instead of silently
  // attributing it to the primary contact when editing its schedule.
  const currentFollowupTarget = lead?.next_action
    ? lead.next_action_contact_id || primaryContactId : primaryContactId;
  const followupContactId = contacts.length === 1 ? contacts[0].id
    : contacts.length > 1 ? validChoice(followupContactChoice,
        currentFollowupTarget && contacts.some((c) => c.id === currentFollowupTarget)
          ? currentFollowupTarget : currentFollowupTarget === '' ? '' : primaryContactId)
      : '';
  const contactOptions = [
    { value: '', label: 'Company / unspecified contact' },
    ...contacts.map((c) => ({
      value: c.id, label: (c.name || c.phone || c.email || c.role || 'Contact') +
        (c.role && c.name ? ' — ' + c.role : '') +
        (c.is_primary ? ' (Primary)' : ''),
    })),
  ];

  const schedule = () => ({
    next_action: nextAction.trim(),
    next_action_type: actionType,
    next_action_at: date.trim() || null,
    next_action_time: time.trim() || null,
    next_action_timezone: timezone,
  });
  const outcomeOptions = [
    ...OUTCOMES_BY_CHANNEL[channel].map(([value,label]) => ({value,label})),
    ...(channel === 'call' ? [{value:'mark_competitor',label:'Mark as competitor'}] : []),
  ];
  const suggested = lead ? suggestedStage(lead.stage, outcome) : 'new';
  const stageOptions = [
    {value:'',label:'Suggested: ' + suggested.replaceAll('_',' ')},
    ...STAGE_OPTIONS.map((value) => ({value,label:value.replaceAll('_',' ')})),
  ];
  const canSaveCall = !saving && !!outcome && !!lead && !lead.do_not_contact && lead.stage !== 'competitor';
  const canSaveFollowup = !saving && !!nextAction.trim() && !!date && !!lead && !lead.do_not_contact && lead.stage !== 'competitor';
  const canComplete = !saving && !!lead?.next_action && !!completionNotes.trim() && !lead?.do_not_contact && lead?.stage !== 'competitor';
  const save = async (kind: 'call' | 'followup' | 'complete', advance = false) => {
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
        ? { outcome, channel, notes, contact_id: callContactId || null,
          ...(stageOverride ? {stage:stageOverride} : {}),
          next_action: lead.next_action || '',
          next_action_type: lead.next_action_type || null,
          next_action_at: lead.next_action_at || null,
          next_action_time: lead.next_action_time?.slice(0, 5) || null,
          next_action_timezone: lead.next_action_timezone || timezone,
          do_not_contact: optOut, complete_due_call: channel === 'call' }
        : kind === 'complete'
          ? { notes: completionNotes, ...completionSchedule,
              next_action_contact_id: completionSchedule.next_action ? followupContactId || null : null }
          : { ...schedule(), contact_id: followupContactId || null };
      await apiFetch(path, { method, body: JSON.stringify(payload) });
      dirty.current = false;
      setOptOut(false);
      setOutcome('');
      setChannel('call');
      setStageOverride('');
      setNotes('');
      setNextAction('');
      setDate('');
      setTime('');
      setActionType('call');
      setCompletionNotes('');
      setCallContactChoice(null);
      setFollowupContactChoice(null);
      reload();
      if (user) void reconcileReminders(user).catch(() => {});
      if (advance && kind === 'call') {
        try {
          const params = new URLSearchParams({
            view: view || 'for_you', industry: industry || 'all',
            tz: timezone, limit: '25', offset: '0',
          });
          const next = await apiFetch<LeadList>('/api/agent-crm/leads?' + params);
          const candidate = next.leads.find((item) => item.id !== id);
          if (candidate) {
            router.replace({ pathname: '/leads/[id]',
              params: { id: candidate.id, view: view || 'for_you', industry: industry || 'all' } });
          } else {
            router.replace('/');
          }
        } catch {
          // Activity already saved; never make navigation failure look like a failed save.
          router.replace('/');
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save update.');
    } finally { setSaving(false); }
  };

  const confirmCallSave = (advance: boolean) => {
    if (!canSaveCall) return;
    if (optOut) {
      showDialog({
        title: 'Mark as Do Not Contact?',
        message: 'This lead will be excluded from future outreach and reminders. History remains visible.',
        cancelLabel: 'Keep active', confirmLabel: 'Mark Do Not Contact',
        onConfirm: () => void save('call', advance),
      });
    } else if (['lost','won'].includes(stageOverride || suggested) &&
               (stageOverride || suggested) !== lead?.stage) {
      showDialog({
        title: 'Confirm lead stage',
        message: 'Recording this result will mark the lead ' +
          (stageOverride || suggested).replaceAll('_',' ') + '. Continue?',
        cancelLabel: 'Cancel', confirmLabel: 'Save activity',
        onConfirm: () => void save('call', advance),
      });
    } else {
      void save('call', advance);
    }
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
      if (user) void reconcileReminders(user).catch(() => {});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update classification.');
    } finally { setSaving(false); }
  };

  if (!user) return <Page><Text style={styles.error}>Sign in to access lead details.</Text></Page>;
  return <Page>
    {loading ? <LeadDetailSkeleton/> : null}
    {error ? <View style={styles.card}>
      <Text style={styles.error}>{error}</Text>
      {!lead ? <Button secondary onPress={reload}>Retry loading lead</Button> : null}
    </View> : null}
    {lead ? <>
      <Text style={styles.title}>{lead.company_name || lead.contact_name || 'Unnamed lead'}</Text>
      <Text style={styles.subtitle}>{lead.industry ? lead.industry + ' · ' : ''}{lead.stage.replace(/_/g, ' ')}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Lead brief</Text>
        <Text style={styles.value}>{lead.lead_brief || lead.problem_summary || 'No brief yet'}</Text>
        {!editingContext ? <Button secondary onPress={beginContextEdit}>Edit lead context</Button>
          : <>
            <Field label="Lead brief (220 characters)" value={briefDraft}
              onChangeText={setBriefDraft} multiline/>
            <Field label="Important details" value={detailsDraft}
              onChangeText={setDetailsDraft} multiline/>
            {factsDraft.map((fact,index) => <View key={fact.label + index} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.value}>{fact.label}</Text>
                <Text style={styles.subtitle}>{fact.value}</Text>
              </View>
              <Button secondary onPress={() => setFactsDraft((current) =>
                current.filter((_,itemIndex) => itemIndex !== index))}>Remove</Button>
            </View>)}
            <Field label="Fact label" value={newFactLabel} onChangeText={setNewFactLabel}
              placeholder="e.g. Decision maker"/>
            <Field label="Fact value" value={newFactValue} onChangeText={setNewFactValue}
              placeholder="e.g. Operations manager"/>
            <Button secondary disabled={factsDraft.length >= 12 || !newFactLabel.trim() ||
              !newFactValue.trim() || newFactLabel.trim().length > 80 ||
              newFactValue.trim().length > 300 ||
              factsDraft.some((fact)=>fact.label.toLowerCase()===newFactLabel.trim().toLowerCase())}
              onPress={() => {
                setFactsDraft((current)=>[...current,{
                  label:newFactLabel.trim(),value:newFactValue.trim(),
                }]);
                setNewFactLabel('');setNewFactValue('');
              }}>Add important fact</Button>
            <Button disabled={saving || briefDraft.length > 220 || detailsDraft.length > 5000}
              onPress={() => void saveContext()}>{saving ? 'Saving…' : 'Save context'}</Button>
            <Button secondary disabled={saving} onPress={() => setEditingContext(false)}>Cancel</Button>
          </>}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Last interaction</Text>
        <Text style={styles.value}>{lead.last_outcome
          ? activityChannelLabel(lead.last_activity_channel, lead.last_outcome) +
            ' · ' + outcomeLabel(lead.last_outcome)
          : 'Not contacted'}</Text>
      </View>
      {!editingIdentity ? <Pressable accessibilityRole="button" onPress={beginIdentityEdit}
        style={{ paddingVertical: 10, alignSelf: 'flex-start' }}>
        <Text style={{ color: theme.primaryDark, fontWeight: '800' }}>Edit lead details</Text>
      </Pressable> : <View style={styles.card}>
        <Text style={[styles.title, { fontSize: 18 }]}>Edit lead details</Text>
        <Text style={styles.subtitle}>Company or contact name required.</Text>
        <Field label="Company name" value={identityCompany} onChangeText={setIdentityCompany}/>
        <Text style={styles.subtitle}>Edit the primary contact name in Contacts below.</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button disabled={saving || !(identityCompany.trim() || lead.contact_name?.trim())} onPress={() => void saveIdentity()}>
              {saving ? 'Saving…' : 'Save details'}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button secondary disabled={saving} onPress={() => setEditingIdentity(false)}>Cancel</Button>
          </View>
        </View>
      </View>}

      <View style={styles.card}>
        <Text style={styles.label}>Next action</Text>
        <Text style={styles.value}>{lead.next_action || 'No action scheduled'}</Text>
        {lead.next_action && contacts.length > 1 ? <Text style={styles.subtitle}>
          Contact: {contacts.find((c) => c.id === lead.next_action_contact_id)?.name ||
            (lead.next_action_contact_id ? 'Former contact' : 'Company / unspecified')}
        </Text> : null}
        {lead.next_action_at ? <Text style={styles.subtitle}>
          Reminder due: {formatFollowupDue(lead)}
        </Text> : null}
        {lead.next_action_type ? <Text style={styles.subtitle}>
          Action type: {lead.next_action_type}
        </Text> : null}
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
          <Text style={[styles.title, { fontSize: 19 }]}>Record activity</Text>
          <SelectSheet title="Activity type" value={channel} options={[...channelOptions]}
            onChange={(value) => edit(() => {
              setChannel(value as ActivityChannel);
              setOutcome('');
              setStageOverride('');
            })} disabled={saving}/>
          {contacts.length > 1 ? <SelectSheet title="Contact" value={callContactId}
            options={contactOptions} onChange={(value) => edit(() => setCallContactChoice(value))}
            disabled={saving} searchable/> : null}
          <SelectSheet title="Result" value={outcome} options={outcomeOptions}
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
              edit(() => { setOutcome(value); setStageOverride(''); });
            }}/>
          <Field label="Notes" value={notes}
            onChangeText={(value) => edit(() => setNotes(value))} multiline/>
          {outcome ? <>
            <SelectSheet title="Lead stage after activity" value={stageOverride}
              options={stageOptions} onChange={(value) => edit(() => setStageOverride(value))}
              disabled={saving}/>
            {outcome === 'not_interested' ? <Text style={styles.subtitle}>
              Not interested normally marks the whole lead Lost. Keep the current stage
              above if only one contact declined.
            </Text> : null}
            {outcome === 'trial_started' ? <Text style={styles.subtitle}>
              Trial started is an activity result; its suggested stage is Interested.
            </Text> : null}
            {outcome === 'onboarding_completed' ? <Text style={styles.subtitle}>
              Onboarding completed marks a subscribed and set-up customer Won.
            </Text> : null}
          </> : null}
          <Pressable onPress={() => edit(() => setOptOut(!optOut))}
            accessibilityRole="checkbox" accessibilityState={{ checked: optOut }}
            style={styles.row}>
            <Text style={{ color: optOut ? theme.warning : theme.muted }}>
              {optOut ? '☑' : '□'} Mark Do Not Contact
            </Text>
          </Pressable>
          <Button disabled={!canSaveCall} onPress={() => confirmCallSave(false)}>{saving ? 'Saving…' : 'Save & Stay'}</Button>
          <Button secondary disabled={!canSaveCall} onPress={() => confirmCallSave(true)}>
            {saving ? 'Saving…' : 'Save & Next'}
          </Button>
        </View>
        <View style={styles.card}>
          <Text style={[styles.title, { fontSize: 19 }]}>Follow-up</Text>
          {contacts.length > 1 ? <SelectSheet title="Contact (optional)" value={followupContactId}
            options={contactOptions} onChange={(value) => edit(() => setFollowupContactChoice(value))}
            disabled={saving} searchable/> : null}
          <SelectSheet title="Action type" value={actionType} options={ACTION_OPTIONS}
            onChange={setActionType} disabled={saving}/>
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
      <LeadContacts lead={lead} contacts={contacts} onRefresh={() => {
        reload();
        if (user) void reconcileReminders(user).catch(() => {});
      }}/>
      {lead.important_details || lead.lead_facts?.length ? <View style={styles.card}>
        <Text style={styles.label}>Important details</Text>
        {(lead.lead_facts || []).map((fact,index)=><Text key={index} style={styles.subtitle}>
          {fact.label}: {fact.value}
        </Text>)}
        {lead.important_details ? <Text style={styles.value}>{lead.important_details}</Text> : null}
      </View> : null}
      <Pressable accessibilityRole="button" onPress={() => setHistoryExpanded((v) => !v)}
        style={styles.card}>
        <Text style={styles.value}>
          Activity history ({history.length}) {historyExpanded ? '▴' : '▾'}
        </Text>
      </Pressable>
      {historyExpanded && (history.length === 0
        ? <Text style={styles.subtitle}>No activity recorded.</Text>
        : history.map((event) => <View key={event.id} style={styles.card}>
          <Text style={styles.value}>{event.event_type === 'outreach'
            ? (event.channel ? activityChannelLabel(event.channel, event.outcome) + ' activity' : 'Outreach')
            : event.event_type.replace(/_/g,' ')}</Text>
          <Text style={styles.subtitle}>Recorded: {new Date(event.created_at).toLocaleString()}</Text>
          {event.contact_name_snapshot ? <Text style={styles.subtitle}>
            Contact: {event.contact_name_snapshot}
          </Text> : null}
          {event.outcome ? <Text style={styles.subtitle}>Outcome: {outcomeLabel(event.outcome)}</Text> : null}
          {event.action ? <Text style={styles.subtitle}>Action: {event.action}</Text> : null}
          {event.next_action ? <Text style={styles.subtitle}>Next action: {event.next_action}</Text> : null}
          {event.next_action_at ? <Text style={styles.subtitle}>
            Reminder due: {formatFollowupDue(event)}
          </Text> : null}
          {event.notes ? <Text style={styles.subtitle}>{event.notes}</Text> : null}
        </View>))}
      <Button secondary onPress={() => router.back()}>Back to leads</Button>
    </> : null}
  </Page>;
}
