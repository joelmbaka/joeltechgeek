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
  const owner = c.createCustomer(d, { name: 'Demo Client', phone: '0712345678' });
  const vehicle = c.createVehicle(d, {
    customerId: owner.id, plate: 'KDW 900Q', model: 'Toyota Fielder',
    year: 2018, mileage: 84000,
  });
  const t = c.createTicket(d, {vehicleId: vehicle.id, complaint: 'Brake noise while stopping'});
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
  assert.throws(()=>c.createVehicle(d,{customerId:d.customers[0].id,plate:'KDW 900Q',model:'Mazda Demio',year:2017,mileage:1}),/Registration already exists/);
});

test('customer can exist without a vehicle and can own multiple vehicles', () => {
  const d=c.seed(), before=d.vehicles.length;
  const owner=c.createCustomer(d,{name:'Amina Njeri',phone:'0712345678'});
  assert.equal(d.vehicles.length,before);
  assert.equal(d.customers.find(x=>x.id===owner.id).name,'Amina Njeri');
  const one=c.createVehicle(d,{customerId:owner.id,plate:'KDW 123A',model:'Toyota Axio',year:2017,mileage:53000});
  const two=c.createVehicle(d,{customerId:owner.id,plate:'KDW 456B',model:'Honda Fit',year:2018,mileage:72000});
  assert.equal(one.customerId,owner.id);
  assert.equal(two.customerId,owner.id);
  assert.equal(d.vehicles.filter(x=>x.customerId===owner.id).length,2);
});
test('vehicle registration requires an existing customer and rejects duplicate plates', () => {
  const d=c.seed();
  assert.throws(()=>c.createVehicle(d,{customerId:'MISSING',plate:'KDW 123A',model:'Toyota Axio',year:2017,mileage:53000}),/Customer not found/);
  assert.throws(()=>c.createVehicle(d,{customerId:d.customers[0].id,plate:'KDM 123A',model:'Toyota Axio',year:2017,mileage:53000}),/Registration already exists/);
});
test('new ticket requires a registered vehicle and does not create customers', () => {
  const d=c.seed(), count=d.customers.length;
  assert.throws(()=>c.createTicket(d,{vehicleId:'MISSING',complaint:'Brake inspection needed'}),/Vehicle not found/);
  const vehicle=c.createVehicle(d,{customerId:d.customers[0].id,plate:'KDW 777X',model:'Toyota Corolla',year:2016,mileage:67000});
  const ticket=c.createTicket(d,{vehicleId:vehicle.id,complaint:'Brake inspection needed'});
  assert.equal(ticket.vehicleId,vehicle.id);
  assert.equal(d.customers.length,count);
});
test('customer and vehicle actions are kept out of new ticket dialog', () => {
  const source=fs.readFileSync(path.join(demoDir,'views.js'),'utf8');
  const dialog=source.split('}else if(kind==="ticket"){')[1].split('}else if(kind==="appointment"){')[0];
  assert.ok(!dialog.includes('Add customer'));
  assert.ok(!dialog.includes('Add vehicle'));
  assert.ok(!dialog.includes('open-customer'));
  assert.ok(dialog.includes('Customer complaint'));
});

test('active appointment blocks direct ticket creation and converts only through booking', () => {
  const d=c.seed(),booking=d.appointments.find(a=>a.id==='APT-23');
  assert.equal(booking.vehicleId,'VH-9');
  assert.throws(()=>c.createTicket(d,{vehicleId:booking.vehicleId,complaint:'Vehicle arrived for suspension inspection'}),/active appointment/i);
  const t=c.createTicket(d,{vehicleId:booking.vehicleId,complaint:booking.concern,appointmentId:booking.id});
  assert.equal(t.appointmentId,booking.id);
  assert.equal(booking.ticketId,t.id);
  assert.equal(booking.status,'Completed');
  assert.equal(d.appointments.filter(c.activeAppointment).some(a=>a.id===booking.id),false);
  assert.throws(()=>c.createTicket(d,{vehicleId:booking.vehicleId,complaint:booking.concern,appointmentId:booking.id}),/active ticket/i);
});
test('walk-in vehicle without appointment can create a ticket', () => {
  const d=c.seed();
  const t=c.createTicket(d,{vehicleId:'VH-8',complaint:'Routine inspection required today'});
  assert.equal(t.vehicleId,'VH-8');
  assert.equal(t.appointmentId,null);
});
test('appointment conversion cannot use another vehicle or a completed booking', () => {
  const d=c.seed(),a=d.appointments.find(x=>x.id==='APT-23');
  assert.throws(()=>c.createTicket(d,{vehicleId:'VH-8',complaint:a.concern,appointmentId:a.id}),/cannot be converted/i);
  const t=c.createTicket(d,{vehicleId:a.vehicleId,complaint:a.concern,appointmentId:a.id});
  assert.equal(t.appointmentId,a.id);
  assert.throws(()=>c.createTicket(d,{vehicleId:'VH-8',complaint:'Routine inspection required today',appointmentId:a.id}),/cannot be converted/i);
});
test('sidebar and labels distinguish create from open', () => {
  const source=fs.readFileSync(path.join(demoDir,'views.js'),'utf8');
  const nav=source.slice(source.indexOf('const NAV='),source.indexOf('const btn='));
  assert.ok(nav.indexOf('"appointments"')<nav.indexOf('"tickets"'));
  assert.ok(source.includes('Create ticket'));
  assert.ok(source.includes('Open ticket'));
  assert.ok(source.includes('filter(a=>c.activeAppointment(a))'));
});

