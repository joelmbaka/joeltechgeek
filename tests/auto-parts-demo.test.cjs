const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..','public','demos','auto-parts');
const coreCode=fs.readFileSync(path.join(base,'core.js'),'utf8');
const appCode=fs.readFileSync(path.join(base,'app.js'),'utf8');
const core=new Function(coreCode+'\nreturn autoPartsCore;')();
test('two-role app and standalone page avoid overview and quotations',()=>{
  assert.match(appCode,/Sales Counter/);
  assert.match(appCode,/Back Office/);
  assert.doesNotMatch(appCode,/["']dashboard["']|["']quotations["']/);
  assert.match(fs.readFileSync(path.join(base,'demo.html'),'utf8'),/\/demos\/retail\/styles.css/);
});
test('customer is optional, sales reduce stock and generate a receipt with frozen costs',()=>{
  const d=core.seed(),p=d.products[0],before=p.stock;
  const sale=core.sale(d,{lines:[{productId:p.id,qty:2}],method:'Cash',tendered:100});
  assert.equal(p.stock,before-2);
  assert.equal(sale.customerId,null);
  assert.match(sale.id,/^R-/);
  assert.equal(sale.cogs,44);
  assert.equal(sale.total,78);
  assert.equal(sale.change,22);
  assert.equal(d.sales.length,1);
});
test('checkout is atomic when stock is insufficient or a duplicated line is supplied',()=>{
  const d=core.seed(),a=d.products[0],b=d.products[1],before=JSON.stringify(d);
  assert.throws(()=>core.sale(d,{lines:[{productId:a.id,qty:1},{productId:b.id,qty:100}],method:'Cash'}),/Not enough stock/);
  assert.equal(JSON.stringify(d),before);
  assert.throws(()=>core.sale(d,{lines:[{productId:a.id,qty:1},{productId:a.id,qty:1}],method:'Cash'}),/Duplicate/);
  assert.equal(JSON.stringify(d),before);
});
test('supplier purchase updates inventory and weighted average cost',()=>{
  const d=core.seed(),p=d.products[0],before=p.stock;
  const item=core.purchase(d,{supplierId:d.suppliers[0].id,lines:[{productId:p.id,qty:8,cost:14}]});
  assert.equal(item.status,'Received');
  assert.equal(p.stock,before+8);
  assert.equal(p.cost,core.money((22*before+14*8)/(before+8)));
});
test('invalid purchase cannot partially mutate inventory',()=>{
  const d=core.seed(),p=d.products[0],before=JSON.stringify(d);
  assert.throws(()=>core.purchase(d,{supplierId:d.suppliers[0].id,lines:[{productId:p.id,qty:2,cost:10},{productId:p.id,qty:3,cost:10}]}),/once/);
  assert.equal(JSON.stringify(d),before);
});
test('monthly profitability is revenue minus historical sale cost and expenses',()=>{
  const d=core.seed(),p=d.products[0];
  const s=core.sale(d,{lines:[{productId:p.id,qty:2}],method:'Card'});
  const month=s.date.slice(0,7);
  core.expense(d,{category:'Rent',amount:20,date:month+'-02'});
  const r=core.report(d,month);
  assert.equal(r.revenue,78);
  assert.equal(r.cogs,44);
  assert.equal(r.gross,34);
  assert.equal(r.expenses,20);
  assert.equal(r.net,14);
  p.cost=100;
  assert.equal(core.report(d,month).cogs,44,'historical COGS must remain unchanged');
});
test('customer can be associated with sale and receipt',()=>{
  const d=core.seed(),c=core.customer(d,{name:'Repair workshop',phone:'123'});
  const sale=core.sale(d,{lines:[{productId:d.products[1].id,qty:1}],customerId:c.id,method:'Bank transfer'});
  assert.equal(sale.customerId,c.id);
});
