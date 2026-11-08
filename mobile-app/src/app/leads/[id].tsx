import { useCallback, useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Button, Field, Page, useUIStyles } from '@/components/ui';
import { SelectSheet } from '@/components/SelectSheet';
import { LeadDetailSkeleton } from '@/components/Skeleton';
import { LeadContacts } from '@/components/LeadContacts';
import { LeadResearchGuide, LEAD_BRIEF_EXAMPLE, LEAD_DETAILS_EXAMPLE,
  LEAD_FACT_LABEL_EXAMPLE, LEAD_FACT_VALUE_EXAMPLE } from '@/components/LeadResearchGuide';
import { LeadContactActions } from '@/components/LeadContactActions';
import { RecordUpdateSheet } from '@/components/RecordUpdateSheet';
import type { UnifiedUpdate } from '@/components/RecordUpdateSheet';
import { InlineFollowupEditor } from '@/components/InlineFollowupEditor';
import type { InlineFollowupUpdate } from '@/components/InlineFollowupEditor';
import { useAppDialog } from '@/components/AppDialog';
import { useTheme } from '@/lib/config';
import { useAuth } from '@/lib/AuthProvider';
import { apiFetch, ApiError } from '@/lib/api';
import { useFreshOnFocus } from '@/lib/useFreshOnFocus';
import { reconcileReminders } from '@/lib/notifications';
import { formatFollowupDue } from '@/lib/followup-display';
import { activityChannelLabel, outcomeLabel } from '@/lib/types';
import {
  QUEUE_PAGE_SIZE, nextSnapshotId, nextPageAfterSnapshot, parseQueueIds,
} from '@/lib/lead-queue';
import type { Lead, LeadContact, LeadDetails, LeadEvent, LeadList } from '@/lib/types';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const excluded = (lead: Lead) => lead.do_not_contact ||
  ['won','lost','competitor','do_not_contact'].includes(lead.stage);
function websiteUrl(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  // Never reinterpret an explicit non-web scheme (mailto:, javascript:, etc.) as a host.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return null;
  try {
    const candidate = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
    return ['https:','http:'].includes(candidate.protocol) && !!candidate.hostname
      && !candidate.username && !candidate.password ? candidate.href : null;
  } catch { return null; }
}
function eventLabel(event: LeadEvent): string {
  if (event.event_type === 'outreach') return (event.channel ?
    activityChannelLabel(event.channel,event.outcome) : 'Outreach') +
    ': ' + outcomeLabel(event.outcome);
  if (event.event_type === 'action_completed') return event.action || 'Action completed';
  if (event.event_type === 'note_added') return 'Note added';
  if (event.event_type === 'classification_changed') return event.action || 'Classification changed';
  return 'Follow-up updated';
}

