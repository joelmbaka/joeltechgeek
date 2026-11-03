const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const base=path.join(__dirname,"..");
const dir=path.join(base,"public","demos","vehicle-tracking");
const C=require(path.join(dir,"core.js"));
const read=p=>fs.readFileSync(path.join(base,p),"utf8");

test("three fictional vehicles seed with distinguishable tracker conditions",()=>{
 const d=C.seed();assert.ok(C.validate(d));
 assert.equal(d.vehicles.length,3);
 assert.equal(C.summary(d).online,2);
 assert.equal(C.summary(d).offline,1);
 assert.equal(C.get(d,"V-103").lastSeenMinutes,45);
 assert.equal(C.position(C.get(d,"V-103")).label,"South C");
 assert.throws(()=>C.get(d,"V-X"),/not found/i);
 assert.deepEqual(C.trip("V-101").map(p=>p.at),["08:12","08:19","08:27","08:35","08:43"]);
});
test("sample movement is allowed only with connected tracker data",()=>{
 const d=C.seed(),a=C.get(d,"V-101"),first=a.position;
 C.move(d,a.id);assert.equal(a.position,(first+1)%C.route(a.id).length);
 assert.equal(a.lastSeenMinutes,0);
 assert.throws(()=>C.move(d,"V-103"),/offline/i);
});
test("signal loss retains last known position and explicitly marks freshness",()=>{
 const d=C.seed(),v=C.get(d,"V-101"),original=C.position(v);
 C.loseSignal(d,v.id);
 assert.equal(v.status,"offline");
 assert.equal(v.ignition,null);
 assert.equal(v.lastSeenMinutes,32);
 assert.deepEqual(C.position(v),original);
 assert.ok(d.alerts.some(a=>a.kind==="Connection lost"&&a.vehicleId===v.id));
 assert.throws(()=>C.loseSignal(d,v.id),/already offline/i);
 C.restoreSignal(d,v.id);
 assert.equal(v.status,"online");
 assert.equal(v.lastSeenMinutes,0);
 assert.ok(d.alerts.some(a=>a.kind==="Connection restored"));
});
test("geofence events are recorded once and can be acknowledged",()=>{
 const d=C.seed(),v=C.get(d,"V-101");
 const a=C.geofence(d,v.id);
 assert.equal(a.kind,"Geofence exit");
 assert.equal(a.status,"new");
 assert.throws(()=>C.geofence(d,v.id),/already simulated/i);
 C.acknowledge(d,a.id);
 assert.equal(a.status,"acknowledged");
 assert.throws(()=>C.acknowledge(d,a.id),/already acknowledged/i);
 assert.throws(()=>C.geofence(d,"V-103"),/connected/i);
});
test("support requests enforce input limits and move forward through statuses",()=>{
 const d=C.seed(),before=d.tickets.length;
 assert.throws(()=>C.createTicket(d,"V-101","Unknown","Something went wrong"),/issue type/i);
 assert.throws(()=>C.createTicket(d,"V-101","Wrong location","a"),/Description/i);
 assert.throws(()=>C.createTicket(d,"V-101","Other","x".repeat(241)),/Description/i);
 assert.equal(d.tickets.length,before);
 const t=C.createTicket(d,"V-101","Wrong location","Map marker looks outdated.");
 assert.equal(t.status,"Open");assert.equal(d.tickets.length,before+1);
 assert.equal(C.summary(d).openRequests,2);
 C.progressTicket(d,t.id);assert.equal(t.status,"In progress");
 C.progressTicket(d,t.id);assert.equal(t.status,"Resolved");
 assert.match(t.reply,/sample/i);
 assert.throws(()=>C.progressTicket(d,t.id),/already resolved/i);
});
test("static standalone assets and no-real-world side effects",()=>{
 const html=read("public/demos/vehicle-tracking/demo.html");
 const app=read("public/demos/vehicle-tracking/app.js");
 const core=read("public/demos/vehicle-tracking/core.js");
 const css=read("public/demos/vehicle-tracking/styles.css");
 const page=read("app/demos/vehicle-tracking/page.tsx");
 const gallery=read("app/demos/page.tsx");
 for(const asset of ["core.js","app.js","styles.css"])assert.ok(html.includes("/demos/vehicle-tracking/"+asset));
 assert.match(html,/noindex,nofollow/);
 assert.match(page,/canonical: '\/demos\/vehicle-tracking'/);
 assert.match(gallery,/href="\/demos\/vehicle-tracking"/);
 assert.match(app,/localStorage/);
 assert.match(app,/LAST KNOWN POSITION/);
 assert.match(app,/SIMULATED POSITION/);
 assert.match(app,/data-action="geofence"/);
 assert.match(app,/Monitoring Desk/);
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|navigator\.geolocation|navigator\.mediaDevices|WebSocket/);
 assert.doesNotMatch(core,/\bfetch\s*\(|XMLHttpRequest|navigator\.geolocation|WebSocket/);
 assert.ok(css.includes("@media(max-width:560px)"));
 for(const [name,source] of [["core.js",core],["app.js",app]])assert.doesNotThrow(()=>new vm.Script(source,{filename:name}));
});
test("vehicle-owner actions flow into monitoring alerts and requests",()=>{
 const events={},storage={},intervals=new Map();
 const root={innerHTML:"",contains:()=>true,addEventListener:(type,fn)=>{events[type]=fn;}};
 const document={getElementById:id=>id==="app"?root:null};
 const localStorage={getItem:key=>storage[key]??null,setItem:(key,val)=>{storage[key]=val;}};
 const window={confirm:()=>true,addEventListener:()=>{}};
 let timerId=0;
 class FakeFormData{constructor(el){this.el=el;}get(key){return this.el[key];}}
 new Function("document","localStorage","window","FormData","setInterval","clearInterval",
  read("public/demos/vehicle-tracking/core.js")+"\n"+read("public/demos/vehicle-tracking/app.js")
 )(document,localStorage,window,FakeFormData,fn=>{const id=++timerId;intervals.set(id,fn);return id;},id=>intervals.delete(id));
 const click=(action,id)=>events.click({target:{closest:()=>({dataset:{action,id},disabled:false})}});
 const change=role=>events.change({target:{id:"role-select",value:role}});
 assert.match(root.innerHTML,/Toyota Prado/);
 click("choose","V-103");
 assert.match(root.innerHTML,/LAST KNOWN POSITION/);
 assert.match(root.innerHTML,/Location may be outdated/);
 click("choose","V-101");
 click("geofence","V-101");
 assert.match(root.innerHTML,/geofence alert created/i);
 click("signal","V-101");
 assert.match(root.innerHTML,/Location may be outdated/);
 const persisted=JSON.parse(storage.jtg_vehicle_tracking_demo_v1);
 assert.equal(persisted.vehicles[0].status,"offline");
 change("desk");
 assert.match(root.innerHTML,/Fleet overview/);
 assert.match(root.innerHTML,/No signal/);
 click("tab","events");
 assert.match(root.innerHTML,/Geofence exit/);
 click("acknowledge","AL-204");
 assert.equal(JSON.parse(storage.jtg_vehicle_tracking_demo_v1).alerts.find(a=>a.id==="AL-204").status,"acknowledged");
 change("owner");click("tab","support");
 events.submit({preventDefault(){},target:{id:"support-form",vehicleId:"V-101",category:"Tracking not updating",note:"Last GPS location stopped refreshing."}});
 assert.match(root.innerHTML,/opened/i);
 change("desk");click("tab","requests");
 assert.match(root.innerHTML,/Last GPS location stopped refreshing/);
 click("progress","REQ-205");
 assert.match(root.innerHTML,/In progress/);
 click("progress","REQ-205");
 assert.match(root.innerHTML,/Resolved/);
 click("tab","fleet");change("owner");click("tab","trips");click("play");
 assert.ok(intervals.size===1);
 for(let i=0;i<4;i++){const fn=[...intervals.values()][0];if(fn)fn();}
 assert.match(root.innerHTML,/5\/5 points/);
 assert.equal(intervals.size,0);
 click("reset");
 assert.equal(JSON.parse(storage.jtg_vehicle_tracking_demo_v1).vehicles[0].status,"online");
 assert.match(root.innerHTML,/Toyota Prado/);
});


