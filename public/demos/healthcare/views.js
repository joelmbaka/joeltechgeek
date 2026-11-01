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
 const btn=(label,action,id="",variant="")=>'<button type="button" class="btn '+variant+'" data-action="'+action+'" '+(id?'data-id="'+e(id)+'"':"")+'>'+label+'</button>';
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
 function patientDetail(){return empty("Patient","Select a record.");}
 function encounterDetail(){return empty("Encounter","Select a record.");}
 function diagnostics(){return empty("Diagnostics","Nothing to show.");}
 function pharmacy(){return empty("Pharmacy","Nothing to show.");}
 function billingPage(){return empty("Billing","Nothing to show.");}
 function inpatients(){return empty("Inpatients","Nothing to show.");}
 function dialog(){return"";}
 return {main,dialog,NAV,ROLE_NAMES,btn,e};
};
})();
