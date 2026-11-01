const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..','public','demos','field-services');
const domain=fs.readFileSync(path.join(base,'core.js'),'utf8');
const app=fs.readFileSync(path.join(base,'app.js'),'utf8');
let seq=0;
const cryptoMock={randomUUID:()=>('test'+(++seq).toString(36)).padEnd(24,'0')};
const core=()=>new Function('crypto',domain+'\nreturn fieldCore;')(cryptoMock);
const asset=(d,id)=>d.assets.find(a=>a.id===id);
const job=(d,id)=>d.tickets.find(j=>j.id===id);
const part=(d,id)=>d.parts.find(p=>p.id===id);
const validChecks=(c,bad=false)=>c.CHECKS.map((item,index)=>({id:item.id,result:bad&&index===2?'Attention':'Pass'}));
const makeRequest=(c,d)=>c.createTicket(d,{
  customerId:'C-101',assetId:'A-101',title:'Filter maintenance',description:'Rooftop unit filters are blocked.',priority:'Standard'
});
function assigned(c,d){
  const j=makeRequest(c,d);
  c.assignTicket(d,j.id,'TECH-101','2026-11-05T09:00');
  c.startJob(d,j.id,'TECH-101');
  return j;
}
function reported(c,d,{bad=false}={}){
  const j=assigned(c,d);
  c.submitReport(d,j.id,'TECH-101',{
    hours:2,notes:'Filter replaced and unit checked carefully.',checks:validChecks(c,bad)
  });
  return j;
}
function demo(saved=null){
  const events={},root={innerHTML:'',contains:()=>true};
  let stored=saved,printed=false;
  const doc={
    getElementById:()=>root,
    addEventListener:(name,cb)=>{events[name]=cb}
  };
  const win={confirm:()=>true,print:()=>{printed=true}};
  const storage={getItem:()=>stored,setItem:(key,v)=>{stored=v}};
  class MockFormData{
    constructor(form){this.fields=form.fields}
    entries(){return Object.entries(this.fields)[Symbol.iterator]()}
  }
  new Function('document','window','localStorage','crypto','FormData',domain+'\n'+app)(
    doc,win,storage,cryptoMock,MockFormData
  );
  return {
    root,role:(id)=>events.change({target:{id:'role-select',value:id}}),
    nav:(id)=>events.click({target:{closest:()=>({dataset:{nav:id}})}}),
    click:(act,id,extra={})=>events.click({target:{closest:()=>({dataset:{act,id,...extra}})}}),
    submit:(type,id,fields)=>events.submit({preventDefault:()=>{},target:{dataset:{form:type,id},fields}}),
    data:()=>JSON.parse(stored),
    snapshot:()=>stored,
    printed:()=>printed
  };
}
const reportFields=(bad=false)=>({
  hours:'2',notes:'Replaced filter and inspected equipment.',
  'check-isolation':'Pass',
  'check-inspection':'Pass',
  'check-repair':bad?'Attention':'Pass',
  'check-testing':'Pass'
});

test('fictional seed includes customers, assets, jobs, parts and an assigned visit',()=>{
  const c=core(),d=c.seed(),m=c.metrics(d);
  assert.equal(d.customers.length,3);
  assert.equal(d.assets.length,3);
  assert.equal(d.tickets.length,2);
  assert.equal(m.unassigned,1);
  assert.equal(m.billed,0);
  assert.equal(part(d,'PART-101').stock,8);
});

test('ticket creation validates customer-asset ownership and required fields',()=>{
  const c=core(),d=c.seed(),before=JSON.stringify(d);
  assert.throws(()=>c.createTicket(d,{
    customerId:'C-102',assetId:'A-101',title:'HVAC repair needed',
    description:'Example technician issue',priority:'Standard'
  }),/belonging to the selected customer/);
  assert.throws(()=>c.createTicket(d,{
    customerId:'C-101',assetId:'A-101',title:'Fix',description:'Too short',
    priority:'Standard'
  }),/Request title/);
  assert.equal(JSON.stringify(d),before);
  const j=makeRequest(c,d);
  assert.equal(j.status,'New');
  assert.equal(j.assetId,'A-101');
});

test('dispatch validates assignment and prevents duplicate scheduling',()=>{
  const c=core(),d=c.seed(),j=makeRequest(c,d),before=JSON.stringify(d);
  assert.throws(()=>c.assignTicket(d,j.id,'NOT-TECH','2026-11-03T09:00'),/valid technician/);
  assert.throws(()=>c.assignTicket(d,j.id,'TECH-101',''),/scheduled date/);
  assert.equal(JSON.stringify(d),before);
  c.assignTicket(d,j.id,'TECH-101','2026-11-03T09:00');
  assert.equal(j.status,'Assigned');
  assert.ok(j.scheduledAt);
  assert.throws(()=>c.assignTicket(d,j.id,'TECH-101','2026-11-05T10:00'),/Only new/);
  assert.throws(()=>c.startJob(d,j.id,'NOT-TECH'),/not assigned/);
  c.startJob(d,j.id,'TECH-101');
  assert.equal(j.status,'In progress');
  assert.throws(()=>c.startJob(d,j.id,'TECH-101'),/Only assigned/);
});

