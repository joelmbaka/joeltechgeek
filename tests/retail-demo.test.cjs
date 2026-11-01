const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = path.join(__dirname, '..', 'public', 'demos', 'retail');
const source = fs.readFileSync(path.join(base, 'retail-core.js'), 'utf8');
const app = fs.readFileSync(path.join(base, 'retail-app.js'), 'utf8');

let counter = 0;
const testCrypto = {randomUUID: () => 'test-' + String(++counter).padStart(10, '0')};
function core() {
  return new Function('crypto', source + '\nreturn retailCore;')(testCrypto);
}
function product(db, id) {
  return db.products.find((p) => p.id === id);
}

test('seed has realistic stock and suppliers', () => {
  const c = core();
  const d = c.seed();
  assert.equal(product(d, 'P-102').stock, 4);
  assert.equal(d.suppliers.length, 3);
  assert.ok(c.metrics(d).low >= 2);
  assert.equal(d.sales.length, 2);
});

test('purchase order only updates stock on receipt, exactly once', () => {
  const c = core();
  const db = c.seed();
  const po = c.createPurchase(db, 'S-1', [{productId:'P-102',qty:20,cost:215}]);
  assert.equal(po.status, 'Draft');
  assert.equal(product(db,'P-102').stock, 4);
  c.receivePurchase(db, po.id);
  assert.equal(product(db,'P-102').stock, 24);
  assert.equal(po.status, 'Received');
  assert.throws(() => c.receivePurchase(db, po.id), /Only draft/);
  assert.equal(product(db,'P-102').stock, 24);
  assert.ok(db.movements.some((m) => m.reference === po.id && m.delta === 20));
});

test('cash checkout records price, change, stock, and cost snapshot', () => {
  const c = core();
  const db = c.seed();
  const po = c.createPurchase(db,'S-1',[{productId:'P-102',qty:20,cost:215}]);
  c.receivePurchase(db, po.id);
  const before = c.metrics(db);
  const sale = c.checkout(db, [{id:'P-102',qty:5}], 'Cash', 1500, 'Miriam · Cashier');
  assert.equal(sale.total,1425);
  assert.equal(sale.tendered,1500);
  assert.equal(sale.change,75);
  assert.equal(product(db,'P-102').stock,19);
  assert.equal(c.metrics(db).revenue, before.revenue + 1425);
  assert.equal(sale.lines[0].cost,product(db,'P-102').cost);
});

test('rejects overselling, underpayment, duplicate receipts, and negative stock', () => {
  const c = core(), db = c.seed();
  const snapshot = JSON.stringify(db);
  assert.throws(() => c.checkout(db, [{id:'P-102',qty:5}], 'M-Pesa', undefined, 'Miriam'), /only 4 units/);
  assert.throws(() => c.checkout(db, [{id:'P-102',qty:2}], 'Cash', 200, 'Miriam'), /at least 570/);
  assert.throws(() => c.adjust(db,'P-102',-5,'Damaged stock'), /negative/);
  assert.throws(() => c.createPurchase(db,'S-1',[
    {productId:'P-102',qty:2,cost:215},
    {productId:'P-102',qty:2,cost:215}
  ]), /once/);
  assert.equal(JSON.stringify(db),snapshot);
});

test('product creation and stock corrections are validated and logged', () => {
  const c = core(), db = c.seed();
  const p = c.addProduct(db,{
    name:'Notebook A5',sku:'GB-500',category:'Stationery',supplierId:'S-3',stock:10,reorder:3,cost:50,price:80
  });
  assert.equal(p.stock,10);
  assert.throws(() => c.addProduct(db,{
    name:'Duplicate',sku:'GB-500',category:'Stationery',supplierId:'S-3',stock:0,reorder:3,cost:50,price:80
  }),/SKU already exists/);
  c.adjust(db,p.id,-2,'Damaged during delivery');
  assert.equal(p.stock,8);
  assert.ok(db.movements.some((m) => m.productId===p.id && m.delta===-2));
});

