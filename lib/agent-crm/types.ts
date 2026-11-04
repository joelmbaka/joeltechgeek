export type Agent = { id: string; name: string; email: string; phone?: string | null; picture_url?: string | null };

export type LeadStage =
  | 'new' | 'contacted' | 'interested' | 'meeting' | 'proposal'
  | 'negotiation' | 'won' | 'lost' | 'nurture' | 'competitor' | 'do_not_contact';

export const ACTIVITY_CHANNELS = ['call', 'email', 'whatsapp', 'other'] as const;
export type ActivityChannel = (typeof ACTIVITY_CHANNELS)[number];
// These represent NEW choices. Older published clients may still send
// 'pilot_requested' and 'email_sent', but new selectors must not show them.
export const CALL_OUTCOMES = [
  'number_unavailable', 'switched_off', 'no_answer', 'busy', 'wrong_number',
  'spoke_to_contact', 'referred_to_contact', 'information_requested',
  'call_back', 'decision_pending', 'demo_requested', 'meeting_booked',
  'proposal_requested', 'trial_started', 'onboarding_completed',
  'not_interested', 'other',
] as const;
export const MESSAGE_OUTCOMES = [
  'sent', 'reply_received', 'information_requested', 'decision_pending',
  'demo_requested', 'meeting_booked', 'proposal_requested',
  'trial_started', 'onboarding_completed', 'not_interested', 'other',
] as const;
export const OTHER_OUTCOMES = [
  'spoke_to_contact', 'information_requested', 'decision_pending',
  'trial_started', 'onboarding_completed', 'not_interested', 'other',
] as const;
export const LEGACY_OUTCOMES = ['pilot_requested', 'email_sent'] as const;
export const CHANNEL_OUTCOMES = {
  call: CALL_OUTCOMES,
  email: MESSAGE_OUTCOMES,
  whatsapp: MESSAGE_OUTCOMES,
  other: OTHER_OUTCOMES,
} as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
export type ActivityOutcome = CallOutcome | (typeof MESSAGE_OUTCOMES)[number] | (typeof LEGACY_OUTCOMES)[number];
export const CALL_OUTCOME_LABELS: Record<ActivityOutcome,string> = {
  number_unavailable:'Number unavailable', switched_off:'Number switched off',
  no_answer:'No answer', busy:'Line busy', wrong_number:'Wrong number',
  spoke_to_contact:'Spoke to contact', referred_to_contact:'Referred to another person',
  information_requested:'Information requested', call_back:'Call back requested',
  decision_pending:'Decision pending', demo_requested:'Demo requested',
  meeting_booked:'Meeting booked', proposal_requested:'Proposal requested',
  trial_started:'Trial started', onboarding_completed:'Onboarding completed',
  not_interested:'Not interested', other:'Other', sent:'Sent', reply_received:'Reply received',
  pilot_requested:'Pilot requested (previous outcome)', email_sent:'Email sent (previous outcome)',
};
const HISTORICAL_OUTCOME_LABELS: Record<string,string> = {
  connected:'Connected (previous outcome)', interested:'Interested (previous outcome)',
  whatsapp_requested:'Demo requested via WhatsApp (previous outcome)',
  email_requested:'Email requested (previous outcome)',
};
export function callOutcomeLabel(value: string): string {
  if (value in CALL_OUTCOME_LABELS) return CALL_OUTCOME_LABELS[value as ActivityOutcome];
  if (value in HISTORICAL_OUTCOME_LABELS) return HISTORICAL_OUTCOME_LABELS[value];
  return value.replaceAll('_',' ').replace(/\b\w/g,(c)=>c.toUpperCase());
}
export function activityChannelForOutcome(value: string): ActivityChannel {
  return value === 'email_sent' ? 'email' : 'call';
}
export function resolveActivityChannel(rawChannel: unknown, rawOutcome: unknown):
  {ok:true;channel:ActivityChannel} | {ok:false;error:string} {
  const outcome = typeof rawOutcome === 'string' ? rawOutcome : '';
  if (rawChannel === undefined || rawChannel === null) {
    const channel = activityChannelForOutcome(outcome);
    if ((LEGACY_OUTCOMES as readonly string[]).includes(outcome) ||
        (CHANNEL_OUTCOMES[channel] as readonly string[]).includes(outcome)) return {ok:true,channel};
    return {ok:false,error:'Choose a valid activity outcome.'};
  }
  if (typeof rawChannel !== 'string' || !(ACTIVITY_CHANNELS as readonly string[]).includes(rawChannel))
    return {ok:false,error:'Choose a valid activity type.'};
  const channel = rawChannel as ActivityChannel;
  if (!(CHANNEL_OUTCOMES[channel] as readonly string[]).includes(outcome))
    return {ok:false,error:'This outcome is not available for that activity type.'};
  return {ok:true,channel};
}
export const LEAD_STAGES: LeadStage[] = [
  'new','contacted','interested','meeting','proposal','negotiation','won','lost',
  'nurture','competitor','do_not_contact',
];
export const RETRY_CALL_OUTCOMES = [
  'number_unavailable','switched_off','no_answer','busy','wrong_number',
] as const;
export function stageForOutcome(previous: LeadStage, outcome: ActivityOutcome): LeadStage {
  // Only an explicit stage override can reopen a completed lead.
  if (['competitor','do_not_contact','won','lost'].includes(previous)) return previous;
  if (outcome === 'onboarding_completed') return 'won';
  if (outcome === 'not_interested') return 'lost';
  const rank: Partial<Record<LeadStage,number>> = {
    new:0, contacted:1, nurture:1, interested:2, meeting:3, proposal:4, negotiation:5,
  };
  const advance = (target: LeadStage): LeadStage =>
    (rank[previous] ?? 10) < (rank[target] ?? 0) ? target : previous;
  if (outcome === 'meeting_booked') return advance('meeting');
  if (outcome === 'proposal_requested') return advance('proposal');
  if (['trial_started','demo_requested','pilot_requested','information_requested'].includes(outcome))
    return advance('interested');
  if (previous === 'new' && (RETRY_CALL_OUTCOMES as readonly string[]).includes(outcome)) return 'new';
  return previous === 'new' ? 'contacted' : previous;
}

