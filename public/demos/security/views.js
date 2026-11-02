const guardViews=(function(){
"use strict";
const escape=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const TABS={
 guard:[["home","Home","⌂"],["patrol","Patrol","◎"],["incidents","Incidents","⚑"],["handover","Handover","▤"]],
 supervisor:[["overview","Overview","◫"],["sites","Sites","⌖"],["alerts","Alerts","⚑"],["activity","Activity","▤"]],
 manager:[["dashboard","Dashboard","◫"],["deployments","Posts","⌖"],["incidents","Incidents","⚑"],["reports","Reports","▤"]]
};
const pill=x=>'<span class="pill '+String(x).toLowerCase().replace(/[^a-z0-9]+/g,"-")+'">'+escape(x)+'</span>';
const button=(label,action,id="",style="",extra="")=>'<button type="button" class="btn '+style+'" data-action="'+action+'" '+(id?'data-id="'+escape(id)+'"':"")+' '+extra+'>'+label+'</button>';
const heading=(title,sub="")=>'<div class="heading"><h1>'+escape(title)+'</h1>'+(sub?'<p>'+escape(sub)+'</p>':"")+'</div>';
const panel=(title,content,cls="")=>'<section class="panel '+cls+'"><div class="panel-heading"><h2>'+escape(title)+'</h2></div>'+content+'</section>';
const pair=(name,value)=>'<div class="pair"><span>'+escape(name)+'</span><strong>'+escape(value??"—")+'</strong></div>';
const metric=(label,num,help="")=>'<div class="metric"><span>'+escape(label)+'</span><strong>'+escape(num)+'</strong><small>'+escape(help)+'</small></div>';
const empty=(title,body)=>'<div class="empty"><b>'+escape(title)+'</b><p>'+escape(body)+'</p></div>';
const mark=id=>'data-id="'+escape(id)+'"';
const field=(label,name,value,attrs="")=>'<label class="field">'+escape(label)+'<input name="'+name+'" value="'+escape(value)+'" '+attrs+' required></label>';
const choose=(label,name,options,chosen)=>'<label class="field">'+escape(label)+'<select name="'+name+'">'+options.map(x=>
 '<option value="'+escape(x[0])+'" '+(x[0]===chosen?"selected":"")+'>'+escape(x[1])+'</option>').join("")+'</select></label>';
const notes=(label,name,value,placeholder="")=>'<label class="field">'+escape(label)+'<textarea name="'+name+'" rows="4" maxlength="350" placeholder="'+escape(placeholder)+'" required>'+escape(value||"")+'</textarea></label>';
return function(d,ui,c){
 const shift=d.shifts.find(x=>x.id==="SH-101");
 const currentSite=c.siteFor(d,shift);
 const guard=c.guardFor(d,shift);
 const sites=d.sites,events=d.events,incidents=d.incidents;
 const siteName=id=>sites.find(x=>x.id===id)?.name||"Unknown site";
 const assignedGuard=s=>c.guardFor(d,s).name;
 const currentShiftForSite=siteId=>d.shifts.find(x=>x.siteId===siteId);
 const evFor=siteId=>events.filter(x=>x.siteId===siteId);
 const photos=filter=>d.evidence.filter(filter);
 const visibleIncidents=()=>ui.role==="guard"?incidents.filter(x=>x.guardId==="GUARD-1"):incidents;
 const openIncidents=(id)=>incidents.filter(x=>x.siteId===id&&x.status!=="Resolved");
 const counts=s=>({verified:s.checkpoints.filter(x=>x.status==="verified").length,
  pending:s.checkpoints.filter(x=>x.status==="pending").length,
  missed:s.checkpoints.filter(x=>x.status==="missed").length});
 const incidentCard=i=>{
  const site=c.site(d,i.siteId),s=c.shift(d,i.shiftId);
  return '<button type="button" class="incident-card '+(i.emergency?"emergency":"")+'" data-open="incident" data-id="'+escape(i.id)+'">'+
   '<div class="card-head"><strong>'+escape(i.title)+'</strong>'+pill(i.status)+'</div>'+
   '<p>'+escape(site.name)+' · '+escape(i.id)+'</p>'+
   '<div class="card-end">'+pill(i.severity)+(i.emergency?'<span class="critical">SOS priority</span>':"")+
    '<small>'+escape(c.guardFor(d,s).name)+' · '+escape(i.openedAt)+'</small></div></button>';
 };
 const siteCard=s=>{
  const site=c.siteFor(d,s),p=counts(s);
  return '<button type="button" class="site-card" data-open="site" data-id="'+escape(site.id)+'">'+
   '<div class="site-icon">⌖</div><div class="site-copy"><div class="card-head"><strong>'+escape(site.name)+'</strong>'+pill(c.shiftStatus(s))+'</div>'+
   '<p>'+escape(site.area)+'</p><small>'+escape(assignedGuard(s))+' · '+p.verified+'/3 checkpoints verified'+
   (p.missed?" · "+p.missed+" missed":"")+'</small></div><span class="chevron">›</span></button>';
 };
 const photoCard=p=>'<div class="evidence-card"><div class="evidence-art"><span class="camera-symbol">▣</span><small>SAMPLE IMAGE</small></div>'+
  '<div><b>'+escape(p.label)+'</b><small>'+escape(p.id)+' · '+escape(p.at)+'</small><span>Simulated camera evidence</span></div></div>';
 const timeline=(rows,limit=0)=>{
  const list=limit?rows.slice(0,limit):rows;
  return list.length?list.map(x=>'<div class="timeline-item"><span class="time-dot"></span><div>'+
   '<b>'+escape(x.detail)+'</b><small>'+escape(x.role)+' · '+escape(x.at)+
   ' · '+escape(siteName(x.siteId))+'</small></div></div>').join(""):
   empty("No activity yet","Actions appear here as they are recorded.");
 };
 const alertBanner=()=>{
  const sos=incidents.filter(x=>x.emergency&&x.status!=="Resolved");
  return sos.length?'<div class="urgent-banner"><b>Emergency awaiting response</b><p>'+sos.length+
   ' open SOS alert'+(sos.length>1?"s":"")+' · immediate supervisor attention needed</p>'+
   button("View alert","open-incident",sos[0].id,"danger-light")+'</div>':"";
 };
 const safeHint='<p class="hint">Demo only: GPS, camera and alerts are simulated. No real tracking, photos or emergency dispatch.</p>';
 function home(){
  const st=c.shiftStatus(shift),checkin=shift.checkIn,reading=c.gpsReading(shift,ui.gpsMode);
  const on=shift.state==="on-duty",done=shift.state==="completed",p=counts(shift);
  return heading("Good morning, Kevin","Your assigned post and today’s guard duties.")+
   '<div class="duty-card"><div class="card-head"><span class="overline">TODAY · DAY SHIFT</span>'+pill(st)+'</div>'+
   '<h2>'+escape(currentSite.name)+'</h2><p>'+escape(currentSite.area)+'</p>'+
   '<div class="duty-meta"><span>07:00–19:00</span><span>Geofence '+currentSite.radiusM+' m</span></div></div>'+
   (done?'<div class="success-banner">✓ Shift complete. Handover and checkout recorded.</div>':
    '<div class="sos-inline">'+button("⚠ EMERGENCY SOS","sos",shift.id,"danger full")+
    '<small>Send an immediate sample alert. A photo is not required.</small></div>')+
   panel("Location check-in",checkin?
    '<div class="location-result"><span class="location-dot">⌖</span><div><b>Location verified · checked in</b>'+
    '<small>'+checkin.distanceM+' m from assigned post · accuracy ±'+checkin.accuracyM+
    ' m · '+escape(checkin.at)+'</small></div></div>'+
    pair("Duty state",st):
    '<p class="hint">Choose a simulated location to demonstrate on-site vs out-of-range verification.</p>'+
    '<div class="location-choices">'+[["near","On site · 35 m"],["far","Outside · 360 m"],["uncertain","Low accuracy"]].map(([key,text])=>
     '<button class="choice '+(ui.gpsMode===key?"selected":"")+'" data-mode="'+key+'">'+text+'</button>').join("")+'</div>'+
    '<div class="location-readout"><span>Simulated GPS</span><b>'+reading.distanceM+' m · ±'+reading.accuracyM+' m</b></div>'+
    button("Verify location & check in","check-in",shift.id,"primary full"))+
   '<div class="metrics two">'+metric("Verified patrols",p.verified+"/3","Site checkpoints")+
    metric("My open incidents",incidents.filter(i=>i.shiftId===shift.id&&i.status!=="Resolved").length,"Requires follow-up")+'</div>'+
   panel("My activity",timeline(events.filter(x=>x.shiftId===shift.id),4))+
   safeHint;
 }
 function patrol(){
  const on=shift.state==="on-duty",num=counts(shift);
  const checkpoints=shift.checkpoints.map((cp,index)=>{
   const eligible=on&&cp.status==="pending"&&!shift.checkpoints.slice(0,index).some(x=>x.status==="pending");
   const attached=photos(p=>p.checkpointId===cp.id);
   return '<article class="checkpoint"><div class="checkpoint-number">'+(index+1)+'</div><div class="checkpoint-main">'+
    '<div class="card-head"><strong>'+escape(cp.label)+'</strong>'+pill(cp.status)+'</div>'+
    '<p>'+escape(currentSite.name)+' · Patrol checkpoint</p>'+
    (eligible?button("✓ Verify checkpoint","verify-checkpoint",shift.id,"primary compact",'data-checkpoint-id="'+escape(cp.id)+'"'):"")+
    (cp.status==="verified"&&on?button("▣ Sample camera","photo",shift.id,"outline compact",'data-target-type="checkpoint" data-target-id="'+escape(cp.id)+'"'):"")+
    (attached.length?'<div class="attached-count">'+attached.length+' sample photo'+(attached.length>1?"s":"")+' attached</div>':"")+
    '</div></article>';
  }).join("");
  return heading("Patrol checkpoints","Verify the assigned security rounds and attach sample photos.")+
   '<div class="metrics three">'+metric("Verified",num.verified)+metric("Pending",num.pending)+metric("Missed",num.missed)+'</div>'+
   (!on?'<div class="info-banner">'+(shift.state==="completed"?"This shift has ended.":"Check in on Home before verifying patrol checkpoints.")+'</div>':"")+
   panel("Westlands patrol route",checkpoints)+
   panel("Camera evidence",photos(x=>x.shiftId===shift.id&&x.checkpointId).map(photoCard).join("")||
    empty("No images yet","Verify a checkpoint, then choose Sample camera to attach evidence."))+
   safeHint;
 }
 function incidentList(){
  const own=visibleIncidents().slice().sort((a,b)=>(a.status==="Resolved")-(b.status==="Resolved")||
   Number(b.emergency)-Number(a.emergency));
  return heading(ui.role==="supervisor"?"Incidents & SOS":ui.role==="guard"?"Incident reports":"Security incidents",
   ui.role==="guard"?"File site reports, capture evidence, or raise an SOS.":"Incident acknowledgement and response history.")+
   alertBanner()+
   (ui.role==="guard"&&shift.state!=="completed"?'<div class="button-row">'+button("⚠ EMERGENCY SOS","sos",shift.id,"danger")+
    (shift.state==="on-duty"?button("＋ Report incident","new-incident",shift.id,"primary"):"")+'</div>':"")+
   panel("Incident register",own.map(incidentCard).join("")||empty("No incidents yet","Reports and alerts will appear here."))+
   (ui.role==="guard"?safeHint:"");
 }
 function handoverPage(){
  const open=incidents.filter(i=>i.shiftId===shift.id&&i.status!=="Resolved"),missed=shift.checkpoints.filter(p=>p.status!=="verified");
  return heading("Shift handover","Pass important observations to the next guard.")+
   panel("Today's shift",pair("Post",currentSite.name)+pair("Guard",guard.name)+
    pair("Status",c.shiftStatus(shift))+pair("Verified checkpoints",counts(shift).verified+"/3")+
    pair("Unverified checkpoints",missed.length)+pair("Open incidents",open.length))+
   panel("Outstanding items",open.map(i=>'<div class="simple-list"><b>'+escape(i.title)+'</b>'+pill(i.status)+'</div>').join("")||
    '<p class="hint">No outstanding incidents on your shift.</p>')+
   panel("Handover notes",shift.handover?
    '<div class="done-message">✓ Handover recorded · '+escape(shift.handover.at)+'</div>'+
    '<p class="note">'+escape(shift.handover.notes)+'</p>':
    shift.state==="on-duty"?
     '<p class="hint">Summarize site condition and unresolved items. Missed patrols remain visible to management.</p>'+
     button("Write handover","handover",shift.id,"primary full"):
    '<p class="hint">Check in to start your shift before preparing handover.</p>')+
   (shift.handover&&shift.state==="on-duty"?button("Complete shift · Check out","check-out",shift.id,"primary full"):"")+
   (shift.state==="completed"?'<div class="success-banner">Shift completed and recorded.</div>':"")+
   safeHint;
 }
 function supervisorOverview(){
  const m=c.metrics(d),unresolved=incidents.filter(x=>x.status!=="Resolved");
  return heading("Site operations","Beatrice · live sample coverage and supervisor response.")+
   alertBanner()+
   '<div class="metrics two">'+metric("Guards on duty",m.onDuty+"/"+m.posts)+metric("Late posts",m.late)+
   metric("Open incidents",m.incidents)+metric("Missed patrols",m.missed)+'</div>'+
   panel("Requires attention",unresolved.map(incidentCard).join("")||
    empty("All clear","No unresolved alerts currently need response."))+
   panel("Today's posts",d.shifts.map(siteCard).join(""))+
   safeHint;
 }
 function supervisorSites(){
  return heading("Assigned sites","Guard status, coverage, and patrol checkpoints across four sites.")+
   panel("Site coverage",d.shifts.map(siteCard).join(""))+
   '<p class="hint">GPS readings are sample values; the app does not access your actual location.</p>';
 }
 function activityPage(){
  return heading("Digital occurrence book","Shared guard and supervisor event log.")+
   panel("Recent activity",timeline(events))+
   panel("Evidence register",d.evidence.map(photoCard).join("")||
    empty("No evidence", "Sample camera captures appear here."))+
   safeHint;
 }
 function managerDashboard(){
  const m=c.metrics(d),coverage=Math.round(m.onDuty/m.posts*100);
  return heading("Operations overview","Grace · company-wide deployment and incident visibility.")+
   alertBanner()+
   '<div class="overview-hero"><span>POST COVERAGE · '+escape(d.date)+'</span><strong>'+coverage+'%</strong>'+
    '<small>'+m.onDuty+' of '+m.posts+' assigned posts checked in</small>'+
    '<div class="progress"><span style="width:'+coverage+'%"></span></div></div>'+
   '<div class="metrics two">'+metric("On duty",m.onDuty)+metric("Late",m.late)+
    metric("Open incidents",m.incidents)+metric("Verified patrols",m.verified)+'</div>'+
   panel("Site status",d.shifts.map(siteCard).join(""))+
   panel("Recent records",timeline(events,5));
 }
 function deployments(){
  const m=c.metrics(d);
  return heading("Guard deployments","Preconfigured client posts and assigned security personnel.")+
   '<div class="metrics two">'+metric("Assigned posts",m.posts)+metric("Late arrivals",m.late)+'</div>'+
   panel("Current shifts",d.shifts.map(s=>{
    const area=c.siteFor(d,s),extra=s.state==="scheduled"?button("Reassign guard","reassign",s.id,"outline compact"):"";
    return '<article class="deployment"><div class="card-head"><strong>'+escape(area.name)+'</strong>'+pill(c.shiftStatus(s))+'</div>'+
     pair("Assigned guard",assignedGuard(s))+pair("Shift",s.slot)+
     '<div class="deployment-actions">'+button("Site details","open-site",area.id,"text")+extra+'</div></article>';
   }).join(""))+
   '<p class="hint">Reassignment is available for unstarted shifts only. Active guards cannot be double-booked.</p>';
 }
 function reports(){
  const m=c.metrics(d),total=d.shifts.flatMap(s=>s.checkpoints).length;
  return heading("Proof of service","Illustrative daily operational evidence across client premises.")+
   panel("Company summary",pair("Sites contracted",m.posts)+pair("Guards checked in",m.onDuty)+
    pair("Late arrival flags",m.late)+pair("Patrol checkpoints verified",m.verified+" / "+total)+
    pair("Missed checkpoints",m.missed)+pair("Sample photos",m.photos)+
    pair("Open incidents",m.incidents)+pair("Emergency alerts awaiting response",m.sos))+
   panel("Client-site reporting",d.shifts.map(s=>{
    const m2=counts(s),name=c.siteFor(d,s).name,open=openIncidents(s.siteId).length;
    return '<button class="report-row" data-open="site" data-id="'+escape(s.siteId)+'">'+
     '<div><b>'+escape(name)+'</b><small>'+escape(assignedGuard(s))+'</small></div>'+
     '<span>'+m2.verified+'/3 patrols · '+open+' open alerts</span><span>›</span></button>';
   }).join(""))+
   safeHint;
 }
 function siteDetail(){
  const s=currentShiftForSite(ui.detailId);
  if(!s)return empty("Site unavailable","No deployment record.");
  const location=c.siteFor(d,s),cp=counts(s),relevant=openIncidents(s.siteId);
  return heading(location.name,location.area)+
   panel("Client & guard",pair("Client",location.client)+pair("Assigned guard",assignedGuard(s))+
    pair("Shift state",c.shiftStatus(s))+pair("Time",s.slot)+
    pair("Check-in",s.checkIn?("Sample GPS · "+s.checkIn.distanceM+" m, ±"+s.checkIn.accuracyM+" m"):"Not checked in")+
    pair("Geofence",location.radiusM+" m"))+
   panel("Patrol compliance",pair("Verified",cp.verified+"/3")+pair("Pending",cp.pending)+pair("Missed",cp.missed)+
    s.checkpoints.map(x=>'<div class="simple-list"><span>'+escape(x.label)+'</span>'+pill(x.status)+'</div>').join(""))+
   panel("Open incidents",relevant.map(incidentCard).join("")||
    empty("No open incidents","All reported events at this site have been resolved."))+
   panel("Occurrence book",timeline(evFor(s.siteId),5));
 }
 function incidentDetail(){
  const i=incidents.find(x=>x.id===ui.detailId);
  if(!i)return empty("Incident unavailable","Not found.");
  const isGuard=ui.role==="guard",s=c.shift(d,i.shiftId),related=photos(x=>x.incidentId===i.id);
  let actions="";
  if(ui.role==="supervisor"){
   if(i.status==="Open")actions=button("Acknowledge alert","ack",i.id,"primary full");
   else if(i.status==="Acknowledged")actions=button("Record response","respond",i.id,"primary full");
   else if(i.status==="Responding")actions=button("Resolve incident","resolve",i.id,"primary full");
  }
  if(isGuard&&i.guardId==="GUARD-1"&&i.status!=="Resolved"&&s.state!=="completed")
   actions+=button("▣ Open sample camera","photo",s.id,"outline full",'data-target-type="incident" data-target-id="'+escape(i.id)+'"');
  return heading(i.emergency?"Emergency SOS":"Incident details",i.id+" · "+siteName(i.siteId))+
   '<div class="incident-heading '+(i.emergency?"sos-heading":"")+'"><b>'+escape(i.title)+'</b>'+
    '<div class="button-row">'+pill(i.severity)+pill(i.status)+'</div></div>'+
   panel("Report",pair("Reported by",c.guardFor(d,s).name)+pair("Category",i.category)+
    pair("Opened",i.openedAt)+pair("Site",siteName(i.siteId))+pair("Severity",i.severity)+
    '<div class="note">'+escape(i.notes)+'</div>')+
   panel("Supervisor response",pair("Status",i.status)+pair("Acknowledged",i.acknowledgedAt||"Not yet")+
    pair("Resolved",i.resolvedAt||"Pending")+
    (i.responseNote?'<div class="note">'+escape(i.responseNote)+'</div>':
     '<p class="hint">Awaiting a documented supervisor response.</p>')+
    actions)+
   panel("Camera evidence",related.map(photoCard).join("")||
    empty("No sample images","Evidence can be attached after an alert when it is safe to do so."))+
   (i.emergency?'<p class="emergency-advice">SOS alerts do not require evidence. For a real emergency, follow your company emergency procedures.</p>':"");
 }
 function page(){
  if(ui.detail==="site")return siteDetail();
  if(ui.detail==="incident")return incidentDetail();
  if(ui.role==="guard")return ({home,patrol,incidents:incidentList,handover:handoverPage}[ui.tab]||home)();
  if(ui.role==="supervisor")return ({overview:supervisorOverview,sites:supervisorSites,alerts:incidentList,activity:activityPage}[ui.tab]||supervisorOverview)();
  return ({dashboard:managerDashboard,deployments,incidents:incidentList,reports}[ui.tab]||managerDashboard)();
 }
 function modal(){
  if(!ui.modal)return"";
  const {kind,id,targetType,targetId}=ui.modal;
  let title="",fields="",submit="",notice="";
  if(kind==="incident"){
   title="Report site incident";submit="Submit incident";
   fields=choose("Category","category",c.CATEGORIES.map(x=>[x,x]),c.CATEGORIES[0])+
    choose("Severity","severity",c.SEVERITIES.map(x=>[x,x]),"Medium")+
    field("Incident title","title","","maxlength=\"72\" placeholder=\"e.g. Damaged boundary fence\"")+
    notes("Observation","notes","","What happened and where? (fictional example only)");
  }else if(kind==="photo"){
   title="Sample camera";submit="Capture sample photo";
   fields='<div class="camera-frame"><span>SIMULATED CAMERA</span><div class="camera-focus">⌗</div>'+
    '<small>Illustrative site scene · no camera permission used</small></div>'+
    choose("Photo description","label",c.PHOTO_LABELS.map(x=>[x,x]),c.PHOTO_LABELS[0])+
    '<p class="hint">Creates a visible sample evidence record with a timestamp. No photograph is taken or uploaded.</p>';
  }else if(kind==="respond"){
   title="Record supervisor response";submit="Save response";
   fields=notes("Action taken","notes","","Describe acknowledgement, assistance dispatched and findings.");
  }else if(kind==="handover"){
   title="Shift handover";submit="Save handover";
   fields=notes("Site condition and follow-ups","notes","Site observed, pending incidents passed to next guard.","Summarize important observations.")+
    '<p class="hint">Outstanding incidents and missed patrol checkpoints remain visible after checkout.</p>';
  }else if(kind==="reassign"){
   const s=c.shift(d,id),current=s.guardId;
   const options=d.guards.filter(g=>g.id!==current&&!d.shifts.some(x=>x.id!==s.id&&x.guardId===g.id&&x.state!=="completed"));
   if(!options.length)return"";
   title="Reassign unstarted post";submit="Save assignment";
   fields='<p class="form-caption">'+escape(siteName(s.siteId))+' · Previous guard: '+escape(assignedGuard(s))+'</p>'+
    choose("Available guard","guardId",options.map(g=>[g.id,g.name]),options[0].id);
  }else return"";
  return '<div class="modal-wrap"><button type="button" class="shade" data-action="close-modal" aria-label="Close modal"></button>'+
   '<section class="modal" role="dialog" aria-modal="true" aria-label="'+escape(title)+'">'+
    '<header><h2>'+escape(title)+'</h2>'+button("×","close-modal","","icon")+'</header>'+
    '<div class="modal-body"><form id="guard-form" data-kind="'+escape(kind)+'" data-id="'+escape(id||"")+
    '" data-target-type="'+escape(targetType||"")+'" data-target-id="'+escape(targetId||"")+'">'+
    fields+'<button type="submit" class="btn primary full">'+escape(submit)+'</button></form></div></section></div>';
 }
 return {page,modal,TABS,button,escape};
};
})();
