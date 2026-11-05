'use client';

import { ArrowLeft, Camera, ChevronRight, Clock3, FileText, MessageSquare, ShieldCheck } from 'lucide-react';
import {
  dayOfInstant, formatClock, formatDay, timelineForDay, shiftWindow, type State,
  type Role, type TimelineItem, type Asset,
} from './security-demo-model';

const panel = 'rounded-2xl border border-[#dfe9e4] bg-white p-4 shadow-sm';
const line = 'text-xs leading-5 text-[#526f60]';

function Evidence({items}: {items: Asset[]}) {
  return items.length ? <div className="mt-3 grid grid-cols-2 gap-2">
    {items.map(asset=><div key={asset.id} className="overflow-hidden rounded-xl border border-[#d8e5de] bg-[#f6faf7]">
      <div className="flex h-16 items-center justify-center bg-[#e5f1e8]">
        {asset.kind==='image' ? <Camera className="h-6 w-6 text-emerald-700"/> : <FileText className="h-6 w-6 text-emerald-700"/>}
      </div>
      <div className="px-2 py-2"><p className="break-words text-[10px] font-semibold text-[#3f6752]">{asset.name}</p>
        <p className="mt-1 text-[9px] font-bold uppercase text-[#89a294]">Illustrative {asset.kind}</p></div>
    </div>)}
  </div> : <p className="mt-2 text-xs text-[#879c8c]">No media or documents recorded.</p>;
}

export default function SecurityRosterDetail({
  row, state, date, siteId, role, onBack, onIssue, onSelectRecord,
}:{
  row: TimelineItem; state: State; date: string; siteId: string; role: Role;
  onBack: () => void; onIssue: (id: string) => void; onSelectRecord: (id: string) => void;
}) {
  const shift = row.shift;
  const officer = shift ? state.staff.find(person=>person.id===shift.staffId) : undefined;
  const site = state.sites.find(s=>s.id===siteId);
  const activity = shift ? state.activity.filter(a=>a.siteId===shift.siteId && a.clientVisible &&
    Date.parse(a.at)>=Date.parse(shift.startAt) && Date.parse(a.at)<Date.parse(shift.endAt))
    .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)) : [];
  const other = shift ? [] : timelineForDay(state,date,siteId).filter(item=>item.id!==row.id);

  return <div className="space-y-4">
    <button type="button" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-emerald-700" onClick={onBack}>
      <ArrowLeft className="h-4 w-4"/> Back to {formatDay(date)}
    </button>
    <section className={panel}>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#5a8973]">{shift?'Duty shift':'Recorded site activity'}</p>
      <h2 className="mt-2 text-lg font-extrabold text-[#1e4434]">{row.title}</h2>
      <p className="mt-2 break-all text-[11px] font-semibold text-[#779280]">Record ID: {shift?.id||row.id}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#4e6f5e]"><Clock3 className="h-4 w-4"/>{formatDay(dayOfInstant(row.at))} · {formatClock(row.at)} EAT</p>
      <p className="mt-3 text-xs leading-6 text-[#4e705f]">{row.detail}</p>
      {shift && <div className="mt-4 space-y-2 rounded-xl bg-[#edf7f0] p-3 text-xs text-[#446853]">
        <p><strong>Officer:</strong> {officer?.name||'Unassigned'}</p>
        <p><strong>Duty period:</strong> {shiftWindow(shift)}</p>
        <p><strong>Status:</strong> {shift.attendance}</p>
        <p><strong>Arrival:</strong> {shift.arrivalAt?formatDay(dayOfInstant(shift.arrivalAt))+' · '+formatClock(shift.arrivalAt):'Not recorded'}</p>
        <p><strong>Departure:</strong> {shift.departureAt?formatDay(dayOfInstant(shift.departureAt))+' · '+formatClock(shift.departureAt):'Not recorded'}</p>
        <p><strong>Method:</strong> {shift.method||'Not yet confirmed'}</p>
        {shift.confirmedBy && <p><strong>Confirmed by:</strong> {shift.confirmedBy}</p>}
        <p><strong>Work contact:</strong> {role==='manager' ? officer?.phone||'Not provided' : officer?.workContact||site?.contact||'Security office'}</p>
      </div>}
    </section>

    {!shift && <section className={panel}>
      <h3 className="text-sm font-bold text-[#24523b]">Media and documents</h3>
      <p className={'mt-1 '+line}>Supporting evidence attached to this record.</p>
      <Evidence items={row.assets}/>
      {row.issueId && <button type="button" onClick={()=>onIssue(row.issueId!)}
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#e7f6ed] px-3 py-2.5 text-xs font-bold text-[#067951]">
        <MessageSquare className="h-4 w-4"/> Open related issue
      </button>}
    </section>}

    {shift && <section className={panel}>
      <h3 className="text-sm font-bold text-[#24523b]">All activities during this duty</h3>
      <p className={'mt-1 '+line}>Recorded site events from shift start through handover, including any events after midnight.</p>
      <div className="mt-4 space-y-4">
        {activity.length===0 && <p className={line}>No additional site events have been recorded for this shift.</p>}
        {activity.map(event=><div key={event.id} className="border-b border-[#e3eee6] pb-3 last:border-0 last:pb-0">
          <p className="text-[10px] font-extrabold text-[#17875e]">{formatDay(dayOfInstant(event.at))} · {formatClock(event.at)}</p>
          <h4 className="mt-1 text-xs font-extrabold text-[#2c503c]">{event.title}</h4>
          <p className={'mt-1 '+line}>{event.detail}</p>
          <p className="mt-1 break-all text-[10px] text-[#849e8f]">ID: {event.id}</p>
          {event.assets.length>0 && <Evidence items={event.assets}/>}
          {event.issueId && <button type="button" onClick={()=>onIssue(event.issueId!)}
            className="mt-2 inline-flex min-h-9 items-center gap-1 text-[11px] font-bold text-emerald-700">View related issue <ChevronRight className="h-4 w-4"/></button>}
        </div>)}
      </div>
    </section>}

    {!shift && <section className={panel}>
      <h3 className="text-sm font-bold text-[#24523b]">Other records on this day</h3>
      <p className={'mt-1 '+line}>Open another record to inspect its full details.</p>
      <div className="mt-3 space-y-2">
        {other.map(item=><button type="button" key={item.id} onClick={()=>onSelectRecord(item.id)}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-[#dcece2] px-3 py-2 text-left hover:bg-[#f5fbf7]">
          <div className="min-w-0"><p className="text-[10px] font-extrabold text-emerald-700">{formatClock(item.at)} · {item.kind==='shift'?'Shift':'Activity'}</p>
            <p className="mt-1 text-xs font-semibold text-[#395646]">{item.title}</p></div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#65937b]"/>
        </button>)}
      </div>
    </section>}
    <p className="text-[10px] leading-5 text-[#8aa296]"><ShieldCheck className="mr-1 inline h-3 w-3"/> Fictional demo data and sample evidence, not live security records.</p>
  </div>;
}
