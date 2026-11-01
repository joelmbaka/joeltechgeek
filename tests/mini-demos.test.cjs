const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const base=path.join(__dirname,'..','public','demos');
const engine=fs.readFileSync(path.join(base,'shared','minimal-engine.js'),'utf8');
const slugs=['logistics','education','property','healthcare'];
const scripts=Object.fromEntries(slugs.map(s=>[s,fs.readFileSync(path.join(base,s,'demo.js'),'utf8')]));
function definition(slug){
 let captured;
 new Function('initMinimalDemo',scripts[slug])((def)=>{captured=def});
 return captured;
}
function harness(slug,previous=null){
 let persisted=previous;const root={innerHTML:'',contains:()=>true},events={};
 const document={getElementById:()=>root,addEventListener:(name,fn)=>events[name]=fn};
 const window={confirm:()=>true};
 const localStorage={getItem:()=>persisted,setItem:(key,value)=>{persisted=value}};
 class FormDataMock{
  constructor(form){this.fields=form.fields}
  entries(){return Object.entries(this.fields)[Symbol.iterator]()}
 }
 new Function('document','window','localStorage','FormData',engine+'\n'+scripts[slug])(document,window,localStorage,FormDataMock);
 return {
  root,nav:id=>events.click({target:{closest:()=>({dataset:{nav:id}})}}),
  role:id=>events.change({target:{id:'role-select',value:id}}),
  clickRole:id=>events.click({target:{closest:()=>({dataset:{role:id}})}}),
  submit:(step,fields={})=>events.submit({preventDefault:()=>{},target:{dataset:{step},fields}}),
  reset:()=>events.click({target:{closest:()=>({dataset:{reset:'true'}})}}),
  saved:()=>persisted,data:()=>JSON.parse(persisted)
 };
}
const listed=(def,id)=>def.steps.find(s=>s.id===id);
function setupSchool(h){
 h.nav('workflow');
 h.submit('invoice',{tuition:'18000',activity:'3000',transport:'4000'});
}
function setupRent(h){
 h.nav('workflow');
 h.submit('invoice');
}
const paymentSchool=(h,amount)=>{
 h.role('guardian');h.submit('payment',{amount:String(amount),method:'M-Pesa (simulated)'});
 h.role('finance');h.submit('reconcile');
};
const paymentRent=(h,amount,ref)=>{
 h.role('manager');h.submit('receipt',{amount:String(amount),method:'Bank transfer',reference:ref});
 h.role('finance');h.submit('allocate');
};

test('all four demos provide product-specific titles, roles, records and a fictional seed',()=>{
 const expected={logistics:'Macsim Cargo',education:'SchoolPey',property:'RentPayor',healthcare:'CliviQue HMIS'};
 for(const slug of slugs){
  const def=definition(slug),seed=def.seed();
  assert.equal(def.slug,slug);
  assert.equal(def.product,expected[slug]);
  assert.equal(def.valid(seed),true);
  assert.ok(def.roles.length>=2);
  assert.ok(def.steps.length>=3);
  assert.ok(def.sections.length>=2);
  assert.ok(def.steps.every(s=>def.roles.some(r=>r.id===s.role)));
  assert.ok(Array.isArray(def.metrics(seed)));
 }
});

test('Macsim: load → request → approve → trip → proof → delivered',()=>{
 const h=harness('logistics');
 h.nav('workflow');
 h.submit('post',{origin:'Mombasa Port',destination:'Nairobi ICD',cargo:'Containerized cargo',weight:'12'});
 assert.equal(h.data().load.status,'Open');
 h.role('driver');h.submit('book',{driverId:'DRV-001'});
 assert.equal(h.data().load.status,'Requested');
 h.role('dispatcher');h.submit('approve');
 assert.equal(h.data().load.status,'Assigned');
 h.role('driver');h.submit('depart');
 assert.equal(h.data().load.status,'In transit');
 h.submit('proof',{container:'DEMO-CONT-001',deliveryNote:'DEMO-DN-001'});
 assert.equal(h.data().load.status,'Proof submitted');
 h.role('dispatcher');h.submit('close');
 assert.equal(h.data().load.status,'Delivered');
 assert.equal(h.data().load.documents.length,1);
 h.nav('records');
 assert.match(h.root.innerHTML,/DEMO-DN-001/);
});

