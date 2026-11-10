import { NextResponse } from 'next/server';
import { requireCrmUser, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool } from '@/lib/agent-crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReminderRow = {
  id: string;
  notification_id: string | null;
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
    const db = getCrmPool();
    // Preserve the existing local reminder feed until the additive inbox
    // migration is installed. Missing schema never disables Android alarms.
    const inboxInstalled = await db.query<{installed: boolean}>(
      "SELECT to_regclass('public.crm_notifications') IS NOT NULL AS installed",
    );
    const hasInbox = inboxInstalled.rows[0]?.installed === true;
    const notificationId = hasInbox ? 'n.id::text' : 'NULL::text';
    const notificationJoin = hasInbox ? `
         LEFT JOIN public.crm_notifications n
           ON n.lead_id = l.id AND n.user_id = l.user_id
          AND n.due_at = l.next_action_due_at AND n.canceled_at IS NULL` : '';
    const result = await db.query<ReminderRow>(
      `SELECT l.id::text AS id, ${notificationId} AS notification_id,
              l.next_action_due_at, l.next_action_timezone,
              l.company_name, l.contact_name AS lead_contact_name,
              selected.name AS selected_contact_name, l.next_action
         FROM public.crm_leads l
         ${notificationJoin}
         LEFT JOIN public.crm_lead_contacts selected
           ON selected.id = l.next_action_contact_id AND selected.lead_id = l.id
        WHERE l.user_id = $1 AND l.next_action_due_at > now()
          AND NOT l.do_not_contact
          AND l.stage NOT IN ('won', 'lost', 'competitor', 'do_not_contact')
        ORDER BY l.next_action_due_at ASC, l.id ASC LIMIT 50`,
      [access.user.id],
    );
    return NextResponse.json({ ok: true, reminders: result.rows },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
