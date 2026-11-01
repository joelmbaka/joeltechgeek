const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'..','public','demos','logistics');
const coreSrc=fs.readFileSync(path.join(dir,'core.js'),'utf8');
const appSrc=fs.readFileSync(path.join(dir,'app.js'),'utf8');
const html=fs.readFileSync(path.join(dir,'demo.html'),'utf8');
const core=()=>new Function(coreSrc+'\nreturn cargoCore;')();
const fields=(x={})=>({originId:'mombasa-port',destinationId:'nairobi-icd',cargo:'Fictional forty foot container',weightTons:'20',driverPay:'280000',routeMiles:'305',containerNo:'FICT-2026-001',...x});
function browser(){
 const events={},root={innerHTML:'',contains:()=>true};let saved=null;
 const doc={getElementById:()=>root,addEventListener:(n,fn)=>{events[n]=fn}};
 const storage={getItem:()=>saved,setItem:(k,v)=>{saved=v}};
 const win={confirm:()=>true};
 class FD{constructor(f){this.fields=f.fields}entries(){return Object.entries(this.fields)[Symbol.iterator]()}}
 new Function('document','window','localStorage','FormData',coreSrc+'\n'+appSrc)(doc,win,storage,FD);
 return {root,data:()=>JSON.parse(saved),snapshot:()=>saved,
   cmd:(cmd,id)=>events.click({target:{closest:()=>({dataset:{cmd,id}})}}),
   tab:id=>events.click({target:{closest:()=>({dataset:{tab:id}})}}),
   role:value=>events.change({target:{id:'role',value}}),
   filter:value=>events.change({target:{id:'filter',value}}),
   form:(type,values,id)=>events.submit({preventDefault:()=>{},target:{dataset:{form:type,id},fields:values}})
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
test('pickup photo placeholder gates picked-up status and cannot be duplicated',()=>{
 const c=core(),d=c.seed();c.book(d,'LD-3088');c.approve(d,'LD-3088');
 assert.throws(()=>c.progress(d,'LD-3088','Picked up'),/Pickup photo/);
 c.attach(d,'LD-3088','pickup');
 assert.equal(c.find(d,'LD-3088').evidence.pickup.placeholder,true);
 assert.throws(()=>c.attach(d,'LD-3088','pickup'),/already exists/);
 c.progress(d,'LD-3088','Picked up');assert.equal(c.find(d,'LD-3088').status,'Picked up');
});
test('driver cannot skip transit and must attach delivery note before marking delivered',()=>{
 const c=core(),d=c.seed();c.book(d,'LD-3088');c.approve(d,'LD-3088');
 c.attach(d,'LD-3088','pickup');c.progress(d,'LD-3088','Picked up');
 assert.throws(()=>c.progress(d,'LD-3088','Delivered'),/cannot skip or repeat/);
 c.progress(d,'LD-3088','In transit');
 assert.throws(()=>c.progress(d,'LD-3088','Delivered'),/Delivery note/);
 c.attach(d,'LD-3088','delivery');c.progress(d,'LD-3088','Delivered');
 assert.equal(c.find(d,'LD-3088').truck.miles,305);
});
test('container return requires EIR; completion releases driver for a second booking',()=>{
 const c=core(),d=c.seed();c.book(d,'LD-3088');c.approve(d,'LD-3088');
 c.attach(d,'LD-3088','pickup');c.progress(d,'LD-3088','Picked up');c.progress(d,'LD-3088','In transit');
 c.attach(d,'LD-3088','delivery');c.progress(d,'LD-3088','Delivered');
 assert.throws(()=>c.progress(d,'LD-3088','Complete'),/Equipment Interchange Receipt/);
 c.attach(d,'LD-3088','eir');c.progress(d,'LD-3088','Complete');
 assert.match(c.find(d,'LD-3088').truck.location,/Mombasa Port/);
 assert.equal(c.find(d,'LD-3088').truck.miles,610);
 assert.equal(c.active(d),undefined);
 c.book(d,'LD-3089');assert.equal(c.find(d,'LD-3089').status,'Booked');
});
test('driver pay is simulated, only allowed when complete, and cannot be repeated',()=>{
 const c=core(),d=c.seed();const before=JSON.stringify(d);
 assert.throws(()=>c.pay(d,'LD-3084'),/Only completed/);
 assert.equal(JSON.stringify(d),before);
 const l=c.pay(d,'LD-3082');
 assert.equal(l.payment.status,'Paid');assert.equal(l.payment.reference,'SIM-PAY-LD-3082');
 assert.throws(()=>c.pay(d,'LD-3082'),/already been marked paid/);
});
test('mobile UI offers only dispatcher and driver, not numbered guide',()=>{
 const h=browser();
 assert.match(h.root.innerHTML,/Grace · Dispatcher/);
 assert.match(h.root.innerHTML,/Kevin · Driver/);
 assert.match(h.root.innerHTML,/Welcome, Grace/);
 assert.doesNotMatch(h.root.innerHTML,/Try the workflow|step by step|first step/i);
 h.tab('loads');assert.match(h.root.innerHTML,/LD-3088/);
 h.filter('In transit');assert.match(h.root.innerHTML,/LD-3084/);
});
test('post/edit form uses location dropdowns and driver rate field',()=>{
 const h=browser();h.cmd('post');
 assert.match(h.root.innerHTML,/<select name="originId"/);
 assert.match(h.root.innerHTML,/<select name="destinationId"/);
 assert.match(h.root.innerHTML,/Pay driver \(KES\)/);
});
test('UI completes post edit book approve pickup transit delivery EIR pay',()=>{
 const h=browser();h.tab('loads');h.cmd('post');h.form('post',fields());
 const id=h.data().loads[0].id;
 h.cmd('edit',id);h.form('edit',fields({driverPay:'290000'}),id);
 assert.equal(h.data().loads[0].driverPay,290000);
 h.role('driver');h.cmd('book',id);
 assert.equal(h.data().loads[0].status,'Booked');
 h.cmd('book','LD-3088');
 assert.equal(h.data().loads.find(l=>l.id==='LD-3088').status,'Open');
 h.role('dispatcher');h.cmd('approve',id);
 h.role('driver');h.tab('myload');
 h.cmd('picked',id);assert.equal(h.data().loads[0].status,'Assigned');
 h.cmd('pickup',id);h.cmd('picked',id);h.cmd('transit',id);
 assert.equal(h.data().loads[0].status,'In transit');
 h.cmd('delivery',id);h.cmd('delivered',id);
 h.cmd('eir',id);h.cmd('complete',id);
 assert.equal(h.data().loads[0].status,'Complete');
 h.role('dispatcher');h.tab('fleet');assert.match(h.root.innerHTML,/sample miles/);
 h.tab('pay');h.cmd('pay',id);
 assert.equal(h.data().loads[0].payment.status,'Paid');
 assert.equal(h.data().loads[0].driverPay,290000);
});
test('mobile demo reset restores ten sample loads and original driver rate',()=>{
 const h=browser();h.cmd('post');h.form('post',fields());
 assert.equal(h.data().loads.length,11);
 h.cmd('reset');
 assert.equal(h.data().loads.length,10);
 assert.equal(h.data().loads.find(l=>l.id==='LD-3088').driverPay,280000);
});
test('static HTML uses dedicated mobile resources, not the shared workflow engine',()=>{
 assert.match(html,/\/demos\/logistics\/core\.js/);
 assert.match(html,/\/demos\/logistics\/app\.js/);
 assert.match(html,/\/demos\/logistics\/styles\.css/);
 assert.match(html,/noindex,nofollow/);
 assert.doesNotMatch(html,/minimal-engine|\/logistics\/demo\.js/);
});
