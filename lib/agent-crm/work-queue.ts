import { NextResponse } from 'next/server';
import type { CrmUser, Lead } from './types';
import { getCrmPool, LEAD_COLUMNS } from './db';
import { crmError } from './auth';

export const WORK_VIEWS = ['for_you','to_call','followups','done_today','priority','all','all_az'] as const;
export type WorkView = (typeof WORK_VIEWS)[number];

export function callRetryDays(failedAttempts: number): number | null {
  if (!Number.isSafeInteger(failedAttempts) || failedAttempts < 1 || failedAttempts >= 5) return null;
  return failedAttempts <= 2 ? 1 : 3;
}
export function validZone(zone: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: zone }); return true; }
  catch { return false; }
}

const FAIL = "('no_answer','switched_off','busy')";
const BAD = "('wrong_number','number_unavailable')";
const ACTIVE = "NOT w.do_not_contact AND w.stage NOT IN ('won','lost','competitor','do_not_contact')";

/** Contact-aware call history. Older unassigned call events are a fallback. */
export function workQueueSQL(): string {
  return [
    'WITH base AS (SELECT '+LEAD_COLUMNS+', user_id,',
    "(SELECT c.id::text FROM public.crm_lead_contacts c WHERE c.lead_id=crm_leads.id AND c.is_primary=true ORDER BY c.created_at,c.id LIMIT 1) AS primary_contact_id",
    'FROM public.crm_leads WHERE user_id=$1),',
    'calls AS (',
    "SELECT e.lead_id::text lead_id,COALESCE(e.contact_id::text,'') target_id,e.created_at,e.outcome::text outcome,e.id::text event_id",
    "FROM public.crm_lead_events e JOIN base b ON b.id=e.lead_id WHERE e.event_type='outreach' AND COALESCE(e.channel,'call')='call'",
    'UNION ALL',
    "SELECT u.lead_id::text,'',u.created_at,u.outcome::text,u.id::text FROM public.crm_lead_updates u JOIN base b ON b.id=u.lead_id WHERE u.outcome IS DISTINCT FROM 'email_sent'",
    '), ranked AS (SELECT c.*,',
    'row_number() OVER (PARTITION BY lead_id,target_id ORDER BY created_at DESC,event_id DESC) rn,',
    'sum(CASE WHEN outcome IN '+FAIL+' THEN 0 ELSE 1 END) OVER (PARTITION BY lead_id,target_id ORDER BY created_at DESC,event_id DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) reset_count',
    'FROM calls c),',
    'call_summary AS (SELECT lead_id,target_id,',
    'max(created_at) FILTER(WHERE rn=1) last_call_at,',
    'max(outcome) FILTER(WHERE rn=1) last_call_outcome,',
    'count(*) FILTER(WHERE reset_count=0 AND outcome IN '+FAIL+')::int failed_call_streak',
    'FROM ranked GROUP BY lead_id,target_id),',
    'worked AS (SELECT lead_id,max(created_at) last_worked_at FROM (',
    "SELECT e.lead_id::text lead_id,e.created_at FROM public.crm_lead_events e JOIN base b ON b.id=e.lead_id WHERE e.event_type IN ('outreach','action_completed')",
    'UNION ALL SELECT u.lead_id::text,u.created_at FROM public.crm_lead_updates u JOIN base b ON b.id=u.lead_id',
    ') a GROUP BY lead_id),',
    'work AS (SELECT b.*,coalesce(s.last_call_at,legacy.last_call_at) last_call_at,',
    'coalesce(s.last_call_outcome,legacy.last_call_outcome) last_call_outcome,',
    'coalesce(s.failed_call_streak,legacy.failed_call_streak,0) failed_call_streak,',
    'a.last_worked_at,COALESCE(contact.phone,b.phone) callable_phone,',
    "CASE WHEN b.next_action_at IS NOT NULL AND (b.next_action_due_at<=now() OR (b.next_action_due_at IS NULL AND b.next_action_at::date<=(now() AT TIME ZONE $2)::date)) THEN true ELSE false END is_due,",
    "CASE WHEN a.last_worked_at IS NOT NULL AND (a.last_worked_at AT TIME ZONE $2)::date=(now() AT TIME ZONE $2)::date THEN true ELSE false END done_today",
    'FROM base b',
    "LEFT JOIN call_summary s ON s.lead_id=b.id::text AND s.target_id=COALESCE(b.next_action_contact_id,b.primary_contact_id,'')",
    "LEFT JOIN call_summary legacy ON legacy.lead_id=b.id::text AND legacy.target_id=''",
    'LEFT JOIN worked a ON a.lead_id=b.id::text',
    'LEFT JOIN public.crm_lead_contacts contact ON contact.id::text=COALESCE(b.next_action_contact_id,b.primary_contact_id) AND contact.lead_id=b.id',
    '), eligible AS (SELECT w.*,',
    'CASE WHEN w.last_call_at IS NULL THEN true WHEN w.last_call_outcome IN '+FAIL,
    'AND w.failed_call_streak BETWEEN 1 AND 4 AND (now() AT TIME ZONE $2)::date >= (w.last_call_at AT TIME ZONE $2)::date + CASE WHEN w.failed_call_streak<=2 THEN 1 ELSE 3 END',
    'THEN true ELSE false END call_eligible,',
    'CASE WHEN w.last_call_at IS NOT NULL AND w.last_call_outcome IN '+FAIL+' AND w.failed_call_streak BETWEEN 1 AND 4',
    'THEN ((w.last_call_at AT TIME ZONE $2)::date + CASE WHEN w.failed_call_streak<=2 THEN 1 ELSE 3 END) ELSE NULL::date END retry_eligible_at',
    'FROM work w), classified AS (SELECT e.*,',
    "CASE WHEN e.do_not_contact OR e.stage IN ('won','lost','competitor','do_not_contact') THEN 'closed'",
    "WHEN e.is_due THEN 'due' WHEN e.next_action_at IS NOT NULL THEN 'scheduled' WHEN e.done_today THEN 'done_today'",
    "WHEN e.last_call_outcome IN "+BAD+" THEN 'fix_contact'",
    "WHEN e.last_call_outcome IN "+FAIL+" AND e.failed_call_streak>=5 THEN 'review'",
    "WHEN e.call_eligible AND length(regexp_replace(COALESCE(e.callable_phone,''),'[^0-9]','','g'))>=7 THEN 'ready'",
    "WHEN e.last_call_outcome IN "+FAIL+" THEN 'cooldown' ELSE 'needs_next_step' END work_state,",
    "(e.is_due AND e.next_action_type='call' AND length(regexp_replace(COALESCE(e.callable_phone,''),'[^0-9]','','g'))>=7",
    ')',
    'OR (e.next_action_at IS NULL AND NOT e.done_today AND e.call_eligible',
    "AND length(regexp_replace(COALESCE(e.callable_phone,''),'[^0-9]','','g'))>=7 AND COALESCE(e.last_call_outcome,'') NOT IN "+BAD+") to_call_now",
    'FROM eligible e)'
  ].join(' ');
}

