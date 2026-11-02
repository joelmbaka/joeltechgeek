export type Agent = { id: string; name: string; email: string };

export type LeadStage =
  | 'new' | 'contacted' | 'interested' | 'meeting' | 'proposal'
  | 'negotiation' | 'won' | 'lost' | 'nurture' | 'do_not_contact';

export const CALL_OUTCOMES = [
  'connected', 'no_answer', 'busy', 'switched_off', 'wrong_number',
  'call_back', 'interested', 'not_interested', 'meeting_booked',
  'whatsapp_requested', 'email_requested', 'other',
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const LEAD_STAGES: LeadStage[] = [
  'new', 'contacted', 'interested', 'meeting', 'proposal',
  'negotiation', 'won', 'lost', 'nurture', 'do_not_contact',
];

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
  last_outcome: CallOutcome | null;
  last_notes: string | null;
  next_action: string | null;
  next_action_at: string | null; // YYYY-MM-DD in Africa/Nairobi
  last_contacted_at: string | null;
  do_not_contact: boolean;
  updated_at: string;
};

export type LeadUpdate = {
  id: string;
  outcome: CallOutcome;
  notes: string | null;
  next_action: string | null;
  next_action_at: string | null;
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