export default function LeadScreen() {
  const styles = useUIStyles();
  const theme = useTheme();
  const dialog = useAppDialog();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const {
    id, view, industry, queueIds:queueIdsParam, queueOffset:queueOffsetParam,
    queueMore, queueView, queueQuery,
  } = useLocalSearchParams<{
    id:string;view?:string;industry?:string;queueIds?:string;
    queueOffset?:string;queueMore?:string;queueView?:string;queueQuery?:string;
  }>();
  const {user} = useAuth();
  const [lead,setLead] = useState<Lead|null>(null);
  const [contacts,setContacts] = useState<LeadContact[]>([]);
  const [history,setHistory] = useState<LeadEvent[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);
  const [notice,setNotice] = useState('');
  const [contactId,setContactId] = useState<string|null>(null);
  const [historyExpanded,setHistoryExpanded] = useState(false);
  const [updateOpen,setUpdateOpen] = useState(false);
  const [inlineFollowupMode,setInlineFollowupMode] = useState<'edit'|'complete'|null>(null);
  const [savingKind,setSavingKind] = useState<'stay'|'next'|null>(null);
  const [nextRetry,setNextRetry] = useState<(() => void) | null>(null);
  const savingRef = useRef(false);
  // Discard older detail GETs when focus, a save, and foreground refresh overlap.
  const detailsRequestVersion = useRef(0);
  const [otherSaving,setOtherSaving] = useState<'context'|'reopen'|null>(null);
  const [contextEditing,setContextEditing] = useState(false);
  const [briefDraft,setBriefDraft] = useState('');
  const [detailsDraft,setDetailsDraft] = useState('');
  const [factsDraft,setFactsDraft] = useState<Array<{label:string;value:string}>>([]);
  const [factLabel,setFactLabel] = useState('');
  const [factValue,setFactValue] = useState('');

  const load = useCallback((signal:AbortSignal) => {
    if (!id || !user) return;
    const version = ++detailsRequestVersion.current;
    setLoading(true);
    setError(null);
    void apiFetch<LeadDetails>('/api/agent-crm/leads/'+encodeURIComponent(id),{signal})
      .then(data=>{
        if (signal.aborted || version !== detailsRequestVersion.current) return;
        setLead(data.lead);setContacts(data.contacts);setHistory(data.history);
      }).catch(reason=>{
        if (!signal.aborted && version === detailsRequestVersion.current)
          setError(reason instanceof Error?reason.message:'Unable to load lead.');
      }).finally(()=>{
        if (!signal.aborted && version === detailsRequestVersion.current) setLoading(false);
      });
  },[id,user?.id]);
  useFreshOnFocus(load,[load]);
  const reload = () => load(new AbortController().signal);
  // Await this after a successful write so the current screen displays fresh history
  // before Save & Stay is considered fully settled. Never repeat the write on GET failure.
  const refreshDetails = async (leadId: string): Promise<boolean> => {
    const version = ++detailsRequestVersion.current;
    try {
      const details = await apiFetch<LeadDetails>(
        '/api/agent-crm/leads/'+encodeURIComponent(leadId),
      );
      if (version !== detailsRequestVersion.current) return false;
      if (details.lead.id !== leadId) return false;
      setLead(details.lead);
      setContacts(details.contacts);
      setHistory(details.history);
      setError(null);
      setLoading(false);
      return true;
    } catch {
      if (version === detailsRequestVersion.current) setLoading(false);
      return false;
    }
  };
  const activeLead = lead && lead.id === id ? lead : null;
  const primaryId = contacts.find(c=>c.is_primary)?.id || contacts[0]?.id || '';
  const chosenContactId = contactId!==null && contacts.some(c=>c.id===contactId)
    ? contactId : primaryId;
  const chosenContact = contacts.find(c=>c.id===chosenContactId);
  const companyOnly = contacts.length === 0;
  const locked = !!activeLead && excluded(activeLead);
  const contactOptions = contacts.map(c=>({
    value:c.id,label:(c.name||c.phone||c.email||'Contact')+(c.is_primary?' (Primary)':''),
  }));

  const openUpdate = () => {
    if (!activeLead || locked) return;
    setInlineFollowupMode(null);
    setUpdateOpen(true);setNotice('');
  };

  const saveUnified = async (payload:UnifiedUpdate, advance:boolean) => {
    if (!activeLead || !user || savingRef.current) return;
    savingRef.current=true;
    setSavingKind(advance?'next':'stay');setError('');setNotice('');
    try {
      const response=await apiFetch<{ok:true;lead:Lead}>(
        '/api/agent-crm/leads/'+encodeURIComponent(id)+'/updates',{
          method:'POST',body:JSON.stringify(payload),
        });
      // The mutation response is authoritative; show its lead state immediately.
      // Only fetch history once the POST has committed, protecting against stale GETs.
      ++detailsRequestVersion.current;
      setLead(response.lead);
      setUpdateOpen(false);
      setNotice('Update saved');
      void reconcileReminders(user).catch(()=>{});
      if (!advance) {
        const fresh = await refreshDetails(response.lead.id);
        setNotice(fresh ? 'Update saved' :
          'Update saved, but history could not refresh. Tap Refresh details.');
      }
      if(advance) {
        // Continue through the snapshot in the order seen on the original list.
        // A save may remove or reorder the current lead in the live query.
        const ids = view === 'closed' ? [] : parseQueueIds(queueIdsParam);
        const savedIndex = ids.indexOf(response.lead.id);
        const selectedView = view && view !== 'closed' ? view : 'for_you';
        const selectedIndustry = industry || 'all';
        const apiView = view === 'closed' ? 'for_you' :
          (queueView || (selectedView === 'all' ? 'all_active' : selectedView));
        const originalOffset = Number(queueOffsetParam);
        const offset = Number.isSafeInteger(originalOffset) &&
          originalOffset >= 0 ? originalOffset : 0;
        if (__DEV__) console.info('[CRM_SAVE_NEXT]', {
          advance, savedLeadId: response.lead.id, routeView: view, queueView: apiView,
          queueOffset: offset, queueMore, queueIdsCount: ids.length,
          currentIndex: savedIndex,
        });
        const openNext = (
          nextId: string, nextIds: string[], nextOffset: number, hasMore: boolean,
        ) => {
          setLead(null);
          setContacts([]);
          setHistory([]);
          setLoading(true);
          router.replace({pathname:'/leads/[id]',params:{
            id:nextId,view:selectedView,industry:selectedIndustry,
            queueIds:nextIds.join(','),queueOffset:String(nextOffset),
            queueMore:hasMore?'1':'0',queueView:apiView,queueQuery:queueQuery||'',
          }});
        };
        const nextId = nextSnapshotId(ids, response.lead.id);
        if (nextId) {
          openNext(nextId, ids, offset, queueMore === '1');
        } else if (savedIndex !== -1 && queueMore !== '1') {
          router.replace('/');
        } else {
          // At page boundaries, overlap with the preceding page: saving can
          // remove a record from a filtered queue and shift OFFSET results.
          const queryOffset = savedIndex !== -1 ?
            Math.max(0, offset - QUEUE_PAGE_SIZE) : 0;
          const params = new URLSearchParams({
            view:apiView, industry:selectedIndustry, q:queueQuery||'',
            tz:timezone, limit:String(QUEUE_PAGE_SIZE*3), offset:String(queryOffset),
          });
          const loadNext = async (): Promise<void> => {
            try {
              const next = await apiFetch<LeadList>('/api/agent-crm/leads?'+params);
              const fetchedIds = next.leads.map(row=>row.id);
              if (__DEV__) console.info('[CRM_SAVE_NEXT_BOUNDARY]', {
                url: '/api/agent-crm/leads?'+params.toString(),
                status: 200, fetchedRecordCount: fetchedIds.length, fetchedIds,
              });
              if (savedIndex !== -1) {
                const page = nextPageAfterSnapshot(ids,fetchedIds,queryOffset,next.has_more);
                if (__DEV__) console.info('[CRM_SAVE_NEXT_BOUNDARY_RESULT]', { page });
                if (page) {
                  setNextRetry(null); openNext(page.ids[0],page.ids,page.offset,page.hasMore);
                } else {
                  setNextRetry(null);
                  setError('Update saved, but no next lead was found in this queue. Return to the list and refresh.');
                }
              } else {
                const pageIds = fetchedIds.filter(leadId=>leadId!==response.lead.id).slice(0,QUEUE_PAGE_SIZE);
                if (pageIds.length) {
                  setNextRetry(null); openNext(pageIds[0],pageIds,0,
                    next.has_more || fetchedIds.length>QUEUE_PAGE_SIZE);
                } else {
                  setNextRetry(null);
                  setError('Update saved, but no next lead was found. Return to the list and refresh.');
                }
              }
            } catch (reason) {
              if (__DEV__) console.warn('[CRM_SAVE_NEXT_BOUNDARY_ERROR]', {
                url: '/api/agent-crm/leads?'+params.toString(),
                status: reason instanceof ApiError ? reason.status : 0,
                error: reason instanceof Error ? reason.message : String(reason),
              });
              setError('Update saved, but the next lead could not load. Retry next lead.');
              setNextRetry(()=>{ void loadNext(); });
            }
          };
          void loadNext();
        }
      }
    } finally {
      savingRef.current=false;
      setSavingKind(null);
    }
  };
  const saveInlineFollowup = async (change: InlineFollowupUpdate) => {
    if (!activeLead || !user) throw new Error('Sign in to update this follow-up.');
    const leadId = activeLead.id;
    const response = change.kind === 'edit'
      ? await apiFetch<{ok:true;lead:Lead}>(
        '/api/agent-crm/leads/'+encodeURIComponent(leadId)+'/followup',{
          method:'PATCH',body:JSON.stringify({
            next_action:change.action,
            next_action_type:change.actionType,
            next_action_at:change.date,
            next_action_time:change.time,
            next_action_timezone:change.timezone,
            contact_id:change.contactId,
          }),
        })
      : await apiFetch<{ok:true;lead:Lead}>(
        '/api/agent-crm/leads/'+encodeURIComponent(leadId)+'/updates',{
          method:'POST',body:JSON.stringify({
            channel:null,outcome:null,notes:change.notes,disposition:'keep',
            followup:{mode:'complete'},
          }),
        });
    ++detailsRequestVersion.current;
    setLead(response.lead);
    setInlineFollowupMode(null);
    setNotice(change.kind === 'edit' ? 'Follow-up saved' : 'Follow-up completed');
    void reconcileReminders(user).catch(()=>{});
    const fresh = await refreshDetails(leadId);
    if (!fresh) setNotice('Follow-up saved, but history could not refresh. Tap Refresh details.');
  };

  const openWebsite = async () => {
    const url = websiteUrl(activeLead?.website||null);
    if (!url) {
      dialog({title:'Invalid website URL',message:'Edit this lead to add a valid website URL.'});
      return;
    }
    try { await WebBrowser.openBrowserAsync(url); }
    catch { dialog({title:'Website unavailable',message:'Could not open this website.'}); }
  };
  const editContext = () => {
    if(!activeLead)return;
    setBriefDraft(activeLead.lead_brief||'');
    setDetailsDraft(activeLead.important_details||'');
    setFactsDraft(activeLead.lead_facts||[]);
    setFactLabel('');setFactValue('');setContextEditing(true);
  };
  const saveContext = async () => {
    if (!activeLead || otherSaving) return;
    setOtherSaving('context');
    try {
      const r=await apiFetch<{ok:true;lead:Lead}>(
        '/api/agent-crm/leads/'+encodeURIComponent(id)+'/brief',{
          method:'PATCH',body:JSON.stringify({
            lead_brief:briefDraft.trim(),important_details:detailsDraft.trim(),
            lead_facts:factsDraft,
          }),
        });
      setLead(r.lead);setContextEditing(false);setNotice('Lead context updated');
    } catch(e) {setError(e instanceof Error?e.message:'Could not update context.');}
    finally {setOtherSaving(null);}
  };
  const reopenCompetitor = () => {
    if (!activeLead || activeLead.stage!=='competitor' || otherSaving) return;
    // Use the validated ID returned by the lead API, not transient router params.
    const leadId = activeLead.id;
    if (!UUID.test(leadId)) {
      setError('Unable to reopen: this lead has an invalid identifier.');
      return;
    }
    const path = '/api/agent-crm/leads/'+encodeURIComponent(leadId)+'/classification';
    dialog({title:'Reopen competitor as prospect?',
      message:'This business will return to active outreach. Confirm that contacting it is appropriate.',
      cancelLabel:'Cancel',confirmLabel:'Reopen',
      onConfirm:()=> {
        setOtherSaving('reopen');
        setError(null);
        void apiFetch<{ok:true;lead:Lead}>(path,{
          method:'PATCH',body:JSON.stringify({status:'new'}),
        }).then(async response=>{
          ++detailsRequestVersion.current;
          setLead(response.lead);
          const fresh = await refreshDetails(leadId);
          setNotice(fresh ? 'Reopened as prospect' :
            'Reopened as prospect; history refresh unavailable. Tap Refresh details.');
          if(user)void reconcileReminders(user).catch(()=>{});
        }).catch(e=>{
          if (__DEV__) console.warn('[CRM_REOPEN]', {
            endpoint:path, leadId, message:e instanceof Error?e.message:String(e),
          });
          setError(e instanceof Error?e.message:'Could not reopen lead.');
        }).finally(()=>setOtherSaving(null));
      },
    });
  };

  if(!user)return <Page><Text style={styles.error}>Sign in to access lead details.</Text></Page>;
  return <Page keyboardAware keyboardVerticalOffset={headerHeight}>
    <Stack.Screen options={{
      headerRight: () => <Pressable accessibilityRole="button" accessibilityLabel="Edit lead details"
        disabled={!activeLead || !!otherSaving}
        onPress={()=>router.push({pathname:'/leads/edit/[id]',params:{id:String(activeLead?.id || id)}})}
        style={{paddingHorizontal:10,paddingVertical:10,opacity:activeLead?1:.5}}>
        <Text style={{color:theme.primaryDark,fontWeight:'800'}}>Edit</Text>
      </Pressable>,
    }}/>
    {!activeLead && loading ? <LeadDetailSkeleton/> : null}
    {error ? <View style={styles.card}>
      <Text style={styles.error}>{error}</Text>
      {nextRetry ? <Button secondary onPress={nextRetry}>Retry next lead</Button> : null}
      {!activeLead ? <Button secondary onPress={reload}>Retry loading lead</Button> : null}
    </View> : null}
    {notice ? <View style={{gap:6}}>
      <Text style={{color:theme.primaryDark,fontWeight:'700'}}>{notice}</Text>
      {notice.includes('refresh') ? <Button secondary onPress={()=>void refreshDetails(activeLead?.id || String(id))}>
        Refresh details
      </Button> : null}
    </View> : null}
    {activeLead ? <>
      <View style={{gap:4}}>
        <Text style={styles.title}>{activeLead.company_name||activeLead.contact_name||'Unnamed lead'}</Text>
        <Text style={styles.subtitle}>
          {[activeLead.industry,activeLead.city||activeLead.country].filter(Boolean).join(' · ')}
        </Text>
        <Text style={{color:theme.ink,fontWeight:'700',textTransform:'capitalize'}}>
          {activeLead.stage.replaceAll('_',' ')} · {activeLead.last_contacted_at||activeLead.last_outcome?'Previously contacted':'Never contacted'}
        </Text>
      </View>
      {locked ? <View style={styles.card}>
        <Text style={[styles.value,{fontSize:17}]}>Closed & Excluded</Text>
        <Text style={styles.subtitle}>
          This record is retained for reference. Outreach and reminders are disabled.
        </Text>
        {activeLead.stage==='competitor'? <Button secondary disabled={!!otherSaving}
          onPress={reopenCompetitor}>{otherSaving==='reopen'?'Reopening…':'Reopen as prospect'}</Button> : null}
      </View> : <View style={styles.card}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Text style={[styles.value,{fontSize:17}]}>Next follow-up</Text>
          {activeLead.next_action && activeLead.next_action_due_at &&
            new Date(activeLead.next_action_due_at).getTime()<=Date.now() ?
            <Text style={{color:theme.warning,fontWeight:'800'}}>Due</Text> : null}
        </View>
        {inlineFollowupMode ? <InlineFollowupEditor
          key={activeLead.id+':'+inlineFollowupMode}
          lead={activeLead} contacts={contacts} mode={inlineFollowupMode}
          onSave={saveInlineFollowup} onCancel={()=>setInlineFollowupMode(null)}/>
        : <>
          <Text style={activeLead.next_action?styles.value:styles.subtitle}>
            {activeLead.next_action||'No follow-up scheduled'}
          </Text>
          {activeLead.next_action ? <>
            <Text style={styles.subtitle}>{formatFollowupDue(activeLead)||'No reminder date'}
              {activeLead.next_action_contact_id?
                ' · '+(contacts.find(c=>c.id===activeLead.next_action_contact_id)?.name||'Contact')
                :' · Company / unspecified'}
            </Text>
            <View style={{flexDirection:'row',gap:9}}>
              <View style={{flex:1}}><Button secondary
                onPress={()=>setInlineFollowupMode('edit')}>Edit</Button></View>
              <View style={{flex:1}}><Button secondary
                onPress={()=>setInlineFollowupMode('complete')}>Complete</Button></View>
            </View>
          </> : <Button secondary
              onPress={()=>setInlineFollowupMode('edit')}>Schedule follow-up</Button>}
        </>}
      </View>}
      <View style={{gap:8}}>
        {contacts.length>1 ? <SelectSheet title="Contact for quick actions"
          value={chosenContactId} options={contactOptions}
          onChange={setContactId} searchable dismissKeyboardOnOpen/> : null}
        <LeadContactActions
          phone={companyOnly?activeLead.phone:chosenContact?.phone}
          email={companyOnly?activeLead.email:chosenContact?.email}
          country={activeLead.country} disabled={locked}/>
      </View>
      <View style={styles.card}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <Text style={[styles.value,{fontSize:17}]}>Lead overview</Text>
          {!contextEditing ? <Pressable onPress={editContext} accessibilityRole="button">
            <Text style={{color:theme.primaryDark,fontWeight:'700'}}>Edit</Text>
          </Pressable> : null}
        </View>
        {!contextEditing ? <>
          <Text style={styles.value}>{activeLead.lead_brief||activeLead.problem_summary||'No lead brief yet.'}</Text>
          {activeLead.website ? <Pressable accessibilityRole="link"
            onPress={()=>void openWebsite()} style={{paddingVertical:8}}>
            <Text style={{color:theme.primaryDark,fontWeight:'700'}}>↗ Visit website</Text>
          </Pressable> : null}
          {activeLead.important_details ? <Text style={styles.subtitle}>
            {activeLead.important_details}</Text> : null}
          {activeLead.lead_facts?.map((fact,i)=><Text key={i} style={styles.subtitle}>
            {fact.label}: {fact.value}</Text>)}
        </> : <>
          <LeadResearchGuide/>
          <Field label="Lead brief (max 220 characters)" value={briefDraft}
            placeholder={LEAD_BRIEF_EXAMPLE} onChangeText={setBriefDraft} multiline/>
          <Field label="Important details" value={detailsDraft}
            placeholder={LEAD_DETAILS_EXAMPLE} onChangeText={setDetailsDraft} multiline/>
          {factsDraft.map((fact,i)=><View key={i}
            style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <Text style={[styles.subtitle,{flex:1}]}>{fact.label}: {fact.value}</Text>
            <Pressable onPress={()=>setFactsDraft(a=>a.filter((_,j)=>j!==i))}>
              <Text style={{color:theme.warning}}>Remove</Text>
            </Pressable>
          </View>)}
          <Field label="Fact label" placeholder={LEAD_FACT_LABEL_EXAMPLE}
            value={factLabel} onChangeText={setFactLabel}/>
          <Field label="Fact value" placeholder={LEAD_FACT_VALUE_EXAMPLE}
            value={factValue} onChangeText={setFactValue}/>
          <Button secondary disabled={!factLabel.trim()||!factValue.trim()||factsDraft.length>=12}
            onPress={()=>{setFactsDraft(v=>[...v,{label:factLabel.trim(),value:factValue.trim()}]);
              setFactLabel('');setFactValue('');}}>Add fact</Button>
          <View style={{flexDirection:'row',gap:10}}>
            <View style={{flex:1}}><Button disabled={!!otherSaving||briefDraft.length>220||detailsDraft.length>5000}
              onPress={()=>void saveContext()}>{otherSaving==='context'?'Saving…':'Save context'}</Button></View>
            <View style={{flex:1}}><Button secondary disabled={!!otherSaving}
              onPress={()=>setContextEditing(false)}>Cancel</Button></View>
          </View>
        </>}
      </View>
      {!locked ? <Button onPress={openUpdate}>+ Record update</Button> : null}
      <View style={styles.card}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <Text style={[styles.value,{fontSize:17}]}>Activity history ({history.length})</Text>
          {history.length>3 ? <Pressable onPress={()=>setHistoryExpanded(v=>!v)}>
            <Text style={{color:theme.primaryDark,fontWeight:'700'}}>
              {historyExpanded?'Show recent':'View all'}
            </Text>
          </Pressable> : null}
        </View>
        {history.length===0 ? <Text style={styles.subtitle}>No activity recorded yet.</Text> :
          (historyExpanded?history:history.slice(0,3)).map(event=>
            <View key={event.id} style={{borderTopWidth:1,borderColor:theme.border,paddingTop:10,gap:4}}>
              <Text style={styles.value}>{eventLabel(event)}</Text>
              <Text style={styles.label}>{new Date(event.created_at).toLocaleString(undefined,{
                month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',
              })}</Text>
              {event.contact_name_snapshot ? <Text style={styles.subtitle}>
                {event.contact_name_snapshot}</Text> : null}
              {event.notes ? <Text style={styles.subtitle}>{event.notes}</Text> : null}
              {event.next_action ? <Text style={styles.subtitle}>Next: {event.next_action}</Text> : null}
              {event.next_action_at ? <Text style={styles.subtitle}>
                Due: {formatFollowupDue(event)}</Text> : null}
            </View>,
          )}
      </View>
      <LeadContacts lead={activeLead} contacts={contacts}
        onRefresh={()=>{reload();void reconcileReminders(user).catch(()=>{});}}/>
      <Button secondary onPress={()=>router.back()}>← Back to leads</Button>
      <RecordUpdateSheet visible={updateOpen} lead={activeLead} contacts={contacts}
        savingKind={savingKind}
        onClose={()=>{if(!savingKind)setUpdateOpen(false);}}
        onSave={saveUnified}/>
    </> : null}
  </Page>;
}
