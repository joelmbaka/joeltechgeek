const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..','public','demos','car-rental');
const coreSource=fs.readFileSync(path.join(base,'core.js'),'utf8');
const appSource=fs.readFileSync(path.join(base,'app.js'),'utf8');
const c=new Function(coreSource+'\nreturn rentalCore;')();
const seed=()=>c.seed('2026-11-07T08:00:00.000Z');
test('browser app compiles and has four owner tabs with nested tracking',()=>{
 assert.doesNotThrow(()=>new Function('rentalCore',appSource));
 assert.match(appSource,/\["fleet","Fleet"/);
 assert.match(appSource,/\["alerts","Alerts"/);
 assert.match(appSource,/\["finance","Finance"/);
 assert.match(appSource,/\["customers","Customers"/);
 assert.match(appSource,/\["tracking","GPS"/);
 assert.doesNotMatch(appSource,/role-switch/);
});
test('12 fictional vehicles, varied rentals and customer ID profiles',()=>{
 const d=seed();
 assert.equal(d.vehicles.length,12);
 assert.equal(d.customers.length,8);
 assert.ok(d.vehicles.every(v=>v.cc>0&&v.seats>0&&v.rate>0));
 assert.ok(d.customers.every(x=>x.documentNo&&x.phone));
 assert.ok([2,3,7,14].every(days=>d.rentals.some(r=>r.days===days)));
 assert.ok(d.rentals.some(r=>c.overdue(r,'2026-11-07T08:00:00.000Z')));
 assert.ok(d.rentals.some(r=>c.payStatus(d,r)==='Partially paid'));
 assert.ok(d.rentals.some(r=>c.payStatus(d,r)==='Unpaid'));
 assert.ok(d.rentals.some(r=>c.payStatus(d,r)==='Paid'));
 assert.equal(d.vehicles.filter(v=>c.status(d,v)==='Maintenance').length,2);
});
test('24-hour rental, initial payment, and preventing second active rental',()=>{
 const d=seed(),v=d.vehicles.find(v=>c.status(d,v)==='Available');
 const r=c.startRental(d,{vehicleId:v.id,customerId:d.customers[0].id,start:'2026-11-07T10:00:00Z',days:3,rate:40,initialPayment:25,method:'Cash'});
 assert.equal(new Date(r.due)-new Date(r.start),3*24*60*60*1000);
 assert.equal(c.due(d,r),95);
 assert.equal(d.rentals.filter(x=>x.id===r.id).length,1);
 const snapshot=JSON.stringify(d);
 assert.throws(()=>c.startRental(d,{vehicleId:v.id,customerId:d.customers[1].id,start:'2026-11-08T10:00:00Z',days:2,rate:40}),/available/);
 assert.equal(JSON.stringify(d),snapshot);
});
test('partial payments cannot exceed balance, extensions preserve payments',()=>{
 const d=seed(),v=d.vehicles.find(v=>c.status(d,v)==='Available');
 const r=c.startRental(d,{vehicleId:v.id,customerId:d.customers[0].id,start:'2026-11-07T10:00:00Z',days:2,rate:35});
 c.recordPayment(d,{rentalId:r.id,amount:20,method:'Card'});
 assert.equal(c.payStatus(d,r),'Partially paid');
 assert.throws(()=>c.recordPayment(d,{rentalId:r.id,amount:100,method:'Cash'}),/exceeds/);
 const extended=c.extendRental(d,r.id,2,'2026-11-07T08:00:00Z');
 assert.equal(extended.days,4);
 assert.equal(c.total(extended),140);
 assert.equal(c.due(d,extended),120);
 assert.equal(c.payments(d,r.id),20);
});
test('return may close without full payment; customer can pay after return',()=>{
 const d=seed(),v=d.vehicles.find(v=>c.status(d,v)==='Available');
 const r=c.startRental(d,{vehicleId:v.id,customerId:d.customers[0].id,start:'2026-11-07T10:00:00Z',days:3,rate:50});
 const closed=c.returnVehicle(d,{rentalId:r.id,returnedAt:'2026-11-09T10:00:00Z',odometer:v.odometer+200,extra:15,payment:65,method:'Cash',maintenance:true});
 assert.equal(c.due(d,closed),100);
 assert.equal(c.status(d,c.vehicle(d,v.id)),'Maintenance');
 assert.equal(c.payStatus(d,closed),'Partially paid');
 c.recordPayment(d,{rentalId:r.id,amount:100,method:'Bank transfer'});
 assert.equal(c.due(d,closed),0);
 assert.equal(c.status(d,c.vehicle(d,v.id)),'Maintenance');
 c.setMaintenance(d,v.id,false);
 assert.equal(c.status(d,c.vehicle(d,v.id)),'Available');
});
test('failed return and invalid negative expenses do not partially modify data',()=>{
 const d=seed(),r=d.rentals.find(r=>!r.returnedAt);
 const before=JSON.stringify(d);
 assert.throws(()=>c.returnVehicle(d,{rentalId:r.id,returnedAt:r.start,odometer:0,extra:0}),/odometer/);
 assert.equal(JSON.stringify(d),before);
 assert.throws(()=>c.expense(d,{category:'Rent',amount:-5}),/greater than zero/);
 assert.equal(JSON.stringify(d),before);
});
test('maintenance and vehicle expenses roll into monthly finance once',()=>{
 const d=seed(),v=d.vehicles.find(v=>c.status(d,v)==='Available');
 c.maintenance(d,{vehicleId:v.id,date:'2026-11-07',cost:75,type:'Service',odometer:v.odometer});
 c.expense(d,{vehicleId:v.id,date:'2026-11-07',amount:25,category:'Insurance'});
 const report=c.finance(d,'2026-11',v.id);
 assert.equal(report.expenses,100);
 assert.equal(report.net,report.revenue-report.expenses);
});
test('GPS route has timestamped coordinates and ignition events',()=>{
 const d=seed(),route=d.vehicles[0].route;
 assert.ok(route.length>5);
 assert.ok(route.every(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Number.isFinite(p.speed)));
 assert.ok(route.some(p=>p.event==='Ignition on'));
 assert.ok(route.some(p=>p.event==='Ignition off'));
});
