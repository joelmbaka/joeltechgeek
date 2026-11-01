const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'..','public','demos','logistics');
const coreSrc=fs.readFileSync(path.join(dir,'core.js'),'utf8');
const appSrc=fs.readFileSync(path.join(dir,'app.js'),'utf8');
const html=fs.readFileSync(path.join(dir,'demo.html'),'utf8');
const core=()=>new Function(coreSrc+'\nreturn cargoCore;')();
const fields=(x={})=>({originId:'mombasa-port',destinationId:'nairobi-icd',cargo:'Fictional forty foot container',weightTons:'20',driverPay:'280000',routeMiles:'305',containerNo:'FICT-2026-001',...x});
function browser(preloaded=null){
 const events={},root={innerHTML:'',contains:()=>true};let saved=preloaded;
 const doc={getElementById:(id)=>id==='app'?root:null,addEventListener:(type,fn)=>{events[type]=fn}};
 const storage={getItem:()=>saved,setItem:(key,value)=>{saved=value}};
 const win={confirm:()=>true};
 class FD{constructor(form){this.fields=form.fields}entries(){return Object.entries(this.fields)[Symbol.iterator]()}}
 new Function('document','window','localStorage','FormData',coreSrc+'\n'+appSrc)(doc,win,storage,FD);
 return {
  root,data:()=>JSON.parse(saved),snapshot:()=>saved,
  action:(action,id)=>events.click({target:{closest:()=>({dataset:{action,id}})}}),
  tab:tab=>events.click({target:{closest:()=>({dataset:{tab}})}}),
  open:load=>events.click({target:{closest:()=>({dataset:{load}})}}),
  page:page=>events.click({target:{closest:()=>({dataset:{page}})}}),
  role:value=>events.change({target:{id:'demo-role',value}}),
  filter:value=>events.change({target:{id:'board-filter',value}}),
  query:value=>events.input({target:{id:'load-search',value,selectionStart:value.length,selectionEnd:value.length}}),
  form:values=>events.submit({preventDefault:()=>{},target:{id:'cargo-form',dataset:{kind:'new'},fields:values}}),
  editForm:values=>events.submit({preventDefault:()=>{},target:{id:'cargo-form',dataset:{kind:'edit'},fields:values}})
 };
}
test('seed: loads span all statuses and two roles start without an active driver booking',()=>{
 const c=core(),d=c.seed();
 assert.equal(d.loads.length,10);
 assert.equal(c.validate(d),true);
 for(const s of ['Open','Booked','Assigned','Picked up','In transit','Delivered','Complete'])assert.ok(d.loads.some(l=>l.status===s),s);
 assert.equal(c.active(d),undefined);
 assert.equal(c.metrics(d).owed,280000);
});
test('dispatcher posting validates locations, uniqueness and driver pay',()=>{
 const c=core(),d=c.seed(),before=JSON.stringify(d);
 assert.throws(()=>c.post(d,fields({originId:'invalid'})),/Select both/);
 assert.throws(()=>c.post(d,fields({destinationId:'mombasa-port'})),/must differ/);
 assert.throws(()=>c.post(d,fields({driverPay:'0'})),/whole number/);
 assert.throws(()=>c.post(d,fields({containerNo:'DEMO-LD-3088'})),/already assigned/);
 assert.equal(JSON.stringify(d),before);
 const l=c.post(d,fields());assert.equal(l.driverPay,280000);assert.equal(l.status,'Open');
});
test('dispatcher can edit and delete only open loads without changing booked loads',()=>{
 const c=core(),d=c.seed(),l=c.post(d,fields());
 c.edit(d,l.id,fields({driverPay:'310000',destinationId:'kisumu',routeMiles:'465'}));
 assert.equal(l.driverPay,310000);assert.equal(l.destinationId,'kisumu');
 c.book(d,l.id);
 const before=JSON.stringify(d);
 assert.throws(()=>c.edit(d,l.id,fields()),/Only open/);
 assert.throws(()=>c.remove(d,l.id),/Only open/);
 assert.equal(JSON.stringify(d),before);
 const open=c.post(d,fields({containerNo:'DELETE-ME-002'}));c.remove(d,open.id);
 assert.equal(c.find(d,open.id),undefined);
});
test('single-active-load booking lock and truck-capacity check',()=>{
 const c=core(),d=c.seed();
 d.driver.capacityTons=18;const before=JSON.stringify(d);
 assert.throws(()=>c.book(d,'LD-3088'),/exceeds your truck/);
 assert.equal(JSON.stringify(d),before);
 d.driver.capacityTons=28;
 c.book(d,'LD-3088');assert.equal(c.find(d,'LD-3088').status,'Booked');
 assert.throws(()=>c.book(d,'LD-3089'),/already have a booked/);
 c.approve(d,'LD-3088');
 assert.throws(()=>c.book(d,'LD-3089'),/already have a booked/);
});
test('dispatcher approval is required before driver pickup',()=>{
 const c=core(),d=c.seed();c.book(d,'LD-3088');
 assert.throws(()=>c.progress(d,'LD-3088','Picked up'),/cannot skip or repeat/);
 c.approve(d,'LD-3088');assert.equal(c.find(d,'LD-3088').status,'Assigned');
});
test('mark pickup adds sample photo atomically',()=>{
 const c=core(),d=c.seed();c.book(d,'LD-3088');c.approve(d,'LD-3088');
 const l=c.find(d,'LD-3088');const n=d.activity.length;
 assert.equal(l.evidence.pickup,null);
 c.progress(d,'LD-3088','Picked up');
 assert.equal(l.status,'Picked up');
 assert.equal(l.evidence.pickup.placeholder,true);
 assert.equal(l.evidence.pickup.label,'Pickup photo');
 assert.match(l.evidence.pickup.reference,/SAMPLE-PICKUP/);
 assert.equal(d.activity.length,n+1);
 assert.throws(()=>c.progress(d,'LD-3088','Picked up'),/cannot skip or repeat/);
 assert.equal(d.activity.length,n+1);
});
test('mark delivery generates sample delivery note in one transition',()=>{
 const c=core(),d=c.seed();c.book(d,'LD-3088');c.approve(d,'LD-3088');
 c.progress(d,'LD-3088','Picked up');
 assert.throws(()=>c.progress(d,'LD-3088','Delivered'),/cannot skip or repeat/);
 assert.equal(c.find(d,'LD-3088').evidence.delivery,null);
 c.progress(d,'LD-3088','In transit');
 c.progress(d,'LD-3088','Delivered');
 const l=c.find(d,'LD-3088');
 assert.equal(l.evidence.pickup.placeholder,true);
 assert.equal(l.evidence.delivery.placeholder,true);
 assert.equal(l.evidence.delivery.label,'Delivery note');
 assert.equal(l.truck.miles,305);
});
test('complete generates sample EIR automatically and releases truck',()=>{
 const c=core(),d=c.seed();c.book(d,'LD-3088');c.approve(d,'LD-3088');
 c.progress(d,'LD-3088','Picked up');c.progress(d,'LD-3088','In transit');c.progress(d,'LD-3088','Delivered');
 const l=c.find(d,'LD-3088');assert.equal(l.evidence.eir,null);
 c.progress(d,'LD-3088','Complete');
 assert.equal(l.evidence.eir.placeholder,true);
 assert.equal(l.evidence.eir.label,'Equipment Interchange Receipt (EIR)');
 assert.match(l.truck.location,/Mombasa Port/);
 assert.equal(l.truck.miles,610);
 assert.equal(c.active(d),undefined);
 c.book(d,'LD-3089');assert.equal(c.find(d,'LD-3089').status,'Booked');
});
test('invalid status change leaves both evidence and activity unchanged',()=>{
 const c=core(),d=c.seed();c.book(d,'LD-3088');
 const before=JSON.stringify(d);
 assert.throws(()=>c.progress(d,'LD-3088','Picked up'),/cannot skip or repeat/);
 assert.equal(JSON.stringify(d),before);
 c.approve(d,'LD-3088');const before2=JSON.stringify(d);
 assert.throws(()=>c.progress(d,'LD-3088','Delivered'),/cannot skip or repeat/);
 assert.equal(JSON.stringify(d),before2);
});
test('driver pay is simulated, only allowed when complete, and cannot be repeated',()=>{
 const c=core(),d=c.seed();const before=JSON.stringify(d);
 assert.throws(()=>c.pay(d,'LD-3084'),/Only completed/);
 assert.equal(JSON.stringify(d),before);
 const l=c.pay(d,'LD-3082');
 assert.equal(l.payment.status,'Paid');assert.equal(l.payment.reference,'SIM-PAY-LD-3082');
 assert.throws(()=>c.pay(d,'LD-3082'),/already been marked paid/);
});

