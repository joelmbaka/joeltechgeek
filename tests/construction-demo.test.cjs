const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dir=path.join(__dirname,"..","public","demos","construction");
const source={
 core:fs.readFileSync(path.join(dir,"core.js"),"utf8"),
 app:fs.readFileSync(path.join(dir,"app.js"),"utf8"),
 css:fs.readFileSync(path.join(dir,"styles.css"),"utf8"),
 html:fs.readFileSync(path.join(dir,"demo.html"),"utf8")
};
const core=()=>new Function(source.core+"\nreturn constructionCore;")();
const find=(arr,id)=>arr.find(x=>x.id===id);
function harness(existing){
 let stored=existing||JSON.stringify(core().seed());
 const root={innerHTML:"",contains:()=>true},events={};
 const document={getElementById:id=>id==="app"?root:null,addEventListener:(name,cb)=>{events[name]=cb}};
 const window={confirm:()=>true};
 const localStorage={getItem:()=>stored,setItem:(k,s)=>{stored=s}};
 class MockFormData{constructor(form){this.fields=form.values}entries(){return Object.entries(this.fields)[Symbol.iterator]()}}
 new Function("document","window","localStorage","FormData",source.core+"\n"+source.app)(document,window,localStorage,MockFormData);
 const click=dataset=>events.click({target:{closest:()=>({dataset})}});
 return {root,role:value=>events.change({target:{id:"role-select",value}}),
  click:(action,id)=>click({action,id}),open:(open,id)=>click({open,id}),
  screen:screen=>click({screen}),tab:tab=>click({tab}),
  queue:value=>click({stockQueue:value}),acct:value=>click({accountQueue:value}),
  submit:(form,id,values)=>events.submit({preventDefault:()=>{},target:{id:"construction-form",dataset:{form,id:id||""},values}}),
  data:()=>JSON.parse(stored),snapshot:()=>stored};
}
const workInput={
 name:"New stairwell blockwork",category:"Masonry",mode:"Labour",description:"Lay stairwell blocks",
 planned:"80",unit:"m²"
};
test("seed has connected, useful work, review, stock, purchasing, finance and reporting states",()=>{
 const c=core(),d=c.seed(),m=c.metrics(d);
 assert.ok(c.valid(d));
 assert.equal(d.tasks.length,3);
 assert.equal(d.materials.length,4);
 assert.equal(d.requests.length,3);
 assert.equal(d.purchases.length,1);
 assert.equal(d.invoices.length,1);
 assert.equal(d.progress[0].status,"Submitted");
 assert.equal(d.reports[0].status,"Submitted");
 assert.equal(c.shortage(d,"MTR-101"),10);
 assert.equal(c.shortage(d,"MTR-103"),0);
 assert.equal(m.payable,2000);
 assert.equal(m.pendingReview,4);
});
test("permissions protect direct mutations without modifying data",()=>{
 const c=core(),d=c.seed(),before=JSON.stringify(d);
 assert.throws(()=>c.createWork(d,"manager",workInput),/Supervisor/);
 assert.throws(()=>c.requestMaterial(d,"supervisor","WORK-101","MAT-101",4,"Needed"),/Stockkeeper/);
 assert.throws(()=>c.createPO(d,"manager","MTR-102","Supplier",2,100),/Accountant/);
 assert.throws(()=>c.reviewWork(d,"accountant","WORK-102","Approve"),/Project Manager/);
 assert.throws(()=>c.recordPayment(d,"manager","INV-101",10),/Accountant/);
 assert.equal(JSON.stringify(d),before);
});
test("Supervisor submits work and Manager approval starts it",()=>{
 const c=core(),d=c.seed();
 const w=c.createWork(d,"supervisor",workInput);
 assert.equal(w.status,"Awaiting approval");assert.equal(w.progress,0);
 assert.throws(()=>c.submitProgress(d,"supervisor",w.id,30,"Started"),/in progress/);
 c.reviewWork(d,"manager",w.id,"Approve");
 assert.equal(w.status,"In progress");
 assert.throws(()=>c.reviewWork(d,"manager",w.id,"Approve"),/Only submitted/);
});
test("returned work is resubmitted by Supervisor and then approved",()=>{
 const c=core(),d=c.seed();
 c.reviewWork(d,"manager","WORK-102","Return");
 assert.equal(find(d.tasks,"WORK-102").status,"Needs correction");
 assert.throws(()=>c.resubmitWork(d,"manager","WORK-102"),/Supervisor/);
 c.resubmitWork(d,"supervisor","WORK-102");
 c.reviewWork(d,"manager","WORK-102","Approve");
 assert.equal(find(d.tasks,"WORK-102").status,"In progress");
});
test("progress is submitted for review and does not change approved progress immediately",()=>{
 const c=core(),d=c.seed();
 const w=find(d.tasks,"WORK-103"),start=w.progress;
 const p=c.submitProgress(d,"supervisor",w.id,45,"Conduits installed");
 assert.equal(p.status,"Submitted");assert.equal(w.progress,start);
 assert.match(p.evidence,/Sample site photo/);
 assert.throws(()=>c.submitProgress(d,"supervisor",w.id,50,"Second"),/Review existing/);
 c.reviewProgress(d,"manager",p.id,"Approve");
 assert.equal(w.progress,45);assert.equal(p.status,"Approved");
});
test("returned progress does not change approved completion",()=>{
 const c=core(),d=c.seed();
 c.reviewProgress(d,"manager","PRG-101","Return");
 assert.equal(find(d.tasks,"WORK-101").progress,40);
 assert.equal(find(d.progress,"PRG-101").status,"Needs correction");
 assert.throws(()=>c.reviewProgress(d,"manager","PRG-101","Approve"),/Only submitted/);
 const p=c.submitProgress(d,"supervisor","WORK-101",58,"Corrected site measurement");
 c.reviewProgress(d,"manager",p.id,"Approve");assert.equal(find(d.tasks,"WORK-101").progress,58);
});
test("100 percent approved progress completes the work item",()=>{
 const c=core(),d=c.seed();
 const p=c.submitProgress(d,"supervisor","WORK-103",100,"All installation completed");
 c.reviewProgress(d,"manager",p.id,"Approve");
 assert.equal(find(d.tasks,"WORK-103").status,"Completed");
});
test("only Stockkeeper creates material requests against approved work",()=>{
 const c=core(),d=c.seed();
 assert.throws(()=>c.requestMaterial(d,"stockkeeper","WORK-102","MAT-101",5,"Wall cement"),/approved work/);
 const r=c.requestMaterial(d,"stockkeeper","WORK-101","MAT-101",5,"Cement for slab");
 assert.equal(r.status,"Submitted");
 assert.throws(()=>c.issueMaterial(d,"stockkeeper",r.id,2),/Only approved/);
 c.reviewRequest(d,"manager",r.id,"Approve");
 assert.equal(r.status,"Approved");
});
test("material requests can be returned, corrected and resubmitted",()=>{
 const c=core(),d=c.seed();
 c.reviewRequest(d,"manager","MTR-101","Return");
 assert.equal(find(d.requests,"MTR-101").status,"Needs correction");
 assert.throws(()=>c.issueMaterial(d,"stockkeeper","MTR-101",1),/Only approved/);
 c.resubmitRequest(d,"stockkeeper","MTR-101");
 c.reviewRequest(d,"manager","MTR-101","Approve");
 assert.equal(find(d.requests,"MTR-101").status,"Approved");
});
test("Stockkeeper issues partial approved quantities; rejected and excess issues fail atomically",()=>{
 const c=core(),d=c.seed(),r=find(d.requests,"MTR-102"),start=find(d.materials,"MAT-102").stock;
 c.issueMaterial(d,"stockkeeper",r.id,3);
 assert.equal(r.status,"Partially issued");assert.equal(r.issuedQty,3);
 assert.equal(find(d.materials,"MAT-102").stock,start-3);
 const snap=JSON.stringify(d);
 assert.throws(()=>c.issueMaterial(d,"stockkeeper",r.id,6),/Only 5/);
 assert.equal(JSON.stringify(d),snap);
 c.issueMaterial(d,"stockkeeper",r.id,5);
 assert.equal(r.status,"Issued");
 assert.throws(()=>c.issueMaterial(d,"stockkeeper",r.id,1),/Only approved/);
});
test("issue is blocked by physical stock; return increases stock with history",()=>{
 const c=core(),d=c.seed();
 c.reviewRequest(d,"manager","MTR-101","Approve");
 const before=JSON.stringify(d);
 assert.throws(()=>c.issueMaterial(d,"stockkeeper","MTR-101",7),/Insufficient/);
 assert.equal(JSON.stringify(d),before);
 c.returnStock(d,"stockkeeper","MAT-101",2,"Unused cement returned");
 assert.equal(find(d.materials,"MAT-101").stock,8);
 assert.equal(d.movements[0].kind,"Return");
});
test("Accountant creates PO only for an approved uncovered shortage",()=>{
 const c=core(),d=c.seed();const original=JSON.stringify(d);
 assert.throws(()=>c.createPO(d,"accountant","MTR-101","Supplier",1,100),/approved/);
 assert.equal(JSON.stringify(d),original);
 c.reviewRequest(d,"manager","MTR-101","Approve");
 const p=c.createPO(d,"accountant","MTR-101","Aggregate Supply Ltd",10,850);
 assert.equal(p.status,"Submitted");
 assert.equal(c.shortage(d,"MTR-101"),0);
 assert.throws(()=>c.createPO(d,"accountant","MTR-101","Another Supplier",1,850),/Only 0/);
});
test("PO manager approval and Accountant sending are separate role-bound actions",()=>{
 const c=core(),d=c.seed();
 c.reviewRequest(d,"manager","MTR-101","Approve");
 const p=c.createPO(d,"accountant","MTR-101","Aggregate Supply Ltd",10,850);
 assert.throws(()=>c.sendPO(d,"accountant",p.id),/Only approved/);
 assert.throws(()=>c.reviewPO(d,"accountant",p.id,"Approve"),/Project Manager/);
 c.reviewPO(d,"manager",p.id,"Approve");
 const i=c.sendPO(d,"accountant",p.id);
 assert.equal(p.status,"Issued");assert.equal(i.total,8500);assert.equal(i.status,"Unpaid");
 assert.equal(p.invoiceId,i.id);
 assert.throws(()=>c.sendPO(d,"accountant",p.id),/Only approved/);
});
test("returned PO does not create an invoice and cannot be received",()=>{
 const c=core(),d=c.seed();c.reviewRequest(d,"manager","MTR-101","Approve");
 const p=c.createPO(d,"accountant","MTR-101","Supplier Ltd",10,850);
 c.reviewPO(d,"manager",p.id,"Return");
 assert.equal(p.status,"Rejected");assert.equal(p.invoiceId,null);
 assert.throws(()=>c.receivePO(d,"stockkeeper",p.id,2),/Only issued/);
});
test("Stockkeeper receives a sent PO in partial batches and never beyond remainder",()=>{
 const c=core(),d=c.seed(),p=find(d.purchases,"PO-101"),initial=find(d.materials,"MAT-104").stock;
 assert.throws(()=>c.receivePO(d,"accountant",p.id,1),/Stockkeeper/);
 const before=JSON.stringify(d);
 assert.throws(()=>c.receivePO(d,"stockkeeper",p.id,7),/Only 6/);
 assert.equal(JSON.stringify(d),before);
 c.receivePO(d,"stockkeeper",p.id,3);
 assert.equal(p.status,"Partially received");assert.equal(find(d.materials,"MAT-104").stock,initial+3);
 c.receivePO(d,"stockkeeper",p.id,3);
 assert.equal(p.status,"Received");assert.equal(p.receivedQty,10);
 assert.throws(()=>c.receivePO(d,"stockkeeper",p.id,1),/Only issued/);
});
test("receipts affect physical stock, not invoice amounts or recorded payments",()=>{
 const c=core(),d=c.seed(),i=find(d.invoices,"INV-101");
 const a=i.total,b=i.paid;
 c.receivePO(d,"stockkeeper","PO-101",6);
 assert.equal(i.total,a);assert.equal(i.paid,b);
 assert.equal(c.metrics(d).payable,a-b);
});
test("Accountant records partial and final payments without exceeding outstanding",()=>{
 const c=core(),d=c.seed(),i=find(d.invoices,"INV-101");
 c.recordPayment(d,"accountant",i.id,500);
 assert.equal(i.status,"Partially paid");assert.equal(i.paid,1300);
 const prior=JSON.stringify(d);
 assert.throws(()=>c.recordPayment(d,"accountant",i.id,1600),/exceeds outstanding/);
 assert.equal(JSON.stringify(d),prior);
 c.recordPayment(d,"accountant",i.id,1500);
 assert.equal(i.status,"Paid");assert.equal(i.paid,i.total);
 assert.throws(()=>c.recordPayment(d,"accountant",i.id,1),/exceeds outstanding/);
});
test("Supervisor site report is manager-reviewed and visible as approved",()=>{
 const c=core(),d=c.seed();
 const r=c.submitReport(d,"supervisor","Daily progress","Concrete works and deliveries");
 assert.equal(r.status,"Submitted");
 assert.throws(()=>c.reviewReport(d,"accountant",r.id,"Approve"),/Project Manager/);
 c.reviewReport(d,"manager",r.id,"Approve");assert.equal(r.status,"Approved");
});
test("roles display Milliol-aligned mobile tabs with no forced step-by-step guide",()=>{
 const h=harness();
 for(const t of ["Home","Review","Finance"])assert.match(h.root.innerHTML,new RegExp(t));
 assert.doesNotMatch(h.root.innerHTML,/guided step|step-by-step|Try the workflow/i);
 h.role("supervisor");assert.match(h.root.innerHTML,/data-tab="work"/);assert.match(h.root.innerHTML,/data-tab="reports"/);
 assert.doesNotMatch(h.root.innerHTML,/data-tab="finance"/);
 h.role("stockkeeper");for(const t of ["To do","Stock","History"])assert.match(h.root.innerHTML,new RegExp(t));
 h.role("accountant");for(const t of ["To do","Invoices","Payments"])assert.match(h.root.innerHTML,new RegExp(t));
});
test("Manager drawer has Milliol project areas and stays inside phone",()=>{
 const h=harness();h.click("drawer");
 for(const x of ["work","materials","stock","reports","activity"])assert.match(h.root.innerHTML,new RegExp('data-screen="'+x+'"'));
 assert.match(h.root.innerHTML,/<div class="gesture"><span><\/span><\/div><div class="drawer-wrap">/);
 h.screen("materials");assert.match(h.root.innerHTML,/Material requests/);
 h.click("back");assert.match(h.root.innerHTML,/Project overview/);
});
test("Supervisor cannot access Manager, Stockkeeper or Accountant authoring actions",()=>{
 const h=harness();h.role("supervisor");
 assert.match(h.root.innerHTML,/New Work/);
 assert.doesNotMatch(h.root.innerHTML,/data-action="new-request"|data-action="new-payment"|data-action="approve-work"/);
 h.open("work","WORK-101");assert.doesNotMatch(h.root.innerHTML,/data-action="new-progress"/);
 h.open("work","WORK-103");assert.match(h.root.innerHTML,/Submit progress/);
 h.open("work","WORK-102");assert.doesNotMatch(h.root.innerHTML,/Approve &amp; start/);
});
test("Supervisor creates Work, Manager approves, Supervisor submits, Manager approves progress",()=>{
 const h=harness();h.role("supervisor");h.click("new-work");
 assert.match(h.root.innerHTML,/New work item/);
 h.submit("work","",workInput);
 const w=h.data().tasks[0];assert.equal(w.status,"Awaiting approval");
 h.role("manager");h.tab("review");h.open("work",w.id);h.click("approve-work",w.id);
 assert.equal(find(h.data().tasks,w.id).status,"In progress");
 h.role("supervisor");h.open("work",w.id);h.click("new-progress",w.id);
 h.submit("progress",w.id,{percent:"35",note:"Part of the wall completed"});
 const p=h.data().progress[0];assert.equal(p.status,"Submitted");assert.equal(find(h.data().tasks,w.id).progress,0);
 h.role("manager");h.tab("review");h.open("progress",p.id);
 assert.match(h.root.innerHTML,/Site photo \(sample\)/);
 h.click("approve-progress",p.id);
 assert.equal(find(h.data().tasks,w.id).progress,35);
});
test("Stockkeeper material request reaches Manager approval and Accountant PO queue",()=>{
 const h=harness();h.role("stockkeeper");h.click("new-request");
 h.submit("request","",{taskId:"WORK-101",materialId:"MAT-103",qty:"22",purpose:"Sand for finishing"});
 const r=h.data().requests[0];assert.equal(r.status,"Submitted");
 h.role("manager");h.tab("review");h.open("request",r.id);h.click("approve-request",r.id);
 h.role("accountant");h.acct("create");h.open("request",r.id);
 assert.match(h.root.innerHTML,/Create purchase order/);
 h.click("new-po",r.id);h.submit("po",r.id,{supplier:"Mock Site Supplier",qty:"12",unitPrice:"2600"});
 const p=h.data().purchases[0];assert.equal(p.status,"Submitted");
 h.role("manager");h.tab("review");h.open("po",p.id);h.click("approve-po",p.id);
 h.role("accountant");h.acct("send");h.open("po",p.id);h.click("send-po",p.id);
 assert.equal(find(h.data().purchases,p.id).status,"Issued");
 assert.ok(find(h.data().invoices,find(h.data().purchases,p.id).invoiceId));
});
test("Stockkeeper receives issued deliveries; Accountant records partial invoice payments",()=>{
 const h=harness(),before=find(h.data().materials,"MAT-104").stock;
 h.role("stockkeeper");h.queue("deliveries");h.open("po","PO-101");h.click("new-receive","PO-101");
 h.submit("receive","PO-101",{qty:"3"});
 assert.equal(find(h.data().materials,"MAT-104").stock,before+3);
 assert.equal(find(h.data().purchases,"PO-101").status,"Partially received");
 h.role("accountant");h.tab("invoices");h.open("invoice","INV-101");h.click("new-payment","INV-101");
 h.submit("payment","INV-101",{amount:"1000"});
 assert.equal(find(h.data().invoices,"INV-101").paid,1800);
 assert.equal(find(h.data().invoices,"INV-101").status,"Partially paid");
});
test("Supervisor reports can be reviewed while staying in freely navigable screens",()=>{
 const h=harness();h.role("supervisor");h.tab("reports");h.click("new-report");
 h.submit("report","",{title:"Concrete pour report",detail:"Completed casting in section A."});
 const report=h.data().reports[0];assert.equal(report.status,"Submitted");
 h.role("manager");h.tab("review");h.open("report",report.id);h.click("approve-report",report.id);
 assert.equal(find(h.data().reports,report.id).status,"Approved");
 h.click("back");h.click("drawer");h.screen("reports");
 assert.match(h.root.innerHTML,/Concrete pour report/);
});
test("Stockkeeper sees both expected deliveries and stock movement history",()=>{
 const h=harness();h.role("stockkeeper");
 h.queue("deliveries");assert.match(h.root.innerHTML,/PO-101/);
 h.tab("stock");assert.match(h.root.innerHTML,/Cement 50 kg/);
 h.tab("history");assert.match(h.root.innerHTML,/MOV-101/);
});
test("Accountant can open purchases and Work drawer destinations",()=>{
 const h=harness();h.role("accountant");h.click("drawer");
 assert.match(h.root.innerHTML,/data-screen="purchases"/);
 assert.match(h.root.innerHTML,/data-screen="work"/);
 h.screen("purchases");assert.match(h.root.innerHTML,/PO-101/);
});
test("browser persistence restores the same fictional records",()=>{
 const h=harness();h.role("supervisor");h.click("new-report");
 h.submit("report","",{title:"Evening report",detail:"Roof activity recorded"});
 const reloaded=harness(h.snapshot());
 assert.equal(reloaded.data().reports.length,3);
 assert.equal(reloaded.data().reports[0].title,"Evening report");
});
test("reset returns the project to seeded state without affecting other demos",()=>{
 const h=harness();h.role("supervisor");h.click("new-report");h.submit("report","",{title:"Test report",detail:"Some site detail"});
 assert.equal(h.data().reports.length,3);
 h.click("reset");assert.equal(h.data().reports.length,2);
 assert.equal(h.data().requests.length,3);
});
test("HTML and CSS use isolated, centered mobile construction demo assets",()=>{
 assert.match(source.html,/\/demos\/construction\/core\.js/);
 assert.match(source.html,/\/demos\/construction\/app\.js/);
 assert.match(source.html,/noindex,nofollow/);
 assert.match(source.css,/\.phone\{/);
 assert.match(source.css,/\.drawer-wrap\{position:absolute/);
 assert.match(source.css,/\.modal-overlay\{position:fixed/);
 assert.match(source.css,/@media\(max-width:540px\)/);
});

test("Supervisor does not see Submit progress while an earlier submission awaits review",()=>{
 const h=harness();h.role("supervisor");h.open("work","WORK-101");
 assert.match(h.root.innerHTML,/55% completion/);
 assert.match(h.root.innerHTML,/Submitted/);
 assert.doesNotMatch(h.root.innerHTML,/data-action="new-progress"/);
 h.open("work","WORK-103");
 assert.match(h.root.innerHTML,/data-action="new-progress"/);
});
test("Supervisor and Stockkeeper have no inactive drawer control",()=>{
 const h=harness();h.role("supervisor");
 assert.doesNotMatch(h.root.innerHTML,/data-action="drawer"/);
 h.role("stockkeeper");assert.doesNotMatch(h.root.innerHTML,/data-action="drawer"/);
 h.role("accountant");assert.match(h.root.innerHTML,/data-action="drawer"/);
});
