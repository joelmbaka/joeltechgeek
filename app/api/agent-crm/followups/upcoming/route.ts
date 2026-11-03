import { NextResponse } from 'next/server';
import { requireCrmAgent, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool } from '@/lib/agent-crm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Minimal, agent-scoped reminder feed. No full lead records downloaded. */
export async function GET(request: Request) {
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;
  try {
    const result = await getCrmPool().query<{ id: string; next_action_due_at: string }>(
      `SELECT id::text AS id, next_action_due_at
       FROM public.crm_leads WHERE agent_id = $1
         AND next_action_due_at > now()
         AND NOT do_not_contact AND stage NOT IN ('won','lost')
       ORDER BY next_action_due_at ASC, id ASC LIMIT 50`,
      [access.agent.id],
    );
    return NextResponse.json({ ok: true, reminders: result.rows },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}
