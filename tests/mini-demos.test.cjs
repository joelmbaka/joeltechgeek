const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const base=path.join(__dirname,'..','public','demos');
const engine=fs.readFileSync(path.join(base,'shared','minimal-engine.js'),'utf8');
const slugs=['property','healthcare'];
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
const listed=(def,id)=>def.actions.find(s=>s.id===id);
function setupRent(h){
 h.nav('workflow');
 h.submit('invoice');
}
const paymentRent=(h,amount,ref)=>{
 h.role('manager');h.submit('receipt',{amount:String(amount),method:'Bank transfer',reference:ref});
 h.role('finance');h.submit('allocate');
};

test('both mini demos provide product-specific titles, roles, records and a fictional seed',()=>{
 const expected={property:'Rental Management',healthcare:'Clinic Operations'};
 for(const slug of slugs){
  const def=definition(slug),seed=def.seed();
  assert.equal(def.slug,slug);
  assert.equal(def.product,expected[slug]);
  assert.equal(def.valid(seed),true);
  assert.ok(def.roles.length>=2);
  assert.ok(def.actions.length>=3);
  assert.ok(def.sections.length>=2);
  assert.ok(def.actions.every(s=>def.roles.some(r=>r.id===s.role)));
  assert.ok(Array.isArray(def.metrics(seed)));
 }
});

test('Rental Management: partial rent payments flow through finance allocation and owner statement',()=>{
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

test('Rental Management: overpayment preserves credit and report can be regenerated',()=>{
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

test('Rental Management: duplicate external payment references are rejected with no new receipt',()=>{
 const h=harness('property');setupRent(h);
 paymentRent(h,10000,'DEMO-PAY-001');
 h.role('manager');
 const before=h.saved();
 h.submit('receipt',{amount:'5000',method:'Bank transfer',reference:'DEMO-PAY-001'});
 assert.equal(h.saved(),before);
 assert.match(h.root.innerHTML,/already been recorded/);
 assert.equal(h.data().payments.length,1);
});

test('Clinic Operations: OPD registration, triage, service, invoice and sample payment',()=>{
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

test('Clinic Operations: cannot bill without a clinician service or pay without an invoice',()=>{
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

test('Clinic Operations: invalid or duplicate payment does not alter the settled invoice',()=>{
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

test('both mini demos expose role switching, records navigation and local reset',()=>{
 for(const slug of slugs){
  const h=harness(slug);
  assert.match(h.root.innerHTML,/INTERACTIVE INDUSTRY CONCEPT/);
  assert.match(h.root.innerHTML,/fictional/i);
  const def=definition(slug);
  h.clickRole(def.roles[def.roles.length-1].id);
  assert.match(h.root.innerHTML,new RegExp(def.roles[def.roles.length-1].name.split(' · ')[0]));
  h.nav('records');assert.match(h.root.innerHTML,/Records &amp; reports/);
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
 assert.equal(new Set(found).size,2);
});

test('property module safely escapes user-entered payment references',()=>{
 const h=harness('property');setupRent(h);
 h.submit('receipt',{amount:'10000',method:'Bank transfer',reference:'<svg onload=alert(1)>'});
 h.nav('records');
 assert.doesNotMatch(h.root.innerHTML,/<svg onload=/);
 assert.match(h.root.innerHTML,/&lt;svg onload=/);
});


test('industry-facing content does not expose reference product names',()=>{
 const forbidden=['Macsim Cargo','SchoolPey','RentPayor','CliviQue','Based on existing product','Real product inspiration'];
 const files=[
   'app/demos/page.tsx',
   ...slugs.map(s=>'app/demos/'+s+'/page.tsx'),
   ...slugs.map(s=>'public/demos/'+s+'/demo.html'),
   ...slugs.map(s=>'public/demos/'+s+'/demo.js')
 ];
 for(const file of files){
   const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
   for(const brand of forbidden){
     assert.equal(source.includes(brand),false,file+' exposes '+brand);
   }
 }
});
