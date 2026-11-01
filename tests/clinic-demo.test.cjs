const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"..","public","demos","healthcare");
const source=Object.fromEntries(["core.js","views.js","app.js","styles.css","demo.html"].map(n=>[n,fs.readFileSync(path.join(base,n),"utf8")]));
const core=()=>new Function(source["core.js"]+"\nreturn hmisCore;")();
const vitals={temperature:"36.8",pulse:"78",systolic:"118",diastolic:"76",spo2:"98",priority:"Routine"};
const visit=(d,id)=>d.encounters.find(v=>v.id===id);
function browser(saved=null){
 const events={},root={innerHTML:"",contains:()=>true};
 const doc={getElementById:id=>id==="app"?root:null,addEventListener:(n,f)=>events[n]=f};
 class FD{constructor(form){this.fields=form.fields}entries(){return Object.entries(this.fields)[Symbol.iterator]()}}
 new Function("document","window","localStorage","FormData",source["core.js"]+"\n"+source["views.js"]+"\n"+source["app.js"])(
  doc,{confirm:()=>true},{getItem:()=>saved,setItem:(k,v)=>{saved=v}},FD);
 const click=d=>events.click({target:{closest:()=>({dataset:d})}});
 return {root,data:()=>saved?JSON.parse(saved):core().seed(),saved:()=>saved,
  nav:nav=>click({nav}),open:(kind,id)=>click({action:"open-"+kind,id}),
  role:value=>events.change({target:{id:"role-select",value}}),
  action:(action,id,extra={})=>click({action,id,...extra}),
  queue:queue=>click({queue}),tab:encTab=>click({encTab}),
  search:value=>events.input({target:{id:"patient-search",value,selectionStart:value.length,selectionEnd:value.length}}),
  submit:(kind,id,fields={},extra={})=>events.submit({preventDefault:()=>{},target:{
   id:"hmis-form",dataset:{kind,id,orderId:extra.orderId||"",rxId:extra.rxId||""},fields}})
 };
}
test("nine existing patients, seven OPD visits, two inpatients and six roles",()=>{
 const c=core(),d=c.seed();a.ok(c.valid(d));a.equal(d.patients.length,9);
 a.equal(d.encounters.length,7);a.equal(d.inpatients.length,2);a.equal(c.ROLES.length,6);
 a.deepEqual(c.ROLES.map(x=>x.id),["reception","nurse","doctor","diagnostics","pharmacy","billing"]);
});
test("seed contains triage, doctor, lab, imaging, pharmacy, billing and completed OPD examples",()=>{
 const c=core(),d=c.seed();
 a.deepEqual(d.encounters.map(v=>c.phase(d,v)),["Awaiting triage","Awaiting doctor",
  "Diagnostics pending","Diagnostics pending","Pharmacy pending","Awaiting billing","Completed"]);
});
test("reception starts an OPD encounter on existing John, never creates another person",()=>{
 const c=core(),d=c.seed(),v=c.startVisit(d,"reception","PAT-1007");
 a.equal(d.patients.length,9);a.equal(d.encounters.length,8);
 a.equal(v.patientId,"PAT-1007");a.equal(c.phase(d,v),"Awaiting triage");
 a.throws(()=>c.startVisit(d,"reception","PAT-1007"),/already has an open/);
});
test("non-reception roles, inpatients and unknown patients cannot start visits",()=>{
 const c=core(),d=c.seed(),snap=JSON.stringify(d);
 a.throws(()=>c.startVisit(d,"doctor","PAT-1007"),/Only reception/);
 a.throws(()=>c.startVisit(d,"reception","PAT-1008"),/already admitted/);
 a.throws(()=>c.startVisit(d,"reception","PAT-NOT-FOUND"),/not found/);
 a.equal(JSON.stringify(d),snap);
});
test("only Reception and Billing may set fictional eligible/pending/not-covered insurance",()=>{
 const c=core(),d=c.seed();
 a.throws(()=>c.verifyInsurance(d,"doctor","PAT-1002","Eligible"),/Only Reception or Billing/);
 a.throws(()=>c.verifyInsurance(d,"reception","PAT-1001","Eligible"),/cash patient/);
 c.verifyInsurance(d,"billing","PAT-1002","Pending");a.equal(c.billing(d,c.visit(d,"OPD-1002")).insurance,0);
 c.verifyInsurance(d,"reception","PAT-1002","Eligible");a.equal(c.billing(d,c.visit(d,"OPD-1002")).insurance,1200);
});
test("vital entry validates ranges and clinician consultation requires triage",()=>{
 const c=core(),d=c.seed(),v=c.visit(d,"OPD-1001"),snap=JSON.stringify(d);
 a.throws(()=>c.consult(d,"doctor",v.id,"Sample note"),/triaged/);
 a.throws(()=>c.triage(d,"nurse",v.id,{...vitals,temperature:"99"}),/Temperature/);
 a.equal(JSON.stringify(d),snap);
 c.triage(d,"nurse",v.id,vitals);a.equal(v.triage.temperature,36.8);
 c.consult(d,"doctor",v.id,"Illustrative note for demo.");a.equal(c.phase(d,v),"Awaiting billing");
});
test("doctor can order Lab and Imaging, diagnostics reports, duplicates are rejected",()=>{
 const c=core(),d=c.seed(),v=c.visit(d,"OPD-1002");
 c.consult(d,"doctor",v.id,"Fictional doctor note.");
 const lab=c.order(d,"doctor",v.id,"cbc"),imaging=c.order(d,"doctor",v.id,"xray");
 a.equal(lab.department,"Lab");a.equal(imaging.department,"Imaging");
 a.throws(()=>c.order(d,"doctor",v.id,"cbc"),/already ordered/);
 a.throws(()=>c.report(d,"doctor",v.id,lab.id,"Sample result"),/Only diagnostics/);
 c.report(d,"diagnostics",v.id,lab.id,"Sample result documented.");
 a.equal(lab.status,"Reported");
 a.equal(c.billing(d,v).total,4700);
});
test("doctor prescribes fictional item; only Pharmacist may mark it dispensed",()=>{
 const c=core(),d=c.seed(),v=c.visit(d,"OPD-1002");
 c.consult(d,"doctor",v.id,"Sample clinical note.");const rx=c.prescribe(d,"doctor",v.id,"med-a");
 a.throws(()=>c.dispense(d,"doctor",v.id,rx.id),/Only pharmacy/);
 c.dispense(d,"pharmacy",v.id,rx.id);a.equal(rx.status,"Dispensed");
 a.throws(()=>c.dispense(d,"pharmacy",v.id,rx.id),/already been dispensed/);
});
test("cash and eligible insurance bills derive amounts from same charges",()=>{
 const c=core(),d=c.seed();
 a.equal(c.billing(d,c.visit(d,"OPD-1001")).patientShare,1500);
 a.equal(c.billing(d,c.visit(d,"OPD-1002")).patientShare,300);
 a.equal(c.billing(d,c.visit(d,"OPD-1002")).insurance,1200);
});
test("Billing records partial and full simulated receipts without overpaying",()=>{
 const c=core(),d=c.seed(),v=c.visit(d,"OPD-1001"),snap=JSON.stringify(d);
 a.throws(()=>c.pay(d,"nurse",v.id,100,"Cash (simulated)"),/Only billing/);
 a.throws(()=>c.pay(d,"billing",v.id,2000,"Cash (simulated)"),/exceeds/);
 a.equal(JSON.stringify(d),snap);
 c.pay(d,"billing",v.id,500,"Cash (simulated)");a.equal(c.billing(d,v).balance,1000);
 c.pay(d,"billing",v.id,1000,"M-Pesa (simulated)");
 a.equal(c.billing(d,v).balance,0);a.equal(v.payments.length,2);
});
test("discharge waits for consultation, diagnostics, pharmacy and billing clearance",()=>{
 const c=core(),d=c.seed(),v=c.visit(d,"OPD-1001");
 a.throws(()=>c.discharge(d,"doctor",v.id),/Complete consultation/);
 c.triage(d,"nurse",v.id,vitals);c.consult(d,"doctor",v.id,"Fictional review.");
 const o=c.order(d,"doctor",v.id,"rapid"),rx=c.prescribe(d,"doctor",v.id,"med-a");
 a.throws(()=>c.discharge(d,"doctor",v.id),/Complete consultation/);
 c.report(d,"diagnostics",v.id,o.id,"Illustrative result.");
 c.dispense(d,"pharmacy",v.id,rx.id);
 a.throws(()=>c.discharge(d,"doctor",v.id),/Complete consultation/);
 c.pay(d,"billing",v.id,c.billing(d,v).balance,"Cash (simulated)");
 a.ok(c.canDischarge(d,v));c.discharge(d,"doctor",v.id);
 a.equal(c.phase(d,v),"Completed");
});
test("six role identities, eight sidebar sections and no Admin or tour UI",()=>{
 const h=browser();
 for(const role of ["Grace","Beatrice","Dr. Kamau","James","Mercy","David"])a.match(h.root.innerHTML,new RegExp(role));
 for(const page of ["overview","patients","opd","lab","imaging","pharmacy","billing","inpatients"])
  a.match(h.root.innerHTML,new RegExp('data-nav="'+page+'"'));
 a.doesNotMatch(h.root.innerHTML,/Admin ·|Step 1|Try the workflow/);
});
test("Patient directory searches existing cash and insured records without registration",()=>{
 const h=browser();h.nav("patients");a.match(h.root.innerHTML,/Mary Wanjiku/);
 h.search("Susan");a.match(h.root.innerHTML,/Susan Achieng/);
 a.doesNotMatch(h.root.innerHTML,/Mary Wanjiku/);
 h.open("patient","PAT-1004");a.match(h.root.innerHTML,/Sample Health Cover/);
 a.doesNotMatch(h.root.innerHTML,/Register patient/);
});
test("Reception starts John OPD visit and sees new encounter, preserving nine patient records",()=>{
 const h=browser();h.open("patient","PAT-1007");
 h.action("start-visit","PAT-1007");a.match(h.root.innerHTML,/Open encounter/);
 h.submit("visit","PAT-1007");
 a.equal(h.data().patients.length,9);a.equal(h.data().encounters.length,8);
 a.match(h.root.innerHTML,/OPD-4001/);
});
test("Nurse triage and Doctor clinical notes share same patient encounter",()=>{
 const h=browser();h.role("nurse");h.open("encounter","OPD-1001");
 h.action("triage","OPD-1001");h.submit("triage","OPD-1001",vitals);
 a.equal(h.data().encounters[0].triage.temperature,36.8);
 h.role("doctor");h.open("encounter","OPD-1001");h.tab("clinical");
 a.match(h.root.innerHTML,/36.8 °C/);
 h.action("consult","OPD-1001");h.submit("consult","OPD-1001",{note:"Fictional assessment documented."});
 a.ok(h.data().encounters[0].consultation);
});
test("doctor lab order is visible to diagnostics; report is visible in doctor record",()=>{
 const h=browser();h.role("doctor");h.open("encounter","OPD-1002");
 h.action("consult","OPD-1002");h.submit("consult","OPD-1002",{note:"Fictional assessment."});
 h.action("order","OPD-1002");h.submit("order","OPD-1002",{code:"cbc"});
 const o=h.data().encounters[1].orders[0];
 h.role("diagnostics");h.nav("lab");a.match(h.root.innerHTML,/Peter Otieno/);
 h.action("report","OPD-1002",{orderId:o.id});
 h.submit("report","OPD-1002",{result:"Sample result reported."},{orderId:o.id});
 h.role("doctor");h.open("encounter","OPD-1002");h.tab("orders");
 a.match(h.root.innerHTML,/Sample result reported/);
});
test("Imaging page and Pharmacy page expose distinct department worklists",()=>{
 const h=browser();h.role("diagnostics");h.nav("imaging");
 a.match(h.root.innerHTML,/Susan Achieng/);h.role("pharmacy");h.nav("pharmacy");
 a.match(h.root.innerHTML,/David Mwangi/);
 const rx=h.data().encounters[4].prescriptions[0];
 h.action("dispense","OPD-1005",{rxId:rx.id});
 a.equal(h.data().encounters[4].prescriptions[0].status,"Dispensed");
});
test("billing officer sees eligible insurance balance and can partially receive money",()=>{
 const h=browser();h.role("billing");h.open("encounter","OPD-1002");h.tab("billing");
 a.match(h.root.innerHTML,/KES 1,200/);a.match(h.root.innerHTML,/KES 300/);
 h.action("pay","OPD-1002");h.submit("pay","OPD-1002",{amount:"100",method:"Cash (simulated)"});
 a.equal(core().billing(h.data(),visit(h.data(),"OPD-1002")).balance,200);
});
test("Doctor can discharge already cleared Faith after Billing receives patient portion",()=>{
 const h=browser();h.role("doctor");h.open("encounter","OPD-1006");
 a.doesNotMatch(h.root.innerHTML,/data-action="discharge"/);
 h.role("billing");h.open("encounter","OPD-1006");
 const due=core().billing(h.data(),visit(h.data(),"OPD-1006")).balance;
 h.action("pay","OPD-1006");h.submit("pay","OPD-1006",{amount:String(due),method:"Cash (simulated)"});
 h.role("doctor");h.open("encounter","OPD-1006");a.match(h.root.innerHTML,/Complete discharge/);
 h.action("discharge","OPD-1006");h.submit("discharge","OPD-1006");
 a.equal(visit(h.data(),"OPD-1006").dischargedAt,"2026-11-01");
});
test("unauthorized role cannot forge doctor orders or billing payments through events",()=>{
 const h=browser(),snapshot=h.saved();
 h.open("encounter","OPD-1002");
 h.action("order","OPD-1002");h.submit("order","OPD-1002",{code:"xray"});
 h.action("pay","OPD-1002");h.submit("pay","OPD-1002",{amount:"200",method:"Cash (simulated)"});
 a.equal(h.saved(),snapshot);
});
test("inpatients are read-only with two ward and bed assignments",()=>{
 const h=browser();h.nav("inpatients");
 a.match(h.root.innerHTML,/Ruth Chebet/);a.match(h.root.innerHTML,/Samuel Kiptoo/);
 a.match(h.root.innerHTML,/Ward A/);a.match(h.root.innerHTML,/Ward B/);
 a.doesNotMatch(h.root.innerHTML,/Admit patient|Assign bed|Transfer ward/);
});
test("shared data persists between sessions and Reset restores original visits",()=>{
 const h=browser();h.role("billing");h.action("pay","OPD-1001");
 h.submit("pay","OPD-1001",{amount:"500",method:"Cash (simulated)"});
 const restored=browser(h.saved());
 a.equal(core().billing(restored.data(),visit(restored.data(),"OPD-1001")).paid,500);
 restored.action("reset");a.equal(restored.data().encounters[0].payments.length,0);
});
test("HMIS UI uses JoelTechGeek branding and responsive desktop/tablet/phone breakpoints",()=>{
 for(const hex of ["#059669","#047857","#0ea5e9","#f59e0b","#fef3c7"])
  a.match(source["styles.css"],new RegExp(hex));
 for(const bp of ["1100px","760px","520px","375px"])
  a.ok(source["styles.css"].includes("max-width:"+bp));
 a.match(source["styles.css"],/\.sidebar\{position:sticky/);
 a.match(source["styles.css"],/\.sidebar\.expanded/);
 a.match(source["demo.html"],/name="viewport"/);
 a.doesNotMatch(source["demo.html"],/minimal-engine|\/healthcare\/demo\.js|mobile\.css/);
 for(const s of [source["app.js"],source["views.js"],source["demo.html"]])
  a.doesNotMatch(s,/CliviQue|guided tour|Register sample patient/);
});
