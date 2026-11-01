const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base=path.join(__dirname,'..','public','demos','retail');
const source=fs.readFileSync(path.join(base,'retail-core.js'),'utf8');
const app=fs.readFileSync(path.join(base,'retail-app.js'),'utf8');
let sequence=0;
const demoCrypto={randomUUID:()=>('retail'+(++sequence).toString(36)).padEnd(16,'0')};
const core=()=>new Function('crypto',source+'\nreturn retailCore;')(demoCrypto);
const product=(data,id)=>data.products.find(p=>p.id===id);
function setup(){
  const root={innerHTML:'',contains:()=>true},handlers={},inputs={};
  let stored=null,printCalled=false;
  const document={
    getElementById:(id)=>id==='app'?root:Object.hasOwn(inputs,id)?{value:inputs[id]}:null,
    addEventListener:(event,fn)=>{handlers[event]=fn;},
    querySelector:()=>null
  };
  const window={confirm:()=>true,scrollTo:()=>{},print:()=>{printCalled=true}};
  const localStorage={getItem:()=>stored,setItem:(key,value)=>{stored=value}};
  class MockFormData{
    constructor(form){this.values=form.values}
    entries(){return Object.entries(this.values)[Symbol.iterator]()}
  }
  new Function('document','window','localStorage','crypto','FormData',source+'\n'+app)(
    document,window,localStorage,demoCrypto,MockFormData
  );
  return {
    root,inputs,
    click:(act,id)=>handlers.click({target:{closest:()=>({dataset:{act,id}})}}),
    navigate:(nav)=>handlers.click({target:{closest:()=>({dataset:{nav}})}}),
    role:(role)=>handlers.change({target:{id:'role-switch',value:role}}),
    change:(id,value)=>handlers.change({target:{id,value}}),
    input:(id,value)=>handlers.input({target:{id,value,dataset:{}}}),
    submit:(form,values,id)=>handlers.submit({preventDefault:()=>{},target:{dataset:{form,id},values}}),
    data:()=>JSON.parse(stored),
    snapshot:()=>stored,
    printCalled:()=>printCalled
  };
}
function draftOrder(h,qty=20,productId='P-102'){
  h.click('new-po');
  h.inputs['po-item']=productId;
  h.inputs['po-qty']=String(qty);
  h.inputs['po-cost']='215';
  h.click('po-add-line');
  h.click('po-save');
  return h.data().purchaseOrders[0];
}
test('seed includes an already received historical order',()=>{
  const c=core(),d=c.seed();
  assert.equal(product(d,'P-102').stock,4);
  assert.equal(d.purchaseOrders[0].lines[0].receivedQty,10);
  assert.equal(d.purchaseOrders[0].status,'Received');
  assert.equal(d.suppliers.length,3);
});
test('a draft does not change stock; full stated receipt updates it exactly once',()=>{
  const c=core(),d=c.seed();
  const po=c.createPurchase(d,'S-1',[{productId:'P-102',qty:20,cost:215}]);
  assert.equal(product(d,'P-102').stock,4);
  assert.equal(po.lines[0].receivedQty,0);
  assert.equal(po.status,'Draft');
  c.receivePurchase(d,po.id,[{productId:'P-102',qty:20}]);
  assert.equal(po.status,'Received');
  assert.equal(po.lines[0].receivedQty,20);
  assert.equal(product(d,'P-102').stock,24);
  assert.equal(po.receipts.length,1);
  assert.throws(()=>c.receivePurchase(d,po.id,[{productId:'P-102',qty:1}]),/fully received/);
  assert.equal(product(d,'P-102').stock,24);
});
test('partial multi-product receipt tracks ordered, received and remaining amounts',()=>{
  const c=core(),d=c.seed();
  const po=c.createPurchase(d,'S-1',[
    {productId:'P-102',qty:20,cost:215},
    {productId:'P-104',qty:7,cost:130}
  ]);
  c.receivePurchase(d,po.id,[{productId:'P-102',qty:8},{productId:'P-104',qty:0}]);
  assert.equal(po.status,'Partially received');
  assert.deepEqual(po.lines.map(l=>l.receivedQty),[8,0]);
  assert.equal(product(d,'P-102').stock,12);
  assert.equal(product(d,'P-104').stock,3);
  assert.equal(c.metrics(d).orders,1);
  c.receivePurchase(d,po.id,[{productId:'P-102',qty:12},{productId:'P-104',qty:2}]);
  assert.equal(po.status,'Partially received');
  assert.deepEqual(po.lines.map(l=>l.receivedQty),[20,2]);
  c.receivePurchase(d,po.id,[{productId:'P-104',qty:5}]);
  assert.equal(po.status,'Received');
  assert.equal(po.receipts.length,3);
  assert.equal(product(d,'P-102').stock,24);
  assert.equal(product(d,'P-104').stock,10);
  assert.equal(c.metrics(d).orders,0);
});
test('over-receipt, invalid quantities and duplicates cannot partially mutate an order',()=>{
  const c=core(),d=c.seed();
  const po=c.createPurchase(d,'S-1',[{productId:'P-102',qty:20,cost:215},{productId:'P-104',qty:7,cost:130}]);
  let before=JSON.stringify(d);
  assert.throws(()=>c.receivePurchase(d,po.id,[{productId:'P-102',qty:21}]),/only 20 remain/);
  assert.throws(()=>c.receivePurchase(d,po.id,[{productId:'P-102',qty:2},{productId:'P-104',qty:8}]),/only 7 remain/);
  assert.throws(()=>c.receivePurchase(d,po.id,[{productId:'P-102',qty:0}]),/greater than zero/);
  assert.throws(()=>c.receivePurchase(d,po.id,[{productId:'P-102',qty:-1}]),/whole number/);
  assert.throws(()=>c.receivePurchase(d,po.id,[{productId:'P-102',qty:1.5}]),/whole number/);
  assert.throws(()=>c.receivePurchase(d,po.id,[{productId:'P-102',qty:1},{productId:'P-102',qty:1}]),/Duplicate/);
  assert.throws(()=>c.receivePurchase(d,po.id),/Enter the quantities/);
  assert.equal(JSON.stringify(d),before);
  c.receivePurchase(d,po.id,[{productId:'P-102',qty:8}]);
  before=JSON.stringify(d);
  assert.throws(()=>c.receivePurchase(d,po.id,[{productId:'P-102',qty:13}]),/only 12 remain/);
  assert.equal(JSON.stringify(d),before);
});
test('legacy saved all-or-nothing receipts are migrated without extra stock',()=>{
  const c=core(),d=c.seed(),historic=d.purchaseOrders[0];
  delete historic.lines[0].receivedQty;
  delete historic.receipts;
  const before=JSON.stringify(d.products);
  c.normalizePurchases(d);
  assert.equal(historic.lines[0].receivedQty,10);
  assert.deepEqual(historic.receipts,[]);
  assert.equal(JSON.stringify(d.products),before);
  const po=c.createPurchase(d,'S-1',[{productId:'P-102',qty:3,cost:215}]);
  delete po.lines[0].receivedQty;
  c.normalizePurchases(d);
  assert.equal(po.lines[0].receivedQty,0);
});
test('checkout calculates tender and change and reduces stock',()=>{
  const c=core(),d=c.seed();
  const po=c.createPurchase(d,'S-1',[{productId:'P-102',qty:20,cost:215}]);
  c.receivePurchase(d,po.id,[{productId:'P-102',qty:20}]);
  const before=c.metrics(d);
  const sale=c.checkout(d,[{id:'P-102',qty:5}],'Cash',1500,'Miriam · Cashier');
  assert.equal(sale.total,1425);
  assert.equal(sale.change,75);
  assert.equal(product(d,'P-102').stock,19);
  assert.equal(c.metrics(d).revenue,before.revenue+1425);
});
test('existing negative stock, overselling and duplicate PO safeguards remain active',()=>{
  const c=core(),d=c.seed(),before=JSON.stringify(d);
  assert.throws(()=>c.checkout(d,[{id:'P-102',qty:5}],'M-Pesa',undefined,'Miriam'),/only 4 units/);
  assert.throws(()=>c.checkout(d,[{id:'P-102',qty:2}],'Cash',200,'Miriam'),/at least 570/);
  assert.throws(()=>c.adjust(d,'P-102',-5,'Damaged stock'),/negative/);
  assert.throws(()=>c.createPurchase(d,'S-1',[{productId:'P-102',qty:2,cost:215},{productId:'P-102',qty:2,cost:215}]),/once/);
  assert.equal(JSON.stringify(d),before);
});
test('product creation is validated and adjustments are recorded',()=>{
  const c=core(),d=c.seed(),p=c.addProduct(d,{name:'Notebook A5',sku:'GB-500',category:'Stationery',supplierId:'S-3',stock:10,reorder:3,cost:50,price:80});
  assert.equal(p.stock,10);
  assert.throws(()=>c.addProduct(d,{name:'Duplicate',sku:'GB-500',category:'Stationery',supplierId:'S-3',stock:0,reorder:3,cost:50,price:80}),/SKU already exists/);
  c.adjust(d,p.id,-2,'Damaged during handling');
  assert.equal(p.stock,8);
  assert.ok(d.movements.some(m=>m.productId===p.id&&m.delta===-2));
});
test('stockkeeper dashboard hides POS and inaccessible Sales actions',()=>{
  const h=setup();
  h.role('stockkeeper');
  h.navigate('dashboard');
  assert.doesNotMatch(h.root.innerHTML,/Open point of sale →/);
  assert.doesNotMatch(h.root.innerHTML,/data-nav="sales"/);
  assert.match(h.root.innerHTML,/Purchase stock →/);
  h.role('cashier');h.navigate('dashboard');
  assert.match(h.root.innerHTML,/Open point of sale →/);
  assert.doesNotMatch(h.root.innerHTML,/Purchase stock →/);
});
test('UI receives partial and final deliveries and never saves an over-receipt',()=>{
  const h=setup();
  h.role('stockkeeper');
  const po=draftOrder(h,20);
  assert.equal(product(h.data(),'P-102').stock,4);
  h.click('receive',po.id);
  assert.match(h.root.innerHTML,/name="receive-P-102"/);
  assert.match(h.root.innerHTML,/max="20"/);
  h.submit('receive',{'receive-P-102':'8'},po.id);
  assert.equal(product(h.data(),'P-102').stock,12);
  assert.equal(h.data().purchaseOrders[0].status,'Partially received');
  h.click('receive',po.id);
  assert.match(h.root.innerHTML,/max="12"/);
  const snapshot=h.snapshot();
  h.submit('receive',{'receive-P-102':'13'},po.id);
  assert.equal(h.snapshot(),snapshot);
  assert.match(h.root.innerHTML,/only 12 remain/);
  h.submit('receive',{'receive-P-102':'12'},po.id);
  assert.equal(product(h.data(),'P-102').stock,24);
  assert.equal(h.data().purchaseOrders[0].status,'Received');
  assert.equal(h.data().purchaseOrders[0].receipts.length,2);
  h.role('cashier');
  for(let i=0;i<5;i++)h.click('cart-add','P-102');
  h.input('tender','1500');
  h.click('checkout');
  assert.equal(h.data().sales[0].total,1425);
  assert.equal(h.data().sales[0].change,75);
  assert.equal(product(h.data(),'P-102').stock,19);
  assert.match(h.root.innerHTML,/SAMPLE RECEIPT/);
  h.click('print');assert.equal(h.printCalled(),true);
  h.click('close');
  h.click('reset');
  assert.equal(product(h.data(),'P-102').stock,4);
});
test('mock M-Pesa is not a real payment',()=>{
  const h=setup();
  h.role('cashier');h.click('cart-add','P-103');h.change('pay-method','M-Pesa');
  assert.match(h.root.innerHTML,/No STK push/);
  h.click('checkout');
  const sale=h.data().sales[0];
  assert.equal(sale.method,'M-Pesa');
  assert.match(sale.reference,/^SIM-MP-/);
  assert.equal(sale.tendered,null);
});
test('stockkeeper can add an item and adjust quantities',()=>{
  const h=setup();h.role('stockkeeper');h.click('new-product');
  h.submit('product',{name:'Notebook A5',sku:'GB-500',category:'Stationery',supplierId:'S-3',stock:'10',reorder:'3',cost:'50',price:'80'});
  const p=h.data().products.find(p=>p.sku==='GB-500');
  assert.ok(p);
  h.click('adjust',p.id);
  h.submit('adjust',{delta:'-2',reason:'Damage during handling'},p.id);
  assert.equal(h.data().products.find(q=>q.id===p.id).stock,8);
});