test('custom part requirements never create stock or parts revenue', () => {
 const d=c.seed(),t=c.ticket(d,'T-1042'),before=d.inventory.length;
 const requirement=c.addRequirement(d,t.id,{description:'Imported custom steering linkage',quantity:2,itemId:null,discount:0});
 assert.equal(requirement.itemId,null);
 assert.equal(requirement.description,'Imported custom steering linkage');
 assert.equal(d.inventory.length,before);
 assert.equal(c.charges(t).parts,0);
});
test('catalogue name and source are separate controls with a custom-name choice', () => {
 const views=fs.readFileSync(path.join(demoDir,'views.js'),'utf8');
 const form=views.slice(views.indexOf('}else if(kind==="requirement"){'),views.indexOf('}else if(kind==="cart"){'));
 assert.ok(form.includes('select("Part name","partChoice"'));
 assert.ok(form.includes('Not in catalogue — enter part name'));
 assert.ok(form.includes('select("Source","source"'));
 assert.ok(form.indexOf('select("Part name"')<form.indexOf('select("Source"'));
 assert.ok(form.includes('custom-part-field'));
 const app=fs.readFileSync(path.join(demoDir,'app.js'),'utf8');
 assert.ok(app.includes('function syncRequirementForm(form)'));
 assert.ok(app.includes('custom?p.description:chosen.name'));
});
test('five ticket tabs keep later stages visible and replace premature content with a large lock', () => {
 const views=fs.readFileSync(path.join(demoDir,'views.js'),'utf8');
 const makeViews=vm.runInNewContext(views+'\n;garageViews',{});
 const d=c.seed(),ui={page:'tickets',ticketId:'T-1041',tab:'cart',search:'',filter:'all',modal:null,document:null};
 const rendered=makeViews(d,ui,c).main();
 for(const id of ['overview','diagnosis','cart','billing','history'])assert.ok(rendered.includes('data-tab="'+id+'"'));
 assert.ok(!rendered.includes('data-tab="requirements"'));
 assert.ok(!rendered.includes('data-tab="services"'));
 assert.ok(rendered.includes('class="stage-lock"'));
 assert.ok(rendered.includes('Customer approval required'));
 assert.ok(rendered.includes('data-tab="diagnosis"'));
 assert.ok(!rendered.includes('data-action="issue-cart"'));
 assert.ok(!rendered.includes('Pending cart'));
});
test('diagnosis and estimate includes services, required parts and customer decision in one tab', () => {
 const makeViews=vm.runInNewContext(fs.readFileSync(path.join(demoDir,'views.js'),'utf8')+'\n;garageViews',{});
 const d=c.seed(),ui={page:'tickets',ticketId:'T-1042',tab:'diagnosis',search:'',filter:'all',modal:null,document:null};
 const html=makeViews(d,ui,c).main();
 for(const label of ['Inspection findings','Services & labour estimate','Parts Requirements & Price List','Customer approval'])
  assert.ok(html.includes(label));
 assert.ok(html.includes('View / share list'));
 assert.ok(!html.includes('id="requirements-cart"'));
});
test('approved repair can use parts cart and see required inventory and customer-sourced actions', () => {
 const makeViews=vm.runInNewContext(fs.readFileSync(path.join(demoDir,'views.js'),'utf8')+'\n;garageViews',{});
 const d=c.seed(),ui={page:'tickets',ticketId:'T-1043',tab:'cart',search:'',filter:'all',modal:null,document:null};
 const html=makeViews(d,ui,c).main();
 assert.ok(!html.includes('class="stage-lock"'));
 assert.ok(html.includes('id="requirements-cart"'));
 assert.ok(html.includes('Mark customer part received'));
 assert.ok(html.includes('Add selected to cart'));
});
test('billing stays locked until repair is finished or customer declines', () => {
 const makeViews=vm.runInNewContext(fs.readFileSync(path.join(demoDir,'views.js'),'utf8')+'\n;garageViews',{});
 const d=c.seed(),ui={page:'tickets',ticketId:'T-1044',tab:'billing',search:'',filter:'all',modal:null,document:null};
 const locked=makeViews(d,ui,c).main();
 assert.ok(locked.includes('Finish the repair first'));
 assert.ok(!locked.includes('Ticket financials'));
 ui.ticketId='T-1047';
 const unlocked=makeViews(d,ui,c).main();
 assert.ok(!unlocked.includes('class="stage-lock"'));
 assert.ok(unlocked.includes('Create invoice'));
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
