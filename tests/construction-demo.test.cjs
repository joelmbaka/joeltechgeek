const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const base=path.join(__dirname,'..','public','demos','construction');
const coreSource=fs.readFileSync(path.join(base,'core.js'),'utf8');
const appSource=fs.readFileSync(path.join(base,'app.js'),'utf8');
let seq=0;
const cryptoMock={randomUUID:()=>('demo'+(++seq).toString(36)).padEnd(20,'0')};
const core=()=>new Function('crypto',coreSource+'\nreturn constructionCore;')(cryptoMock);
const find=(rows,id)=>rows.find(x=>x.id===id);

function harness(saved=null){
  const events={},root={innerHTML:'',contains:()=>true};
  let stored=saved;
  const document={
    getElementById:(id)=>id==='app'?root:null,
    addEventListener:(type,fn)=>events[type]=fn
  };
  const window={confirm:()=>true};
  const localStorage={
    getItem:()=>stored,
    setItem:(key,value)=>{stored=value}
  };
  class MockFormData{
    constructor(form){this.values=form.values}
    entries(){return Object.entries(this.values)[Symbol.iterator]()}
  }
  new Function('document','window','localStorage','crypto','FormData',coreSource+'\n'+appSource)(
    document,window,localStorage,cryptoMock,MockFormData
  );
  return {
    root,
    role:(value)=>events.change({target:{id:'role-select',value}}),
    navigate:(nav)=>events.click({target:{closest:()=>({dataset:{nav}})}}),
    click:(action,id,extra={})=>events.click({target:{closest:()=>({dataset:{action,id,...extra}})}}),
    submit:(kind,id,values)=>events.submit({preventDefault:()=>{},target:{dataset:{form:kind,id},values}}),
    input:(name,value)=>events.input({target:{name,value}}),
    snapshot:()=>stored,
    state:()=>JSON.parse(stored)
  };
}

test('fictional project seed includes sample tasks, stock, approvals and costs',()=>{
  const c=core(),d=c.seed(),m=c.metrics(d);
  assert.equal(d.project.budget,12500000);
  assert.equal(d.tasks.length,5);
  assert.equal(d.materials.length,6);
  assert.equal(find(d.materials,'MAT-101').stock,42);
  assert.equal(m.pending,1);
  assert.equal(m.approved,1);
  assert.equal(m.spent,12500);
});

test('pending request cannot issue stock; rejection permanently blocks issue',()=>{
  const c=core(),d=c.seed(),r=d.requests[0];
  const snapshot=JSON.stringify(d);
  assert.throws(()=>c.issueMaterial(d,r.id,1),/Only approved requests/);
  assert.equal(JSON.stringify(d),snapshot);
  c.decideRequest(d,r.id,'Rejected');
  assert.equal(r.status,'Rejected');
  assert.throws(()=>c.decideRequest(d,r.id,'Approved'),/Only pending/);
  assert.throws(()=>c.issueMaterial(d,r.id,1),/Only approved/);
  assert.equal(find(d.materials,r.materialId).stock,42);
});

test('approved requests can issue stock in partial batches but not exceed approval',()=>{
  const c=core(),d=c.seed(),r=c.requestMaterial(d,'TASK-101','MAT-101',12,'Cement for slab finishing');
  assert.equal(r.status,'Pending');
  assert.equal(find(d.materials,'MAT-101').stock,42);
  c.decideRequest(d,r.id,'Approved');
  c.issueMaterial(d,r.id,5);
  assert.equal(r.status,'Partially issued');
  assert.equal(r.issuedQty,5);
  assert.equal(find(d.materials,'MAT-101').stock,37);
  const before=JSON.stringify(d);
  assert.throws(()=>c.issueMaterial(d,r.id,8),/only 7 remain approved/);
  assert.equal(JSON.stringify(d),before);
  c.issueMaterial(d,r.id,7);
  assert.equal(r.status,'Issued');
  assert.equal(r.issues.length,2);
  assert.equal(find(d.materials,'MAT-101').stock,30);
  assert.throws(()=>c.issueMaterial(d,r.id,1),/Only approved requests/);
});

test('issue cannot exceed available stock and fails atomically',()=>{
  const c=core(),d=c.seed(),r=c.requestMaterial(d,'TASK-105','MAT-106',11,'Paint needed for corridor finishes');
  c.decideRequest(d,r.id,'Approved');
  const before=JSON.stringify(d);
  assert.throws(()=>c.issueMaterial(d,r.id,7),/Not enough/);
  assert.equal(JSON.stringify(d),before);
  c.issueMaterial(d,r.id,6);
  assert.equal(find(d.materials,'MAT-106').stock,0);
  assert.equal(r.status,'Partially issued');
});

test('draft purchases do not affect stock or project direct costs',()=>{
  const c=core(),d=c.seed(),before=c.metrics(d),stock=find(d.materials,'MAT-101').stock;
  const po=c.createPurchase(d,'Summit Materials (fictional)',[{materialId:'MAT-101',qty:30,unitCost:900}]);
  assert.equal(po.status,'Draft');
  assert.equal(find(d.materials,'MAT-101').stock,stock);
  assert.equal(c.metrics(d).spent,before.spent);
  assert.equal(c.metrics(d).committed,27000);
});

