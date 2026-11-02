const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"..","public","demos","security");
const files=Object.fromEntries(["core.js","views.js","app.js","styles.css","demo.html"].map(n=>[n,fs.readFileSync(path.join(dir,n),"utf8")]));
const core=()=>new Function(files["core.js"]+"\nreturn guardCore;")();
const get=(xs,id)=>xs.find(x=>x.id===id);
const fields={category:"Access control",severity:"High",title:"Perimeter gate left open",notes:"Unsecured perimeter gate noticed during the inspection."};
function browser(snapshot){
 let saved=snapshot===undefined?null:snapshot;
 const root={innerHTML:"",contains:()=>true},ev={};
 const doc={getElementById:id=>id==="app"?root:null,addEventListener:(n,f)=>ev[n]=f};
 class FD{constructor(f){this.fields=f.fields}entries(){return Object.entries(this.fields)[Symbol.iterator]()}}
 new Function("document","window","localStorage","FormData",files["core.js"]+"\n"+files["views.js"]+"\n"+files["app.js"])(
  doc,{confirm:()=>true},{getItem:()=>saved,setItem:(k,v)=>{saved=v}},FD);
 const click=d=>ev.click({target:{closest:()=>({dataset:d})}});
 return{root,saved:()=>saved,data:()=>saved?JSON.parse(saved):core().seed(),
  role:r=>ev.change({target:{id:"role-select",value:r}}),tab:r=>click({tab:r}),
  mode:m=>click({mode:m}),open:(type,id)=>click({open:type,id}),
  act:(action,id,extra={})=>click({action,id,...extra}),
  submit:(kind,id,fields={},opts={})=>ev.submit({preventDefault:()=>{},target:{
   id:"guard-form",dataset:{kind,id,targetType:opts.targetType||"",targetId:opts.targetId||""},fields}})
 };
}
test("fictional deployment has four sites, five guard records, four shifts and three demo roles",()=>{
 const c=core(),d=c.seed();a.ok(c.valid(d));
 a.equal(d.sites.length,4);a.equal(d.guards.length,5);a.equal(d.shifts.length,4);
 a.deepEqual(c.ROLES.map(r=>r.id),["guard","supervisor","manager"]);
 a.ok(d.sites.some(s=>s.name.includes("Westlands")));
});
test("sample coverage includes on duty, late, missed checkpoints, and incident statuses",()=>{
 const c=core(),d=c.seed(),m=c.metrics(d);
 a.equal(m.onDuty,2);a.equal(m.late,1);a.equal(m.missed,1);
 a.equal(m.incidents,1);a.equal(d.incidents.length,2);
 a.equal(c.shiftStatus(d.shifts[3]),"Late");
});
test("GPS far and uncertain readings are denied without state changes",()=>{
 const c=core(),d=c.seed(),before=JSON.stringify(d);
 a.throws(()=>c.checkIn(d,"guard","SH-101","far"),/Location not verified/);
 a.throws(()=>c.checkIn(d,"guard","SH-101","uncertain"),/Location not verified/);
 a.equal(JSON.stringify(d),before);
});
test("GPS near check-in verifies distance plus accuracy and cannot be repeated",()=>{
 const c=core(),d=c.seed(),s=c.checkIn(d,"guard","SH-101","near");
 a.equal(s.state,"on-duty");a.equal(s.checkIn.distanceM,35);a.equal(s.checkIn.accuracyM,12);
 a.ok(s.checkIn.distanceM+s.checkIn.accuracyM<=c.siteFor(d,s).radiusM);
 a.throws(()=>c.checkIn(d,"guard","SH-101","near"),/scheduled shift/);
});
test("Guard cannot check into other posts or bypass role checks",()=>{
 const c=core(),d=c.seed(),before=JSON.stringify(d);
 a.throws(()=>c.checkIn(d,"manager","SH-101","near"),/Only the guard/);
 a.throws(()=>c.checkIn(d,"guard","SH-102","near"),/Only Kevin/);
 a.equal(JSON.stringify(d),before);
});
test("patrol verification requires check-in and sequential checkpoint order",()=>{
 const c=core(),d=c.seed();
 a.throws(()=>c.verifyCheckpoint(d,"guard","SH-101","SH-101-CP1"),/must be checked in/);
 c.checkIn(d,"guard","SH-101","near");
 a.throws(()=>c.verifyCheckpoint(d,"guard","SH-101","SH-101-CP2"),/earlier patrol checkpoints/);
 c.verifyCheckpoint(d,"guard","SH-101","SH-101-CP1");
 c.verifyCheckpoint(d,"guard","SH-101","SH-101-CP2");
 a.equal(d.shifts[0].checkpoints[1].status,"verified");
 a.throws(()=>c.verifyCheckpoint(d,"guard","SH-101","SH-101-CP1"),/already processed/);
});
test("incident reporting validates values, saves a shared event and keeps failure atomic",()=>{
 const c=core(),d=c.seed();c.checkIn(d,"guard","SH-101","near");const before=JSON.stringify(d);
 a.throws(()=>c.reportIncident(d,"guard","SH-101",{...fields,category:"Other fake"}),/valid incident category/);
 a.throws(()=>c.reportIncident(d,"guard","SH-101",{...fields,notes:"small"}),/Incident notes/);
 a.equal(JSON.stringify(d),before);
 const i=c.reportIncident(d,"guard","SH-101",fields);
 a.equal(i.status,"Open");a.equal(i.siteId,"SITE-1");
 a.equal(d.events[0].kind,"Incident");
});
test("camera records only sample evidence on valid open incident or verified patrol",()=>{
 const c=core(),d=c.seed();c.checkIn(d,"guard","SH-101","near");
 a.throws(()=>c.photo(d,"guard","SH-101","checkpoint","SH-101-CP1","Gate observation"),/Verify the checkpoint/);
 c.verifyCheckpoint(d,"guard","SH-101","SH-101-CP1");
 const p=c.photo(d,"guard","SH-101","checkpoint","SH-101-CP1","Gate observation");
 const i=c.reportIncident(d,"guard","SH-101",fields);
 const p2=c.photo(d,"guard","SH-101","incident",i.id,"Property condition");
 a.equal(p.checkpointId,"SH-101-CP1");a.equal(p2.incidentId,i.id);
 a.equal(p2.source,"Simulated camera");
});
test("camera rejects cross-site incidents, invalid sample labels and photo count overflow",()=>{
 const c=core(),d=c.seed();c.checkIn(d,"guard","SH-101","near");
 const i=c.reportIncident(d,"guard","SH-101",fields);
 a.throws(()=>c.photo(d,"guard","SH-101","incident","INC-201","Gate observation"),/not open on Kevin/);
 a.throws(()=>c.photo(d,"guard","SH-101","incident",i.id,"Random image"),/Choose a sample photo/);
 for(let n=0;n<3;n++)c.photo(d,"guard","SH-101","incident",i.id,"Gate observation");
 a.throws(()=>c.photo(d,"guard","SH-101","incident",i.id,"Gate observation"),/Three sample photos/);
});
test("SOS requires no check-in or camera evidence and is idempotent while open",()=>{
 const c=core(),d=c.seed(),e=d.evidence.length;
 const i=c.sos(d,"guard","SH-101");a.equal(i.severity,"Critical");a.equal(i.emergency,true);
 a.equal(d.evidence.length,e);
 const snapshot=JSON.stringify(d);a.equal(c.sos(d,"guard","SH-101").id,i.id);
 a.equal(JSON.stringify(d),snapshot);
});
test("supervisor incident response has Open, Acknowledged, Responding and Resolved stages",()=>{
 const c=core(),d=c.seed(),i=d.incidents[0];
 a.throws(()=>c.respond(d,"supervisor",i.id,"Support team dispatched."),/Acknowledge/);
 c.acknowledge(d,"supervisor",i.id);
 a.throws(()=>c.resolve(d,"supervisor",i.id),/Record a supervisor response/);
 c.respond(d,"supervisor",i.id,"Relief officer dispatched and site inspected.");
 c.resolve(d,"supervisor",i.id);a.equal(i.status,"Resolved");
});
test("manager and guard cannot forge supervisor incident actions",()=>{
 const c=core(),d=c.seed(),before=JSON.stringify(d);
 for(const role of ["guard","manager"]){
  a.throws(()=>c.acknowledge(d,role,"INC-201"),/Only the supervisor/);
  a.throws(()=>c.resolve(d,role,"INC-201"),/Only the supervisor/);
 }
 a.equal(JSON.stringify(d),before);
});
test("handover records open incidents and checkout requires recorded handover",()=>{
 const c=core(),d=c.seed();
 c.checkIn(d,"guard","SH-101","near");const i=c.reportIncident(d,"guard","SH-101",fields);
 a.throws(()=>c.checkOut(d,"guard","SH-101"),/Complete shift handover/);
 const h=c.handover(d,"guard","SH-101","Incoming guard informed of perimeter gate issue.");
 a.ok(h.unresolvedIncidentIds.includes(i.id));
 c.checkOut(d,"guard","SH-101");a.equal(d.shifts[0].state,"completed");
 a.equal(i.status,"Open");
});
test("open emergency prevents shift checkout until supervisor resolves it",()=>{
 const c=core(),d=c.seed();c.checkIn(d,"guard","SH-101","near");
 const i=c.sos(d,"guard","SH-101");
 c.handover(d,"guard","SH-101","Emergency response in progress, pending closure.");
 a.throws(()=>c.checkOut(d,"guard","SH-101"),/emergency SOS is still open/);
 c.acknowledge(d,"supervisor",i.id);
 c.respond(d,"supervisor",i.id,"Response team on location and guard confirmed safe.");
 c.resolve(d,"supervisor",i.id);c.checkOut(d,"guard","SH-101");
 a.equal(d.shifts[0].state,"completed");
});
test("operations manager can reassign late unstarted shift to available standby only",()=>{
 const c=core(),d=c.seed(),before=JSON.stringify(d);
 a.throws(()=>c.reassign(d,"supervisor","SH-104","GUARD-5"),/Only the manager/);
 a.throws(()=>c.reassign(d,"manager","SH-102","GUARD-5"),/unstarted shifts/);
 a.throws(()=>c.reassign(d,"manager","SH-104","GUARD-1"),/already assigned/);
 a.equal(JSON.stringify(d),before);
 c.reassign(d,"manager","SH-104","GUARD-5");
 a.equal(d.shifts[3].guardId,"GUARD-5");a.equal(c.metrics(d).late,0);
});
test("guard, supervisor and manager each have exactly four relevant bottom tabs",()=>{
 const h=browser();
 for(const tab of ["home","patrol","incidents","handover"])a.match(h.root.innerHTML,new RegExp('data-tab="'+tab+'"'));
 h.role("supervisor");
 for(const tab of ["overview","sites","alerts","activity"])a.match(h.root.innerHTML,new RegExp('data-tab="'+tab+'"'));
 h.role("manager");
 for(const tab of ["dashboard","deployments","incidents","reports"])a.match(h.root.innerHTML,new RegExp('data-tab="'+tab+'"'));
 a.doesNotMatch(h.root.innerHTML,/data-tab="handover"/);
});
test("guard GPS mode selection fails out of range and then succeeds on site",()=>{
 const h=browser();h.mode("far");h.act("check-in","SH-101");
 a.equal(h.data().shifts[0].state,"scheduled");a.match(h.root.innerHTML,/Location not verified/);
 h.mode("near");h.act("check-in","SH-101");
 a.equal(h.data().shifts[0].state,"on-duty");
 h.tab("patrol");h.act("verify-checkpoint","SH-101",{checkpointId:"SH-101-CP1"});
 a.equal(h.data().shifts[0].checkpoints[0].status,"verified");
});
test("verified checkpoint supports photo modal and attached illustrative evidence",()=>{
 const h=browser();h.act("check-in","SH-101");h.tab("patrol");
 h.act("verify-checkpoint","SH-101",{checkpointId:"SH-101-CP1"});
 h.act("photo","SH-101",{targetType:"checkpoint",targetId:"SH-101-CP1"});
 a.match(h.root.innerHTML,/SIMULATED CAMERA/);
 h.submit("photo","SH-101",{label:"Site perimeter"},{targetType:"checkpoint",targetId:"SH-101-CP1"});
 a.equal(h.data().evidence.filter(p=>p.checkpointId==="SH-101-CP1").length,1);
});
test("guard incident and photo become visible in supervisor alert details",()=>{
 const h=browser();h.act("check-in","SH-101");h.tab("incidents");
 h.act("new-incident","SH-101");h.submit("incident","SH-101",fields);
 const i=h.data().incidents[0];h.act("photo","SH-101",{targetType:"incident",targetId:i.id});
 h.submit("photo","SH-101",{label:"Gate observation"},{targetType:"incident",targetId:i.id});
 h.role("supervisor");h.tab("alerts");a.match(h.root.innerHTML,/Perimeter gate left open/);
 h.open("incident",i.id);a.match(h.root.innerHTML,/Gate observation/);
});
test("SOS immediately appears in both supervisor and manager workspaces without a photo",()=>{
 const h=browser(),before=h.data().evidence.length;
 h.act("sos","SH-101");a.equal(h.data().evidence.length,before);
 h.role("supervisor");a.match(h.root.innerHTML,/Emergency awaiting response/);
 h.role("manager");a.match(h.root.innerHTML,/Emergency awaiting response/);
});
test("supervisor handles SOS through acknowledge, response note and resolution UI",()=>{
 const h=browser();h.act("sos","SH-101");const id=h.data().incidents[0].id;
 h.role("supervisor");h.open("incident",id);
 h.act("ack",id);a.equal(get(h.data().incidents,id).status,"Acknowledged");
 h.act("respond",id);h.submit("respond",id,{notes:"Team dispatched to site and guard confirmed safe."});
 a.equal(get(h.data().incidents,id).status,"Responding");
 h.act("resolve",id);a.equal(get(h.data().incidents,id).status,"Resolved");
});
test("guard completes shift handover and checkout after emergency resolution",()=>{
 const h=browser();h.act("check-in","SH-101");h.act("sos","SH-101");
 const id=h.data().incidents[0].id;
 h.role("supervisor");h.open("incident",id);
 h.act("ack",id);h.act("respond",id);
 h.submit("respond",id,{notes:"Incident attended by supervisor and support personnel."});
 h.act("resolve",id);
 h.role("guard");h.tab("handover");h.act("handover","SH-101");
 h.submit("handover","SH-101",{notes:"All patrol notes and incident response shared with incoming guard."});
 h.act("check-out","SH-101");
 a.equal(h.data().shifts[0].state,"completed");
});
test("Grace can replace late Kilimani guard and see updated proof of service",()=>{
 const h=browser();h.role("manager");h.tab("deployments");
 h.act("reassign","SH-104");h.submit("reassign","SH-104",{guardId:"GUARD-5"});
 a.equal(h.data().shifts[3].guardId,"GUARD-5");
 h.tab("reports");a.match(h.root.innerHTML,/Daniel Mwangi/);
});
test("guard cannot use supervisor or manager buttons by forging events",()=>{
 const h=browser(),snapshot=h.saved();
 h.act("ack","INC-201");h.act("resolve","INC-201");h.act("reassign","SH-104");
 h.submit("reassign","SH-104",{guardId:"GUARD-5"});
 a.equal(h.saved(),snapshot);
});
test("browser persistence, reset and input escaping work",()=>{
 const h=browser();h.act("check-in","SH-101");
 h.act("new-incident","SH-101");
 h.submit("incident","SH-101",{...fields,title:"<svg onload=alert(1)>"});
 a.doesNotMatch(h.root.innerHTML,/<svg onload=/);
 a.match(h.root.innerHTML,/&lt;svg onload=/);
 const reloaded=browser(h.saved());a.equal(reloaded.data().incidents.length,3);
 reloaded.act("reset");a.equal(reloaded.data().incidents.length,2);
});
test("no real geolocation, camera or SOS network integrations in browser demo",()=>{
 for(const file of ["core.js","views.js","app.js","demo.html"])
  a.doesNotMatch(files[file],/navigator\.geolocation|getUserMedia|fetch\(|XMLHttpRequest|CliviQue/);
 a.match(files["views.js"],/SIMULATED CAMERA/);
 a.match(files["views.js"],/No real tracking, photos or emergency dispatch/);
 a.match(files["demo.html"],/noindex,nofollow/);
});
test("responsive styles use JoelTechGeek colors and mobile-first full viewport behavior",()=>{
 for(const color of ["#059669","#047857","#0ea5e9","#f59e0b","#fef3c7"])
  a.match(files["styles.css"],new RegExp(color));
 for(const size of ["1100px","540px","365px"])a.ok(files["styles.css"].includes("max-width:"+size));
 a.match(files["styles.css"],/height:100dvh/);
 a.match(files["demo.html"],/name="viewport"/);
});