test('create-load data includes container feet, consignee, and a return depot',()=>{
 const c=core(),d=c.seed();
 const l=c.post(d,fields({containerFeet:'20',consignee:'Valley Logistics Ltd.',returnId:'mombasa-cfs'}));
 assert.equal(l.containerFeet,20);
 assert.equal(l.consignee,'Valley Logistics Ltd.');
 assert.equal(l.returnId,'mombasa-cfs');
 assert.throws(()=>c.post(d,fields({containerNo:'OTHER-02',containerFeet:'30'})),/20 or 40/);
 assert.throws(()=>c.post(d,fields({containerNo:'OTHER-03',returnId:'invalid'})),/valid empty return depot/);
});
test('driver can cancel only own pending booking and dispatcher can decline booked loads',()=>{
 const c=core(),d=c.seed();
 assert.throws(()=>c.cancel(d,'LD-3088'),/Only your pending/);
 c.book(d,'LD-3088');
 c.cancel(d,'LD-3088');
 assert.equal(c.find(d,'LD-3088').status,'Open');
 assert.equal(c.find(d,'LD-3088').driver,null);
 c.book(d,'LD-3088');
 c.decline(d,'LD-3088');
 assert.equal(c.find(d,'LD-3088').status,'Open');
 assert.equal(c.active(d),undefined);
});
test('dispatcher and driver share Board, Active, History tabs without a numbered guide',()=>{
 const h=browser();
 assert.match(h.root.innerHTML,/Grace \(Dispatcher\)/);
 for(const text of ['Board','Active','History','Booked, active &amp; open'])assert.match(h.root.innerHTML,new RegExp(text));
 assert.doesNotMatch(h.root.innerHTML,/step by step|Try the workflow|guided steps/i);
 h.tab('active');assert.match(h.root.innerHTML,/LD-3084/);
 h.tab('history');assert.match(h.root.innerHTML,/LD-3082/);
 h.role('driver');assert.match(h.root.innerHTML,/Kevin \(Driver\)/);
 h.tab('active');assert.match(h.root.innerHTML,/No loads found/);
 h.tab('board');assert.match(h.root.innerHTML,/LD-3088/);
});
test('board search and status filter navigate across dispatcher load states',()=>{
 const h=browser();
 h.filter('All');assert.match(h.root.innerHTML,/LD-3084/);
 h.filter('In transit');assert.match(h.root.innerHTML,/LD-3084/);
 assert.doesNotMatch(h.root.innerHTML,/LD-3088/);
 h.filter('All');h.query('Eldoret');assert.match(h.root.innerHTML,/LD-3090/);
 assert.doesNotMatch(h.root.innerHTML,/LD-3088/);
});
test('dispatcher drawer opens Fleet, Drivers, Finance, Locations and Consignees',()=>{
 const h=browser();h.action('menu');
 for(const item of ['Fleet','Drivers','Finance','Locations','Consignees','Settings'])assert.match(h.root.innerHTML,new RegExp(item));
 h.page('fleet');assert.match(h.root.innerHTML,/Truck|KDH 117A/i);
 h.action('back');
 h.action('menu');h.page('drivers');assert.match(h.root.innerHTML,/Drivers/);
 h.action('back');
 h.action('menu');h.page('finance');assert.match(h.root.innerHTML,/Outstanding driver payouts/);
 h.action('back');
 h.action('menu');h.page('locations');assert.match(h.root.innerHTML,/Mombasa Port/);
 h.action('back');
 h.action('menu');h.page('consignees');assert.match(h.root.innerHTML,/Harbor Freight Co/);
});
test('load details open from cards and back returns to the correct tab',()=>{
 const h=browser();h.open('LD-3088');
 assert.match(h.root.innerHTML,/Load Details/);
 assert.match(h.root.innerHTML,/Container number/);
 assert.match(h.root.innerHTML,/Consignee/);
 assert.match(h.root.innerHTML,/Tracking Timeline/);
 h.action('back');assert.match(h.root.innerHTML,/Booked, active &amp; open/);
 h.tab('active');h.open('LD-3084');assert.match(h.root.innerHTML,/Driver &amp; Truck/);
 h.action('back');assert.match(h.root.innerHTML,/LD-3084/);
});
test('load creation is a full-screen form with original Macsim-style field hierarchy',()=>{
 const h=browser();h.action('new');
 assert.match(h.root.innerHTML,/Create Load/);
 for(const name of ['containerFeet','containerNo','weightTons','destinationId','originId','consignee','returnId','driverPay','routeMiles'])assert.match(h.root.innerHTML,new RegExp('name="'+name+'"'));
 assert.match(h.root.innerHTML,/Pay \(KSH\)/);
 assert.match(h.root.innerHTML,/<select name="destinationId"/);
 assert.match(h.root.innerHTML,/<select name="originId"/);
});
test('mobile status buttons auto-display sample pickup photo delivery note and EIR',()=>{
 const h=browser();h.action('new');h.form(fields());
 const id=h.data().loads[0].id;
 h.action('back');h.role('driver');h.open(id);h.action('book',id);
 h.action('back');h.role('dispatcher');h.open(id);h.action('approve',id);
 h.action('back');h.role('driver');h.tab('active');h.open(id);
 assert.match(h.root.innerHTML,/Mark Picked Up/);
 assert.doesNotMatch(h.root.innerHTML,/Add Pickup Photo/);
 h.action('picked',id);
 assert.equal(h.data().loads[0].evidence.pickup.placeholder,true);
 assert.match(h.root.innerHTML,/SAMPLE-PICKUP-/);
 assert.match(h.root.innerHTML,/Sample attached/);
 h.action('transit',id);
 assert.match(h.root.innerHTML,/Mark Delivered/);
 assert.doesNotMatch(h.root.innerHTML,/Add Delivery Note/);
 h.action('delivered',id);
 assert.equal(h.data().loads[0].status,'Delivered');
 assert.equal(h.data().loads[0].evidence.delivery.placeholder,true);
 assert.match(h.root.innerHTML,/SAMPLE-DELIVERY-/);
 assert.doesNotMatch(h.root.innerHTML,/Add EIR/);
 h.action('complete',id);
 assert.equal(h.data().loads[0].status,'Complete');
 assert.equal(h.data().loads[0].evidence.eir.placeholder,true);
 assert.match(h.root.innerHTML,/SAMPLE-EIR-/);
 h.action('back');h.tab('history');assert.match(h.root.innerHTML,new RegExp(id));
 h.role('dispatcher');h.tab('history');h.open(id);h.action('pay',id);
 assert.equal(h.data().loads[0].payment.status,'Paid');
});
test('the driver can cancel an unapproved booking from load details',()=>{
 const h=browser();h.role('driver');h.open('LD-3088');h.action('book','LD-3088');
 assert.equal(h.data().loads.find(l=>l.id==='LD-3088').status,'Booked');
 h.action('cancel','LD-3088');
 assert.equal(h.data().loads.find(l=>l.id==='LD-3088').status,'Open');
});
test('the dispatcher can decline a reservation and return it to Board',()=>{
 const h=browser();h.role('driver');h.open('LD-3088');h.action('book','LD-3088');
 h.action('back');h.role('dispatcher');h.open('LD-3088');h.action('decline','LD-3088');
 assert.equal(h.data().loads.find(l=>l.id==='LD-3088').status,'Open');
});
test('search and data rendering safely escape injected HTML',()=>{
 const h=browser();h.action('new');h.form(fields({cargo:'<svg onload=alert(1)>',containerNo:'<img src=x onerror=alert(1)>'}));
 assert.doesNotMatch(h.root.innerHTML,/<svg onload=|<img src=/);
 h.action('back');h.filter('All');
 assert.doesNotMatch(h.root.innerHTML,/<svg onload=|<img src=/);
});
test('reloading the browser restores records without creating duplicates',()=>{
 const h=browser();h.action('new');h.form(fields());
 const saved=h.snapshot(),second=browser(saved);
 assert.equal(second.data().loads.length,11);
 assert.equal(second.data().loads[0].id,h.data().loads[0].id);
});
test('reset restores fictional seed and clears dynamically created loads',()=>{
 const h=browser();h.action('new');h.form(fields());
 assert.equal(h.data().loads.length,11);
 h.action('reset');
 assert.equal(h.data().loads.length,10);
 assert.equal(h.data().loads.find(l=>l.id==='LD-3088').driverPay,280000);
 assert.match(h.root.innerHTML,/Board/);
});
test('Cargo HTML uses standalone mobile scripts and no framework workflow guide',()=>{
 assert.match(html,/\/demos\/logistics\/core\.js/);
 assert.match(html,/\/demos\/logistics\/app\.js/);
 assert.match(html,/\/demos\/logistics\/styles\.css/);
 assert.match(html,/noindex,nofollow/);
 assert.doesNotMatch(html,/minimal-engine|\/logistics\/demo\.js/);
});


