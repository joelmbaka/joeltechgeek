const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const demoDir = path.join(__dirname, '..', 'public', 'demos', 'garage');
const source = fs.readFileSync(path.join(demoDir, 'core.js'), 'utf8');
const c = vm.runInNewContext(source + '\n;garageCore', {});

function createDiagnosed() {
  const d = c.seed();
  const vehicle = c.createCustomerVehicle(d, {
    name: 'Demo Client', phone: '0712345678', plate: 'KDW 900Q',
    model: 'Toyota Fielder', year: 2018, mileage: 84000,
  });
  const t = c.openTicket(d, {vehicleId: vehicle.id, complaint: 'Brake noise while stopping'});
  c.diagnose(d, t.id, {findings: 'Front brake pads worn and fluid needs replacement', feasible: 'yes'});
  return { d, t };
}
function approveWithPart(d,t,quantity=1) {
  c.addService(d,t.id,{description:'Replace worn pads',quantity:1,unitPrice:2100,discount:0,kind:'repair'});
  c.requireInventory(d,t.id,'SKU-1',quantity,0);
  c.requestApproval(d,t.id);c.approve(d,t.id);
}
function issue(d,t,item='SKU-1',qty=1) {
  c.addToCart(d,t.id,item,qty,0);
  return c.issueCart(d,t.id);
}
test('fixture has complete modules and realistic starting tickets', () => {
  const d=c.seed();
  assert.equal(c.valid(d),true);
  assert.ok(d.tickets.length>=7);
  assert.ok(d.inventory.some(x=>x.quantity===0));
  assert.ok(d.tickets.some(x=>x.status==='released'));
  assert.ok(d.tickets.some(x=>x.status==='awaiting-approval'));
});
test('new customer and vehicle create an open ticket without duplicate registration', () => {
  const {d,t}=createDiagnosed();
  assert.equal(t.status,'estimating');
  assert.equal(c.customerFor(d,t).name,'Demo Client');
  assert.throws(()=>c.createCustomerVehicle(d,{name:'Other',phone:'0711223344',plate:'KDW 900Q',model:'Mazda Demio',year:2017,mileage:1}),/Registration already exists/);
});
test('parts requirements are informational and do not deduct stock', () => {
  const {d,t}=createDiagnosed();
  const initial=c.stock(d,'SKU-1').quantity;
  c.requireInventory(d,t.id,'SKU-1',1,100);
  assert.equal(c.stock(d,'SKU-1').quantity,initial);
  assert.equal(t.issues.length,0);
  assert.equal(c.charges(t).parts,0);
});
test('approval required before adding cart or issuing parts', () => {
  const {d,t}=createDiagnosed();
  assert.throws(()=>c.addToCart(d,t.id,'SKU-1',1),/approval/i);
  approveWithPart(d,t);
  assert.ok(['awaiting-parts','in-repair'].includes(t.status));
});
test('confirming cart deducts quantity and preserves historical unit cost', () => {
  const {d,t}=createDiagnosed();
  approveWithPart(d,t);
  const initial=c.stock(d,'SKU-1').quantity;
  c.addToCart(d,t.id,'SKU-1',1,0);
  assert.equal(c.stock(d,'SKU-1').quantity,initial);
  const rows=c.issueCart(d,t.id);
  assert.equal(c.stock(d,'SKU-1').quantity,initial-1);
  assert.equal(rows[0].unitCost,520);
  assert.equal(c.charges(t).parts,850);
  assert.equal(c.charges(t).cost,520);
  assert.equal(t.cart.length,0);
});
test('an item not on requirements can still be issued from stock', () => {
  const {d,t}=createDiagnosed();
  approveWithPart(d,t);
  issue(d,t,'SKU-6',1);
  assert.equal(c.stock(d,'SKU-6').quantity,11);
  assert.equal(c.charges(t).parts,350);
});
test('returning issued stock restores quantity, sales and cost', () => {
  const {d,t}=createDiagnosed();
  approveWithPart(d,t,2);
  const initial=c.stock(d,'SKU-1').quantity;
  const [row]=issue(d,t,'SKU-1',2);
  assert.equal(c.charges(t).parts,1700);
  c.returnIssue(d,t.id,row.id,1);
  assert.equal(c.stock(d,'SKU-1').quantity,initial-1);
  assert.equal(c.charges(t).parts,850);
  assert.equal(c.charges(t).cost,520);
  assert.throws(()=>c.returnIssue(d,t.id,row.id,2),/exceeds issued quantity/);
});
test('customer-provided parts fulfil requirements without affecting inventory or parts revenue', () => {
  const {d,t}=createDiagnosed();
  c.addService(d,t.id,{description:'Fit customer-provided bumper',quantity:1,unitPrice:2000,discount:0,kind:'repair'});
  const r=c.addRequirement(d,t.id,{description:'Rear bumper',quantity:1});
  c.requestApproval(d,t.id);c.approve(d,t.id);
  const before=c.stock(d,'SKU-1').quantity;
  c.receiveCustomerPart(d,t.id,r.id,1);
  assert.equal(t.status,'in-repair');
  assert.equal(c.stock(d,'SKU-1').quantity,before);
  assert.equal(c.charges(t).parts,0);
});
test('rejecting an estimate does not bill uncompleted repairs', () => {
  const {d,t}=createDiagnosed();
  c.addService(d,t.id,{description:'Diagnosis fee',quantity:1,unitPrice:1000,discount:0,kind:'diagnosis'});
  c.addService(d,t.id,{description:'Replacement labour',quantity:1,unitPrice:3000,discount:0,kind:'repair'});
  c.requestApproval(d,t.id);c.reject(d,t.id,'Customer declined repair');
  assert.equal(c.charges(t).services,1000);
  c.invoiceTicket(d,t.id);
  assert.equal(t.invoice.total,1000);
  assert.throws(()=>c.release(d,t.id),/balance|settle/i);
  c.payment(d,t.id,{amount:1000,method:'Cash'});
  c.release(d,t.id);
  assert.equal(t.status,'released');
});
test('repair unavailable can be released with no diagnosis fee', () => {
  const d=c.seed(),t=c.ticket(d,'T-1045');
  c.diagnose(d,t.id,{findings:'Repair equipment unavailable at this workshop',feasible:'no'});
  assert.equal(t.status,'cannot-repair');
  c.release(d,t.id);
  assert.equal(t.status,'released');
});
test('complete repair, invoice, partial payment and release only after settlement', () => {
  const {d,t}=createDiagnosed();
  approveWithPart(d,t);
  issue(d,t);
  const sv=t.services[0];c.completeService(d,t.id,sv.id);
  c.finishRepair(d,t.id);
  c.invoiceTicket(d,t.id);
  assert.equal(t.invoice.total,2950);
  assert.throws(()=>c.payment(d,t.id,{amount:3000,method:'Cash'}),/exceeds/i);
  c.payment(d,t.id,{amount:1000,method:'Cash'});
  assert.throws(()=>c.release(d,t.id),/outstanding/i);
  c.payment(d,t.id,{amount:1950,method:'M-Pesa (sample)'});
  c.release(d,t.id);
  assert.equal(t.status,'released');
  assert.equal(c.charges(t).outstanding,0);
});
test('invoice and released tickets cannot be mutated', () => {
  const d=c.seed(),t=c.ticket(d,'T-1048');
  assert.throws(()=>c.addToCart(d,t.id,'SKU-1',1),/closed/i);
  assert.throws(()=>c.release(d,t.id),/Already released/);
});
test('persisted fictional data validates and reset returns fresh state', () => {
  const {d}=createDiagnosed();
  const restored=JSON.parse(JSON.stringify(d));
  assert.equal(c.valid(restored),true);
  const reset=c.seed();
  assert.equal(reset.tickets.length,8);
  assert.notEqual(reset.tickets.length,d.tickets.length);
});
test('demo HTML loads existing assets and never embeds a live payment gateway', () => {
  const html=fs.readFileSync(path.join(demoDir,'demo.html'),'utf8');
  for(const asset of ['styles.css','core.js','views.js','app.js'])assert.ok(html.includes('/demos/garage/'+asset));
  const page=fs.readFileSync(path.join(__dirname,'..','app','demos','garage','page.tsx'),'utf8');
  assert.match(page,/browser-local|locally/);
  assert.match(page,/no database|There is no database/i);
});