test('issuing spare parts checks job state, technician assignment and stock',()=>{
  const c=core(),d=c.seed(),j=makeRequest(c,d);
  assert.throws(()=>c.usePart(d,j.id,'TECH-101','PART-101',1),/Start your assigned job/);
  c.assignTicket(d,j.id,'TECH-101','2026-11-05T09:00');c.startJob(d,j.id,'TECH-101');
  const before=JSON.stringify(d);
  assert.throws(()=>c.usePart(d,j.id,'TECH-101','PART-101',9),/Not enough/);
  assert.throws(()=>c.usePart(d,j.id,'TECH-101','PART-101',0),/whole number/);
  assert.throws(()=>c.usePart(d,j.id,'NO-ONE','PART-101',1),/assigned job/);
  assert.equal(JSON.stringify(d),before);
  const used=c.usePart(d,j.id,'TECH-101','PART-101',2);
  assert.equal(part(d,'PART-101').stock,6);
  assert.equal(j.partsUsed.length,1);
  assert.equal(used.unitPrice,1900);
  assert.equal(d.movements.length,1);
});

test('technician checklist cannot omit items, duplicate items or bypass report state',()=>{
  const c=core(),d=c.seed(),j=assigned(c,d),before=JSON.stringify(d);
  assert.throws(()=>c.submitReport(d,j.id,'TECH-101',{hours:2,notes:'Worked on the unit',checks:[]}),/Complete every/);
  assert.throws(()=>c.submitReport(d,j.id,'TECH-101',{hours:2,notes:'Worked on the unit',checks:[
    {id:'isolation',result:'Pass'},{id:'isolation',result:'Pass'},
    {id:'repair',result:'Pass'},{id:'testing',result:'Pass'}]}),/duplicate/);
  assert.throws(()=>c.submitReport(d,j.id,'TECH-101',{hours:0,notes:'Worked on the unit',checks:validChecks(c)}),/at least 0.25/);
  assert.equal(JSON.stringify(d),before);
  c.submitReport(d,j.id,'TECH-101',{hours:2,notes:'Completed a sample maintenance visit.',checks:validChecks(c)});
  assert.equal(j.status,'Awaiting review');
  assert.throws(()=>c.submitReport(d,j.id,'TECH-101',{hours:2,notes:'Another duplicate submission',checks:validChecks(c)}),/Only an in-progress/);
});

test('attention requires manager return, rework and passing resubmission',()=>{
  const c=core(),d=c.seed(),j=reported(c,d,{bad:true});
  const before=JSON.stringify(d);
  assert.throws(()=>c.reviewJob(d,j.id,'Approve'),/must be resolved/);
  assert.throws(()=>c.reviewJob(d,j.id,'Return','short'),/Return reason/);
  assert.equal(JSON.stringify(d),before);
  c.reviewJob(d,j.id,'Return','Repeat the repair check and verify equipment.');
  assert.equal(j.status,'Returned');
  assert.throws(()=>c.createInvoice(d,j.id),/Only approved/);
  c.startJob(d,j.id,'TECH-101');
  c.submitReport(d,j.id,'TECH-101',{hours:1.5,notes:'Completed rework and retested everything.',checks:validChecks(c)});
  assert.equal(j.reports.length,2);
  c.reviewJob(d,j.id,'Approve');
  assert.equal(j.status,'Approved');
});

test('invoice uses labour and price snapshots without double-counting consumed parts',()=>{
  const c=core(),d=c.seed(),j=assigned(c,d);
  c.usePart(d,j.id,'TECH-101','PART-101',2);
  c.submitReport(d,j.id,'TECH-101',{hours:2,notes:'Filter replaced, unit tested after service.',checks:validChecks(c)});
  c.reviewJob(d,j.id,'Approve');
  const i=c.createInvoice(d,j.id);
  assert.equal(i.total,8800);
  assert.equal(i.rows.length,2);
  assert.equal(i.rows[0].unitPrice,2500);
  assert.equal(i.rows[1].unitPrice,1900);
  assert.equal(c.metrics(d).billed,8800);
  assert.equal(part(d,'PART-101').stock,6);
  assert.throws(()=>c.createInvoice(d,j.id),/Only approved/);
  assert.equal(d.invoices.length,1);
});