export function workViewFilter(view: WorkView): string {
  if(view==='for_you') return ACTIVE+" AND (w.is_due OR (NOT w.done_today AND w.next_action_at IS NULL AND (w.to_call_now OR w.work_state IN ('needs_next_step','fix_contact','review'))))";
  if(view==='to_call') return ACTIVE+' AND w.to_call_now';
  if(view==='followups') return ACTIVE+' AND w.next_action_at IS NOT NULL';
  if(view==='done_today') return 'w.done_today';
  if(view==='priority') return ACTIVE+" AND w.priority='high'";
  return 'true';
}
function viewOrder(view: WorkView): string {
  const p="CASE w.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END";
  if(view==='all_az') return "lower(COALESCE(NULLIF(btrim(w.company_name),''),w.contact_name,'')) ASC,w.id ASC";
  if(view==='all') return 'w.updated_at DESC,w.id DESC';
  if(view==='done_today') return 'w.last_worked_at DESC NULLS LAST,w.id ASC';
  if(view==='followups') return 'w.next_action_due_at ASC NULLS LAST,w.next_action_at ASC,w.id ASC';
  if(view==='priority') return "CASE WHEN w.is_due THEN 0 WHEN w.to_call_now THEN 1 ELSE 2 END,w.next_action_due_at ASC NULLS LAST,w.updated_at DESC,w.id ASC";
  if(view==='to_call') return "CASE WHEN w.is_due THEN 0 ELSE 1 END,w.next_action_due_at ASC NULLS LAST,"+p+",w.last_call_at ASC NULLS FIRST,w.id ASC";
  return "CASE WHEN w.is_due THEN 0 WHEN w.to_call_now THEN 1 ELSE 2 END,w.next_action_due_at ASC NULLS LAST,"+p+",w.last_call_at ASC NULLS FIRST,w.id ASC";
}