function demoHarness() {
  const root={innerHTML:'',contains:()=>true};
  let stored=null, printed=false;
  const handlers={},inputs={};
  const document={
    getElementById:(id)=>id==='app'?root:(Object.hasOwn(inputs,id)?{value:inputs[id]}:null),
    addEventListener:(name,fn)=>{handlers[name]=fn;},
    querySelector:()=>null
  };
  const window={confirm:()=>true,scrollTo:()=>{},print:()=>{printed=true;}};
  const storage={getItem:()=>stored,setItem:(key,value)=>{stored=value;}};
  class MockFormData {
    constructor(form){this.values=form.values;}
    entries(){return Object.entries(this.values)[Symbol.iterator]();}
  }
  new Function('document','window','localStorage','crypto','FormData',source+'\n'+app)(
    document,window,storage,testCrypto,MockFormData
  );
  const click=(act,id)=>handlers.click({target:{closest:()=>({dataset:{act,id}})}});
  const change=(id,value)=>handlers.change({target:{id,value}});
  const input=(id,value)=>handlers.input({target:{id,value,dataset:{}}});
  const submit=(kind,values,id)=>handlers.submit({
    preventDefault:()=>{},target:{dataset:{form:kind,id},values}
  });
  return {
    root,inputs,click,change,input,submit,
    data:()=>JSON.parse(stored),
    printed:()=>printed
  };
}

test('interactive UI renders, receives a purchase, checks out, prints, and resets', () => {
  const h=demoHarness();
  assert.match(h.root.innerHTML,/Store overview/);
  h.change('role-switch','stockkeeper');
  h.click('new-po');
  h.inputs['po-item']='P-102';
  h.inputs['po-qty']='20';
  h.inputs['po-cost']='215';
  h.click('po-add-line');
  assert.match(h.root.innerHTML,/Draft lines \(1\)/);
  h.click('po-save');
  let db=h.data();
  const po=db.purchaseOrders[0];
  assert.equal(product(db,'P-102').stock,4);
  h.click('receive',po.id);
  assert.equal(product(h.data(),'P-102').stock,24);
  h.change('role-switch','cashier');
  for(let i=0;i<5;i++)h.click('cart-add','P-102');
  h.input('tender','1500');
  h.click('checkout');
  db=h.data();
  assert.equal(db.sales[0].total,1425);
  assert.equal(db.sales[0].change,75);
  assert.equal(product(db,'P-102').stock,19);
  assert.match(h.root.innerHTML,/SAMPLE RECEIPT/);
  h.click('print');
  assert.equal(h.printed(),true);
  h.click('close');
  h.click('reset');
  assert.equal(product(h.data(),'P-102').stock,4);
});

test('simulated M-Pesa mode never calls a payment service', () => {
  const h=demoHarness();
  h.change('role-switch','cashier');
  h.click('cart-add','P-103');
  h.change('pay-method','M-Pesa');
  assert.match(h.root.innerHTML,/No STK push/);
  h.click('checkout');
  const sale=h.data().sales[0];
  assert.equal(sale.method,'M-Pesa');
  assert.match(sale.reference,/^SIM-MP-/);
  assert.equal(sale.tendered,null);
});

test('UI product creation and stock adjustment',()=>{
  const h=demoHarness();
  h.change('role-switch','stockkeeper');
  h.click('new-product');
  h.submit('product',{name:'Notebook A5',sku:'GB-500',category:'Stationery',supplierId:'S-3',stock:'10',reorder:'3',cost:'50',price:'80'});
  const p=h.data().products.find((x)=>x.sku==='GB-500');
  assert.ok(p);
  assert.equal(p.stock,10);
  h.click('adjust',p.id);
  h.submit('adjust',{delta:'-2',reason:'Damage during handling'},p.id);
  assert.equal(h.data().products.find((x)=>x.id===p.id).stock,8);
});