test('simulated payment is idempotent and updates job and invoice statuses',()=>{
  const c=core(),d=c.seed(),j=reported(c,d);
  c.reviewJob(d,j.id,'Approve');
  const i=c.createInvoice(d,j.id),before=JSON.stringify(d);
  assert.throws(()=>c.recordPayment(d,i.id,'Bank transfer'),/supported simulated/);
  assert.equal(JSON.stringify(d),before);
  c.recordPayment(d,i.id,'M-Pesa (simulated)');
  assert.equal(i.status,'Paid');
  assert.equal(j.status,'Paid');
  assert.match(i.reference,/^SIM-/);
  assert.equal(c.metrics(d).paid,i.total);
  assert.equal(c.metrics(d).unpaid,0);
  assert.throws(()=>c.recordPayment(d,i.id,'Cash'),/Only unpaid/);
});

test('UI roles reveal only relevant navigation and actions',()=>{
  const h=demo();
  assert.match(h.root.innerHTML,/Service requests/);
  h.role('technician');
  assert.match(h.root.innerHTML,/My field jobs/);
  assert.doesNotMatch(h.root.innerHTML,/data-nav="billing"/);
  h.role('manager');
  assert.match(h.root.innerHTML,/Manager reviews/);
  assert.doesNotMatch(h.root.innerHTML,/data-nav="mywork"/);
  h.role('billing');
  assert.match(h.root.innerHTML,/Invoices/);
  assert.doesNotMatch(h.root.innerHTML,/data-nav="tickets"/);
});

test('UI cross-role ticket-to-payment workflow including parts and printable invoice',()=>{
  const h=demo();
  h.click('new-job');
  h.submit('new-job',undefined,{assetId:'A-101',title:'Rooftop unit repair',priority:'Standard',description:'Rooftop unit needs air filter replacement.'});
  const j=h.data().tickets[0];
  assert.equal(j.status,'New');
  h.click('assign',j.id);
  h.submit('assign',j.id,{techId:'TECH-101',schedule:'2026-11-03T10:00'});
  assert.equal(h.data().tickets[0].status,'Assigned');
  h.role('technician');
  h.click('start',j.id);
  h.click('part',j.id);h.submit('part',j.id,{partId:'PART-101',qty:'2'});
  assert.equal(part(h.data(),'PART-101').stock,6);
  h.click('report',j.id);h.submit('report',j.id,reportFields());
  assert.equal(h.data().tickets[0].status,'Awaiting review');
  h.role('manager');h.click('review',j.id);h.click('approve',j.id);
  assert.equal(h.data().tickets[0].status,'Approved');
  h.role('billing');h.click('invoice-create',j.id);
  const i=h.data().invoices[0];
  assert.equal(i.total,8800);
  assert.match(h.root.innerHTML,/DEMO ONLY/);
  h.click('print');assert.equal(h.printed(),true);
  h.click('close');h.click('payment',i.id);
  h.submit('payment',i.id,{method:'Cash'});
  assert.equal(h.data().tickets[0].status,'Paid');
  assert.equal(h.data().invoices[0].status,'Paid');
  h.nav('reports');assert.match(h.root.innerHTML,/8,800/);
});

test('UI manager return blocks approval until technician resubmits passing checks',()=>{
  const h=demo();
  h.role('technician');
  h.click('start','JOB-1002');
  h.click('report','JOB-1002');h.submit('report','JOB-1002',reportFields(true));
  assert.equal(job(h.data(),'JOB-1002').status,'Awaiting review');
  h.role('manager');h.click('review','JOB-1002');
  const before=h.snapshot();
  h.click('approve','JOB-1002');
  assert.equal(h.snapshot(),before);
  assert.match(h.root.innerHTML,/must be resolved before approval/);
  h.submit('return','JOB-1002',{reason:'Please repeat the repair check and retest.'});
  assert.equal(job(h.data(),'JOB-1002').status,'Returned');
  h.role('technician');h.click('start','JOB-1002');
  h.click('report','JOB-1002');h.submit('report','JOB-1002',reportFields(false));
  h.role('manager');h.click('review','JOB-1002');h.click('approve','JOB-1002');
  assert.equal(job(h.data(),'JOB-1002').status,'Approved');
  assert.equal(job(h.data(),'JOB-1002').reports.length,2);
});

test('browser state survives a reload and reset restores the sample',()=>{
  const h=demo();
  h.click('new-job');
  h.submit('new-job',undefined,{assetId:'A-102',title:'Pump seal service',priority:'Urgent',description:'Water pump has visible leakage around shaft.'});
  const cached=h.snapshot();
  const reloaded=demo(cached);
  assert.equal(reloaded.data().tickets.length,3);
  reloaded.click('reset');
  assert.equal(reloaded.data().tickets.length,2);
  assert.equal(reloaded.data().parts[0].stock,8);
});