export type LeadContact = {
  id: string;
  lead_id: string;
  name: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  company_name: string;
  industry: string;
  country: string;
  city: string | null;
  website: string | null;
  contact_name: string | null;
  contact_role: string | null;
  contacts_search?: string | null;
  phone: string | null;
  email: string | null;
  existing_system: string | null;
  problem_summary: string | null;
  qualification_reason: string | null;
  source_url: string | null;
  priority: 'high' | 'normal' | 'low';
  stage: LeadStage;
  last_outcome: string | null; // Includes legacy outcome labels in historical leads.
  last_activity_channel: ActivityChannel | null;
  last_notes: string | null;
  next_action: string | null;
  next_action_at: string | null; // YYYY-MM-DD, optional time
  next_action_time: string | null; // HH:MM:SS when set
  next_action_timezone: string | null; // IANA timezone
  next_action_due_at: string | null; // ISO UTC instant for mobile scheduling
  next_action_contact_id: string | null; // Optional contact assigned to the current follow-up
  last_contacted_at: string | null;
  do_not_contact: boolean;
  updated_at: string;
};

export type LeadUpdate = {
  id: string;
  event_type: 'outreach' | 'action_completed' | 'followup_updated';
  outcome: string | null;
  channel: ActivityChannel | null;
  action: string | null;
  notes: string | null;
  next_action: string | null;
  next_action_at: string | null;
  next_action_time: string | null;
  next_action_timezone: string | null;
  contact_id: string | null;
  contact_name_snapshot: string | null;
  created_at: string;
};

export type LeadStats = {
  total: number;
  to_call: number;
  followups_due: number;
  interested: number;
  meetings: number;
  won: number;
};