test('supplier deliveries can be partially received without exceeding the order',()=>{
  const c=core(),d=c.seed(),po=c.createPurchase(d,'Summit Materials (fictional)',[
    {materialId:'MAT-101',qty:30,unitCost:900},
    {materialId:'MAT-104',qty:6,unitCost:300}
  ]);
  let before=JSON.stringify(d);
  assert.throws(()=>c.receivePurchase(d,po.id,[{materialId:'MAT-101',qty:31}]),/only 30 remain ordered/);
  assert.throws(()=>c.receivePurchase(d,po.id,[{materialId:'MAT-101',qty:8},{materialId:'MAT-104',qty:7}]),/only 6 remain ordered/);
  assert.throws(()=>c.receivePurchase(d,po.id,[{materialId:'MAT-101',qty:0}]),/above zero/);
  assert.throws(()=>c.receivePurchase(d,po.id,[{materialId:'MAT-101',qty:1.5}]),/whole number/);
  assert.throws(()=>c.receivePurchase(d,po.id,[{materialId:'MAT-101',qty:2},{materialId:'MAT-101',qty:2}]),/Duplicate/);
  assert.equal(JSON.stringify(d),before);
  c.receivePurchase(d,po.id,[{materialId:'MAT-101',qty:12},{materialId:'MAT-104',qty:0}]);
  assert.equal(po.status,'Partially received');
  assert.equal(find(d.materials,'MAT-101').stock,54);
  assert.equal(po.lines[0].receivedQty,12);
  before=JSON.stringify(d);
  assert.throws(()=>c.receivePurchase(d,po.id,[{materialId:'MAT-101',qty:19}]),/only 18 remain ordered/);
  assert.equal(JSON.stringify(d),before);
  c.receivePurchase(d,po.id,[{materialId:'MAT-101',qty:18},{materialId:'MAT-104',qty:6}]);
  assert.equal(po.status,'Received');
  assert.equal(po.receipts.length,2);
  assert.equal(find(d.materials,'MAT-101').stock,72);
  assert.equal(find(d.materials,'MAT-104').stock,38);
  assert.throws(()=>c.receivePurchase(d,po.id,[{materialId:'MAT-101',qty:1}]),/fully received/);
});

test('progress only moves forward and preserves a meaningful site update',()=>{
  const c=core(),d=c.seed(),t=find(d.tasks,'TASK-101'),before=JSON.stringify(d);
  assert.throws(()=>c.updateProgress(d,t.id,64,'Tried to reduce the progress'),/cannot go below/);
  assert.throws(()=>c.updateProgress(d,t.id,101,'This is beyond completion'),/cannot exceed 100/);
  assert.equal(JSON.stringify(d),before);
  c.updateProgress(d,t.id,80,'Slab finish has been completed');
  assert.equal(t.progress,80);
  assert.equal(d.progressHistory[0].from,65);
  assert.equal(d.progressHistory[0].to,80);
  c.updateProgress(d,t.id,100,'Work verified as completed');
  assert.equal(t.progress,100);
  assert.throws(()=>c.updateProgress(d,t.id,100,'No actual change'),/new progress/);
});

test('issued materials and site expenses affect reports but receiving stock does not double count',()=>{
  const c=core(),d=c.seed(),r=d.requests[1];
  const before=c.metrics(d);
  c.issueMaterial(d,r.id,5);
  assert.equal(c.metrics(d).issuedCost,5*1250);
  assert.equal(c.metrics(d).spent,before.spent+6250);
  const po=c.createPurchase(d,'Fictional supplier',[{materialId:'MAT-102',qty:8,unitCost:1250}]);
  c.receivePurchase(d,po.id,[{materialId:'MAT-102',qty:8}]);
  assert.equal(c.metrics(d).spent,before.spent+6250);
  c.addExpense(d,'Site logistics','Delivery of fictional aggregate',4200);
  assert.equal(c.metrics(d).spent,before.spent+6250+4200);
  assert.equal(c.metrics(d).budgetRemaining,d.project.budget-c.metrics(d).spent);
});

test('invalid procurement, request and expense inputs do not create records',()=>{
  const c=core(),d=c.seed(),before=JSON.stringify(d);
  assert.throws(()=>c.requestMaterial(d,'TASK-101','MAT-101',0,'Need cement'),/whole number/);
  assert.throws(()=>c.requestMaterial(d,'BAD','MAT-101',4,'Need cement'),/existing work item/);
  assert.throws(()=>c.createPurchase(d,'Supplier',[
    {materialId:'MAT-101',qty:2,unitCost:100},
    {materialId:'MAT-101',qty:2,unitCost:100}
  ]),/twice/);
  assert.throws(()=>c.addExpense(d,'Not a category','Impossible expense',100),/category/);
  assert.equal(JSON.stringify(d),before);
});

