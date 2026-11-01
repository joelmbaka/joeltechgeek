const hmisCore=(function(){
"use strict";
const ROLES=[
 {id:"reception",name:"Grace",title:"Reception"},
 {id:"nurse",name:"Beatrice",title:"Nurse"},
 {id:"doctor",name:"Dr. Kamau",title:"Doctor"},
 {id:"diagnostics",name:"James",title:"Diagnostics"},
 {id:"pharmacy",name:"Mercy",title:"Pharmacist"},
 {id:"billing",name:"David",title:"Billing Officer"}
];
const TESTS=[
 {id:"cbc",name:"Complete blood count (sample)",department:"Lab",amount:1200},
 {id:"rapid",name:"Rapid test panel (sample)",department:"Lab",amount:700},
 {id:"xray",name:"Chest X-ray (sample)",department:"Imaging",amount:2000},
 {id:"ultrasound",name:"Abdominal ultrasound (sample)",department:"Imaging",amount:2600}
];
const MEDS=[
 {id:"med-a",name:"Example medication A",amount:450},
 {id:"med-b",name:"Example medication B",amount:650}
];
const CONSULT_FEE=1500, TODAY="2026-11-01";
const n=raw=>Number(raw);
const fmt=v=>String(v??"").trim();
const find=(items,id,label="Record")=>items.find(x=>x.id===id)||(()=>{throw Error(label+" not found.")})();
const validate=(v,label,min=2,max=280)=>{let s=fmt(v);if(s.length<min||s.length>max)throw Error(label+" must be "+min+"–"+max+" characters.");return s};
const amount=(v,label,min,max)=>{let x=n(v);if(fmt(v)===""||!Number.isSafeInteger(x)||x<min||x>max)throw Error(label+" must be a whole number between "+min+" and "+max+".");return x};
const access=(role,required)=>{if(role!==required)throw Error("Only "+required+" may perform this action.");};
const next=(d,prefix)=>prefix+"-"+String(++d.seq).padStart(4,"0");
const active=(v)=>!v.dischargedAt;
const addEvent=(d,v,role,text)=>{
 const event={id:next(d,"EV"),date:TODAY,role,text};
 v.timeline.push(event);return event;
};
const patient=(d,id)=>find(d.patients,id,"Patient");
const visit=(d,id)=>find(d.encounters,id,"Encounter");
function billing(d,v){
 const p=patient(d,v.patientId),lines=[{id:"consult",label:"OPD consultation",amount:CONSULT_FEE}];
 for(const o of v.orders)lines.push({id:o.id,label:o.label,amount:o.amount});
 for(const m of v.prescriptions)lines.push({id:m.id,label:m.label,amount:m.amount});
 const total=lines.reduce((sum,x)=>sum+x.amount,0);
 const insured=p.paymentType==="Insured"&&p.insurance?.status==="Eligible";
 const insurance=insured?Math.round(total*0.8):0;
 const patientShare=total-insurance;
 const paid=v.payments.reduce((sum,x)=>sum+x.amount,0);
 return {lines,total,insurance,patientShare,paid,balance:Math.max(0,patientShare-paid),
  paymentType:p.paymentType,insuranceStatus:p.paymentType==="Insured"?p.insurance?.status:"Not applicable"};
}
function phase(d,v){
 if(v.dischargedAt)return"Completed";
 if(!v.triage)return"Awaiting triage";
 if(!v.consultation)return"Awaiting doctor";
 if(v.orders.some(o=>o.status==="Pending"))return"Diagnostics pending";
 if(v.prescriptions.some(p=>p.status==="Pending"))return"Pharmacy pending";
 if(billing(d,v).balance>0)return"Awaiting billing";
 return"Ready to discharge";
}
function canDischarge(d,v){
 return Boolean(v.triage&&v.consultation&&v.orders.every(o=>o.status==="Reported")&&
 v.prescriptions.every(p=>p.status==="Dispensed")&&billing(d,v).balance===0&&!v.dischargedAt);
}
function seed(){
 const patients=[
  {id:"PAT-1001",name:"Mary Wanjiku",age:31,sex:"Female",phone:"0711000101",paymentType:"Cash",insurance:null},
  {id:"PAT-1002",name:"Peter Otieno",age:45,sex:"Male",phone:"0711000102",paymentType:"Insured",insurance:{provider:"Sample Health Cover",member:"DEMO-102",status:"Eligible"}},
  {id:"PAT-1003",name:"Brian Kamau",age:27,sex:"Male",phone:"0711000103",paymentType:"Cash",insurance:null},
  {id:"PAT-1004",name:"Susan Achieng",age:37,sex:"Female",phone:"0711000104",paymentType:"Insured",insurance:{provider:"Sample Health Cover",member:"DEMO-104",status:"Eligible"}},
  {id:"PAT-1005",name:"David Mwangi",age:52,sex:"Male",phone:"0711000105",paymentType:"Cash",insurance:null},
  {id:"PAT-1006",name:"Faith Nyambura",age:30,sex:"Female",phone:"0711000106",paymentType:"Insured",insurance:{provider:"Sample Health Cover",member:"DEMO-106",status:"Eligible"}},
  {id:"PAT-1007",name:"John Kariuki",age:34,sex:"Male",phone:"0711000107",paymentType:"Cash",insurance:null},
  {id:"PAT-1008",name:"Ruth Chebet",age:62,sex:"Female",phone:"0711000108",paymentType:"Insured",insurance:{provider:"Sample Health Cover",member:"DEMO-108",status:"Pending"}},
  {id:"PAT-1009",name:"Samuel Kiptoo",age:41,sex:"Male",phone:"0711000109",paymentType:"Cash",insurance:null}
 ];
 const triage={temperature:36.8,pulse:78,systolic:118,diastolic:76,spo2:98,priority:"Routine"};
 const consultation={note:"Illustrative clinical documentation for the fictional visit.",at:TODAY};
 const order=(id,code,status)=>{const t=find(TESTS,code,"Test");return{id,code,label:t.name,department:t.department,amount:t.amount,status,
  result:status==="Reported"?"Sample result documented (fictional).":null}};
 const prescription=(id,code,status)=>{const m=find(MEDS,code,"Medicine");return{id,code,label:m.name,amount:m.amount,status}};
 const makeVisit=(id,patientId,stage)=>({
  id,patientId,date:TODAY,triage:stage==="triage"?null:{...triage},
  consultation:["triage","doctor"].includes(stage)?null:{...consultation},
  orders:stage==="lab"?[order(id+"-L","cbc","Pending")]:
   stage==="imaging"?[order(id+"-I","xray","Pending")]:
   stage==="clearance"?[order(id+"-R","rapid","Reported")]:[],
  prescriptions:stage==="pharmacy"?[prescription(id+"-M","med-a","Pending")]:
   stage==="clearance"?[prescription(id+"-M","med-b","Dispensed")]:[],
  payments:stage==="completed"?[{id:"PAY-1007",date:TODAY,amount:1500,method:"Cash (simulated)",reference:"SIM-OPD-1007"}]:[],
  dischargedAt:stage==="completed"?TODAY:null,
  timeline:[{id:"EV-"+id,date:TODAY,role:"Reception",text:"OPD encounter opened"}]
 });
 const encounters=[
  makeVisit("OPD-1001","PAT-1001","triage"),
  makeVisit("OPD-1002","PAT-1002","doctor"),
  makeVisit("OPD-1003","PAT-1003","lab"),
  makeVisit("OPD-1004","PAT-1004","imaging"),
  makeVisit("OPD-1005","PAT-1005","pharmacy"),
  makeVisit("OPD-1006","PAT-1006","clearance"),
  makeVisit("OPD-1007","PAT-1007","completed")
 ];
 const inpatients=[
  {id:"ADM-1008",patientId:"PAT-1008",ward:"Ward A",bed:"04",admittedAt:"2026-10-30",status:"Admitted"},
  {id:"ADM-1009",patientId:"PAT-1009",ward:"Ward B",bed:"02",admittedAt:"2026-10-31",status:"Admitted"}
 ];
 return {version:2,seq:4000,facility:{name:"Harborview Medical Centre",date:TODAY},patients,encounters,inpatients};
}
const valid=d=>Boolean(d?.version===2&&d.facility&&Array.isArray(d.patients)&&
 Array.isArray(d.encounters)&&Array.isArray(d.inpatients)&&Number.isSafeInteger(d.seq));
function startVisit(d,role,patientId){
 access(role,"reception");
 const p=patient(d,patientId);
 if(d.inpatients.some(x=>x.patientId===p.id&&x.status==="Admitted"))throw Error("This patient is already admitted.");
 if(d.encounters.some(x=>x.patientId===p.id&&active(x)))throw Error("This patient already has an open OPD visit.");
 const v={id:next(d,"OPD"),patientId:p.id,date:TODAY,triage:null,consultation:null,orders:[],
  prescriptions:[],payments:[],dischargedAt:null,timeline:[]};
 addEvent(d,v,"Reception","OPD encounter opened");
 d.encounters.unshift(v);return v;
}
function verifyInsurance(d,role,patientId,status){
 if(!["reception","billing"].includes(role))throw Error("Only Reception or Billing may verify insurance.");
 const p=patient(d,patientId);
 if(p.paymentType!=="Insured")throw Error("This is a cash patient.");
 if(!["Eligible","Pending","Not covered"].includes(status))throw Error("Choose an insurance verification result.");
 if(d.encounters.some(v=>v.patientId===p.id&&v.payments.length))throw Error("Cannot change coverage after a payment is recorded.");
 p.insurance.status=status;
 for(const v of d.encounters.filter(x=>x.patientId===p.id&&active(x)))addEvent(d,v,role==="billing"?"Billing":"Reception","Simulated coverage status: "+status);
 return p;
}
function triage(d,role,id,values){
 access(role,"nurse");const v=visit(d,id);
 if(v.dischargedAt||v.triage)throw Error("Triage has already been recorded for this encounter.");
 const priority=fmt(values.priority);
 if(!["Routine","Urgent"].includes(priority))throw Error("Choose a valid priority.");
 const entry={
  temperature:(()=>{
    const x=Number(values.temperature);
    if(!Number.isFinite(x)||x<34||x>42||Math.round(x*10)!==x*10)
      throw Error("Temperature must be between 34 and 42 °C with one decimal.");
    return x;
   })(),
  pulse:amount(values.pulse,"Pulse",35,200),
  systolic:amount(values.systolic,"Systolic pressure",70,220),
  diastolic:amount(values.diastolic,"Diastolic pressure",40,140),
  spo2:amount(values.spo2,"Oxygen saturation",80,100),
  priority
 };
 v.triage=entry;addEvent(d,v,"Nurse","Triage completed · "+priority);
 return v;
}
function consult(d,role,id,note){
 access(role,"doctor");const v=visit(d,id);
 if(!v.triage||v.dischargedAt)throw Error("A triaged, open encounter is required.");
 const text=validate(note,"Consultation note",5,350);
 v.consultation={note:text,at:TODAY};
 addEvent(d,v,"Doctor","Consultation documented");
 return v;
}
function order(d,role,id,code){
 access(role,"doctor");const v=visit(d,id);
 if(!v.triage||!v.consultation||v.dischargedAt)throw Error("Complete an active consultation before ordering tests.");
 const test=find(TESTS,code,"Test");
 if(v.orders.some(x=>x.code===code))throw Error("This test is already ordered.");
 const o={id:next(d,"ORD"),code,label:test.name,department:test.department,amount:test.amount,status:"Pending",result:null};
 v.orders.push(o);addEvent(d,v,"Doctor",test.department+" order: "+o.label);return o;
}
function report(d,role,encounterId,orderId,reportText){
 access(role,"diagnostics");const v=visit(d,encounterId),o=find(v.orders,orderId,"Order");
 if(v.dischargedAt||o.status!=="Pending")throw Error("This order is already completed.");
 const text=validate(reportText,"Sample report",5,240);
 o.status="Reported";o.result=text;
 addEvent(d,v,"Diagnostics",o.department+" result reported · "+o.label);return o;
}
function prescribe(d,role,id,code){
 access(role,"doctor");const v=visit(d,id);
 if(!v.triage||!v.consultation||v.dischargedAt)throw Error("Complete an active consultation before prescribing.");
 const item=find(MEDS,code,"Medication");
 if(v.prescriptions.some(x=>x.code===code))throw Error("This medication is already prescribed.");
 const p={id:next(d,"RX"),code,label:item.name,amount:item.amount,status:"Pending"};
 v.prescriptions.push(p);addEvent(d,v,"Doctor","Sample prescription: "+p.label);return p;
}
function dispense(d,role,encounterId,rxId){
 access(role,"pharmacy");const v=visit(d,encounterId),rx=find(v.prescriptions,rxId,"Prescription");
 if(v.dischargedAt||rx.status!=="Pending")throw Error("This prescription has already been dispensed.");
 rx.status="Dispensed";addEvent(d,v,"Pharmacy",rx.label+" dispensed (fictional)");return rx;
}
function pay(d,role,id,value,method){
 access(role,"billing");const v=visit(d,id);
 if(v.dischargedAt)throw Error("Encounter is already completed.");
 const invoice=billing(d,v),cash=amount(value,"Payment amount",1,500000);
 if(cash>invoice.balance)throw Error("Payment exceeds the patient balance.");
 if(!["Cash (simulated)","M-Pesa (simulated)"].includes(method))throw Error("Select a simulated payment method.");
 const id2=next(d,"PAY");
 const p={id:id2,date:TODAY,amount:cash,method,reference:"SIM-OPD-"+id2.slice(4)};
 v.payments.push(p);addEvent(d,v,"Billing","Sample payment "+p.reference+" recorded");
 return p;
}
function discharge(d,role,id){
 access(role,"doctor");const v=visit(d,id);
 if(!canDischarge(d,v))throw Error("Complete consultation, outstanding orders, dispensing and patient clearance before discharge.");
 v.dischargedAt=TODAY;addEvent(d,v,"Doctor","OPD encounter completed and discharged");
 return v;
}
function stats(d){
 const visits=d.encounters;return {
 patients:d.patients.length,opd:visits.length,active:visits.filter(active).length,
 inpatients:d.inpatients.length,
 triage:visits.filter(v=>phase(d,v)==="Awaiting triage").length,
 doctor:visits.filter(v=>phase(d,v)==="Awaiting doctor").length,
 diagnostics:visits.flatMap(v=>v.orders).filter(o=>o.status==="Pending").length,
 pharmacy:visits.flatMap(v=>v.prescriptions).filter(p=>p.status==="Pending").length,
 billing:visits.filter(v=>!v.dischargedAt&&v.consultation&&billing(d,v).balance>0).length,
 completed:visits.filter(v=>Boolean(v.dischargedAt)).length
 };
}
return {ROLES,TESTS,MEDS,TODAY,seed,valid,patient,visit,billing,phase,canDischarge,stats,
 startVisit,verifyInsurance,triage,consult,order,report,prescribe,dispense,pay,discharge};
})();
