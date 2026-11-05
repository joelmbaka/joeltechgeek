'use client';

import { useEffect, useState, useRef, type ReactNode, type FormEvent } from 'react';
import {
  ArrowLeft, Bell, Building2, CalendarDays, Camera, Check, CheckCircle2,
  ChevronLeft, ChevronRight, ClipboardCheck, ClipboardList, Clock3, FileImage,
  FileText, House, Info, MapPin, MessageSquare, Plus, RotateCcw, Send,
  ShieldCheck, Users, X
} from 'lucide-react';
import styles from './SecurityExperience.module.css';
import SecurityRosterDetail from './SecurityRosterDetail';
import {
  STORAGE_KEY, kenyaToday, addDays, formatDay, formatClock, dayOfInstant,
  HISTORY_DAYS, PLANNING_DAYS, fillRollingWindow,
  seedDemo, valid, timelineForDay, siteIssues, siteReports, shiftOnDay,
  assignShift, addShift, confirmAttendance, completeShift, addSite, addStaff,
  addIssue, advanceIssue, addSampleEvidence, logVisit, publishReport,
  type State, type Role, type Shift, type Issue, type IssueStatus, type Asset,
  type ReportPeriod
} from './security-demo-model';

const panel = 'rounded-2xl border border-[#dfe9e4] bg-white p-4 shadow-sm';
const field = 'mt-1.5 w-full min-w-0 rounded-xl border border-[#cfdfd6] bg-white px-3 py-2.5 text-xs text-[#244238] outline-none focus:border-[#059669] focus:ring-2 focus:ring-emerald-100';
const primary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#059669] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-40';
const secondary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#c6ded2] bg-white px-3 py-2.5 text-xs font-semibold text-[#08694e] hover:bg-emerald-50 disabled:opacity-40';
const textMuted = 'text-xs leading-5 text-[#678278]';

const issueLabels: Record<IssueStatus, string> = {
  open: 'Open', acknowledged: 'Acknowledged', responding: 'In progress', resolved: 'Resolved',
};
function Card({children, className = ''}: {children: ReactNode; className?: string}) {
  return <section className={panel + ' ' + className}>{children}</section>;
}
function Status({value}: {value: string}) {
  const good = ['confirmed', 'completed', 'resolved'].includes(value);
  const caution = ['open', 'unconfirmed'].includes(value);
  const cls = good ? 'bg-emerald-100 text-emerald-800' : caution ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800';
  const names: Record<string, string> = {
    scheduled:'Scheduled', unconfirmed:'Unconfirmed', reported:'Reported · unverified',
    confirmed:'Confirmed', completed:'Completed', open:'Open', acknowledged:'Acknowledged',
    responding:'In progress', resolved:'Resolved',
  };
  return <span className={'inline-flex shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ' + cls}>{names[value] || value}</span>;
}
function SectionTitle({title, note, action}: {title: string; note?: string; action?: ReactNode}) {
  return <div className="mb-3 flex items-start justify-between gap-3">
    <div className="min-w-0"><h2 className="text-[17px] font-extrabold tracking-tight text-[#203b33]">{title}</h2>
      {note && <p className={'mt-1 ' + textMuted}>{note}</p>}</div>{action}
  </div>;
}
function DateNavigator({date, onChange}: {date: string; onChange: (value: string) => void}) {
  return <div className={panel + ' mb-4'}>
    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#729486]">Selected date · Nairobi time</p>
    <div className="flex items-center gap-2">
      <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d4e3da] bg-[#f6faf7]" onClick={() => onChange(addDays(date,-1))} aria-label="Previous day"><ChevronLeft className="h-5 w-5"/></button>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Choose roster date</span>
        <input aria-label="Choose roster date" type="date" value={date} className="w-full min-w-0 rounded-xl border border-[#d4e3da] bg-white px-2 py-2.5 text-center text-xs font-bold text-[#1a4b3e] outline-none focus:border-emerald-600" onChange={e=>{if(e.target.value)onChange(e.target.value);}} />
      </label>
      <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d4e3da] bg-[#f6faf7]" onClick={() => onChange(addDays(date,1))} aria-label="Next day"><ChevronRight className="h-5 w-5"/></button>
    </div>
    <p className="mt-2 text-center text-xs font-semibold text-[#55756a]">{formatDay(date)}</p>
  </div>;
}
function Assets({assets}: {assets: Asset[]}) {
  if (!assets.length) return null;
  return <div className="mt-3 grid grid-cols-2 gap-2" aria-label="Sample media and attachments">
    {assets.map(a => <div key={a.id} className="min-w-0 overflow-hidden rounded-xl border border-[#d8e5de] bg-[#f6faf7]">
      {a.kind === 'image' ? <div className="flex h-16 items-center justify-center bg-gradient-to-br from-[#dcebe3] via-[#ebf3eb] to-[#bed5c9]">
        <div className="rounded-xl border border-[#b8d4c4] bg-white/65 p-2"><Camera className="h-5 w-5 text-[#457963]"/></div>
      </div> : <div className="flex h-16 items-center justify-center bg-[#e8f1eb]">
        <FileText className="h-7 w-7 text-[#397e5d]"/>
      </div>}
      <p className="min-h-10 break-words px-2 py-2 text-[10px] font-semibold leading-4 text-[#476c5a]">{a.name}</p>
      <p className="px-2 pb-2 text-[9px] font-bold uppercase tracking-wide text-[#86a096]">{a.kind==='image'?'Sample image':'Sample document'}</p>
    </div>)}
  </div>;
}

