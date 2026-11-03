(function(core,makeViews){
"use strict";
const KEY="jtech-security-demo-v1",root=document.getElementById("app");
let d;
try{d=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
if(!core.valid(d))d=core.seed();
const ui={role:"guard",tab:"home",detail:null,detailId:null,gpsMode:"near",modal:null,notice:""};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){ui.notice="Could not save demo changes in this browser.";}};
const title=()=>ui.detail==="incident"?"Incident details":ui.detail==="site"?"Site details":{
 guard:{home:"Guard Home",patrol:"Patrol",incidents:"Incidents",handover:"Handover"},
 supervisor:{overview:"Supervisor",sites:"Sites",alerts:"Alerts",activity:"Occurrence Book"},
 manager:{dashboard:"Operations",deployments:"Deployments",incidents:"Incidents",reports:"Daily Report"}
}[ui.role][ui.tab];
let lastViewScrollKey=null;
function render(){
 const scrollKey=[ui.role,ui.tab,ui.detail,ui.detailId].join(':');
 const previousScroll=root.querySelector?.(".main")?.scrollTop||0;
 const keepScroll=lastViewScrollKey===scrollKey;
 const v=makeViews(d,ui,core);
 const roleOptions=core.ROLES.map(r=>'<option value="'+r.id+'" '+(r.id===ui.role?"selected":"")+'>'+
 v.escape(r.name+" · "+r.title)+'</option>').join("");
 const tabs=v.TABS[ui.role];
 const nav='<nav class="bottom-nav" aria-label="Security app tabs">'+tabs.map(([id,name,icon])=>
 '<button type="button" class="'+(ui.tab===id&&!ui.detail?"active":"")+'" data-tab="'+id+'"><span>'+icon+'</span><small>'+name+'</small></button>').join("")+'</nav>';
 root.innerHTML='<div class="demo-stage"><aside class="stage-intro"><small>SECURITY OPERATIONS · MOBILE DEMO</small>'+
 '<h2>Guard Operations</h2><p>Deploy professional guards, verify attendance, capture patrol evidence and resolve incidents—within one mobile concept.</p>'+
 '<a href="/demos/security">← Demo overview</a></aside>'+
 '<div class="phone"><div class="device-status"><span>9:41</span><span>▮ ▮ ▰</span></div>'+
 '<header class="app-header">'+(ui.detail?'<button class="back" data-action="back" aria-label="Back">‹</button>':
 '<span class="app-badge">⬡</span>')+
 '<div class="app-heading"><b>'+v.escape(title())+'</b><small>'+v.escape(d.company)+'</small></div>'+
 '<select id="role-select" aria-label="Choose demo user">'+roleOptions+'</select></header>'+
 '<main class="main"><div class="screen">'+v.page()+'</div></main>'+nav+
 '<div class="gesture"><span></span></div></div>'+
 '<aside class="stage-help"><b>Explore three roles</b><p>Kevin: on-site check-in and patrol. Beatrice: alerts and response. Grace: coverage, staffing and reporting.</p>'+
 '<button class="reset-outside" data-action="reset">↻ Reset fictional data</button>'+
 '<small>No real GPS, camera recording, alerts, or external connections.</small></aside></div>'+
 v.modal()+(ui.notice?'<div class="toast" role="status">'+v.escape(ui.notice)+
 '<button data-action="dismiss" aria-label="Dismiss">×</button></div>':"");
 if(keepScroll){const host=root.querySelector?.(".main");if(host)host.scrollTop=previousScroll;}
 lastViewScrollKey=scrollKey;
}
function go(role){
 if(!core.ROLES.some(r=>r.id===role))return;
 ui.role=role;ui.tab=makeViews(d,ui,core).TABS[role][0][0];
 ui.detail=null;ui.detailId=null;ui.modal=null;ui.notice="";render();
}
function open(type,id){
 if(type==="incident"&&!(d.incidents.some(i=>i.id===id&&(ui.role!=="guard"||i.guardId==="GUARD-1"))))return;
 if(type==="site"&&(ui.role==="guard"||!d.sites.some(s=>s.id===id)))return;
 ui.detail=type;ui.detailId=id;ui.modal=null;ui.notice="";render();
}
function mutate(fn,message="Fictional record updated.",post){
 try{
  const result=fn();
  save();
  ui.modal=null;
  ui.notice=message;
  if(post)post(result);
  render();return result;
 }catch(error){
  ui.notice=error?.message||"Could not complete this action.";
  render();return null;
 }
}
function modal(kind,id,extra={}){
 const valid={
  incident:ui.role==="guard"&&d.shifts.some(s=>s.id===id&&s.guardId==="GUARD-1"&&s.state==="on-duty"),
  photo:ui.role==="guard"&&d.shifts.some(s=>s.id===id&&s.guardId==="GUARD-1"&&s.state!=="completed"),
  respond:ui.role==="supervisor"&&d.incidents.some(i=>i.id===id&&i.status==="Acknowledged"),
  handover:ui.role==="guard"&&d.shifts.some(s=>s.id===id&&s.guardId==="GUARD-1"&&s.state==="on-duty"&&!s.handover),
  reassign:ui.role==="manager"&&d.shifts.some(s=>s.id===id&&s.state==="scheduled")
 };
 if(!valid[kind])return;
 ui.modal={kind,id,targetType:extra.targetType||"",targetId:extra.targetId||""};
 ui.notice="";render();
}
document.addEventListener("click",event=>{
 const el=event.target.closest("[data-tab],[data-action],[data-open],[data-mode]");
 if(!el||!root.contains(el))return;
 const {tab,action,open:target,mode,id,checkpointId,targetType,targetId}=el.dataset;
 if(tab){if(makeViews(d,ui,core).TABS[ui.role].some(x=>x[0]===tab)){
  ui.tab=tab;ui.detail=null;ui.detailId=null;ui.notice="";ui.modal=null;render();
 }return;}
 if(target){open(target,id);return;}
 if(mode){if(["near","far","uncertain"].includes(mode)&&ui.role==="guard"){ui.gpsMode=mode;render();}return;}
 if(action==="open-site"){open("site",id);return;}
 if(action==="open-incident"){open("incident",id);return;}
 if(action==="back"){ui.detail=null;ui.detailId=null;ui.notice="";render();return;}
 if(action==="close-modal"){ui.modal=null;ui.notice="";render();return;}
 if(action==="dismiss"){ui.notice="";render();return;}
 if(action==="reset"){
  if(!window.confirm("Restore all fictional security operations records?"))return;
  d=core.seed();save();ui.tab=makeViews(d,ui,core).TABS[ui.role][0][0];
  ui.detail=null;ui.detailId=null;ui.modal=null;ui.gpsMode="near";
  ui.notice="Demo records restored.";render();return;
 }
 if(action==="check-in"&&ui.role==="guard"){
  mutate(()=>core.checkIn(d,ui.role,id,ui.gpsMode),"Sample GPS location verified. Shift started.");return;
 }
 if(action==="verify-checkpoint"&&ui.role==="guard"){
  mutate(()=>core.verifyCheckpoint(d,ui.role,id,checkpointId),"Checkpoint verified for this patrol.");return;
 }
 if(action==="sos"&&ui.role==="guard"){
  mutate(()=>core.sos(d,ui.role,id),"Emergency SOS created · visible to supervisor (demo only).",i=>{
   ui.detail="incident";ui.detailId=i.id;
  });return;
 }
 if(action==="ack"&&ui.role==="supervisor"){
  mutate(()=>core.acknowledge(d,ui.role,id),"Alert acknowledged by supervisor.");return;
 }
 if(action==="resolve"&&ui.role==="supervisor"){
  mutate(()=>core.resolve(d,ui.role,id),"Supervisor resolved the incident.");return;
 }
 if(action==="check-out"&&ui.role==="guard"){
  mutate(()=>core.checkOut(d,ui.role,id),"Shift completed and checkout saved.");return;
 }
 if(["new-incident","photo","respond","handover","reassign"].includes(action)){
  modal(action==="new-incident"?"incident":action,id,{targetType,targetId});return;
 }
});
document.addEventListener("change",event=>{
 if(event.target.id==="role-select")go(event.target.value);
});
document.addEventListener("submit",event=>{
 const form=event.target;
 if(form.id!=="guard-form"||!root.contains(form))return;
 event.preventDefault();
 const {kind,id,targetType,targetId}=form.dataset;
 if(!ui.modal||ui.modal.kind!==kind||ui.modal.id!==id||
  ui.modal.targetType!==targetType||ui.modal.targetId!==targetId)return;
 const values=Object.fromEntries(new FormData(form).entries());
 if(kind==="incident"&&ui.role==="guard"){
  mutate(()=>core.reportIncident(d,ui.role,id,values),"Incident submitted to the supervisor.",i=>{
   ui.detail="incident";ui.detailId=i.id;
  });
 }else if(kind==="photo"&&ui.role==="guard"){
  mutate(()=>core.photo(d,ui.role,id,targetType,targetId,values.label),"Sample camera evidence attached.");
 }else if(kind==="respond"&&ui.role==="supervisor"){
  mutate(()=>core.respond(d,ui.role,id,values.notes),"Supervisor response recorded.");
 }else if(kind==="handover"&&ui.role==="guard"){
  mutate(()=>core.handover(d,ui.role,id,values.notes),"Shift handover saved.");
 }else if(kind==="reassign"&&ui.role==="manager"){
  mutate(()=>core.reassign(d,ui.role,id,values.guardId),"Unstarted shift reassigned.");
 }
});
document.addEventListener("keydown",event=>{
 if(event.key!=="Escape")return;
 if(ui.modal){ui.modal=null;render();}
 else if(ui.detail){ui.detail=null;ui.detailId=null;render();}
});
render();
})(guardCore,guardViews);
