export type Agent = { id: string; name: string; email: string; phone?: string | null; picture_url?: string | null };
export type Lead = {
  id: string; company_name: string; industry: string; country: string;
  city: string | null; website: string | null; contact_name: string | null;
  contact_role: string | null; phone: string | null; email: string | null;
  existing_system: string | null; problem_summary: string | null;
  qualification_reason: string | null; source_url: string | null;
  priority: 'high' | 'normal' | 'low'; stage: string;
  last_outcome: string | null; last_activity_channel: ActivityChannel | null; last_notes: string | null;
  next_action: string | null; next_action_at: string | null;
  next_action_time: string | null; next_action_timezone: string | null;
  next_action_due_at: string | null; next_action_contact_id: string | null;
  last_contacted_at: string | null;
  do_not_contact: boolean; updated_at: string;
};
export type LeadContact = {
  id: string; lead_id: string;
  name: string | null; role: string | null; phone: string | null; email: string | null;
  is_primary: boolean; created_at: string; updated_at: string;
};
export type LeadEvent = {
  id: string; event_type: 'outreach' | 'action_completed' | 'followup_updated';
  outcome: string | null; channel: ActivityChannel | null;
  action: string | null; notes: string | null;
  next_action: string | null; next_action_at: string | null;
  next_action_time: string | null; next_action_timezone: string | null;
  contact_id: string | null; contact_name_snapshot: string | null;
  created_at: string;
};
export type Stats = {
  total: number; to_call: number; followups_due: number;
  interested: number; meetings: number; won: number;
};
export type LeadList = { ok: true; leads: Lead[]; has_more: boolean; filtered_total: number;
  limit: number; offset: number; stats: Stats; industries: string[]; industry_counts?: Record<string, number> };
export type LeadDetails = { ok: true; lead: Lead; history: LeadEvent[]; contacts: LeadContact[] };
export const ACTIVITY_CHANNELS = ['call','email','whatsapp','other'] as const;
export type ActivityChannel = (typeof ACTIVITY_CHANNELS)[number];
export const OUTCOMES = [
  ['number_unavailable','Number unavailable'],['switched_off','Number switched off'],
  ['no_answer','No answer'],['busy','Line busy'],['wrong_number','Wrong number'],
  ['spoke_to_contact','Spoke to contact'],['referred_to_contact','Referred to another person'],
  ['information_requested','Information requested'],['call_back','Call back requested'],
  ['decision_pending','Decision pending'],['demo_requested','Demo requested'],
  ['meeting_booked','Meeting booked'],['proposal_requested','Proposal requested'],
  ['trial_started','Trial started'],['onboarding_completed','Onboarding completed'],
  ['not_interested','Not interested'],['other','Other'],
] as const;
const messages = [
  ['sent','Sent'],['reply_received','Reply received'],
  ['information_requested','Information requested'],['decision_pending','Decision pending'],
  ['demo_requested','Demo requested'],['meeting_booked','Meeting booked'],
  ['proposal_requested','Proposal requested'],['trial_started','Trial started'],
  ['onboarding_completed','Onboarding completed'],['not_interested','Not interested'],['other','Other'],
] as const;
export const OUTCOMES_BY_CHANNEL = {
  call: OUTCOMES,
  email: messages,
  whatsapp: messages,
  other: [
    ['spoke_to_contact','Spoke to contact'],['information_requested','Information requested'],
    ['decision_pending','Decision pending'],['trial_started','Trial started'],
    ['onboarding_completed','Onboarding completed'],['not_interested','Not interested'],['other','Other'],
  ],
} as const;
const LEGACY_LABELS: Record<string,string> = {
  pilot_requested: 'Pilot requested (previous outcome)',
  email_sent: 'Email sent (previous outcome)',
  connected: 'Connected (previous outcome)',
  whatsapp_requested: 'Demo requested via WhatsApp (previous outcome)',
};
export const outcomeLabel = (s: string | null) =>
  s == null ? 'Not contacted' :
  LEGACY_LABELS[s] || [...OUTCOMES, ...messages].find((row)=>row[0]===s)?.[1] ||
    s.replaceAll('_',' ');
export const activityChannelLabel = (channel: string | null | undefined, outcome?: string | null) => {
  const resolved = channel || (outcome === 'email_sent' ? 'email' : 'call');
  return resolved === 'whatsapp' ? 'WhatsApp' : resolved[0].toUpperCase()+resolved.slice(1);
};
export const STAGE_OPTIONS = [
  'new','contacted','interested','meeting','proposal','negotiation','won','lost','nurture',
] as const;
export function suggestedStage(previous: string, outcome: string): string {
  if (outcome === 'onboarding_completed') return 'won';
  if (outcome === 'not_interested') return 'lost';
  if (['won','lost','competitor','do_not_contact'].includes(previous)) return previous;
  const rank:Record<string,number> = {new:0,contacted:1,nurture:1,interested:2,
    meeting:3,proposal:4,negotiation:5};
  const advance = (target:string) => (rank[previous] ?? 10)<(rank[target] ?? 0) ? target:previous;
  if (outcome === 'meeting_booked') return advance('meeting');
  if (outcome === 'proposal_requested') return advance('proposal');
  if (['trial_started','demo_requested','pilot_requested','information_requested'].includes(outcome))
    return advance('interested');
  if (previous === 'new' && ['number_unavailable','switched_off','no_answer','busy','wrong_number'].includes(outcome))
    return 'new';
  return previous === 'new' ? 'contacted' : previous;
}
