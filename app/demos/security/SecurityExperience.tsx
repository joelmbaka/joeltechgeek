'use client';

import { useEffect, useState, useRef, type ReactNode, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Building2, CalendarDays, Camera, Check, ChevronLeft, ChevronRight,
  Clock3, FileText, Info, MapPin, MessageSquare, Plus, RotateCcw, Send,
  ShieldCheck, X
} from 'lucide-react';
import styles from './SecurityExperience.module.css';
import SecurityRosterDetail from './SecurityRosterDetail';
import {
  STORAGE_KEY, kenyaToday, addDays, formatDay, formatClock, dayOfInstant, shiftWindow,
  HISTORY_DAYS, PLANNING_DAYS, fillRollingWindow,
  seedDemo, valid, timelineForDay, siteIssues, siteReports, clientSiteReports, shiftOnDay,
  assignShift, addShift, setShiftPresence, addSite, addStaff,
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
  const caution = ['open', 'unconfirmed', 'absent'].includes(value);
  const cls = good ? 'bg-emerald-100 text-emerald-800' : value === 'absent' ? 'bg-rose-100 text-rose-800' : caution ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800';
  const names: Record<string, string> = {
    scheduled:'Scheduled', unconfirmed:'Unconfirmed', reported:'Reported · unverified',
    confirmed:'On site', absent:'Not on site', completed:'Completed', open:'Open', acknowledged:'Acknowledged',
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
  return <div className="mt-3 grid grid-cols-2 gap-2" aria-label="Attached evidence">
    {assets.map(a=><div key={a.id} className="min-w-0 overflow-hidden rounded-xl border border-[#d8e5de] bg-[#f6faf7]">
      {a.kind==='image' && a.dataUrl ? <img src={a.dataUrl} alt={a.name} className="h-24 w-full object-cover"/> :
        <div className="flex h-16 items-center justify-center bg-[#e6f2e9]">
          {a.kind==='image'?<Camera className="h-6 w-6 text-emerald-700"/>:<FileText className="h-6 w-6 text-emerald-700"/>}
        </div>}
      <div className="p-2"><p className="break-words text-[10px] font-semibold leading-4 text-[#476c5a]">{a.name}</p>
        {a.dataUrl ? <a href={a.dataUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[11px] font-bold text-emerald-700">View attachment</a> :
          <p className="mt-1 text-[9px] uppercase text-[#86a096]">Illustrative {a.kind}</p>}
      </div>
    </div>)}
  </div>;
}

export default function SecurityExperience() {
  const [data, setData] = useState<State>(() => fillRollingWindow(seedDemo()));
  const [hydrated,setHydrated] = useState(false);
  const [clockMs,setClockMs] = useState(0);
  const [role,setRole] = useState<Role>('client');
  const [tab,setTab] = useState('roster');
  const [siteId,setSiteId] = useState('greenview');
  const [date,setDate] = useState(kenyaToday);
  const [notice,setNotice] = useState('');
  const [activeIssueId,setActiveIssueId] = useState<string | null>(null);
  const [activeTimelineId,setActiveTimelineId] = useState<string | null>(null);
  const [selectedSiteId,setSelectedSiteId] = useState<string | null>(null);
  const [showAddSite,setShowAddSite] = useState(false);
  const [showAddStaff,setShowAddStaff] = useState(false);
  const [showShiftForm,setShowShiftForm] = useState(false);
  const [showIncidentForm,setShowIncidentForm] = useState(false);
  const [showReportForm,setShowReportForm] = useState(false);
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
  const [visitNote,setVisitNote] = useState('');
  const [visitPhoto,setVisitPhoto] = useState(false);
  const [reportSite,setReportSite] = useState('greenview');
  const [reportPeriod,setReportPeriod] = useState<ReportPeriod>('daily');
  const [reportFrom,setReportFrom] = useState(kenyaToday);
  const [reportTo,setReportTo] = useState(kenyaToday);
  const [reportText,setReportText] = useState('');
  const [reportEvidence,setReportEvidence] = useState<Asset[]>([]);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const update=()=>setClockMs(Date.now());
    update();
    const interval=window.setInterval(update,60000);
    return ()=>window.clearInterval(interval);
  }, []);
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { setNotice('Browser storage is full or unavailable. Some demo changes may not survive a refresh.'); }
  }, [data,hydrated]);

  const currentSite = data.sites.find(s => s.id === siteId) || data.sites[0];
  const issue = activeIssueId ? data.issues.find(i=>i.id === activeIssueId) : undefined;
  const roster = data.shifts.filter(s => s.siteId === siteId && shiftOnDay(s,date));
  const timeline = timelineForDay(data,date,siteId);
  const selectedTimeline = activeTimelineId ? timeline.find(item=>item.id===activeTimelineId) : undefined;
  const windowStart = addDays(kenyaToday(),-HISTORY_DAYS);
  const windowEnd = addDays(kenyaToday(),PLANNING_DAYS);
  const issues = siteIssues(data,siteId);
  const clientReportGroups = clientSiteReports(data,siteId);
  const managerIssues = [...data.issues].sort((a,b)=> Date.parse(b.openedAt)-Date.parse(a.openedAt));
  const tabs = role === 'client'
    ? [{id:'roster',name:'Roster', Icon: CalendarDays},{id:'issues',name:'Issues', Icon: MessageSquare},{id:'reports',name:'Reports', Icon:FileText}]
    : [{id:'roster',name:'Roster', Icon:CalendarDays},{id:'sites',name:'Sites', Icon:Building2},{id:'issues',name:'Issues', Icon:MessageSquare},{id:'reports',name:'Reports', Icon:FileText}];

  function perform(operation: (state: State)=>State, message: string) {
    try { const next = operation(data); setData(next); setNotice(message); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to update sample data.'); }
  }
  function switchRole(next: Role) {
    setRole(next); setTab('roster');setActiveIssueId(null);setActiveTimelineId(null);setSelectedSiteId(null);setNotice('');
    if(scrollRef.current)scrollRef.current.scrollTop=0;
  }
  function moveTab(next: string) {
    setTab(next);setActiveIssueId(null);setActiveTimelineId(null);setSelectedSiteId(null);setNotice('');
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
    setTab('issues');
    openIssue(id);
  }
  function openIssue(id: string) {
    setActiveIssueId(id);setReply('');
    if(scrollRef.current)scrollRef.current.scrollTop=0;
  }
  function reset() {
    if(typeof window !== 'undefined' && !window.confirm('Reset all fictional security service data?')) return;
    const next = fillRollingWindow(seedDemo());setData(next);setDate(next.anchorDate);setSiteId('greenview');
    setRole('client');setTab('roster');setActiveIssueId(null);setActiveTimelineId(null);setSelectedSiteId(null);setReportEvidence([]);setNotice('Sample data restored.');
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
              <Clock3 className="mb-1 h-4 w-4"/>{row.kind==='shift' ? 'Duty' : formatClock(row.at)}
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
    const officer=data.staff.find(s=>s.id===shift.staffId);
    const started=Date.parse(shift.startAt)<=clockMs && shift.attendance!=='completed';
    return <Card key={shift.id}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-[#204534]">{officer?.name||'Unassigned'}</h3>
          <p className="mt-1 text-[11px] text-[#678274]">{data.sites.find(s=>s.id===shift.siteId)?.name}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] leading-5 text-[#678274]"><Clock3 className="h-3 w-3 shrink-0"/>{shiftWindow(shift)}</p>
        </div>
        <Status value={shift.attendance}/>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className={primary} disabled={!started||shift.attendance==='confirmed'}
          onClick={()=>perform(d=>setShiftPresence(d,shift.id,'on_site'),'Officer marked on site. The client roster has been updated.')}>
          <Check className="h-4 w-4"/> On site
        </button>
        <button type="button" className={secondary} disabled={!started||shift.attendance==='absent'}
          onClick={()=>perform(d=>setShiftPresence(d,shift.id,'not_on_site'),'Officer marked not on site. The client roster has been updated.')}>
          Not on site
        </button>
      </div>
      {!started&&shift.attendance!=='completed'&&<p className="mt-2 text-[10px] text-[#779084]">Attendance can be marked once the shift begins.</p>}
      {['scheduled','unconfirmed'].includes(shift.attendance)&&<details className="mt-3 border-t border-[#e4eee6] pt-3">
        <summary className="cursor-pointer text-[11px] font-bold text-emerald-700">Change assigned officer</summary>
        <select className={field} value={shift.staffId}
          onChange={e=>perform(d=>assignShift(d,shift.id,e.target.value),'Officer reassigned.')}>
          {data.staff.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </details>}
    </Card>;
  }
  function reportList(recs: ReturnType<typeof siteReports>, showSiteName = true) {
    return recs.length ? <div className="space-y-3">{recs.map(rep=><Card key={rep.id}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800">{rep.period}</span>
        <span className="text-[10px] text-[#7c9489]">{formatDay(dayOfInstant(rep.publishedAt))}</span>
      </div>
      <h3 className="mt-3 text-sm font-extrabold text-[#264637]">{rep.title}</h3>
      {showSiteName&&<p className="mt-1 text-[11px] font-semibold text-[#58836f]">{data.sites.find(s=>s.id===rep.siteId)?.name}</p>}
      <p className="mt-2 text-[11px] leading-5 text-[#779186]">From {formatDay(rep.periodFrom)} to {formatDay(rep.periodTo)}</p>
      <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-[#4c695a]">{rep.summary}</p>
      {(rep.assets?.length||0)>0&&<div className="mt-3"><p className="text-[11px] font-bold text-[#456f5b]">Attached evidence</p><Assets assets={rep.assets||[]}/></div>}
    </Card>)}</div> : <Card><p className={textMuted}>No published reports yet.</p></Card>;
  }
  async function readReportFiles(event: ChangeEvent<HTMLInputElement>) {
    const files=Array.from(event.target.files||[]);
    event.target.value='';
    if(!files.length)return;
    if(files.length+reportEvidence.length>3){setNotice('Attach up to three files per report.');return;}
    const allowed=['image/png','image/jpeg','image/webp','application/pdf'];
    if(files.some(file=>!allowed.includes(file.type)||file.size>600*1024)){
      setNotice('Only PNG, JPEG, WebP or PDF files up to 600 KB each are supported in this browser demo.');
      return;
    }
    try {
      const uploads=await Promise.all(files.map(file=>new Promise<Asset>((resolve,reject)=>{
        const reader=new FileReader();
        reader.onerror=()=>reject(new Error('Could not read the attachment.'));
        reader.onload=()=>resolve({
          id:'file-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),
          kind:file.type.startsWith('image/')?'image':'document',
          name:file.name, mimeType:file.type, dataUrl:String(reader.result),
        });
        reader.readAsDataURL(file);
      })));
      setReportEvidence(current=>[...current,...uploads].slice(0,3));
      setNotice(files.length+' attachment(s) added to the report.');
    }catch(error){setNotice(error instanceof Error?error.message:'Attachment failed.');}
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
  const clientReports = <div className="space-y-5">
    <SectionTitle title="Site reports" note="Reports are published for individual properties. Browse each site's reports newest first."/>
    {clientReportGroups.map(({site,reports: siteReportList})=><section key={site.id} className="space-y-3" aria-label={site.name+' reports'}>
      <div className="flex items-center justify-between gap-3 border-b border-[#d9e9df] pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-[#24523b]">{site.name}</h3>
          <p className="mt-1 text-[11px] text-[#789184]">{site.area}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#e9f5ed] px-2.5 py-1 text-[10px] font-bold text-[#17754f]">
          {siteReportList.length} {siteReportList.length===1?'report':'reports'}
        </span>
      </div>
      {reportList(siteReportList, false)}
    </section>)}
  </div>;
  const clients=Array.from(new Set(data.sites.map(s=>s.client))).sort((a,b)=>a.localeCompare(b));
  const selectedSite=selectedSiteId ? data.sites.find(s=>s.id===selectedSiteId) : undefined;

  const managerRoster = rosterDetail || <div className="space-y-4">
    <SectionTitle title="Duty roster" note="View shifts for one day and mark whether an officer is on site."
      action={<button type="button" className={secondary} onClick={()=>setShowShiftForm(v=>!v)}><Plus className="h-4 w-4"/> Add shift</button>}/>
    {showShiftForm&&<Card>
      <h3 className="text-sm font-extrabold text-[#24533c]">Schedule a shift</h3>
      <form className="mt-3 space-y-3" onSubmit={e=>{
        e.preventDefault();
        try {
          setData(addShift(data,newShiftSite,newShiftStaff,date,newShiftStart,newShiftEnd));
          setNotice('Shift scheduled. Overnight assignments appear on both dates.');
          setShowShiftForm(false);setSiteId(newShiftSite);
        }catch(error){setNotice(error instanceof Error?error.message:'Unable to add shift.');}
      }}>
        <p className={textMuted}>Date: {formatDay(date)}. Change the roster date below to schedule another day.</p>
        <label className="block text-xs font-bold text-[#3c604b]">Site
          <select className={field} value={newShiftSite} onChange={e=>setNewShiftSite(e.target.value)}>
            {data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-[#3c604b]">Officer
          <select className={field} value={newShiftStaff} onChange={e=>setNewShiftStaff(e.target.value)}>
            {data.staff.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-bold text-[#3c604b]">Starts
            <input type="time" className={field} required value={newShiftStart} onChange={e=>setNewShiftStart(e.target.value)}/>
          </label>
          <label className="block text-xs font-bold text-[#3c604b]">Ends
            <input type="time" className={field} required value={newShiftEnd} onChange={e=>setNewShiftEnd(e.target.value)}/>
          </label>
        </div>
        <button className={primary+' w-full'} type="submit">Save shift</button>
      </form>
    </Card>}
    <DateNavigator date={date} onChange={changeRosterDate}/>
    <label className="block text-[11px] font-bold text-[#5c806d]">Property
      <select className={field} value={siteId} onChange={e=>{setSiteId(e.target.value);setActiveTimelineId(null);}}>
        {data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </label>
    <SectionTitle title="Assigned officers" note="Presence is recorded by the supervisor. Future shifts remain scheduled."/>
    <div className="space-y-3">
      {roster.length?roster.map(managerShiftCard):<Card><p className={textMuted}>No assignments for this property on the selected date.</p></Card>}
    </div>
  </div>;

  const siteForm = <Card>
    <h3 className="text-sm font-extrabold text-[#24533c]">Add client / property</h3>
    <form className="mt-3 space-y-3" onSubmit={e=>{
      e.preventDefault();
      try {
        setData(addSite(data,newSiteName,newSiteArea,newClientName,newSiteContact));
        setNewSiteName('');setNewSiteArea('');setNewClientName('');setNewSiteContact('');
        setShowAddSite(false);setNotice('Client property added.');
      }catch(error){setNotice(error instanceof Error?error.message:'Unable to add property.');}
    }}>
      <label className="block text-xs font-bold text-[#3c604b]">Client
        <input className={field} required minLength={3} value={newClientName} placeholder="Property owner / company"
          onChange={e=>setNewClientName(e.target.value)}/>
      </label>
      <label className="block text-xs font-bold text-[#3c604b]">Property / site
        <input className={field} required minLength={4} value={newSiteName} onChange={e=>setNewSiteName(e.target.value)}/>
      </label>
      <label className="block text-xs font-bold text-[#3c604b]">Location
        <input className={field} required minLength={3} value={newSiteArea} onChange={e=>setNewSiteArea(e.target.value)}/>
      </label>
      <label className="block text-xs font-bold text-[#3c604b]">Office contact
        <input className={field} value={newSiteContact} onChange={e=>setNewSiteContact(e.target.value)}/>
      </label>
      <button className={primary+' w-full'} type="submit">Save client property</button>
    </form>
  </Card>;

  const staffForm = <Card>
    <h3 className="text-sm font-extrabold text-[#24533c]">Add staff member</h3>
    <form className="mt-3 space-y-3" onSubmit={e=>{
      e.preventDefault();
      try{
        setData(addStaff(data,newStaffName,newStaffPhone));
        setNewStaffName('');setNewStaffPhone('');setShowAddStaff(false);setNotice('Staff member added.');
      }catch(error){setNotice(error instanceof Error?error.message:'Unable to add staff member.');}
    }}>
      <label className="block text-xs font-bold text-[#3c604b]">Officer name
        <input className={field} required minLength={3} value={newStaffName} onChange={e=>setNewStaffName(e.target.value)}/>
      </label>
      <label className="block text-xs font-bold text-[#3c604b]">Contact
        <input className={field} value={newStaffPhone} onChange={e=>setNewStaffPhone(e.target.value)}/>
      </label>
      <button className={primary+' w-full'} type="submit">Save staff member</button>
    </form>
  </Card>;

  const managerSites = selectedSite ? <div className="space-y-4">
    <button type="button" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-emerald-700" onClick={()=>setSelectedSiteId(null)}>
      <ArrowLeft className="h-4 w-4"/> Back to clients
    </button>
    <Card>
      <p className="text-[10px] font-extrabold uppercase text-emerald-700">Property · {selectedSite.id}</p>
      <h2 className="mt-1 text-lg font-extrabold text-[#234a35]">{selectedSite.name}</h2>
      <p className={'mt-1 '+textMuted}>{selectedSite.area} · {selectedSite.client}</p>
      <p className="mt-2 text-[11px] text-[#6b8b77]">Security office: {selectedSite.contact}</p>
    </Card>
    <Card>
      <SectionTitle title="Record a site visit" note="This visit will appear in this property's client activity timeline."/>
      <form className="space-y-3" onSubmit={e=>{
        e.preventDefault();
        try{
          setData(logVisit(data,selectedSite.id,visitNote,visitPhoto));
          setVisitNote('');setVisitPhoto(false);
          setNotice('Site visit saved for '+selectedSite.name+'.');
        }catch(error){setNotice(error instanceof Error?error.message:'Unable to save visit.');}
      }}>
        <label className="block text-xs font-bold text-[#3c604b]">Visit notes
          <textarea className={field} rows={3} required minLength={10} value={visitNote}
            onChange={e=>setVisitNote(e.target.value)} placeholder="Who was on site, checks performed and observations"/>
        </label>
        <label className="flex items-center gap-2 text-xs text-[#456d5a]">
          <input type="checkbox" checked={visitPhoto} onChange={e=>setVisitPhoto(e.target.checked)}/>
          Attach illustrative sample photo
        </label>
        <button className={primary+' w-full'} type="submit">Save site visit</button>
      </form>
    </Card>
    <SectionTitle title="Recent site visits" note="Recorded by the security team for this property."/>
    <div className="space-y-2">
      {data.activity.filter(a=>a.siteId===selectedSite.id&&a.type==='visit')
        .sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,6)
        .map(item=><Card key={item.id}>
          <p className="text-[11px] font-extrabold text-[#185d44]">{formatDay(dayOfInstant(item.at))} · {formatClock(item.at)}</p>
          <p className="mt-2 text-xs text-[#3c644f]">{item.detail}</p>
          <Assets assets={item.assets}/>
        </Card>)}
    </div>
  </div> : <div className="space-y-4">
    <SectionTitle title="Clients" note="Properties grouped by client. Open a property to record site visits."
      action={<button type="button" className={secondary} onClick={()=>setShowAddSite(v=>!v)}><Plus className="h-4 w-4"/> Add</button>}/>
    {showAddSite&&siteForm}
    <div className="space-y-3">
      {clients.map(name=><Card key={name}>
        <h3 className="text-sm font-extrabold text-[#234e38]">{name}</h3>
        <p className="mt-1 text-[10px] text-[#789383]">{data.sites.filter(s=>s.client===name).length} properties</p>
        <div className="mt-3 space-y-2">
          {data.sites.filter(s=>s.client===name).map(site=><button type="button" key={site.id}
            onClick={()=>{setSelectedSiteId(site.id);setVisitNote('');setVisitPhoto(false);}}
            className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#dcebe0] bg-[#f6faf7] p-3 text-left hover:border-emerald-400">
            <span className="min-w-0"><span className="block text-xs font-bold text-[#235a3d]">{site.name}</span>
              <span className="mt-1 block text-[10px] text-[#7b9986]">{site.area}</span></span>
            <ChevronRight className="h-4 w-4 shrink-0 text-emerald-700"/>
          </button>)}
        </div>
      </Card>)}
    </div>
    <SectionTitle title="Staff" note="Staff available for assignments and site coverage."
      action={<button type="button" className={secondary} onClick={()=>setShowAddStaff(v=>!v)}><Plus className="h-4 w-4"/> Add</button>}/>
    {showAddStaff&&staffForm}
    <div className="space-y-2">
      {data.staff.map(staff=><div key={staff.id}
        className="flex items-center justify-between gap-2 rounded-xl border border-[#e0eae3] bg-white px-3 py-3">
        <p className="text-xs font-bold text-[#2c4d3d]">{staff.name}</p>
        <p className="text-[10px] text-[#7b9186]">{staff.phone}</p>
      </div>)}
    </div>
  </div>;

  const managerIssuesView = issue ? issueDetails(issue) : <div className="space-y-4">
    <SectionTitle title="Issues" note="Site incidents, client concerns and resolution history."
      action={<button type="button" className={secondary} onClick={()=>setShowIncidentForm(v=>!v)}><Plus className="h-4 w-4"/> Add</button>}/>
    {showIncidentForm&&<Card>
      <h3 className="text-sm font-extrabold text-[#24533c]">Record a site issue</h3>
      <form className="mt-3 space-y-3" onSubmit={e=>{
        e.preventDefault();
        try{
          setData(addIssue(data,siteId,issueTitle,issueText,'manager'));
          setIssueTitle('');setIssueText('');setShowIncidentForm(false);setNotice('Site issue recorded.');
        }catch(error){setNotice(error instanceof Error?error.message:'Unable to record issue.');}
      }}>
        <label className="block text-xs font-bold text-[#3c604b]">Site
          <select className={field} value={siteId} onChange={e=>setSiteId(e.target.value)}>
            {data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-[#3c604b]">Issue
          <input className={field} required minLength={5} value={issueTitle} onChange={e=>setIssueTitle(e.target.value)}/>
        </label>
        <label className="block text-xs font-bold text-[#3c604b]">Details
          <textarea className={field} required minLength={10} rows={3} value={issueText} onChange={e=>setIssueText(e.target.value)}/>
        </label>
        <button className={primary+' w-full'} type="submit">Save issue</button>
      </form>
    </Card>}
    <SectionTitle title="Current issues"/>
    <div className="space-y-3">{managerIssues.filter(i=>i.status!=='resolved').map(showIssue)}</div>
    <SectionTitle title="Resolved issues"/>
    <div className="space-y-3">{managerIssues.filter(i=>i.status==='resolved').map(showIssue)}</div>
  </div>;

  const managerReports = <div className="space-y-4">
    <SectionTitle title="Reports" note="Create dated site reports with optional evidence, visible to each client."
      action={<button type="button" className={secondary} onClick={()=>setShowReportForm(v=>!v)}><Plus className="h-4 w-4"/> Add</button>}/>
    {showReportForm&&<Card>
      <h3 className="text-sm font-extrabold text-[#24533c]">New report</h3>
      <form className="mt-3 space-y-3" onSubmit={e=>{
        e.preventDefault();
        try{
          setData(publishReport(data,reportSite,reportPeriod,reportFrom,reportTo,reportText,reportEvidence));
          setReportText('');setReportEvidence([]);setShowReportForm(false);
          setNotice('Report saved. The property client can view it under Reports.');
        }catch(error){setNotice(error instanceof Error?error.message:'Unable to save report.');}
      }}>
        <label className="block text-xs font-bold text-[#3c604b]">For site
          <select className={field} value={reportSite} onChange={e=>setReportSite(e.target.value)}>
            {data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-[#3c604b]">Report frequency
          <select className={field} value={reportPeriod}
            onChange={e=>{
              const period=e.target.value as ReportPeriod;
              setReportPeriod(period);setReportTo(kenyaToday());
              setReportFrom(period==='daily'?kenyaToday():period==='weekly'?addDays(kenyaToday(),-6):kenyaToday().slice(0,7)+'-01');
            }}>
            <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-bold text-[#3c604b]">From
            <input type="date" required className={field} value={reportFrom} onChange={e=>setReportFrom(e.target.value)}/>
          </label>
          <label className="block text-xs font-bold text-[#3c604b]">To
            <input type="date" required max={kenyaToday()} className={field} value={reportTo} onChange={e=>setReportTo(e.target.value)}/>
          </label>
        </div>
        <label className="block text-xs font-bold text-[#3c604b]">Summary and findings
          <textarea className={field} rows={4} minLength={10} required value={reportText}
            onChange={e=>setReportText(e.target.value)} placeholder="Attendance, site condition, incidents, and recommendations"/>
        </label>
        <label className="block text-xs font-bold text-[#3c604b]">Attach evidence (optional)
          <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" multiple className={field}
            onChange={e=>{void readReportFiles(e);}}/>
        </label>
        <p className={textMuted}>PNG, JPEG, WebP or PDF. Maximum 3 files, 600 KB each. Files stay in this browser. Avoid uploading sensitive real-world evidence.</p>
        {reportEvidence.length>0&&<div className="space-y-2">
          {reportEvidence.map(file=><div key={file.id} className="flex items-center justify-between gap-2 rounded-lg bg-[#edf7f0] px-3 py-2">
            <span className="min-w-0 truncate text-[11px] text-[#276447]">{file.name}</span>
            <button type="button" aria-label={'Remove '+file.name} onClick={()=>setReportEvidence(items=>items.filter(item=>item.id!==file.id))}
              className="rounded-lg p-2 text-[#9c564e]"><X className="h-4 w-4"/></button>
          </div>)}
        </div>}
        <button type="submit" className={primary+' w-full'}><FileText className="h-4 w-4"/> Save report</button>
      </form>
    </Card>}
    <SectionTitle title="Published reports" note="Most recent first; each is available to its property client."/>
    {reportList([...data.reports].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)))}
  </div>;

  return <div className={styles.stage}>
    <aside className={styles.intro}>
      <p className={styles.kicker}>JOELTECHGEEK · SECURITY DEMO</p>
      <h1>Stay on top of every site.</h1>
      <p>Explore shift coverage, daily site records, client concerns, evidence and service reporting in a connected mobile experience.</p>
      <Link href="/demos/security">← About this solution</Link>
    </aside>
    <section className={styles.phone} aria-label="Security management mobile app demo">
      <div className={styles.statusbar} aria-hidden="true"><span>9:41</span><span>●●● ◕ ▰</span></div>
      <header className={styles.appHeader}>
        <Link href="/demos/security" className={styles.logo} aria-label="Back to security demo overview"><ShieldCheck className="h-6 w-6"/></Link>
        <div className={styles.brand}><strong>Security Operations</strong><span>CONNECTED SERVICE · DEMO</span></div>
        <label className={styles.roleLabel} htmlFor="security-role-select">Switch role
          <select id="security-role-select" className={styles.roleSelect} value={role} onChange={e=>switchRole(e.target.value as Role)}>
            <option value="client">{currentSite.client.split(' ')[0]} · Client</option>
            <option value="manager">Grace · Supervisor</option>
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
        {role==='manager' && tab==='roster' && managerRoster}
        {role==='manager' && tab==='sites' && managerSites}
        {role==='manager' && tab==='issues' && managerIssuesView}
        {role==='manager' && tab==='reports' && managerReports}
        <p className="mt-7 rounded-xl bg-[#e9f1eb] px-3 py-2 text-[10px] leading-5 text-[#6b8779]">Fictional demonstration · No live staff, GPS, calls or emergency dispatch. Uploaded report evidence stays in this browser; sample evidence is illustrative.</p>
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
