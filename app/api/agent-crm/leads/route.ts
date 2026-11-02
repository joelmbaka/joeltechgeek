import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { CALL_OUTCOMES, LEAD_STAGES, stageForOutcome } from '@/lib/agent-crm/types';
import type { CallOutcome, Lead, LeadStage, LeadStats } from '@/lib/agent-crm/types';
import { isCrmIndustry } from '@/lib/agent-crm/industries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireCrmAgent();
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
             WHERE (last_contacted_at IS NULL OR (next_action_at IS NULL AND COALESCE(last_outcome_v2, last_outcome) IN ('number_unavailable','switched_off','no_answer','busy','wrong_number'))) AND NOT do_not_contact
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


function badInput(message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

function normalizedUrl(value: string): string | null {
  if (!value) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // The browser authenticates using an HTTP-only Auth.js session cookie.
  // Check Origin on writes to prevent cross-site POSTs.
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return badInput('Invalid request origin.', 403);
  }

  const access = await requireCrmAgent();
  if ('response' in access) return access.response;

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return badInput('Please enter valid lead details.');
    }
    body = value as Record<string, unknown>;
  } catch {
    return badInput('Invalid JSON body.');
  }

  const limits = {
    company_name: 180, industry: 100, country: 80, city: 120,
    website: 1000, contact_name: 150, contact_role: 120,
    phone: 40, email: 254, existing_system: 100,
    problem_summary: 2500, qualification_reason: 2500,
    source_url: 1000, priority: 12, stage: 24,
    outcome: 32, notes: 2500, next_action: 300, next_action_at: 10,
  } as const;
  const values: Record<keyof typeof limits, string> = {} as Record<keyof typeof limits, string>;
  for (const [name, limit] of Object.entries(limits)) {
    const raw = body[name];
    if (raw === undefined || raw === null) {
      values[name as keyof typeof limits] = '';
      continue;
    }
    if (typeof raw !== 'string' || raw.length > limit) {
      return badInput(`Please check the ${name.replaceAll('_', ' ')} field.`);
    }
    values[name as keyof typeof limits] = raw.trim();
  }

  if (!values.company_name) return badInput('Company name is required.');
  if (!isCrmIndustry(values.industry)) return badInput('Choose an industry from the list.');
  if (!values.country) return badInput('Country is required.');
  const priority = values.priority || 'normal';
  const stageValue = values.stage || 'new';
  if (!['high', 'normal', 'low'].includes(priority)) return badInput('Invalid priority.');
  if (!LEAD_STAGES.includes(stageValue as LeadStage) || stageValue === 'do_not_contact') {
    return badInput('Invalid lead stage.');
  }
  const outcome = values.outcome || null;
  if (outcome !== null && !CALL_OUTCOMES.includes(outcome as CallOutcome)) {
    return badInput('Invalid call outcome.');
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return badInput('Invalid contact email.');
  }
  for (const key of ['website', 'source_url'] as const) {
    const normalized = normalizedUrl(values[key]);
    if (normalized === null) return badInput(`Invalid ${key.replace('_', ' ')}.`);
    values[key] = normalized;
  }

  const dueDate = values.next_action_at || null;
  if (dueDate && (
    !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
    Number.isNaN(Date.parse(dueDate)) ||
    new Date(dueDate).toISOString().slice(0, 10) !== dueDate
  )) {
    return badInput('Invalid follow-up date.');
  }
  const stage = outcome
    ? stageForOutcome(stageValue as LeadStage, outcome as CallOutcome)
    : stageValue;

  let client: PoolClient | undefined;
  try {
    client = await getCrmPool().connect();
    await client.query('BEGIN');

    // Agent ownership always comes from the verified cookie, never the body.
    const columns = [
      'agent_id', 'company_name', 'industry', 'country', 'city', 'website',
      'contact_name', 'contact_role', 'phone', 'email', 'existing_system',
      'problem_summary', 'qualification_reason', 'source_url', 'priority',
      'stage', 'last_outcome_v2', 'last_notes', 'next_action', 'next_action_at',
      'last_contacted_at',
    ] as const;
    const nullIfEmpty = (value: string) => value || null;
    const params = [
      access.agent.id, values.company_name, values.industry, values.country,
      nullIfEmpty(values.city), nullIfEmpty(values.website),
      nullIfEmpty(values.contact_name), nullIfEmpty(values.contact_role),
      nullIfEmpty(values.phone), nullIfEmpty(values.email),
      nullIfEmpty(values.existing_system), nullIfEmpty(values.problem_summary),
      nullIfEmpty(values.qualification_reason), nullIfEmpty(values.source_url),
      priority, stage, outcome, nullIfEmpty(values.notes),
      nullIfEmpty(values.next_action), dueDate, outcome ? new Date() : null,
    ];

    const inserted = await client.query<{ id: string }>(
      'INSERT INTO public.crm_leads (' + columns.join(', ') + ') VALUES (' +
      params.map((_, index) => '$' + (index + 1)).join(', ') + ') RETURNING id::text AS id',
      params,
    );
    const id = inserted.rows[0].id;

    if (outcome) {
      await client.query(
        `INSERT INTO public.crm_lead_events
          (lead_id, agent_id, event_type, outcome, notes, next_action, next_action_at)
          VALUES ($1, $2, 'outreach', $3, $4, $5, $6::date)`,
        [id, access.agent.id, outcome, nullIfEmpty(values.notes),
          nullIfEmpty(values.next_action), dueDate],
      );
    }
    const read = await client.query<Lead>(
      'SELECT ' + LEAD_COLUMNS +
      ' FROM public.crm_leads WHERE id = $1 AND agent_id = $2',
      [id, access.agent.id],
    );
    await client.query('COMMIT');

    return NextResponse.json(
      { ok: true, lead: read.rows[0] },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch { /* connection unavailable */ }
    }
    if ((error as { code?: string }).code === '23505') {
      return badInput('A lead with this company and industry already exists in your CRM.', 409);
    }
    return crmError(error);
  } finally {
    client?.release();
  }
}