test('simulated roles only display navigation and actions they can use',()=>{
  const h=harness();
  assert.match(h.root.innerHTML,/Site overview/);
  h.role('supervisor');
  assert.match(h.root.innerHTML,/Site tasks/);
  assert.doesNotMatch(h.root.innerHTML,/data-nav="costs"/);
  h.navigate('requests');
  assert.match(h.root.innerHTML,/Request materials/);
  h.role('manager');
  h.navigate('requests');
  assert.match(h.root.innerHTML,/Review request/);
  h.role('storekeeper');
  h.navigate('requests');
  assert.match(h.root.innerHTML,/Issue stock/);
  assert.doesNotMatch(h.root.innerHTML,/data-nav="reports"/);
  h.role('accountant');
  assert.match(h.root.innerHTML,/Record expense/);
  assert.doesNotMatch(h.root.innerHTML,/data-nav="purchases"/);
});

test('cross-role UI connects requests, issues, task updates and site reporting',()=>{
  const h=harness();
  h.role('supervisor');h.navigate('requests');h.click('new-request');
  h.submit('request',undefined,{taskId:'TASK-101',materialId:'MAT-101',qty:'12',note:'Cement for slab finishing'});
  const r=h.state().requests[0];
  assert.equal(r.status,'Pending');
  h.role('manager');h.navigate('requests');h.click('review',r.id);
  h.click('decision',r.id,{decision:'Approved'});
  assert.equal(h.state().requests[0].status,'Approved');
  h.role('storekeeper');h.navigate('requests');h.click('issue',r.id);
  h.submit('issue',r.id,{qty:'5'});
  assert.equal(h.state().requests[0].status,'Partially issued');
  assert.equal(find(h.state().materials,'MAT-101').stock,37);
  h.click('issue',r.id);
  const before=h.snapshot();
  h.submit('issue',r.id,{qty:'8'});
  assert.equal(h.snapshot(),before);
  h.submit('issue',r.id,{qty:'7'});
  assert.equal(h.state().requests[0].status,'Issued');
  assert.equal(find(h.state().materials,'MAT-101').stock,30);
  h.role('supervisor');h.navigate('tasks');h.click('progress','TASK-101');
  h.submit('progress','TASK-101',{percent:'80',note:'Slab has been finished'});
  assert.equal(find(h.state().tasks,'TASK-101').progress,80);
  h.role('accountant');h.navigate('costs');h.click('new-expense');
  h.submit('expense',undefined,{category:'Site logistics',description:'Fictional delivery trip',amount:'4200'});
  assert.equal(h.state().expenses[0].amount,4200);
  h.navigate('reports');assert.match(h.root.innerHTML,/Project reports/);
  assert.match(h.root.innerHTML,/Estimated direct cost/);
});

test('UI partial goods receiving, over-receipt protection and blank-as-zero',()=>{
  const h=harness();
  h.role('manager');h.navigate('purchases');h.click('new-purchase');
  h.submit('purchase',undefined,{supplier:'Fictional supplier',materialId:'MAT-101',qty:'30',unitCost:'900'});
  const p=h.state().purchases[0];assert.equal(p.status,'Draft');
  assert.equal(find(h.state().materials,'MAT-101').stock,42);
  h.role('storekeeper');h.navigate('purchases');h.click('receive',p.id);
  assert.match(h.root.innerHTML,/max="30"/);
  const original=h.snapshot();
  h.submit('receive',p.id,{'receive-MAT-101':''});
  assert.equal(h.snapshot(),original);
  assert.match(h.root.innerHTML,/above zero/);
  h.submit('receive',p.id,{'receive-MAT-101':'12'});
  assert.equal(h.state().purchases[0].status,'Partially received');
  assert.equal(find(h.state().materials,'MAT-101').stock,54);
  h.click('receive',p.id);
  assert.match(h.root.innerHTML,/max="18"/);
  const before=h.snapshot();
  h.submit('receive',p.id,{'receive-MAT-101':'19'});
  assert.equal(h.snapshot(),before);
  assert.match(h.root.innerHTML,/only 18 remain ordered/);
  h.submit('receive',p.id,{'receive-MAT-101':'18'});
  assert.equal(h.state().purchases[0].status,'Received');
  assert.equal(find(h.state().materials,'MAT-101').stock,72);
});

test('reset restores the fictional project and a reloaded demo reads saved data',()=>{
  const h=harness();
  h.role('accountant');h.click('new-expense');
  h.submit('expense',undefined,{category:'Transport',description:'Fictional delivery trip',amount:'800'});
  const existing=h.snapshot();
  const reloaded=harness(existing);
  reloaded.role('accountant');reloaded.navigate('costs');
  assert.match(reloaded.root.innerHTML,/Fictional delivery trip/);
  reloaded.click('reset');
  assert.equal(reloaded.state().expenses.length,1);
  assert.equal(reloaded.state().expenses[0].amount,12500);
});