test("anti-theft events are visible in the owner feed and each explains the required hardware",()=>{
 const d=C.seed();
 const security=d.alerts.filter(a=>a.category==="security");
 assert.ok(security.length>=2);
 assert.ok(security.some(a=>a.kind==="Unexpected ignition"&&a.ownerRead===false));
 assert.ok(C.summary(d).unreadOwnerAlerts>=2);
 assert.equal(C.SECURITY_SCENARIOS.length,5);
 for(const scenario of C.SECURITY_SCENARIOS){
  const copy=C.seed(),before=copy.alerts.length;
  const ev=C.triggerSecurityEvent(copy,"V-101",scenario.id);
  assert.equal(copy.alerts.length,before+1);
  assert.equal(copy.alerts[0].id,ev.id);
  assert.equal(ev.category,"security");
  assert.equal(ev.kind,scenario.kind);
  assert.equal(ev.status,"new");
  assert.equal(ev.ownerRead,false);
  assert.equal(ev.requirement,scenario.requirement);
  C.markOwnerRead(copy,ev.id);
  assert.equal(ev.ownerRead,true);
  assert.throws(()=>C.markOwnerRead(copy,ev.id),/already read/i);
  C.acknowledge(copy,ev.id);
  assert.equal(ev.status,"acknowledged");
 }
});

