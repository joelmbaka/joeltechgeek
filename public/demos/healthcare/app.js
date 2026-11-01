(function(core,makeViews){
"use strict";
const KEY="jtech-hmis-demo-v2",root=document.getElementById("app");
let data;
try{data=JSON.parse(localStorage.getItem(KEY)||"null")}catch(err){}
if(!core.valid(data))data=core.seed();
const ui={role:"reception",page:"overview",detail:null,id:null,search:"",queue:"open",
 encTab:"overview",modal:null,menu:false,message:""};
const staff=core.ROLES;
const allowed={
 "start-visit":["reception"],verify:["reception","billing"],triage:["nurse"],
 consult:["doctor"],order:["doctor"],prescribe:["doctor"],report:["diagnostics"],
 dispense:["pharmacy"],pay:["billing"],discharge:["doctor"]
};
const saves=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){ui.message="Changes could not be saved in this browser."}};
const can=(action)=>!allowed[action]||allowed[action].includes(ui.role);
function nav(page){
 if(!makeViews(data,ui,core).NAV.some(x=>x[0]===page))return;
 ui.page=page;ui.detail=null;ui.id=null;ui.modal=null;ui.encTab="overview";ui.menu=false;ui.message="";
 render();
}
function detail(type,id){
 if(type==="patient"&&!data.patients.some(x=>x.id===id))return;
 if(type==="encounter"&&!data.encounters.some(x=>x.id===id))return;
 ui.detail=type;ui.id=id;ui.modal=null;ui.menu=false;ui.encTab="overview";ui.message="";render();
}
function render(){
 const v=makeViews(data,ui,core),esc=v.e;
 const link=(x)=>'<button type="button" class="side-link '+(ui.page===x[0]&&!ui.detail?"active":"")+
 '" data-nav="'+esc(x[0])+'"><span aria-hidden="true">'+x[2]+'</span>'+x[1]+'</button>';
 const menu='<nav class="nav-list" aria-label="HMIS modules">'+
 '<div class="nav-group"><span>Workspace</span>'+v.NAV.slice(0,3).map(link).join("")+'</div>'+
 '<div class="nav-group"><span>Departments</span>'+v.NAV.slice(3,7).map(link).join("")+'</div>'+
 '<div class="nav-group"><span>Hospital</span>'+v.NAV.slice(7).map(link).join("")+'</div></nav>';
 const roleOptions=staff.map(r=>'<option value="'+r.id+'" '+(r.id===ui.role?"selected":"")+'>'+
  esc(r.name+" · "+r.title)+'</option>').join("");
 const overlay=ui.menu?'<button class="mobile-shade" data-action="close-menu" aria-label="Close navigation"></button>':"";
 root.innerHTML='<div class="hmis-shell">'+overlay+
 '<aside class="sidebar '+(ui.menu?"expanded":"")+'"><div class="logo"><span class="logo-mark">✚</span>'+
 '<span><strong>Hospital Operations</strong><small>Fictional HMIS · Web demo</small></span></div>'+menu+
 '<div class="sidebar-foot"><small>Harborview Medical Centre</small><span>Illustrative records only</span></div></aside>'+
 '<div class="hmis-workspace"><header class="topbar">'+
 '<button class="menu-trigger" data-action="toggle-menu" aria-label="Open navigation">☰</button>'+
 '<div class="topbar-title"><b>'+esc(data.facility.name)+'</b><small>Outpatient management · Demo</small></div>'+
 '<div class="topbar-actions"><label class="role-switch"><span>Viewing as</span><select id="role-select" aria-label="Choose demo user">'+roleOptions+'</select></label>'+
 v.btn("↻","reset","","reset-button")+'</div></header>'+
 '<main class="content" id="main-content">'+v.main()+
 '<p class="demo-footnote">Fictional clinical and billing information · No real patient data, medical decisions, insurance checks or transactions</p></main></div>'+
 '</div>'+v.dialog()+
 (ui.message?'<div class="toast" role="status">'+esc(ui.message)+v.btn("×","dismiss","","text")+'</div>':"");
}
function openModal(kind,id,attrs){
 if(!can(kind))return;
 if(kind==="visit"||kind==="verify"){
  if(!data.patients.some(x=>x.id===id))return;
 }else{
  const v=data.encounters.find(x=>x.id===id);
  if(!v)return;
  if(["triage","consult","order","prescribe","pay","discharge"].includes(kind)&&v.dischargedAt)return;
  if(kind==="triage"&&v.triage)return;
  if(["consult","order","prescribe"].includes(kind)&&!v.triage)return;
  if(["order","prescribe"].includes(kind)&&!v.consultation)return;
  if(kind==="discharge"&&!core.canDischarge(data,v))return;
 }
 ui.modal={kind,id,orderId:attrs?.orderId||null,rxId:attrs?.rxId||null};
 ui.message="";render();
}
function mutate(fn){
 try{const output=fn();saves();ui.modal=null;ui.message="Fictional record updated.";render();return output}
 catch(err){ui.message=err?.message||"Could not update this record.";render();return null}
}
document.addEventListener("click",ev=>{
 const el=ev.target.closest("[data-nav],[data-action],[data-queue],[data-enc-tab]");
 if(!el||!root.contains(el))return;
 const {nav:destination,action,queue,encTab,id,orderId,rxId}=el.dataset;
 if(destination){nav(destination);return}
 if(queue){if(["open","completed","all"].includes(queue)){ui.queue=queue;render()}return}
 if(encTab){if(["overview","clinical","orders","billing","timeline"].includes(encTab)){ui.encTab=encTab;render()}return}
 if(!action)return;
 if(action==="navigate"){nav(id);return}
 if(action==="open-patient"){detail("patient",id);return}
 if(action==="open-encounter"){detail("encounter",id);return}
 if(action==="toggle-menu"){ui.menu=!ui.menu;render();return}
 if(action==="close-menu"){ui.menu=false;render();return}
 if(action==="close-modal"){ui.modal=null;render();return}
 if(action==="dismiss"){ui.message="";render();return}
 if(action==="reset"){
  if(!window.confirm("Reset all fictional HMIS records?"))return;
  data=core.seed();saves();ui.page="overview";ui.detail=null;ui.id=null;ui.menu=false;
  ui.modal=null;ui.queue="open";ui.search="";ui.encTab="overview";ui.message="Sample records restored.";render();return;
 }
 if(action==="dispense"){
  if(!can(action))return;
  mutate(()=>core.dispense(data,ui.role,id,rxId));return;
 }
 if(allowed[action]){openModal(action,id,{orderId,rxId});return}
});
document.addEventListener("change",ev=>{
 if(ev.target.id==="role-select"){
  const role=ev.target.value;if(!staff.some(x=>x.id===role))return;
  ui.role=role;ui.modal=null;ui.menu=false;ui.message="";
  ui.detail=null;ui.id=null;ui.page="overview";ui.encTab="overview";render();
 }
});
document.addEventListener("input",ev=>{
 if(ev.target.id!=="patient-search")return;
 ui.search=ev.target.value;const pos=ev.target.selectionStart;render();
 const field=document.getElementById("patient-search");
 if(field&&typeof field.focus==="function"){field.focus();if(typeof field.setSelectionRange==="function")field.setSelectionRange(pos,pos)}
});
document.addEventListener("submit",ev=>{
 const form=ev.target;if(form.id!=="hmis-form"||!root.contains(form))return;
 ev.preventDefault();const {kind,id,orderId,rxId}=form.dataset;
 if(!ui.modal||ui.modal.kind!==kind||ui.modal.id!==id||!can(kind))return;
 const inputs=Object.fromEntries(new FormData(form).entries());
 const outcome=mutate(()=>{
  switch(kind){
   case "visit":return core.startVisit(data,ui.role,id);
   case "verify":return core.verifyInsurance(data,ui.role,id,inputs.status);
   case "triage":return core.triage(data,ui.role,id,inputs);
   case "consult":return core.consult(data,ui.role,id,inputs.note);
   case "order":return core.order(data,ui.role,id,inputs.code);
   case "report":return core.report(data,ui.role,id,orderId,inputs.result);
   case "prescribe":return core.prescribe(data,ui.role,id,inputs.code);
   case "pay":return core.pay(data,ui.role,id,inputs.amount,inputs.method);
   case "discharge":return core.discharge(data,ui.role,id);
   default:throw Error("Unsupported form");
  }
 });
 if(outcome&&kind==="visit")detail("encounter",outcome.id);
});
document.addEventListener("keydown",ev=>{
 if(ev.key!=="Escape")return;
 if(ui.modal){ui.modal=null;render()}
 else if(ui.menu){ui.menu=false;render()}
});
render();
})(hmisCore,hmisViews);