export async function getSmartPagedLeads(params: URLSearchParams, user: CrmUser): Promise<NextResponse> {
  const raw=params.get('view')||'for_you';
  if(!(WORK_VIEWS as readonly string[]).includes(raw)) return NextResponse.json({ok:false,error:'Invalid view.'},{status:400});
  const view=raw as WorkView;
  const zone=params.get('tz')||'Etc/UTC';
  if(!validZone(zone)) return NextResponse.json({ok:false,error:'Invalid time zone.'},{status:400});
  const limit=Number(params.get('limit')||25),offset=Number(params.get('offset')||0);
  if(!Number.isSafeInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(offset)||offset<0||offset>1000000)
    return NextResponse.json({ok:false,error:'Invalid pagination.'},{status:400});
  const search=(params.get('q')||'').trim().replace(/\s+/g,' ');
  const industry=(params.get('industry')||'').trim();
  if(search.length>120||industry.length>100) return NextResponse.json({ok:false,error:'Invalid filter.'},{status:400});
  const values:unknown[]=[user.id,zone];
  const bind=(value:unknown)=>{values.push(value);return '$'+values.length;};
  // Search is global across work views, so a lead hidden as Done Today or
  // Scheduled can always be found by company, contact or other context.
  const filters:string[]=[search ? 'true' : workViewFilter(view)];
  if(industry==='__uncategorized__') filters.push("btrim(w.industry)=''");
  else if(industry && industry!=='all') filters.push('w.industry='+bind(industry));
  for(const word of search.split(/\s+/).filter(Boolean).slice(0,8)){
    const p=bind('%'+word.replace(/[!%_]/g,match=>'!'+match)+'%');
    const fields=['w.company_name','w.contact_name','w.phone','w.email','w.industry','w.city','w.country','w.problem_summary','w.lead_brief'];
    const matches=fields.map(col=>"COALESCE("+col+",'') ILIKE "+p+" ESCAPE '!'");
    matches.push("EXISTS (SELECT 1 FROM public.crm_lead_contacts c WHERE c.lead_id=w.id AND (COALESCE(c.name,'') ILIKE "+p+" ESCAPE '!' OR COALESCE(c.phone,'') ILIKE "+p+" ESCAPE '!' OR COALESCE(c.email,'') ILIKE "+p+" ESCAPE '!'))");
    filters.push('('+matches.join(' OR ')+')');
  }
  const condition=filters.join(' AND '),prefix=workQueueSQL();
  const listArgs=[...values,limit+1,offset];
  const select=prefix+' SELECT w.* FROM classified w WHERE '+condition+' ORDER BY '+viewOrder(view)+
    ' LIMIT $'+(listArgs.length-1)+' OFFSET $'+listArgs.length;
  const count=prefix+' SELECT count(*)::int total FROM classified w WHERE '+condition;
  try {
    const db=getCrmPool();
    const [rows,counts,stats,categories,toCall]=await Promise.all([
      db.query<Lead & {work_state:string}>(select,listArgs),
      db.query<{total:number}>(count,values),
      db.query(`SELECT count(*)::int AS total,
        count(*) FILTER(WHERE next_action_due_at<=now()
          AND NOT do_not_contact AND stage NOT IN ('won','lost','competitor'))::int AS followups_due,
        count(*) FILTER(WHERE stage IN ('interested','meeting','proposal','negotiation'))::int AS interested,
        count(*) FILTER(WHERE stage='meeting')::int AS meetings,
        count(*) FILTER(WHERE stage='won')::int AS won
        FROM public.crm_leads WHERE user_id=$1`,[user.id]),
      db.query<{industry:string;count:number}>("SELECT industry,count(*)::int count FROM public.crm_leads WHERE user_id=$1 AND btrim(industry)<>'' GROUP BY industry ORDER BY industry",[user.id]),
      db.query<{total:number}>(prefix+' SELECT count(*)::int total FROM classified w WHERE '+workViewFilter('to_call'),[user.id,zone]),
    ]);
    return NextResponse.json({ok:true,user,leads:rows.rows.slice(0,limit),has_more:rows.rows.length>limit,
      filtered_total:counts.rows[0]?.total??0,limit,offset,
      stats:{...stats.rows[0],to_call:toCall.rows[0]?.total??0},
      industries:categories.rows.map(x=>x.industry),
      industry_counts:Object.fromEntries(categories.rows.map(x=>[x.industry,x.count]))},
      {headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return crmError(error);}
}