test('Macsim: vehicle carrying capacity is validated without modifying booking state',()=>{
 const h=harness('logistics');h.nav('workflow');
 h.submit('post',{origin:'Mombasa Port',destination:'Nairobi ICD',cargo:'Containerized cargo',weight:'22'});
 h.role('driver');
 const before=h.saved();
 h.submit('book',{driverId:'DRV-001'});
 assert.equal(h.saved(),before);
 assert.match(h.root.innerHTML,/rated for 18 tonnes/);
});

test('Macsim: cannot book or close a nonexistent or unverified load',()=>{
 const h=harness('logistics');h.nav('workflow');
 h.role('driver');h.submit('book',{driverId:'DRV-001'});
 assert.equal(h.saved(),null);
 assert.match(h.root.innerHTML,/not available/);
 h.role('dispatcher');h.submit('post',{origin:'Mombasa Port',destination:'Nairobi ICD',cargo:'Containerized cargo',weight:'12'});
 const before=h.saved();h.submit('close');
 assert.equal(h.saved(),before);
 assert.equal(h.data().load.status,'Open');
});

test('SchoolPey: student term fee invoice and a reconciled partial payment',()=>{
 const h=harness('education');setupSchool(h);
 assert.equal(h.data().invoice.total,25000);
 h.role('guardian');h.submit('payment',{amount:'8000',method:'M-Pesa (simulated)'});
 assert.equal(h.data().invoice.allocated,0);
 assert.equal(h.data().payments[0].status,'Pending');
 h.role('finance');h.submit('reconcile');
 assert.equal(h.data().invoice.allocated,8000);
 assert.equal(h.data().receipts.length,1);
 assert.equal(h.data().credit,0);
});

test('SchoolPey: overpayments become student credit, not negative balances',()=>{
 const h=harness('education');setupSchool(h);
 paymentSchool(h,8000);paymentSchool(h,20000);
 assert.equal(h.data().invoice.allocated,25000);
 assert.equal(h.data().credit,3000);
 assert.equal(h.data().receipts.length,2);
 assert.equal(h.data().receipts[1].allocated,17000);
 assert.equal(h.data().receipts[1].credit,3000);
 h.nav('records');assert.match(h.root.innerHTML,/3,000/);
});

test('SchoolPey: rejects invalid fees and prevents parallel unreviewed payments',()=>{
 const h=harness('education');h.nav('workflow');
 h.submit('invoice',{tuition:'bad',activity:'3000',transport:'4000'});
 assert.equal(h.saved(),null);
 h.submit('invoice',{tuition:'18000',activity:'3000',transport:'4000'});
 h.role('guardian');h.submit('payment',{amount:'10000',method:'M-Pesa (simulated)'});
 const before=h.saved();
 h.submit('payment',{amount:'10000',method:'M-Pesa (simulated)'});
 assert.equal(h.saved(),before);
 h.role('finance');h.submit('reconcile');
 assert.equal(h.data().payments.length,1);
});

test('RentPayor: partial rent payments flow through finance allocation and owner statement',()=>{
 const h=harness('property');setupRent(h);
 assert.equal(h.data().invoice.total,32000);
 h.submit('receipt',{amount:'12000',method:'Bank transfer',reference:'DEMO-PAY-001'});
 assert.equal(h.data().invoice.allocated,0);
 h.role('finance');h.submit('allocate');
 assert.equal(h.data().invoice.allocated,12000);
 assert.equal(h.data().invoice.status,'Partially paid');
 h.role('manager');h.submit('statement');
 assert.equal(h.data().statement.received,12000);
 assert.equal(h.data().statement.remaining,20000);
 assert.equal(h.data().receipts.length,1);
});

test('RentPayor: overpayment preserves credit and report can be regenerated',()=>{
 const h=harness('property');setupRent(h);
 paymentRent(h,12000,'DEMO-PAY-001');
 h.role('manager');h.submit('statement');
 paymentRent(h,25000,'DEMO-PAY-002');
 assert.equal(h.data().invoice.allocated,32000);
 assert.equal(h.data().invoice.status,'Paid');
 assert.equal(h.data().credit,5000);
 h.role('manager');h.submit('statement');
 assert.equal(h.data().statement.remaining,0);
 assert.equal(h.data().statement.credit,5000);
});

