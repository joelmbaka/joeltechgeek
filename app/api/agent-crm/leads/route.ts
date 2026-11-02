import { NextResponse } from 'next/server';
import { requireCrmAgent, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import type { Lead, LeadStats } from '@/lib/agent-crm/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;

  try {
    const db = getCrmPool();
    const [leadsResult, statsResult] = await Promise.all([
      db.query<Lead>(
        'SELECT ' + LEAD_COLUMNS +
        ' FROM public.crm_leads WHERE agent_id = $1 ' +
        "ORDER BY CASE WHEN next_action_at IS NOT NULL AND next_action_at <= ((now() AT TIME ZONE 'Africa/Nairobi')::date) THEN 0 " +
        'WHEN last_contacted_at IS NULL THEN 1 ELSE 2 END, ' +
        'next_action_at ASC NULLS LAST, updated_at DESC LIMIT 1000',
        [access.agent.id],
      ),
      db.query<LeadStats>(
        `SELECT count(*)::int AS total,
           count(*) FILTER (
             WHERE (last_contacted_at IS NULL OR (next_action_at IS NULL AND last_outcome IN ('no_answer','busy','switched_off'))) AND NOT do_not_contact
               AND stage NOT IN ('won','lost')
           )::int AS to_call,
           count(*) FILTER (
             WHERE next_action_at <= ((now() AT TIME ZONE 'Africa/Nairobi')::date) AND NOT do_not_contact
               AND stage NOT IN ('won','lost')
           )::int AS followups_due,
           count(*) FILTER (
             WHERE stage IN ('interested','meeting','proposal','negotiation')
           )::int AS interested,
           count(*) FILTER (WHERE stage = 'meeting')::int AS meetings,
           count(*) FILTER (WHERE stage = 'won')::int AS won
         FROM public.crm_leads WHERE agent_id = $1`,
        [access.agent.id],
      ),
    ]);

    return NextResponse.json(
      {
        ok: true,
        agent: access.agent,
        leads: leadsResult.rows,
        stats: statsResult.rows[0],
        has_more: (statsResult.rows[0]?.total || 0) > leadsResult.rows.length,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return crmError(error);
  }
}
