import { NextResponse } from 'next/server';
import { requireCrmUser, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool } from '@/lib/agent-crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReminderRow = {
  id: string;
  next_action_due_at: string;
  next_action_timezone: string | null;
  company_name: string | null;
  lead_contact_name: string | null;
  selected_contact_name: string | null;
  next_action: string | null;
};

/**
 * Private, read-only feed used to schedule local Android reminders.
 * Selected contacts are joined by BOTH ID and parent lead, so a company's
 * primary contact is never incorrectly presented as the follow-up contact.
 * Phone numbers, emails, activity history and private notes are not sent.
 */
export async function GET(request: Request) {
  const access = await requireCrmUser(request);
  if ('response' in access) return access.response;
  try {
    const result = await getCrmPool().query<ReminderRow>(
      `SELECT l.id::text AS id, l.next_action_due_at, l.next_action_timezone,
              l.company_name, l.contact_name AS lead_contact_name,
              selected.name AS selected_contact_name, l.next_action
         FROM public.crm_leads l
         LEFT JOIN public.crm_lead_contacts selected
           ON selected.id = l.next_action_contact_id AND selected.lead_id = l.id
        WHERE l.user_id = $1 AND l.next_action_due_at > now()
          AND NOT l.do_not_contact
          AND l.stage NOT IN ('won', 'lost', 'competitor')
        ORDER BY l.next_action_due_at ASC, l.id ASC LIMIT 50`,
      [access.user.id],
    );
    return NextResponse.json({ ok: true, reminders: result.rows },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