test("tamper and suspected interference display last known location without inventing current position",()=>{
 for(const kind of ["tamper","interference"]){
  const d=C.seed(),v=C.get(d,"V-102"),p=C.position(v);
  const alert=C.triggerSecurityEvent(d,v.id,kind);
  assert.equal(v.status,"offline");
  assert.deepEqual(C.position(v),p);
  assert.equal(v.ignition,null);
  assert.ok(v.lastSeenMinutes>0);
  assert.equal(alert.category,"security");
  assert.throws(()=>C.triggerSecurityEvent(d,v.id,"ignition"),/offline/i);
 }
 const d=C.seed();
 assert.throws(()=>C.triggerSecurityEvent(d,"V-101","not-a-real-event"),/unknown/i);
 assert.throws(()=>C.triggerSecurityEvent(d,"V-103","vibration"),/offline/i);
});

test("legacy localStorage records receive anti-theft examples once, preserving existing user work",()=>{
 const d=C.seed();
 delete d.securityExamplesV2;
 d.alerts=d.alerts.filter(a=>a.category!=="security");
 d.tickets[0].status="In progress";
 const originalTicket=JSON.stringify(d.tickets[0]);
 const oldAlertId=d.alerts[0].id;
 const n=d.alerts.length;
 assert.equal(C.ensureSecuritySamples(d),true);
 assert.equal(d.alerts.length,n+2);
 assert.ok(d.alerts.some(a=>a.id===oldAlertId));
 assert.equal(JSON.stringify(d.tickets[0]),originalTicket);
 assert.equal(C.ensureSecuritySamples(d),false);
 assert.equal(d.alerts.length,n+2);
 assert.ok(C.validate(d));
});

test("owner app exposes anti-theft preview, triggers and read actions shared with Monitoring Desk",()=>{
 const events={},store={};
 const root={innerHTML:"",contains:()=>true,querySelector:()=>null,addEventListener:(type,fn)=>{events[type]=fn;}};
 const document={getElementById:()=>root};
 const localStorage={getItem:key=>store[key]??null,setItem:(key,val)=>{store[key]=val;}};
 const window={confirm:()=>true,addEventListener:()=>{}};
 class FakeFormData{constructor(el){this.el=el;}get(k){return this.el[k];}}
 new Function("document","localStorage","window","FormData","setInterval","clearInterval",
  read("public/demos/vehicle-tracking/core.js")+"\n"+read("public/demos/vehicle-tracking/app.js")
 )(document,localStorage,window,FakeFormData,()=>1,()=>{});
 const click=(action,id)=>events.click({target:{closest:()=>({dataset:{action,id},disabled:false})}});
 const role=value=>events.change({target:{id:"role-select",value}});
 assert.match(root.innerHTML,/Anti-theft alert examples/);
 assert.match(root.innerHTML,/Unexpected ignition/);
 assert.match(root.innerHTML,/VEHICLE SECURITY/);
 click("security","vibration");
 assert.match(root.innerHTML,/Vehicle disturbance detected/);
 let data=JSON.parse(store.jtg_vehicle_tracking_demo_v1);
 assert.equal(data.alerts[0].category,"security");
 const alertId=data.alerts[0].id;
 click("tab","alerts");
 assert.match(root.innerHTML,/Anti-theft & security/);
 assert.match(root.innerHTML,/Tracking & connectivity/);
 assert.match(root.innerHTML,/Mark as read/);
 click("owner-read",alertId);
 data=JSON.parse(store.jtg_vehicle_tracking_demo_v1);
 assert.equal(data.alerts[0].ownerRead,true);
 assert.equal(data.alerts[0].status,"new","customer reading does not acknowledge for monitoring");
 role("desk");click("tab","events");
 assert.match(root.innerHTML,/Vehicle disturbance detected/);
 assert.match(root.innerHTML,/Acknowledge alert/);
 click("acknowledge",alertId);
 data=JSON.parse(store.jtg_vehicle_tracking_demo_v1);
 assert.equal(data.alerts[0].status,"acknowledged");
});
