import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireCrmAgent, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import { CALL_OUTCOMES, LEAD_STAGES, stageForOutcome } from '@/lib/agent-crm/types';
import type { CallOutcome, Lead, LeadStage, LeadStats } from '@/lib/agent-crm/types';
import { canUseBusinessCategory } from '@/lib/agent-crm/categories';
import { parseFollowupSchedule, followupDueAtSQL } from '@/lib/agent-crm/followups';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Search text of all contacts. Existing lead columns remain primary-contact snapshots.
const CONTACT_SEARCH_COLUMN = `(SELECT string_agg(concat_ws(' ', c.name, c.phone, c.email), ' ')
  FROM public.crm_lead_contacts c WHERE c.lead_id = crm_leads.id) AS contacts_search`;


/** A paginated, server-searchable response for Android. Web GET remains unchanged. */
async function getPagedLeads(params: URLSearchParams, agentId: string) {
  const rawLimit = params.get('limit') || '25';
  const rawOffset = params.get('offset') || '0';
  if (!/^\d+$/.test(rawLimit) || !/^\d+$/.test(rawOffset))
    return badInput('Invalid pagination parameters.');
  const limit = Number(rawLimit);
  const offset = Number(rawOffset);
  if (limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset > 1000000)
    return badInput('Pagination is out of range.');

  const search = (params.get('q') || '').trim().replace(/\s+/g, ' ');
  if (search.length > 120) return badInput('Search is too long.');
  const queue = params.get('queue') || 'all';
  const sort = params.get('sort') || 'recommended';
  const industry = (params.get('industry') || '').trim();
  if (!['all','due','to_call','interested'].includes(queue) ||
      !['recommended','recent','company','priority','followup'].includes(sort) ||
      industry.length > 100) return badInput('Invalid filter.');

  const due = "(next_action_at IS NOT NULL AND ((next_action_due_at IS NOT NULL AND next_action_due_at <= now()) OR (next_action_due_at IS NULL AND next_action_at <= ((now() AT TIME ZONE COALESCE(next_action_timezone, 'Africa/Nairobi'))::date))))";
  const active = "NOT do_not_contact AND stage NOT IN ('won','lost','competitor')";
  const filters: string[] = ['agent_id = $1'];
  const args: unknown[] = [agentId];
  const bind = (value: unknown) => { args.push(value); return '$' + args.length; };
  if (industry === '__uncategorized__') filters.push("btrim(industry) = ''");
  else if (industry && industry !== 'all') filters.push('industry = ' + bind(industry));
  if (queue === 'due') filters.push(active + ' AND ' + due);
  if (queue === 'to_call') filters.push(active +
    " AND (last_contacted_at IS NULL OR (next_action_at IS NULL AND COALESCE(last_outcome_v2, last_outcome) IN ('number_unavailable','switched_off','no_answer','busy','wrong_number')))");
  if (queue === 'interested') filters.push("stage IN ('interested','meeting','proposal','negotiation')");
  if (search) {
    for (const term of search.split(' ').slice(0, 8)) {
      const pattern = '%' + term.replace(/[!%_]/g, (char) => '!' + char) + '%';
      const p = bind(pattern);
      filters.push('(company_name ILIKE ' + p + " ESCAPE '!' OR " +
        'contact_name ILIKE ' + p + " ESCAPE '!' OR " +
        'phone ILIKE ' + p + " ESCAPE '!' OR " +
        'email ILIKE ' + p + " ESCAPE '!' OR " +
        'industry ILIKE ' + p + " ESCAPE '!' OR " +
        'EXISTS (SELECT 1 FROM public.crm_lead_contacts c WHERE c.lead_id=crm_leads.id ' +
        "AND (coalesce(c.name,'') ILIKE " + p + " ESCAPE '!' OR " +
        "coalesce(c.phone,'') ILIKE " + p + " ESCAPE '!' OR " +
        "coalesce(c.email,'') ILIKE " + p + " ESCAPE '!')))");
    }
  }
  const order: Record<string,string> = {
    recommended: 'CASE WHEN ' + due + ' THEN 0 WHEN last_contacted_at IS NULL THEN 1 ELSE 2 END, next_action_at ASC NULLS LAST, next_action_due_at ASC NULLS LAST, updated_at DESC, id DESC',
    recent: 'updated_at DESC, id DESC',
    company: 'lower(company_name) ASC, id ASC',
    priority: "CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, updated_at DESC, id DESC",
    followup: 'next_action_at ASC NULLS LAST, next_action_due_at ASC NULLS LAST, id ASC',
  };
  try {
    const db = getCrmPool();
    // Build SQL + placeholders before executing. Both are scoped to agent_id.
    const where = filters.join(' AND ');
    const countArgs = [...args];
    const lim = bind(limit + 1);
    const off = bind(offset);
    const [leads, filteredCount, summary, industryRows] = await Promise.all([
      db.query<Lead>('SELECT ' + LEAD_COLUMNS + ', ' + CONTACT_SEARCH_COLUMN + ' FROM public.crm_leads WHERE ' +
        where + ' ORDER BY ' + order[sort] + ' LIMIT ' + lim + ' OFFSET ' + off, args),
      db.query<{ total: number }>('SELECT count(*)::int AS total FROM public.crm_leads WHERE ' + where, countArgs),
      db.query<LeadStats>(
        'SELECT count(*)::int AS total, ' +
        "count(*) FILTER (WHERE (last_contacted_at IS NULL OR (next_action_at IS NULL AND COALESCE(last_outcome_v2,last_outcome) IN ('number_unavailable','switched_off','no_answer','busy','wrong_number'))) AND NOT do_not_contact AND stage NOT IN ('won','lost','competitor'))::int AS to_call, " +
        'count(*) FILTER (WHERE ' + due + " AND NOT do_not_contact AND stage NOT IN ('won','lost','competitor'))::int AS followups_due, " +
        "count(*) FILTER (WHERE stage IN ('interested','meeting','proposal','negotiation'))::int AS interested, " +
        "count(*) FILTER (WHERE stage = 'meeting')::int AS meetings, " +
        "count(*) FILTER (WHERE stage = 'won')::int AS won " +
        'FROM public.crm_leads WHERE agent_id = $1',
        [agentId],
      ),
      db.query<{ industry: string; count: number }>(
        "SELECT industry, count(*)::int AS count FROM public.crm_leads WHERE agent_id = $1 AND btrim(industry) <> '' GROUP BY industry ORDER BY industry",
        [agentId],
      ),
    ]);
    return NextResponse.json({
      ok: true, leads: leads.rows.slice(0, limit),
      has_more: leads.rows.length > limit, filtered_total: filteredCount.rows[0]?.total ?? 0, limit, offset,
      stats: summary.rows[0], industries: industryRows.rows.map((row) => row.industry),
      industry_counts: Object.fromEntries(industryRows.rows.map((row) => [row.industry, row.count])),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return crmError(error); }
}

export async function GET(request: Request) {
  const access = await requireCrmAgent(request);
  if ('response' in access) return access.response;

  const searchParams = new URL(request.url).searchParams;
  if (searchParams.has('limit')) {
    return getPagedLeads(searchParams, access.agent.id);
  }
  try {
    const db = getCrmPool();
    const [leadsResult, statsResult] = await Promise.all([
      db.query<Lead>(
        'SELECT ' + LEAD_COLUMNS + ', ' + CONTACT_SEARCH_COLUMN +
        ' FROM public.crm_leads WHERE agent_id = $1 ' +
        "ORDER BY CASE WHEN next_action_at IS NOT NULL AND ((next_action_due_at IS NOT NULL AND next_action_due_at <= now()) OR (next_action_due_at IS NULL AND next_action_at <= ((now() AT TIME ZONE COALESCE(next_action_timezone, 'Africa/Nairobi'))::date))) THEN 0 " +
        'WHEN last_contacted_at IS NULL THEN 1 ELSE 2 END, ' +
        'next_action_at ASC NULLS LAST, next_action_due_at ASC NULLS LAST, updated_at DESC LIMIT 1000',
        [access.agent.id],
      ),
      db.query<LeadStats>(
        `SELECT count(*)::int AS total,
           count(*) FILTER (
             WHERE (last_contacted_at IS NULL OR (next_action_at IS NULL AND COALESCE(last_outcome_v2, last_outcome) IN ('number_unavailable','switched_off','no_answer','busy','wrong_number'))) AND NOT do_not_contact
               AND stage NOT IN ('won','lost','competitor')
           )::int AS to_call,
           count(*) FILTER (
             WHERE next_action_at IS NOT NULL AND ((next_action_due_at IS NOT NULL AND next_action_due_at <= now()) OR (next_action_due_at IS NULL AND next_action_at <= ((now() AT TIME ZONE COALESCE(next_action_timezone, 'Africa/Nairobi'))::date))) AND NOT do_not_contact
               AND stage NOT IN ('won','lost','competitor')
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
  if (!validCrmWriteOrigin(request)) return badInput('Invalid request origin.', 403);
  const access = await requireCrmAgent(request);
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
    outcome: 32, notes: 2500, next_action: 300, next_action_at: 10, next_action_time: 5, next_action_timezone: 64,
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
  if (!values.country) return badInput('Country is required.');
  const priority = values.priority || 'normal';
  const stageValue = values.stage || 'new';
  if (!['high', 'normal', 'low'].includes(priority)) return badInput('Invalid priority.');
  if (!LEAD_STAGES.includes(stageValue as LeadStage) || stageValue === 'do_not_contact' || stageValue === 'competitor') {
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

  const parsedSchedule = parseFollowupSchedule(values);
  if (!parsedSchedule.ok) return badInput(parsedSchedule.error);
  const schedule = parsedSchedule.value;
  const dueDate = schedule.next_action_at;
  if (dueDate && !values.next_action) return badInput('Enter a next action for this date.');
  const stage = outcome
    ? stageForOutcome(stageValue as LeadStage, outcome as CallOutcome)
    : stageValue;

  let client: PoolClient | undefined;
  try {
    // Validate before acquiring a transaction connection to avoid pool starvation.
    if (values.industry && !(await canUseBusinessCategory(access.agent.id, values.industry))) {
      return badInput('Choose a saved business category or create a new one.');
    }
    client = await getCrmPool().connect();
    await client.query('BEGIN');

    // Agent ownership always comes from the verified cookie, never the body.
    const columns = [
      'agent_id', 'company_name', 'industry', 'country', 'city', 'website',
      'contact_name', 'contact_role', 'phone', 'email', 'existing_system',
      'problem_summary', 'qualification_reason', 'source_url', 'priority',
      'stage', 'last_outcome_v2', 'last_notes', 'next_action', 'next_action_at',
      'next_action_time', 'next_action_timezone', 'next_action_due_at', 'last_contacted_at',
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
      nullIfEmpty(values.next_action), dueDate,
      schedule.next_action_time, schedule.next_action_timezone, outcome ? new Date() : null,
    ];

    const markers = params.map((_, index) => '$' + (index + 1));
    // The derived UTC due time occupies column 23, between timezone
    // and last_contacted_at. Parameters 20-22 carry date/time/timezone.
    markers.splice(22, 0, followupDueAtSQL(20, 21, 22));
    const inserted = await client.query<{ id: string }>(
      'INSERT INTO public.crm_leads (' + columns.join(', ') + ') VALUES (' +
      markers.join(', ') + ') RETURNING id::text AS id',
      params,
    );
    const id = inserted.rows[0].id;

    // Persist the first contact in the dedicated table, preserving legacy
    // fields on the lead as the primary contact snapshot for older clients.
    let primaryContactId: string | null = null;
    if ([values.contact_name, values.contact_role, values.phone, values.email].some(Boolean)) {
      const contact = await client.query<{ id: string }>(
        `INSERT INTO public.crm_lead_contacts (lead_id, name, role, phone, email, is_primary)
          VALUES ($1, $2, $3, $4, $5, true) RETURNING id::text`,
        [id, nullIfEmpty(values.contact_name), nullIfEmpty(values.contact_role),
          nullIfEmpty(values.phone), nullIfEmpty(values.email)],
      );
      primaryContactId = contact.rows[0]?.id ?? null;
    }
    if (values.next_action && primaryContactId) {
      await client.query(
        'UPDATE public.crm_leads SET next_action_contact_id = $2::uuid WHERE id = $1',
        [id, primaryContactId],
      );
    }

    if (outcome) {
      await client.query(
        `INSERT INTO public.crm_lead_events
          (lead_id, agent_id, event_type, outcome, notes, next_action, next_action_at,
           next_action_time, next_action_timezone, next_action_due_at,
           contact_id, contact_name_snapshot)
          VALUES ($1, $2, 'outreach', $3, $4, $5, $6::date, $7::time, $8,
            ${followupDueAtSQL(6, 7, 8)}, $9::uuid, $10)`,
        [id, access.agent.id, outcome, nullIfEmpty(values.notes),
          nullIfEmpty(values.next_action), dueDate, schedule.next_action_time, schedule.next_action_timezone,
          primaryContactId, primaryContactId
            ? (values.contact_name || values.phone || values.email || values.contact_role || 'Contact')
            : null],
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
      return badInput('A lead with this company and business category already exists in your CRM.', 409);
    }
    return crmError(error);
  } finally {
    client?.release();
  }
}