test('RentPayor: duplicate external payment references are rejected with no new receipt',()=>{
 const h=harness('property');setupRent(h);
 paymentRent(h,10000,'DEMO-PAY-001');
 h.role('manager');
 const before=h.saved();
 h.submit('receipt',{amount:'5000',method:'Bank transfer',reference:'DEMO-PAY-001'});
 assert.equal(h.saved(),before);
 assert.match(h.root.innerHTML,/already been recorded/);
 assert.equal(h.data().payments.length,1);
});

test('CliviQue: OPD registration, triage, service, invoice and sample payment',()=>{
 const h=harness('healthcare');h.nav('workflow');
 h.submit('register',{name:'Jamie Sample (fictional)'});
 h.submit('visit');
 assert.equal(h.data().encounter.status,'Awaiting triage');
 h.role('nurse');h.submit('triage',{priority:'Routine'});
 h.role('clinician');h.submit('consult',{serviceId:'consultlab'});
 assert.equal(h.data().encounter.service.amount,2600);
 h.role('cashier');h.submit('bill');
 assert.equal(h.data().invoice.total,2600);
 h.submit('payment',{method:'Cash (demo)'});
 assert.equal(h.data().invoice.status,'Paid');
 assert.equal(h.data().encounter.status,'Administratively completed');
 h.nav('records');assert.match(h.root.innerHTML,/BILL-DEMO-001/);
});

test('CliviQue: cannot bill without a clinician service or pay without an invoice',()=>{
 const h=harness('healthcare');h.nav('workflow');
 h.role('cashier');h.submit('bill');
 assert.equal(h.saved(),null);
 h.role('reception');h.submit('register',{name:'Jamie Sample (fictional)'});
 h.submit('visit');
 const before=h.saved();
 h.role('cashier');h.submit('bill');
 assert.equal(h.saved(),before);
 assert.equal(h.data().invoice,null);
 h.role('nurse');h.submit('triage',{priority:'Invalid'});
 assert.equal(h.saved(),before);
});

test('CliviQue: invalid or duplicate payment does not alter the settled invoice',()=>{
 const h=harness('healthcare');h.nav('workflow');
 h.submit('register',{name:'Jamie Sample (fictional)'});h.submit('visit');
 h.role('nurse');h.submit('triage',{priority:'Routine'});
 h.role('clinician');h.submit('consult',{serviceId:'consult'});
 h.role('cashier');h.submit('bill');
 const before=h.saved();h.submit('payment',{method:'Bank (real)'});
 assert.equal(h.saved(),before);
 h.submit('payment',{method:'Cash (demo)'});
 const after=h.saved();h.submit('payment',{method:'Cash (demo)'});
 assert.equal(h.saved(),after);
 assert.equal(h.data().invoice.reference,'SIM-CLV-001');
});

test('all four demos expose role switching, records navigation and local reset',()=>{
 for(const slug of slugs){
  const h=harness(slug);
  assert.match(h.root.innerHTML,/Interactive concept/);
  assert.match(h.root.innerHTML,/FICTIONAL DATA/);
  const def=definition(slug);
  h.clickRole(def.roles[def.roles.length-1].id);
  assert.match(h.root.innerHTML,new RegExp(def.roles[def.roles.length-1].name.split(' · ')[0]));
  h.nav('records');assert.match(h.root.innerHTML,/Demo records &amp; reports/);
  h.reset();assert.match(h.root.innerHTML,/Sample data restored/);
  assert.equal(h.data().version,1);
 }
});

test('each demo uses an independent browser storage key',()=>{
 const found=slugs.map(s=>s.replace(/-/g,''));
 for(const slug of slugs){
  const h=harness(slug);h.reset();
  assert.equal(h.data().version,1);
 }
 assert.equal(new Set(found).size,4);
});

test('form escapes user-provided markup in the client UI',()=>{
 const h=harness('logistics');h.nav('workflow');
 h.submit('post',{origin:'<svg onload=alert(1)>',destination:'Nairobi ICD',cargo:'Cargo',weight:'12'});
 h.nav('records');
 assert.doesNotMatch(h.root.innerHTML,/<svg onload=/);
 assert.match(h.root.innerHTML,/&lt;svg onload=/);
});
