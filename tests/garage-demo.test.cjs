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
test('full diagnosis workspace is visible before inspection is recorded', () => {
 const makeViews=vm.runInNewContext(fs.readFileSync(path.join(demoDir,'views.js'),'utf8')+'\n;garageViews',{});
 const d=c.seed(),ui={page:'tickets',ticketId:'T-1041',tab:'diagnosis',search:'',filter:'all',modal:null,document:null};
 const html=makeViews(d,ui,c).main();
 for(const label of ['1 · Inspection findings','2 · Services & labour estimate','3 · Parts Requirements & Price List','4 · Customer approval'])
  assert.ok(html.includes(label));
 assert.ok(html.includes('Record diagnosis'));
 assert.ok(html.includes('Add service fee'));
 assert.ok(html.includes('Add part'));
 assert.ok(html.includes('disabled title="Record inspection findings first"'));
 assert.ok(!html.includes('data-action="request-approval"'));
 assert.ok(!html.includes('data-action="issue-cart"'));
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
test('parts cart contains only independent pending, issued and externally sourced parts', () => {
 const makeViews=vm.runInNewContext(fs.readFileSync(path.join(demoDir,'views.js'),'utf8')+'\n;garageViews',{});
 const d=c.seed(),ui={page:'tickets',ticketId:'T-1043',tab:'cart',search:'',filter:'all',modal:null,document:null};
 const html=makeViews(d,ui,c).main();
 assert.ok(!html.includes('class="stage-lock"'));
 assert.ok(!html.includes('Select from parts requirements'));
 assert.ok(!html.includes('Parts still required before billing'));
 assert.ok(html.includes('Add from inventory'));
 assert.ok(html.includes('Record outside part'));
 assert.ok(html.includes('Parts obtained outside the garage'));
});
test('billing can be visited before repair completion and hosts its only complete-repair action', () => {
 const makeViews=vm.runInNewContext(fs.readFileSync(path.join(demoDir,'views.js'),'utf8')+'\n;garageViews',{});
 const d=c.seed(),ui={page:'tickets',ticketId:'T-1044',tab:'billing',search:'',filter:'all',modal:null,document:null};
 const visible=makeViews(d,ui,c).main();
 assert.ok(!visible.includes('class="stage-lock"'));
 assert.ok(visible.includes('Repair completion'));
 assert.ok(visible.includes('Complete repair'));
 assert.ok(visible.includes('Create invoice'));
 ui.tab='diagnosis';
 const diagnosis=makeViews(d,ui,c).main();
 assert.ok(!diagnosis.includes('data-action="finish-repair"'));
 ui.tab='overview';
 const overview=makeViews(d,ui,c).main();
 assert.ok(!overview.includes('Next action'));
 assert.ok(!overview.includes('data-action="finish-repair"'));
});


test('record diagnosis is shown once outside inspection findings and no separate approval request exists', () => {
 const makeViews=vm.runInNewContext(fs.readFileSync(path.join(demoDir,'views.js'),'utf8')+'\n;garageViews',{});
 const d=c.seed(),ui={page:'tickets',ticketId:'T-1041',tab:'diagnosis',search:'',filter:'all',modal:null,document:null};
 const html=makeViews(d,ui,c).main();
 assert.equal((html.match(/data-action="modal" data-id="diagnosis"/g)||[]).length,1);
 assert.ok(!html.includes('Request customer approval'));
 assert.ok(!html.includes('Next action'));
 const ticket=makeViews(d,{...ui,ticketId:'T-1042'},c).main();
 assert.ok(ticket.includes('Customer approved'));
 assert.ok(ticket.includes('Customer rejected'));
 assert.ok(!ticket.includes('Request customer approval'));
 const app=fs.readFileSync(path.join(demoDir,'app.js'),'utf8');
 assert.ok(app.includes('window.confirm?.("Confirm that the customer approved'));
 assert.ok(app.includes('window.confirm?.("Confirm that the customer rejected'));
});
test('customer approval and rejection can be recorded directly after diagnosis', () => {
 const {d,t}=createDiagnosed();
 c.addService(d,t.id,{description:'Repair brake pads',quantity:1,unitPrice:800,discount:0,kind:'repair'});
 c.approve(d,t.id);
 assert.equal(t.approval.decision,'Approved');
 const other=createDiagnosed();
 c.addService(other.d,other.t.id,{description:'Repair brake pads',quantity:1,unitPrice:800,discount:0,kind:'repair'});
 c.reject(other.d,other.t.id);
 assert.equal(other.t.status,'rejected');
});
test('posting invoice before service completion does not permit early release', () => {
 const {d,t}=createDiagnosed();
 approveWithPart(d,t);
 issue(d,t);
 const inv=c.invoiceTicket(d,t.id);
 assert.equal(inv.total,2950);
 assert.equal(t.status,'invoiced');
 c.payment(d,t.id,{amount:inv.total,method:'Cash'});
 assert.throws(()=>c.release(d,t.id),/Complete repair before releasing/i);
 c.completeService(d,t.id,t.services[0].id);
 c.finishRepair(d,t.id);
 assert.equal(t.status,'invoiced');
 assert.equal(t.repairCompleted,true);
 assert.equal(t.invoice.total,inv.total);
 c.release(d,t.id);
 assert.equal(t.status,'released');
});
test('finishing repairs before invoicing also works, and invoice amount is stable', () => {
 const {d,t}=createDiagnosed();
 approveWithPart(d,t);
 issue(d,t);
 c.completeService(d,t.id,t.services[0].id);
 c.finishRepair(d,t.id);
 assert.equal(t.status,'ready-for-billing');
 const invoice=c.invoiceTicket(d,t.id);
 assert.equal(invoice.total,2950);
 c.payment(d,t.id,{amount:2950,method:'Cash'});
 c.release(d,t.id);
 assert.equal(t.status,'released');
});


test('saving diagnosis navigates to Diagnosis & Estimate', () => {
 const app=fs.readFileSync(path.join(demoDir,'app.js'),'utf8');
 assert.ok(app.includes('c.diagnose(w,ui.ticketId,p),"Diagnosis recorded.",()=>{ui.tab="diagnosis";}'));
});
test('a pending cart item blocks invoicing but suggested parts do not', () => {
 const makeViews=vm.runInNewContext(fs.readFileSync(path.join(demoDir,'views.js'),'utf8')+'\n;garageViews',{});
 const {d,t}=createDiagnosed();
 approveWithPart(d,t);
 c.addToCart(d,t.id,'SKU-1',1,0);
 const ui={page:'tickets',ticketId:t.id,tab:'billing',search:'',filter:'all',modal:null,document:null};
 const before=makeViews(d,ui,c).main();
 assert.ok(!before.includes('class="stage-lock"'));
 assert.ok(!before.includes('Required parts not yet fulfilled'));
 assert.ok(!before.includes('data-action="invoice"'));
 assert.throws(()=>c.invoiceTicket(d,t.id),/pending cart|Clear pending cart/i);
 c.removeCart(d,t.id,t.cart[0].id);
 const after=makeViews(d,ui,c).main();
 assert.ok(after.includes('Create invoice'));
 const result=c.invoiceTicket(d,t.id);
 assert.equal(result.total,2100);
});
test('recording an outside part requires no matching requirement or garage stock', () => {
 const {d,t}=createDiagnosed();
 approveWithPart(d,t);
 const stockBefore=d.inventory.map(x=>x.quantity);
 const external=c.recordOutsidePart(d,t.id,{name:'Rear bumper',quantity:1,source:'external'});
 assert.equal(external.source,'Purchased outside');
 assert.equal(t.externalParts.length,1);
 assert.equal(t.cart.length,0);
 assert.equal(t.issues.length,0);
 assert.equal(c.charges(t).parts,0);
 assert.equal(d.inventory.every((x,i)=>x.quantity===stockBefore[i]),true);
 const makeViews=vm.runInNewContext(fs.readFileSync(path.join(demoDir,'views.js'),'utf8')+'\n;garageViews',{});
 const h=makeViews(d,{page:'tickets',ticketId:t.id,tab:'cart',search:'',filter:'all',modal:null,document:null},c).main();
 assert.ok(h.includes('Rear bumper'));
 assert.ok(h.includes('Purchased outside'));
});
test('informational parts estimate does not prevent invoice or repair completion', () => {
 const {d,t}=createDiagnosed();
 c.addService(d,t.id,{description:'Inspect and repair steering',quantity:1,unitPrice:1500,discount:0,kind:'repair'});
 const r=c.addRequirement(d,t.id,{description:'Suggested steering linkage',quantity:2,itemId:null});
 c.approve(d,t.id);
 assert.equal(t.status,'in-repair');
 assert.equal(t.requirements.length,1);
 c.completeService(d,t.id,t.services[0].id);
 c.finishRepair(d,t.id);
 const inv=c.invoiceTicket(d,t.id);
 assert.equal(inv.total,1500);
 assert.equal(t.requirements[0].id,r.id);
 assert.equal(t.issues.length,0);
});
test('outside parts received from customer are separate from estimated suggestions', () => {
 const {d,t}=createDiagnosed();
 c.addService(d,t.id,{description:'Install supplied part',quantity:1,unitPrice:1000,discount:0,kind:'repair'});
 c.approve(d,t.id);
 const p=c.recordOutsidePart(d,t.id,{name:'Used radiator',quantity:1,source:'customer'});
 assert.equal(p.source,'Customer supplied');
 assert.equal(t.requirements.length,0);
 c.completeService(d,t.id,t.services[0].id);
 c.finishRepair(d,t.id);
 assert.equal(c.invoiceTicket(d,t.id).total,1000);
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
test('customer-supplied actual part does not affect suggestions, stock or garage parts revenue', () => {
 const {d,t}=createDiagnosed();
 c.addService(d,t.id,{description:'Fit customer-provided bumper',quantity:1,unitPrice:2000,discount:0,kind:'repair'});
 c.addRequirement(d,t.id,{description:'Rear bumper suggested',quantity:1});
 c.approve(d,t.id);
 const before=c.stock(d,'SKU-1').quantity;
 const part=c.recordOutsidePart(d,t.id,{name:'Bumper supplied by customer',quantity:1,source:'customer'});
 assert.equal(part.source,'Customer supplied');
 assert.equal(t.requirements.length,1);
 assert.equal(t.externalParts.length,1);
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
