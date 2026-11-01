const hmisViews=(function(){
"use strict";
const money=n=>"KES "+Number(n||0).toLocaleString("en-KE");
const escape=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const NAV=[["overview","Overview","◫"],["patients","Patients","♙"],["opd","OPD queue","▤"],
 ["lab","Laboratory","◈"],["imaging","Imaging","▧"],["pharmacy","Pharmacy","✚"],
 ["billing","Billing","▣"],["inpatients","Inpatients","▥"]];
const ROLE_NAMES={reception:"Reception",nurse:"Nurse",doctor:"Doctor",diagnostics:"Diagnostics",pharmacy:"Pharmacy",billing:"Billing"};
return function(d,s,c){
 const find=(arr,id)=>arr.find(x=>x.id===id);
 const patient=id=>find(d.patients,id),visit=id=>find(d.encounters,id);
 const person=v=>patient(v.patientId);
 const is=role=>s.role===role;
 const state=v=>c.phase(d,v);
 const bill=v=>c.billing(d,v);
 const e=escape;
 const k=money;
 const title=(name,description="")=>'<div class="page-title"><h1>'+e(name)+'</h1><p>'+e(description)+'</p></div>';
 const btn=(label,action,id="",variant="",extra="")=>'<button type="button" class="btn '+variant+'" data-action="'+action+'" '+(id?'data-id="'+e(id)+'"':"")+" "+extra+'>'+label+'</button>';
 const badge=value=>'<span class="badge '+String(value).toLowerCase().replace(/[^a-z0-9]+/g,"-")+'">'+e(value)+'</span>';
 const pair=(name,value)=>'<div class="detail-pair"><span>'+e(name)+'</span><strong>'+e(value??"—")+'</strong></div>';
 const panel=(name,body)=>'<section class="panel"><h2>'+e(name)+'</h2>'+body+'</section>';
 const empty=(name,detail)=>'<div class="empty"><b>'+e(name)+'</b><p>'+e(detail)+'</p></div>';
 const metric=(name,value,detail)=>'<div class="metric"><small>'+e(name)+'</small><strong>'+e(value)+'</strong><span>'+e(detail)+'</span></div>';
 const buttonOpen=(type,id,text="Open")=>btn(text,"open-"+type,id,"outline compact");
 const payer=p=>badge(p.paymentType)+(p.paymentType==="Insured"?" "+badge(p.insurance.status):"");
 const encounterRow=v=>'<div class="record-row"><div><b>'+e(person(v).name)+'</b><small>'+e(v.id)+' · '+e(v.date)+'</small></div>'+
   '<div class="record-tags">'+payer(person(v))+badge(state(v))+'</div>'+buttonOpen("encounter",v.id)+'</div>';
 const patientRow=p=>'<div class="record-row"><div><b>'+e(p.name)+'</b><small>'+e(p.id)+' · '+e(p.phone)+'</small></div>'+
   '<div class="record-tags">'+payer(p)+'</div>'+buttonOpen("patient",p.id)+'</div>';
 function overview(){
  const stats=c.stats(d);
  const work={
   reception:d.encounters.filter(v=>!v.dischargedAt&&!v.triage),
   nurse:d.encounters.filter(v=>!v.dischargedAt&&!v.triage),
   doctor:d.encounters.filter(v=>!v.dischargedAt&&v.triage),
   diagnostics:d.encounters.filter(v=>v.orders.some(o=>o.status==="Pending")),
   pharmacy:d.encounters.filter(v=>v.prescriptions.some(p=>p.status==="Pending")),
   billing:d.encounters.filter(v=>!v.dischargedAt&&v.consultation&&bill(v).balance>0)
  }[s.role]||[];
  return title("Hospital overview","Shared fictional OPD encounters across clinical and administrative teams.")+
   '<div class="metrics">'+metric("Registered patients",stats.patients,"Existing records only")+
   metric("Active OPD",stats.active,"Open encounters")+
   metric("Pending diagnostics",stats.diagnostics,"Lab and imaging")+
   metric("Inpatients",stats.inpatients,"Read-only ward census")+'</div>'+
   panel("Your worklist · "+ROLE_NAMES[s.role],
     '<div class="panel-tools"><span>'+work.length+' relevant cases</span>'+btn("View all OPD","navigate","opd","outline compact")+'</div>'+
     (work.map(encounterRow).join("")||empty("No work waiting","Switch role or open a different department.")))+
   '<div class="columns">'+panel("Live OPD picture",pair("Awaiting triage",stats.triage)+pair("Awaiting doctor",stats.doctor)+
      pair("Pharmacy pending",stats.pharmacy)+pair("Outstanding billing",stats.billing))+
    panel("Demo environment",'<p class="muted">Nine fictional patients are already in the registry. No account creation is required. Department worklists share encounter notes, orders, results, payments and timeline events.</p>'+
    '<p class="muted">All results and payments are examples. No clinical guidance or real integrations.</p>')+'</div>';
 }
 function patients(){
  const q=s.search.trim().toLowerCase();
  const list=d.patients.filter(p=>[p.id,p.name,p.phone,p.paymentType].join(" ").toLowerCase().includes(q));
  return title("Patients","Already registered. Search and open an existing record.")+
   '<div class="toolbar"><label class="search"><span>⌕</span><input id="patient-search" value="'+e(s.search)+'" placeholder="Search name, patient ID or payment type" aria-label="Search patients"></label><span>'+list.length+' records</span></div>'+
   panel("Patient directory",list.map(patientRow).join("")||empty("No patients","Try a different search."));
 }
 function opd(){
  const list=d.encounters.filter(v=>s.queue==="all"||(s.queue==="completed"?!!v.dischargedAt:!v.dischargedAt));
  return title("OPD queue","Active and completed outpatient encounters.")+
   '<div class="toolbar"><div class="segmented">'+[["open","Open"],["completed","Completed"],["all","All"]].map(x=>
    '<button type="button" data-queue="'+x[0]+'" class="'+(s.queue===x[0]?"selected":"")+'">'+x[1]+'</button>').join("")+'</div><span>'+list.length+' visits</span></div>'+
   panel("Encounters",list.map(encounterRow).join("")||empty("No encounters","Try another status."));
 }
 function main(){
  if(s.detail==="patient")return patientDetail();
  if(s.detail==="encounter")return encounterDetail();
  const screens={overview,patients,opd,lab:()=>diagnostics("Lab"),imaging:()=>diagnostics("Imaging"),
   pharmacy,billing:billingPage,inpatients};
  return (screens[s.page]||overview)();
 }

 function patientDetail(){
  const p=patient(s.id);if(!p)return empty("Patient missing","Choose an existing patient.");
  const encounters=d.encounters.filter(v=>v.patientId===p.id);
  const openVisit=encounters.find(v=>!v.dischargedAt);
  const inpatient=d.inpatients.find(v=>v.patientId===p.id&&v.status==="Admitted");
  const insurance=p.paymentType==="Cash"?'<p class="muted">Cash patient. No insurance coverage is required.</p>':
   pair("Provider",p.insurance.provider)+pair("Demo member",p.insurance.member)+
   pair("Eligibility",p.insurance.status)+
   (["reception","billing"].includes(s.role)?btn("Check sample insurance","verify",p.id,"outline full"):"")+
   '<p class="muted">No real insurer is queried.</p>';
  return title(p.name,p.id+" · "+p.age+" years · "+p.sex)+
   '<div class="columns">'+panel("Patient profile",pair("ID",p.id)+pair("Phone",p.phone)+
     pair("Payment type",p.paymentType)+pair("Current OPD",openVisit?.id||"None"))+
    panel("Insurance & eligibility",insurance)+'</div>'+
   (inpatient?panel("Admission",pair("Ward",inpatient.ward)+pair("Bed",inpatient.bed)+
    pair("Admitted",inpatient.admittedAt)+'<p class="muted">Read-only inpatient census.</p>'):"")+
   panel("OPD history",encounters.map(encounterRow).join("")||empty("No encounters","An OPD visit may be started for this patient."))+
   (is("reception")&&!openVisit&&!inpatient?btn("＋ Start OPD visit","start-visit",p.id,"primary"):"");
 }


 function encounterDetail(){
  const v=visit(s.id);if(!v)return empty("Encounter missing","Choose another visit.");
  const p=person(v),b=bill(v),tab=s.encTab||"overview";
  let content="";
  if(tab==="overview"){
   const info=panel("Encounter",pair("Reference",v.id)+pair("Patient",p.name)+pair("Date",v.date)+
     pair("Stage",state(v))+pair("Priority",v.triage?.priority||"Pending"));
   const cash=panel("Financial summary",pair("Gross charges",k(b.total))+pair("Insurance",k(b.insurance))+
     pair("Patient share",k(b.patientShare))+pair("Payments",k(b.paid))+pair("Outstanding",k(b.balance)));
   let actions='<p class="muted">All departments use the same encounter record.</p>';
   if(is("nurse")&&!v.triage)actions+=btn("Record triage","triage",v.id,"primary");
   if(is("doctor")&&v.triage&&!v.dischargedAt)actions+=btn("Save consultation","consult",v.id,"outline");
   if(is("billing")&&b.balance>0&&!v.dischargedAt)actions+=btn("Record payment","pay",v.id,"primary");
   if(is("doctor")&&c.canDischarge(d,v))actions+=btn("Complete discharge","discharge",v.id,"primary");
   if(is("doctor")&&v.consultation&&!v.dischargedAt&&!c.canDischarge(d,v))
     actions+='<p class="muted">Discharge requires reported tests, fulfilled prescriptions and a cleared balance.</p>';
   content='<div class="columns">'+info+cash+'</div>'+panel("Encounter actions",actions);
  }else if(tab==="clinical"){
   let vitals='<p class="muted">Triage has not been recorded.</p>';
   if(v.triage)vitals='<div class="details-grid">'+pair("Temperature",v.triage.temperature+" °C")+
     pair("Pulse",v.triage.pulse+" bpm")+pair("Blood pressure",v.triage.systolic+"/"+v.triage.diastolic)+
     pair("SpO₂",v.triage.spo2+"%")+pair("Priority",v.triage.priority)+'</div>';
   if(is("nurse")&&!v.triage)vitals+=btn("Record triage","triage",v.id,"primary");
   let clinical=v.consultation?'<p class="note">'+e(v.consultation.note)+'</p>':
     '<p class="muted">No doctor consultation yet.</p>';
   if(is("doctor")&&v.triage&&!v.dischargedAt)clinical+=btn("Save consultation","consult",v.id,"primary");
   content=panel("Nursing triage",vitals)+panel("Doctor consultation",clinical);
  }else if(tab==="orders"){
   let tests="";
   for(const o of v.orders){
    tests+='<div class="task-row"><div><b>'+e(o.label)+'</b><small>'+e(o.department)+" · "+k(o.amount)+'</small>'+
     (o.result?'<p class="note">'+e(o.result)+'</p>':"")+'</div>'+badge(o.status);
    if(is("diagnostics")&&o.status==="Pending")
      tests+=btn("Report result","report",v.id,"outline compact",'data-order-id="'+e(o.id)+'"');
    tests+='</div>';
   }
   let medicines="";
   for(const rx of v.prescriptions){
    medicines+='<div class="task-row"><div><b>'+e(rx.label)+'</b><small>'+k(rx.amount)+'</small></div>'+badge(rx.status);
    if(is("pharmacy")&&rx.status==="Pending")
      medicines+=btn("Mark dispensed","dispense",v.id,"outline compact",'data-rx-id="'+e(rx.id)+'"');
    medicines+='</div>';
   }
   content=panel("Lab & imaging requests",tests||empty("No orders","No diagnostic requests yet."))+
    panel("Pharmacy prescriptions",medicines||empty("No prescriptions","Nothing prescribed yet."));
   if(is("doctor")&&v.consultation&&!v.dischargedAt)
    content+='<div class="button-row">'+btn("＋ Diagnostic order","order",v.id,"primary")+
      btn("＋ Prescription","prescribe",v.id,"outline")+'</div>';
  }else if(tab==="billing"){
   let charges=b.lines.map(x=>pair(x.label,k(x.amount))).join("");
   charges+='<div class="charge-summary">'+pair("Gross",k(b.total))+pair("Insurance",k(b.insurance))+
     pair("Patient payable",k(b.patientShare))+pair("Received",k(b.paid))+pair("Remaining",k(b.balance))+'</div>';
   content=panel("Encounter charges",charges);
   if(p.paymentType==="Insured"){
    content+=panel("Insurance",pair("Provider",p.insurance.provider)+pair("Eligibility",p.insurance.status)+
     (["reception","billing"].includes(s.role)?btn("Verify coverage","verify",p.id,"outline full"):""));
   }
   let payments=v.payments.map(x=>'<div class="task-row"><div><b>'+k(x.amount)+'</b><small>'+
     e(x.reference)+'</small></div>'+badge(x.method)+'</div>').join("");
   content+=panel("Payment history",payments||empty("No payments","No simulated payments yet."));
   if(is("billing")&&b.balance>0&&!v.dischargedAt)content+=btn("Record sample payment","pay",v.id,"primary");
  }else if(tab==="timeline"){
   let events=v.timeline.slice().reverse().map(x=>'<div class="timeline"><span class="dot"></span><div><b>'+
     e(x.text)+'</b><small>'+e(x.role)+' · '+e(x.date)+'</small></div></div>').join("");
   content=panel("Encounter timeline",events||empty("No events","The history will appear here."));
  }
  const tabs=[["overview","Overview"],["clinical","Clinical"],["orders","Orders"],
    ["billing","Billing"],["timeline","Timeline"]];
  const navigation='<div class="tabs">'+tabs.map(x=>'<button data-enc-tab="'+x[0]+'" class="'+
   (tab===x[0]?"selected":"")+'">'+x[1]+'</button>').join("")+'</div>';
  return '<div class="breadcrumb"><button class="text-link" data-action="navigate" data-id="opd">‹ OPD queue</button></div>'+
   '<div class="enc-heading">'+title(p.name,v.id+" · "+v.date)+
    '<div class="button-row">'+payer(p)+badge(state(v))+buttonOpen("patient",p.id,"Patient profile")+'</div></div>'+
    navigation+content;
 }


 function diagnostics(department){
  const items=d.encounters.flatMap(v=>v.orders.filter(o=>o.department===department).map(o=>({v,o})));
  const waiting=items.filter(x=>x.o.status==="Pending"),reported=items.filter(x=>x.o.status==="Reported");
  const row=({v,o})=>{
   let button="";
   if(is("diagnostics")&&o.status==="Pending")
    button=btn("Record result","report",v.id,"primary compact",'data-order-id="'+e(o.id)+'"');
   return '<div class="task-row"><div><b>'+e(person(v).name)+'</b><small>'+e(v.id)+" · "+e(o.label)+'</small></div>'+
    badge(o.status)+buttonOpen("encounter",v.id)+button+'</div>';
  };
  return title(department==="Lab"?"Laboratory":"Imaging","Existing work orders with fictional sample results.")+
   '<div class="metrics three">'+metric("Pending",waiting.length,"To report")+
    metric("Reported",reported.length,"Completed")+
    metric("Total",items.length,"All requests")+'</div>'+
   panel("Pending orders",waiting.map(row).join("")||empty("Nothing pending","No results waiting."))+
   panel("Reported",reported.map(row).join("")||empty("No results yet","Completed orders will appear here."));
 }


 function pharmacy(){
  const items=d.encounters.flatMap(v=>v.prescriptions.map(rx=>({v,rx})));
  const waiting=items.filter(x=>x.rx.status==="Pending"),done=items.filter(x=>x.rx.status==="Dispensed");
  const row=({v,rx})=>{
   let action="";
   if(is("pharmacy")&&rx.status==="Pending")
    action=btn("Mark dispensed","dispense",v.id,"primary compact",'data-rx-id="'+e(rx.id)+'"');
   return '<div class="task-row"><div><b>'+e(person(v).name)+'</b><small>'+e(v.id)+" · "+e(rx.label)+'</small></div>'+
    badge(rx.status)+buttonOpen("encounter",v.id)+action+'</div>';
  };
  return title("Pharmacy","Illustrative medication requests and sample dispensing.")+
   '<div class="metrics three">'+metric("Pending",waiting.length,"To dispense")+
    metric("Dispensed",done.length,"Completed")+
    metric("All prescriptions",items.length,"Fictional items")+'</div>'+
   panel("To dispense",waiting.map(row).join("")||empty("No pending orders","Pharmacy worklist is clear."))+
   panel("Dispensing history",done.map(row).join("")||empty("No fulfilled orders","Completed items will appear here."));
 }


 function billingPage(){
  const all=d.encounters.filter(v=>!v.dischargedAt),unpaid=all.filter(v=>bill(v).balance>0);
  let rows="";
  for(const v of all){
   const b=bill(v);
   const collect=is("billing")&&b.balance>0?btn("Record payment","pay",v.id,"primary compact"):"";
   rows+='<div class="task-row"><div><b>'+e(person(v).name)+'</b><small>'+e(v.id)+" · "+e(person(v).paymentType)+'</small></div>'+
    '<span class="amount">'+k(b.balance)+'</span>'+badge(b.balance>0?"Outstanding":"Cleared")+
     buttonOpen("encounter",v.id)+collect+'</div>';
  }
  return title("Billing & clearance","Charges, simulated insurer portions and sample collections.")+
   '<div class="metrics three">'+metric("Open encounters",all.length,"In current queue")+
    metric("Receivables",k(unpaid.reduce((n,v)=>n+bill(v).balance,0)),"Sample balances")+
    metric("Cleared",all.length-unpaid.length,"Zero outstanding")+'</div>'+
   panel("OPD invoices",rows)+
   '<p class="muted">Eligible fictional coverage assigns an illustrative 80% to the insurer. No real payment or insurer activity occurs.</p>';
 }


 function inpatients(){
  let rows="";
  for(const admission of d.inpatients){
   const p=patient(admission.patientId);
   rows+='<div class="task-row"><div><b>'+e(p.name)+'</b><small>'+
    e(admission.ward)+" · Bed "+e(admission.bed)+" · "+e(admission.admittedAt)+'</small></div>'+
    payer(p)+badge(admission.status)+buttonOpen("patient",p.id)+'</div>';
  }
  return title("Inpatients","Ward overview only. OPD is the interactive scope.")+
   '<div class="metrics three">'+metric("Admitted",d.inpatients.length,"Current patients")+
    metric("Ward A",d.inpatients.filter(x=>x.ward==="Ward A").length,"Beds occupied")+
    metric("Ward B",d.inpatients.filter(x=>x.ward==="Ward B").length,"Beds occupied")+'</div>'+
   panel("Current admissions",rows)+
   '<p class="muted">Inpatient bed transfers, medication administration, ward rounds and inpatient discharge are out of scope.</p>';
 }


 function dialog(){
  if(!s.modal)return"";
  const {kind,id,orderId}=s.modal;
  const enc=visit(id),p=patient(id)||(enc?person(enc):null);
  const field=(label,name,value,type="text",other="")=>'<label class="form-field">'+e(label)+
   '<input name="'+name+'" type="'+type+'" value="'+e(value)+'" '+other+' required></label>';
  const select=(label,name,items,selected)=>'<label class="form-field">'+e(label)+'<select name="'+name+'">'+
   items.map(x=>'<option value="'+e(x[0])+'" '+(String(x[0])===String(selected)?"selected":"")+'>'+e(x[1])+'</option>').join("")+'</select></label>';
  const notes=(label,name,value)=>'<label class="form-field">'+e(label)+'<textarea name="'+name+'" rows="3" maxlength="350" required>'+e(value)+'</textarea></label>';
  let title="",submit="Save",fields="";
  if(kind==="visit"){
   title="Start OPD visit";submit="Open encounter";
   fields='<p class="form-hint">Patient: <b>'+e(p.name)+'</b>. This starts an encounter for the existing patient. No new patient registration.</p>';
  }else if(kind==="verify"){
   title="Sample insurance verification";submit="Save coverage status";
   fields='<p class="form-hint">'+e(p.insurance.provider)+" · "+e(p.insurance.member)+'</p>'+
    select("Fictional eligibility","status",[["Eligible","Eligible"],["Pending","Pending"],["Not covered","Not covered"]],p.insurance.status)+
    '<p class="form-hint">No real insurer is contacted.</p>';
  }else if(kind==="triage"){
   title="Triage";submit="Save vitals";
   fields='<p class="form-hint">Fictional sample observations only, not medical guidance.</p>'+
    '<div class="form-grid">'+field("Temperature (°C)","temperature","36.8","number",'min="34" max="42" step="0.1"')+
    field("Pulse (bpm)","pulse",78,"number",'min="35" max="200"')+
    field("Systolic pressure","systolic",118,"number",'min="70" max="220"')+
    field("Diastolic pressure","diastolic",76,"number",'min="40" max="140"')+
    field("SpO₂ (%)","spo2",98,"number",'min="80" max="100"')+
    select("Priority","priority",[["Routine","Routine"],["Urgent","Urgent"]],"Routine")+'</div>';
  }else if(kind==="consult"){
   title="Doctor consultation";submit="Save consultation note";
   fields=notes("Fictional note","note",enc.consultation?.note||"Illustrative outpatient consultation note for demonstration.");
  }else if(kind==="order"){
   const available=c.TESTS.filter(x=>!enc.orders.some(o=>o.code===x.id));
   if(!available.length)return"";
   title="Request diagnostics";submit="Create sample order";
   fields=select("Lab or imaging service","code",available.map(x=>[x.id,x.department+" · "+x.name+" · "+k(x.amount)]),available[0].id)+
    '<p class="form-hint">The service charge is added to the encounter.</p>';
  }else if(kind==="report"){
   title="Report diagnostic result";submit="Mark as reported";
   fields=notes("Illustrative result","result","Sample result reported (fictional).")+
    '<p class="form-hint">Do not enter real patient or clinical information.</p>';
  }else if(kind==="prescribe"){
   const available=c.MEDS.filter(x=>!enc.prescriptions.some(p=>p.code===x.id));
   if(!available.length)return"";
   title="Sample prescription";submit="Add sample item";
   fields=select("Fictional item","code",available.map(x=>[x.id,x.name+" · "+k(x.amount)]),available[0].id);
  }else if(kind==="pay"){
   const b=bill(enc);if(!b.balance)return"";
   title="Record sample payment";submit="Record fictional payment";
   fields='<div class="form-hint">'+e(person(enc).name)+" · "+k(b.balance)+' outstanding</div>'+
    field("Amount (KES)","amount",b.balance,"number",'min="1" max="'+b.balance+'" step="1"')+
    select("Simulated payment method","method",[["Cash (simulated)","Cash (simulated)"],["M-Pesa (simulated)","M-Pesa (simulated)"]],"Cash (simulated)")+
    '<p class="form-hint">No M-Pesa STK or real cash movement.</p>';
  }else if(kind==="discharge"){
   title="Complete OPD visit";submit="Confirm fictional discharge";
   fields='<p class="form-hint">The clinical, diagnostics, pharmacy and financial records are cleared. This is an illustrative workflow action, not medical discharge advice.</p>';
  }else return"";
  return '<div class="modal-shell"><button type="button" class="modal-shade" data-action="close-modal" aria-label="Close dialog"></button>'+
   '<section class="modal" role="dialog" aria-modal="true" aria-label="'+e(title)+'"><header><h2>'+e(title)+'</h2>'+
   btn("×","close-modal","","icon")+'</header>'+
   '<form id="hmis-form" data-kind="'+e(kind)+'" data-id="'+e(id||"")+'" data-order-id="'+e(orderId||"")+
   '" data-rx-id="'+e(s.modal.rxId||"")+'"><div class="modal-form">'+fields+
   '<button type="submit" class="btn primary full">'+e(submit)+'</button></div></form></section></div>';
 }

 return {main,dialog,NAV,ROLE_NAMES,btn,e};
};
})();