test('driver sees their booked load first, ahead of all open loads',()=>{
 const h=browser();
 h.role('driver');
 h.open('LD-3088');h.action('book','LD-3088');
 h.action('back');h.tab('board');
 const booked=h.root.innerHTML.indexOf('data-load="LD-3088"');
 const open=h.root.innerHTML.indexOf('data-load="LD-3089"');
 assert.ok(booked>=0&&open>booked,'driver booked load must appear first');
 assert.match(h.root.innerHTML,/badge-booked/);
 assert.match(h.root.innerHTML,/badge-open/);
});
test('dispatcher Board orders booked before active statuses and then open loads',()=>{
 const h=browser();
 const body=h.root.innerHTML;
 const booked=body.indexOf('data-load="LD-3087"');
 const assigned=body.indexOf('data-load="LD-3086"');
 const picked=body.indexOf('data-load="LD-3085"');
 const inTransit=body.indexOf('data-load="LD-3084"');
 const delivered=body.indexOf('data-load="LD-3083"');
 const open=body.indexOf('data-load="LD-3088"');
 assert.ok(booked>=0&&booked<assigned&&assigned<picked&&picked<inTransit&&inTransit<delivered&&delivered<open,'Board load ordering');
 assert.match(body,/badge-assigned/);
 assert.match(body,/badge-picked-up/);
 assert.match(body,/badge-in-transit/);
 assert.match(body,/badge-delivered/);
 assert.doesNotMatch(body,/data-load="LD-3082"/);
 h.filter('All');
 assert.match(h.root.innerHTML,/data-load="LD-3082"/);
});
test('status badge is visible on every dispatcher Board card including Open',()=>{
 const h=browser();
 const cards=h.root.innerHTML.match(/<button class="load-card[\s\S]*?<\/button>/g)||[];
 assert.ok(cards.length>=8);
 for(const c of cards)assert.match(c,/class="badge badge-/);
});
