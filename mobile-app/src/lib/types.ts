export type Agent = { id: string; name: string; email: string; phone?: string | null; picture_url?: string | null };
export type Lead = {
  id: string; lead_title: string; company_name: string; industry: string; country: string;
  city: string | null; website: string | null; contact_name: string | null;
  contact_role: string | null; phone: string | null; email: string | null;
  existing_system: string | null; problem_summary: string | null;
  qualification_reason: string | null; source_url: string | null;
  priority: 'high' | 'normal' | 'low'; stage: string;
  last_outcome: string | null; last_notes: string | null;
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
  outcome: string | null; action: string | null; notes: string | null;
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
export const OUTCOMES = [
  ['number_unavailable','Number unavailable'], ['switched_off','Switched off'],
  ['no_answer','No answer'], ['busy','Line busy'], ['wrong_number','Wrong number'],
  ['not_interested','Not interested'], ['call_back','Call back requested'],
  ['decision_pending','Decision pending'], ['demo_requested','Demo requested'],
  ['meeting_booked','Meeting booked'], ['pilot_requested','Pilot requested'],
  ['proposal_requested','Proposal requested'], ['email_sent','Email sent'],
  ['other','Other'],
] as const;
export const outcomeLabel = (s: string | null) =>
  OUTCOMES.find((row) => row[0] === s)?.[1] || (s ? s.replace(/_/g, ' ') : 'Not contacted');
