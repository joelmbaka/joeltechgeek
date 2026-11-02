export type Agent = { id: string; name: string; email: string };

export type LeadStage =
  | 'new' | 'contacted' | 'interested' | 'meeting' | 'proposal'
  | 'negotiation' | 'won' | 'lost' | 'nurture' | 'do_not_contact';

// Outreach defaults to a phone call. Email is a distinct outcome only when
// the agent actually sent an email, not a replacement for call attempts.
export const CALL_OUTCOMES = [
  'number_unavailable', 'switched_off', 'no_answer', 'busy', 'wrong_number',
  'not_interested', 'call_back', 'decision_pending',
  'demo_requested', 'meeting_booked', 'pilot_requested', 'proposal_requested',
  'email_sent', 'other',
] as const;

export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  number_unavailable: 'Number unavailable',
  switched_off: 'Number switched off',
  no_answer: 'No answer',
  busy: 'Line busy',
  wrong_number: 'Wrong number',
  not_interested: 'Not interested',
  call_back: 'Call back requested',
  decision_pending: 'Decision pending',
  demo_requested: 'Demo requested',
  meeting_booked: 'Meeting booked',
  pilot_requested: 'Pilot requested',
  proposal_requested: 'Proposal requested',
  email_sent: 'Email sent',
  other: 'Other',
};

const HISTORICAL_OUTCOME_LABELS: Record<string, string> = {
  connected: 'Connected (previous outcome)',
  interested: 'Interested (previous outcome)',
  whatsapp_requested: 'Demo requested via WhatsApp (previous outcome)',
  email_requested: 'Email requested (previous outcome)',
};

export function callOutcomeLabel(value: string): string {
  if (value in CALL_OUTCOME_LABELS) return CALL_OUTCOME_LABELS[value as CallOutcome];
  if (value in HISTORICAL_OUTCOME_LABELS) return HISTORICAL_OUTCOME_LABELS[value];
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export const LEAD_STAGES: LeadStage[] = [
  'new', 'contacted', 'interested', 'meeting', 'proposal',
  'negotiation', 'won', 'lost', 'nurture', 'do_not_contact',
];

export const RETRY_CALL_OUTCOMES = [
  'number_unavailable', 'switched_off', 'no_answer', 'busy', 'wrong_number',
  // Existing records may still use these legacy values.
] as const;

export function stageForOutcome(previous: LeadStage, outcome: CallOutcome): LeadStage {
  if (outcome === 'not_interested') return 'lost';
  if (outcome === 'meeting_booked') return 'meeting';
  if (outcome === 'proposal_requested') return 'proposal';
  if (outcome === 'demo_requested' || outcome === 'pilot_requested') return 'interested';
  if (outcome === 'decision_pending') return 'nurture';
  // Unanswered attempts are not conversations with a prospect.
  if (previous === 'new' && RETRY_CALL_OUTCOMES.some((item) => item === outcome)) return 'new';
  if (previous === 'new') return 'contacted';
  return previous;
}

export type Lead = {
  id: string;
  company_name: string;
  industry: string;
  country: string;
  city: string | null;
  website: string | null;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  email: string | null;
  existing_system: string | null;
  problem_summary: string | null;
  qualification_reason: string | null;
  source_url: string | null;
  priority: 'high' | 'normal' | 'low';
  stage: LeadStage;
  last_outcome: string | null; // Includes legacy outcome labels in historical leads.
  last_notes: string | null;
  next_action: string | null;
  next_action_at: string | null; // YYYY-MM-DD, optional time
  next_action_time: string | null; // HH:MM:SS when set
  next_action_timezone: string | null; // IANA timezone
  next_action_due_at: string | null; // ISO UTC instant for mobile scheduling
  last_contacted_at: string | null;
  do_not_contact: boolean;
  updated_at: string;
};

export type LeadUpdate = {
  id: string;
  event_type: 'outreach' | 'action_completed' | 'followup_updated';
  outcome: string | null;
  action: string | null;
  notes: string | null;
  next_action: string | null;
  next_action_at: string | null;
  next_action_time: string | null;
  next_action_timezone: string | null;
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