export default function SecurityExperience() {
  const [data, setData] = useState<State>(() => fillRollingWindow(seedDemo()));
  const [hydrated,setHydrated] = useState(false);
  const [role,setRole] = useState<Role>('client');
  const [tab,setTab] = useState('roster');
  const [siteId,setSiteId] = useState('greenview');
  const [date,setDate] = useState(kenyaToday);
  const [notice,setNotice] = useState('');
  const [activeIssueId,setActiveIssueId] = useState<string | null>(null);
  const [activeTimelineId,setActiveTimelineId] = useState<string | null>(null);
  const [serviceMode,setServiceMode] = useState<'issues'|'reports'>('issues');
  const [issueTitle,setIssueTitle] = useState('');
  const [issueText,setIssueText] = useState('');
  const [reply,setReply] = useState('');
  const [newSiteName,setNewSiteName] = useState('');
  const [newSiteArea,setNewSiteArea] = useState('');
  const [newClientName,setNewClientName] = useState('');
  const [newSiteContact,setNewSiteContact] = useState('');
  const [newStaffName,setNewStaffName] = useState('');
  const [newStaffPhone,setNewStaffPhone] = useState('');
  const [newShiftSite,setNewShiftSite] = useState('greenview');
  const [newShiftStaff,setNewShiftStaff] = useState('daniel');
  const [newShiftStart,setNewShiftStart] = useState('06:00');
  const [newShiftEnd,setNewShiftEnd] = useState('18:00');
  const [visitSite,setVisitSite] = useState('greenview');
  const [visitNote,setVisitNote] = useState('');
  const [visitPhoto,setVisitPhoto] = useState(false);
  const [reportSite,setReportSite] = useState('greenview');
  const [reportPeriod,setReportPeriod] = useState<ReportPeriod>('daily');
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const today = kenyaToday();
    let source = seedDemo(today);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: unknown = JSON.parse(raw);
        if (valid(stored)) source = stored;
      }
    } catch { /* unavailable or corrupt browser storage: use sample state */ }
    setData(fillRollingWindow(source, today));
    setDate(today);
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* optional local storage */ }
  }, [data,hydrated]);

  const currentSite = data.sites.find(s => s.id === siteId) || data.sites[0];
  const issue = activeIssueId ? data.issues.find(i=>i.id === activeIssueId) : undefined;
  const roster = data.shifts.filter(s => s.siteId === siteId && shiftOnDay(s,date));
  const timeline = timelineForDay(data,date,siteId);
  const selectedTimeline = activeTimelineId ? timeline.find(item=>item.id===activeTimelineId) : undefined;
  const windowStart = addDays(kenyaToday(),-HISTORY_DAYS);
  const windowEnd = addDays(kenyaToday(),PLANNING_DAYS);
  const issues = siteIssues(data,siteId);
  const reports = siteReports(data,siteId);
  const managerIssues = [...data.issues].sort((a,b)=> Date.parse(b.openedAt)-Date.parse(a.openedAt));
  const tabs = role === 'client'
    ? [{id:'roster',name:'Roster', Icon: CalendarDays},{id:'issues',name:'Issues', Icon: MessageSquare},{id:'reports',name:'Reports', Icon:FileText}]
    : [{id:'overview',name:'Overview', Icon:House},{id:'roster',name:'Roster', Icon:CalendarDays},{id:'sites',name:'Sites', Icon:Building2},{id:'service',name:'Service', Icon:ClipboardCheck}];

  function perform(operation: (state: State)=>State, message: string) {
    try { const next = operation(data); setData(next); setNotice(message); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to update sample data.'); }
  }
  function switchRole(next: Role) {
    setRole(next); setTab(next==='client'?'roster':'overview');setActiveIssueId(null);setActiveTimelineId(null);setNotice('');
    if(scrollRef.current)scrollRef.current.scrollTop=0;
  }
  function moveTab(next: string) {
    setTab(next);setActiveIssueId(null);setActiveTimelineId(null);setNotice('');
    if(scrollRef.current)scrollRef.current.scrollTop=0;
  }
  function openTimeline(id: string) {
    setActiveTimelineId(id);
    if(scrollRef.current)scrollRef.current.scrollTop=0;
  }
  function changeRosterDate(next: string) {
    setDate(next);setActiveTimelineId(null);
    if(scrollRef.current)scrollRef.current.scrollTop=0;
  }
  function viewTimelineIssue(id: string) {
    setActiveTimelineId(null);
    setTab(role==='client'?'issues':'service');
    if(role==='manager')setServiceMode('issues');
    openIssue(id);
  }
  function openIssue(id: string) {
    setActiveIssueId(id);setReply('');
    if(scrollRef.current)scrollRef.current.scrollTop=0;
  }
  function reset() {
    if(typeof window !== 'undefined' && !window.confirm('Reset all fictional security service data?')) return;
    const next = fillRollingWindow(seedDemo());setData(next);setDate(next.anchorDate);setSiteId('greenview');
    setRole('client');setTab('roster');setActiveIssueId(null);setActiveTimelineId(null);setNotice('Sample data restored.');
  }
  function submitIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const next = addIssue(data,siteId,issueTitle,issueText,role);
      setData(next);setIssueTitle('');setIssueText('');setNotice('Issue recorded. Open its details to track progress.');
      openIssue(next.issues[0].id);
    } catch(error) {setNotice(error instanceof Error ? error.message : 'Unable to submit issue.');}
  }
  function showIssue(item: Issue) {
    return <button type="button" key={item.id} className="block w-full rounded-2xl border border-[#dfe9e4] bg-white p-4 text-left shadow-sm hover:border-emerald-300" onClick={()=>openIssue(item.id)}>
      <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-[#608678]">#{item.id.slice(-8)}</span><Status value={item.status}/></div>
      <h3 className="mt-2 text-sm font-extrabold text-[#284337]">{item.title}</h3>
      <p className={'mt-1 '+textMuted}>{role==='manager' ? (data.sites.find(s=>s.id===item.siteId)?.name+' · ') : ''}{formatDay(dayOfInstant(item.openedAt))}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[#52816b]"><span>{item.history.length} progress updates · {item.assets.length} attachments</span><ChevronRight className="h-4 w-4"/></div>
    </button>;
  }
  function issueDetails(item: Issue) {
    return <div className="space-y-4">
      <button type="button" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700" onClick={()=>setActiveIssueId(null)}><ArrowLeft className="h-4 w-4"/> All issues</button>
      <Card>
        <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#739184]">Issue #{item.id.slice(-8)}</p><Status value={item.status}/></div>
        <h2 className="mt-3 text-lg font-extrabold text-[#1d4436]">{item.title}</h2>
        <p className={'mt-1 '+textMuted}>{formatDay(dayOfInstant(item.openedAt))} · {formatClock(item.openedAt)}</p>
        <p className="mt-3 text-xs leading-6 text-[#49675b]">{item.description}</p>
      </Card>
      <Card><SectionTitle title="Resolution progress" note="Updates from the security company appear here."/>
        <ol className="space-y-0">
          {item.history.map((step,index)=><li key={index} className="relative border-l-2 border-[#b7dfc8] pb-5 pl-4 last:border-transparent last:pb-0">
            <span className="absolute -left-[6px] top-0 grid h-2.5 w-2.5 rounded-full bg-[#059669]"/>
            <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#235d46]">{issueLabels[step.status]}</p><span className="text-[10px] text-[#82978c]">{formatClock(step.at)}</span></div>
            <p className="mt-1 text-[11px] font-medium text-[#617e70]">{step.by} · {formatDay(dayOfInstant(step.at))}</p>
            <p className="mt-1 text-xs leading-5 text-[#485f54]">{step.note}</p>
          </li>)}
        </ol>
      </Card>
      <Card><SectionTitle title="Media & documents" note="Illustrative attachments associated with this issue."/>
        {item.assets.length ? <Assets assets={item.assets}/> : <p className={textMuted}>No media or documents attached yet.</p>}
        {role==='manager' && <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={secondary} onClick={()=>perform(d=>addSampleEvidence(d,item.id,'image'),'Sample photo attached to issue.')}><Camera className="h-4 w-4"/> Add sample photo</button>
          <button type="button" className={secondary} onClick={()=>perform(d=>addSampleEvidence(d,item.id,'document'),'Sample document attached to issue.')}><FileText className="h-4 w-4"/> Add sample document</button>
        </div>}
      </Card>
      {role==='manager' && item.status !== 'resolved' && <Card>
        <SectionTitle title="Update resolution" note="Changes are immediately reflected in the client view."/>
        {item.status!=='open' && <label className="block text-xs font-bold text-[#325d48]">Response or action taken
          <textarea className={field} rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Describe what you did (at least 8 characters)"/>
        </label>}
        <button type="button" className={primary+' mt-3 w-full'} onClick={()=>{
          try {setData(advanceIssue(data,item.id,reply));setReply('');setNotice('Issue progress updated for the client.');}
          catch(error){setNotice(error instanceof Error?error.message:'Unable to update issue.');}
        }}>{item.status==='open'?'Acknowledge issue':item.status==='acknowledged'?'Start response':'Mark resolved'} <ChevronRight className="h-4 w-4"/></button>
      </Card>}
    </div>;
  }
  function rosterTimeline() {
    return <div>
      <SectionTitle title="Daily activity" note="Select an event or duty shift to view its record ID, all related activities, and evidence."/>
      {timeline.length===0 ? <Card>
        <p className={textMuted}>There are no sample site records for this date.</p>
        <p className="mt-2 text-[11px] leading-5 text-[#6c8979]">Sample history is generated from {formatDay(windowStart)} to today, with planned shifts through {formatDay(windowEnd)}. Dates farther away do not receive additional sample records; a night shift may still carry into the following day.</p>
        <button type="button" className={secondary+' mt-3 w-full'} onClick={()=>changeRosterDate(kenyaToday())}>Return to today</button>
      </Card> : <div className="space-y-3">
        {timeline.map(row=><button type="button" key={row.id}
          onClick={()=>openTimeline(row.id)} aria-label={'Open activity '+(row.shift?.id||row.id)}
          className={panel+' block w-full text-left transition hover:border-[#a1d2b7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600'}>
          <div className="flex items-start gap-3">
            <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-[#edf7f1] py-2 text-[11px] font-extrabold text-[#087c59]">
              <Clock3 className="mb-1 h-4 w-4"/>{formatClock(row.at)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#709585]">{row.kind==='shift'?'Duty shift':'Site activity'}</p>
              <h3 className="mt-1 text-xs font-extrabold text-[#1d4034]">{row.title}</h3>
              <p className="mt-1 text-[11px] leading-5 text-[#567065]">{row.detail}</p>
              {row.shift && <div className="mt-2 space-y-1">
                <div className="flex flex-wrap items-center gap-2"><Status value={row.shift.attendance}/>{row.shift.method && <span className="text-[10px] text-[#739085]">{row.shift.method}</span>}</div>
                <p className="text-[10px] text-[#738f7e]">Duty contact: {data.staff.find(p=>p.id===row.shift!.staffId)?.workContact || data.sites.find(s=>s.id===row.shift!.siteId)?.contact || 'Control room'}</p>
              </div>}
              {row.assets.length>0 && <p className="mt-2 text-[10px] font-semibold text-emerald-700">{row.assets.length} sample attachment(s)</p>}
              <p className="mt-2 break-all text-[10px] text-[#8da99a]">ID: {row.shift?.id||row.id}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#699b81]"/>
          </div>
        </button>)}
      </div>}
    </div>;
  }
  function managerShiftCard(shift: Shift) {
    const officer = data.staff.find(s=>s.id===shift.staffId);
    return <Card key={shift.id}>
      <div className="flex items-start justify-between gap-2">
        <div><h3 className="text-sm font-extrabold text-[#204534]">{officer?.name}</h3>
          <p className="mt-1 text-[11px] text-[#678274]">{data.sites.find(s=>s.id===shift.siteId)?.name}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[#678274]"><Clock3 className="h-3 w-3"/>{formatClock(shift.startAt)} – {formatClock(shift.endAt)}{dayOfInstant(shift.startAt)!==dayOfInstant(shift.endAt)?' (+1 day)':''}</p></div>
        <Status value={shift.attendance}/>
      </div>
      {(shift.arrivalAt||shift.method) && <p className="mt-2 rounded-xl bg-[#f2f8f4] px-3 py-2 text-[11px] leading-5 text-[#52766a]">Arrival: {shift.arrivalAt?formatClock(shift.arrivalAt):'Not recorded'} · {shift.method || 'Not verified'}</p>}
      {['scheduled','unconfirmed'].includes(shift.attendance) && <label className="mt-3 block text-[11px] font-bold text-[#486b5c]">Reassign officer
        <select className={field} value={shift.staffId} onChange={e=>perform(d=>assignShift(d,shift.id,e.target.value),'Duty roster updated.')}>
          {data.staff.filter(s=>s.active).map(s=><option value={s.id} key={s.id}>{s.name}</option>)}
        </select>
      </label>}
      {['scheduled','unconfirmed','reported'].includes(shift.attendance) && <div className="mt-3 flex flex-wrap gap-2">
        {shift.attendance!=='reported' && <button type="button" className={secondary+' flex-1'} onClick={()=>perform(d=>confirmAttendance(d,shift.id,'office'),'Telephone-reported arrival saved as unverified.')}>Office report</button>}
        <button type="button" className={primary+' flex-1'} onClick={()=>perform(d=>confirmAttendance(d,shift.id,'supervisor'),'Supervisor confirmation recorded.')}><CheckCircle2 className="h-3.5 w-3.5"/> Confirm on site</button>
      </div>}
      {shift.attendance==='confirmed' && <button type="button" className={secondary+' mt-3 w-full'} onClick={()=>perform(d=>completeShift(d,shift.id),'Shift departure recorded.')}><Check className="h-4 w-4"/> Record departure</button>}
    </Card>;
  }
  function reportList(recs: typeof reports) {
    return recs.length ? <div className="space-y-3">{recs.map(rep=><Card key={rep.id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800">{rep.period}</span>
        <span className="text-[10px] text-[#7c9489]">{formatDay(dayOfInstant(rep.publishedAt))}</span>
      </div>
      <h3 className="mt-3 text-sm font-extrabold text-[#264637]">{rep.title}</h3>
      {role==='manager' && <p className="mt-1 text-[11px] font-semibold text-[#58836f]">{data.sites.find(s=>s.id===rep.siteId)?.name}</p>}
      <p className="mt-1 text-[11px] text-[#779186]">Covered: {formatDay(rep.periodFrom)}{rep.periodFrom!==rep.periodTo?' to '+formatDay(rep.periodTo):''}</p>
      <p className="mt-3 text-xs leading-6 text-[#4c695a]">{rep.summary}</p>
    </Card>)}</div> : <Card><p className={textMuted}>No published reports yet.</p></Card>;
  }

  const rosterDetail = selectedTimeline ? <SecurityRosterDetail
    row={selectedTimeline} state={data} date={date} siteId={siteId} role={role}
    onBack={()=>{setActiveTimelineId(null);if(scrollRef.current)scrollRef.current.scrollTop=0;}}
    onIssue={viewTimelineIssue} onSelectRecord={openTimeline}/> : null;
  const clientRoster = rosterDetail || <div className="space-y-4">
    <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">My property</p>
      <h1 className="mt-1 text-xl font-extrabold text-[#214935]">{currentSite.name}</h1>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-[#718d7e]"><MapPin className="h-3.5 w-3.5"/>{currentSite.area}</p></div>
    <label className="block text-[11px] font-semibold text-[#749084]">Sample property
      <select className={field} value={siteId} onChange={e=>{setSiteId(e.target.value);setActiveIssueId(null);setActiveTimelineId(null);}}>{data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
    </label>
    <DateNavigator date={date} onChange={changeRosterDate} />
    {rosterTimeline()}
    <p className="px-1 text-[11px] text-[#849b8e]">For assistance, contact the security control room: {currentSite.contact}.</p>
  </div>;
  const clientIssues = issue ? issueDetails(issue) : <div className="space-y-4">
    <SectionTitle title="Site issues" note="Current concerns and resolved history, with full progress and evidence."/>
    <div className="space-y-3">{issues.filter(i=>i.status!=='resolved').map(showIssue)}</div>
    <SectionTitle title="Resolved issues"/>
    <div className="space-y-3">{issues.filter(i=>i.status==='resolved').map(showIssue)}</div>
    <Card>
      <SectionTitle title="Raise a concern" note="Report an issue directly to the security company."/>
      <form className="space-y-3" onSubmit={submitIssue}>
        <label className="block text-xs font-bold text-[#436651]">Title<input required minLength={5} maxLength={100} className={field} value={issueTitle} onChange={e=>setIssueTitle(e.target.value)} placeholder="e.g. Gate left unsecured"/></label>
        <label className="block text-xs font-bold text-[#436651]">Description<textarea required minLength={10} maxLength={600} className={field} rows={3} value={issueText} onChange={e=>setIssueText(e.target.value)} placeholder="What happened and where?"/></label>
        <button className={primary+' w-full'} type="submit"><Send className="h-4 w-4"/> Submit issue</button>
      </form>
    </Card>
  </div>;
  const clientReports = <div><SectionTitle title="Site reports" note="Daily, weekly and monthly reports published by your security company."/>
    {reportList(reports)}</div>;
  const unresolved = data.issues.filter(i=>i.status!=='resolved');
  const unconfirmed = data.shifts.filter(s=>shiftOnDay(s,kenyaToday()) && ['reported','unconfirmed'].includes(s.attendance));
  const managerOverview = <div className="space-y-4">
    <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">Security management</p>
      <h1 className="mt-1 text-xl font-extrabold text-[#214935]">Today's operations</h1>
      <p className={textMuted}>Site coverage, staff and client service in one place.</p></div>
    <div className="grid grid-cols-2 gap-2">
      {[['Active sites',data.sites.length],['Staff',data.staff.length],['Attendance exceptions',unconfirmed.length],['Open issues',unresolved.length]].map(([label,value])=>
        <Card key={label}><p className="text-[11px] font-semibold text-[#728f80]">{label}</p><p className="mt-2 text-2xl font-extrabold text-[#0f7051]">{value}</p></Card>)}
    </div>
    <SectionTitle title="Needs attention"/>
    <div className="space-y-3">
      {unconfirmed.slice(0,3).map(s=><Card key={s.id}>
        <div className="flex items-start justify-between gap-2">
          <div><h3 className="text-xs font-bold text-[#264c37]">{data.sites.find(site=>site.id===s.siteId)?.name}</h3>
            <p className="mt-1 text-[11px] text-[#789486]">{data.staff.find(person=>person.id===s.staffId)?.name} · Attendance follow-up</p></div>
          <Status value={s.attendance}/>
        </div>
        <button type="button" className="mt-2 text-[11px] font-bold text-emerald-700" onClick={()=>{setTab('roster');setDate(dayOfInstant(s.startAt));}}>Review roster →</button>
      </Card>)}
      {unresolved.slice(0,3).map(i=><Card key={i.id}>
        <p className="text-xs font-bold text-[#264c37]">{i.title}</p><p className={'mt-1 '+textMuted}>{data.sites.find(site=>site.id===i.siteId)?.name}</p>
        <div className="mt-2 flex items-center justify-between"><Status value={i.status}/><button className="text-[11px] font-bold text-emerald-700" onClick={()=>{setTab('service');setServiceMode('issues');openIssue(i.id);}}>View issue →</button></div>
      </Card>)}
    </div>
    <Card>
      <SectionTitle title="Quick actions"/>
      <div className="grid grid-cols-2 gap-2">
        <button className={secondary} onClick={()=>moveTab('roster')}><CalendarDays className="h-4 w-4"/> Duty roster</button>
        <button className={secondary} onClick={()=>moveTab('sites')}><Building2 className="h-4 w-4"/> Visit a site</button>
        <button className={secondary} onClick={()=>{moveTab('service');setServiceMode('issues');}}><MessageSquare className="h-4 w-4"/> Resolve issue</button>
        <button className={secondary} onClick={()=>{moveTab('service');setServiceMode('reports');}}><FileText className="h-4 w-4"/> Publish report</button>
      </div>
    </Card>
  </div>;
  const managerRoster = rosterDetail || <div className="space-y-4">
    <SectionTitle title="Duty roster" note="Manage assignments, record attendance and review previous shifts."/>
    <DateNavigator date={date} onChange={changeRosterDate} />
    <label className="block text-[11px] font-bold text-[#5c806d]">Property
      <select className={field} value={siteId} onChange={e=>setSiteId(e.target.value)}>{data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
    </label>
    <SectionTitle title="Shifts on selected day"/>
    <div className="space-y-3">{roster.length?roster.map(managerShiftCard):<Card><p className={textMuted}>No shifts recorded for this property on the selected day.</p></Card>}</div>
    <details className={panel}>
      <summary className="cursor-pointer text-xs font-extrabold text-[#0b7854]">+ Schedule a shift</summary>
      <form className="mt-4 space-y-3" onSubmit={e=>{
        e.preventDefault();
        perform(d=>addShift(d,newShiftSite,newShiftStaff,date,newShiftStart,newShiftEnd),'Shift scheduled. Overnight shifts appear on both days.');
      }}>
        <label className="block text-xs font-bold">Property<select className={field} value={newShiftSite} onChange={e=>setNewShiftSite(e.target.value)}>{data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="block text-xs font-bold">Assigned officer<select className={field} value={newShiftStaff} onChange={e=>setNewShiftStaff(e.target.value)}>{data.staff.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-bold">Start time<input type="time" required className={field} value={newShiftStart} onChange={e=>setNewShiftStart(e.target.value)}/></label>
          <label className="block text-xs font-bold">End time<input type="time" required className={field} value={newShiftEnd} onChange={e=>setNewShiftEnd(e.target.value)}/></label>
        </div>
        <p className={textMuted}>Shifts ending before their start time continue into the next calendar day.</p>
        <button type="submit" className={primary+' w-full'}><Plus className="h-4 w-4"/> Add shift</button>
      </form>
    </details>
    <SectionTitle title="Chronological site record"/>
    {rosterTimeline()}
  </div>;
  const managerSites = <div className="space-y-4">
    <SectionTitle title="Clients & sites" note="Maintain assigned properties and make site visit records."/>
    <div className="space-y-3">{data.sites.map(site=><Card key={site.id}>
      <p className="text-sm font-extrabold text-[#24523b]">{site.name}</p>
      <p className={'mt-1 '+textMuted}><MapPin className="mr-1 inline h-3.5 w-3.5"/>{site.area}</p>
      <p className="mt-2 text-[11px] font-semibold text-[#668a77]">Client: {site.client}</p>
      <p className="mt-1 text-[11px] text-[#779387]">{data.shifts.filter(s=>s.siteId===site.id).length} scheduled/historical assignments</p>
    </Card>)}</div>
    <details className={panel}><summary className="cursor-pointer text-xs font-extrabold text-[#0b7854]">+ Add client & property</summary>
      <form className="mt-4 space-y-3" onSubmit={e=>{e.preventDefault();try{
        setData(addSite(data,newSiteName,newSiteArea,newClientName,newSiteContact));
        setNewSiteName('');setNewSiteArea('');setNewClientName('');setNewSiteContact('');setNotice('Client site added.');
      }catch(error){setNotice(error instanceof Error?error.message:'Unable to create client site.');}}}>
        {[['Client name',newClientName,setNewClientName],['Property / site name',newSiteName,setNewSiteName],['Location',newSiteArea,setNewSiteArea],['Control room contact',newSiteContact,setNewSiteContact]].map(([label,val,change])=>
          <label key={label as string} className="block text-xs font-bold">{label as string}<input className={field} required={label!=='Control room contact'} value={val as string} onChange={e=>(change as (x:string)=>void)(e.target.value)}/></label>)}
        <button className={primary+' w-full'} type="submit">Add client site</button>
      </form>
    </details>
    <details className={panel}><summary className="cursor-pointer text-xs font-extrabold text-[#0b7854]">+ Add staff member</summary>
      <form className="mt-4 space-y-3" onSubmit={e=>{e.preventDefault();try{
        setData(addStaff(data,newStaffName,newStaffPhone));setNewStaffName('');setNewStaffPhone('');setNotice('Staff member added.');
      }catch(error){setNotice(error instanceof Error?error.message:'Unable to add officer.');}}}>
        <label className="block text-xs font-bold">Officer name<input required className={field} value={newStaffName} onChange={e=>setNewStaffName(e.target.value)}/></label>
        <label className="block text-xs font-bold">Contact<input className={field} value={newStaffPhone} onChange={e=>setNewStaffPhone(e.target.value)} placeholder="Work contact / phone"/></label>
        <button type="submit" className={primary+' w-full'}>Add staff member</button>
      </form>
    </details>
    <Card>
      <SectionTitle title="Record a site visit" note="Visit details and sample photos appear in that client's daily timeline."/>
      <form className="space-y-3" onSubmit={e=>{e.preventDefault();try{
        setData(logVisit(data,visitSite,visitNote,visitPhoto));setVisitNote('');setVisitPhoto(false);setNotice('Site visit recorded in the client timeline.');
      }catch(error){setNotice(error instanceof Error?error.message:'Unable to record visit.');}}}>
        <label className="block text-xs font-bold">Site<select className={field} value={visitSite} onChange={e=>setVisitSite(e.target.value)}>{data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="block text-xs font-bold">Visit notes<textarea required minLength={10} className={field} rows={3} value={visitNote} onChange={e=>setVisitNote(e.target.value)} placeholder="What was checked and observed?"/></label>
        <label className="flex items-center gap-2 text-xs text-[#456d5a]"><input type="checkbox" checked={visitPhoto} onChange={e=>setVisitPhoto(e.target.checked)}/> Include an illustrative sample photo</label>
        <button className={primary+' w-full'} type="submit"><ClipboardCheck className="h-4 w-4"/> Save site visit</button>
      </form>
    </Card>
    <SectionTitle title="Staff directory"/>
    <div className="space-y-2">{data.staff.map(s=><div key={s.id} className="flex items-center justify-between rounded-xl border border-[#e0eae3] bg-white px-3 py-3 text-xs">
      <span className="font-bold text-[#2c4d3d]">{s.name}</span><span className="text-[#7b9186]">{s.phone}</span>
    </div>)}</div>
  </div>;
  const managerService = <div className="space-y-4">
    <SectionTitle title="Client service" note="Respond to concerns and publish service reports."/>
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#e9f3ec] p-1">
      {(['issues','reports'] as const).map(value=><button key={value} type="button" onClick={()=>{setServiceMode(value);setActiveIssueId(null);}}
        className={'rounded-lg px-3 py-2.5 text-xs font-bold '+(serviceMode===value?'bg-white text-emerald-800 shadow-sm':'text-[#68867a]')}>{value==='issues'?'Issues':'Reports'}</button>)}
    </div>
    {serviceMode==='issues' ? (issue ? issueDetails(issue) : <div className="space-y-4">
      <SectionTitle title="Active concerns"/>
      <div className="space-y-3">{managerIssues.filter(i=>i.status!=='resolved').map(showIssue)}</div>
      <SectionTitle title="Resolved history"/>
      <div className="space-y-3">{managerIssues.filter(i=>i.status==='resolved').map(showIssue)}</div>
      <Card>
        <SectionTitle title="Record site incident"/>
        <form className="space-y-3" onSubmit={e=>{e.preventDefault();try{
          setData(addIssue(data,siteId,issueTitle,issueText,'manager'));setIssueTitle('');setIssueText('');setNotice('Site incident recorded.');
        }catch(error){setNotice(error instanceof Error?error.message:'Unable to log incident.');}}}>
          <label className="block text-xs font-bold">Site<select className={field} value={siteId} onChange={e=>setSiteId(e.target.value)}>{data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="block text-xs font-bold">Incident title<input required minLength={5} className={field} value={issueTitle} onChange={e=>setIssueTitle(e.target.value)}/></label>
          <label className="block text-xs font-bold">Details<textarea required minLength={10} rows={3} className={field} value={issueText} onChange={e=>setIssueText(e.target.value)}/></label>
          <button type="submit" className={primary+' w-full'}>Record incident</button>
        </form>
      </Card>
    </div>) : <div className="space-y-4">
      <Card><SectionTitle title="Publish report" note="Choose a property and reporting period."/>
        <div className="space-y-3">
          <label className="block text-xs font-bold">Site<select className={field} value={reportSite} onChange={e=>setReportSite(e.target.value)}>{data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="block text-xs font-bold">Reporting period<select className={field} value={reportPeriod} onChange={e=>setReportPeriod(e.target.value as ReportPeriod)}>
            <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select></label>
          <button type="button" className={primary+' w-full'} onClick={()=>perform(d=>publishReport(d,reportSite,reportPeriod),'Report published to selected client.')}><FileText className="h-4 w-4"/> Publish report</button>
        </div>
      </Card>
      <SectionTitle title="Published reports" note="Most recent first across all client sites."/>
      {reportList([...data.reports].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)))}
    </div>}
  </div>;

  return <div className={styles.stage}>
    <aside className={styles.intro}>
      <p className={styles.kicker}>JOELTECHGEEK · SECURITY DEMO</p>
      <h1>Stay on top of every site.</h1>
      <p>Explore shift coverage, daily site records, client concerns, evidence and service reporting in a connected mobile experience.</p>
      <a href="/demos/security">← About this solution</a>
    </aside>
    <section className={styles.phone} aria-label="Security management mobile app demo">
      <div className={styles.statusbar} aria-hidden="true"><span>9:41</span><span>●●● ◕ ▰</span></div>
      <header className={styles.appHeader}>
        <a href="/demos/security" className={styles.logo} aria-label="Back to security demo overview"><ShieldCheck className="h-6 w-6"/></a>
        <div className={styles.brand}><strong>Security Operations</strong><span>CONNECTED SERVICE · DEMO</span></div>
        <label className={styles.roleLabel} htmlFor="security-role-select">Switch role
          <select id="security-role-select" className={styles.roleSelect} value={role} onChange={e=>switchRole(e.target.value as Role)}>
            <option value="client">{currentSite.client.split(' ')[0]} · Client</option>
            <option value="manager">Grace · Manager</option>
          </select>
        </label>
      </header>
      <main ref={scrollRef} className={styles.screen} aria-label={role==='client'?'Client service app':'Security manager app'}>
        {notice && <div role="status" className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-emerald-200 bg-[#e7f7ed] p-3 text-xs text-[#23664b]">
          <span className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0"/>{notice}</span>
          <button type="button" aria-label="Dismiss notice" onClick={()=>setNotice('')}><X className="h-4 w-4"/></button>
        </div>}
        {role==='client' && tab==='roster' && clientRoster}
        {role==='client' && tab==='issues' && clientIssues}
        {role==='client' && tab==='reports' && clientReports}
        {role==='manager' && tab==='overview' && managerOverview}
        {role==='manager' && tab==='roster' && managerRoster}
        {role==='manager' && tab==='sites' && managerSites}
        {role==='manager' && tab==='service' && managerService}
        <p className="mt-7 rounded-xl bg-[#e9f1eb] px-3 py-2 text-[10px] leading-5 text-[#6b8779]">Fictional demonstration · No live staff, GPS, calls, messages, evidence uploads or emergency dispatch. Sample attachments are illustrative.</p>
      </main>
      <nav className={styles.tabBar} aria-label="Mobile app navigation">
        {tabs.map(({id,name,Icon})=><button key={id} type="button" className={styles.tab+' '+(tab===id?styles.tabActive:'')} aria-current={tab===id?'page':undefined}
          onClick={()=>moveTab(id)}><Icon className="h-5 w-5"/><span>{name}</span></button>)}
      </nav>
      <div className={styles.gesture} aria-hidden="true"><span/></div>
    </section>
    <aside className={styles.guide}>
      <p className={styles.kicker}>TRY THESE SCENARIOS</p>
      <h2>One service. Two perspectives.</h2>
      <ol><li>Browse the client roster by date and inspect a night shift spanning midnight.</li>
        <li>Open an issue to review its history and sample evidence.</li>
        <li>Switch to Grace to manage rosters, client sites and site visits.</li>
        <li>Resolve an issue or publish a report, then return to the client.</li></ol>
      <button type="button" className={styles.reset} onClick={reset}><RotateCcw className="h-4 w-4"/> Reset sample data</button>
      <small>All details are fictional; changes remain in this browser.</small>
    </aside>
  </div>;
}
