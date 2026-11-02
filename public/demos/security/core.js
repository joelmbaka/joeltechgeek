const guardCore=(function(){
"use strict";
const DATE="2026-11-02",CLOCK="09:41 EAT";
const ROLES=[{id:"guard",name:"Kevin",title:"Security Guard"},{id:"supervisor",name:"Beatrice",title:"Site Supervisor"},{id:"manager",name:"Grace",title:"Operations Manager"}];
const CATEGORIES=["Suspicious activity","Access control","Property damage","Safety hazard","Other"];
const SEVERITIES=["Low","Medium","High"];
const PHOTO_LABELS=["Gate observation","Site perimeter","Property condition"];
const get=(records,id,label)=>records.find(x=>x.id===id)||(()=>{throw Error(label+" not found.");})();
const verifyRole=(role,needed)=>{if(role!==needed)throw Error("Only the "+needed+" can do this.");};
const trim=(x,label,min=1,max=300)=>{const v=String(x??"").trim();if(v.length<min||v.length>max)throw Error(label+" must be "+min+"–"+max+" characters.");return v;};
const uid=(d,prefix)=>prefix+"-"+String(++d.seq).padStart(4,"0");
const shift=(d,id)=>get(d.shifts,id,"Shift");
const site=(d,id)=>get(d.sites,id,"Site");
const incident=(d,id)=>get(d.incidents,id,"Incident");
const guard=(d,id)=>get(d.guards,id,"Guard");
function event(d,s,role,kind,detail){
 const row={id:uid(d,"EV"),shiftId:s.id,siteId:s.siteId,guardId:s.guardId,role,kind,detail,at:CLOCK};
 d.events.unshift(row);return row;
}
function makeShift(id,siteId,guardId,state,late,checkpoints){
 return {id,siteId,guardId,date:DATE,slot:"07:00–19:00",state,late:!!late,
  checkIn:state==="on-duty"?{distanceM:42,accuracyM:12,source:"Sample GPS",at:"07:03 EAT"}:null,
  checkOut:null,handover:null,
  checkpoints:checkpoints.map(([id,label,status])=>({id,label,status,verifiedAt:status==="verified"?"08:10 EAT":null}))};
}
function seed(){
 const sites=[
  {id:"SITE-1",name:"Westlands Office Plaza",area:"Westlands, Nairobi",client:"Summit Offices Ltd",radiusM:120,
   checkpointLabels:["Main entrance","Parking perimeter","Rear service gate"]},
  {id:"SITE-2",name:"Karen Residential Estate",area:"Karen, Nairobi",client:"Green Acres Estate",radiusM:140,
   checkpointLabels:["Main gate","Visitor entrance","Boundary fence"]},
  {id:"SITE-3",name:"Industrial Area Warehouse",area:"Industrial Area, Nairobi",client:"Metro Storage Ltd",radiusM:160,
   checkpointLabels:["Loading bay","North perimeter","Warehouse entrance"]},
  {id:"SITE-4",name:"Kilimani Apartments",area:"Kilimani, Nairobi",client:"Palm Heights Management",radiusM:110,
   checkpointLabels:["Lobby","Parking entrance","Rear perimeter"]}
 ];
 const guards=[
  {id:"GUARD-1",name:"Kevin Otieno",phone:"0711000001"},
  {id:"GUARD-2",name:"Sarah Wanjiku",phone:"0711000002"},
  {id:"GUARD-3",name:"Musa Kamau",phone:"0711000003"},
  {id:"GUARD-4",name:"Jane Achieng",phone:"0711000004"},
  {id:"GUARD-5",name:"Daniel Mwangi",phone:"0711000005"}
 ];
 const cp=(n,list)=>list.map((label,i)=>[n+"-CP"+(i+1),label,i===0?"verified":"pending"]);
 const shifts=[
  makeShift("SH-101","SITE-1","GUARD-1","scheduled",false,cp("SH-101",sites[0].checkpointLabels).map(x=>[x[0],x[1],"pending"])),
  makeShift("SH-102","SITE-2","GUARD-2","on-duty",false,cp("SH-102",sites[1].checkpointLabels)),
  makeShift("SH-103","SITE-3","GUARD-3","on-duty",false,[
   ["SH-103-CP1","Loading bay","verified"],["SH-103-CP2","North perimeter","missed"],["SH-103-CP3","Warehouse entrance","pending"]]),
  makeShift("SH-104","SITE-4","GUARD-4","scheduled",true,cp("SH-104",sites[3].checkpointLabels).map(x=>[x[0],x[1],"pending"]))
 ];
 const incidents=[
  {id:"INC-201",shiftId:"SH-103",siteId:"SITE-3",guardId:"GUARD-3",
   title:"Warehouse gate left unsecured",category:"Access control",severity:"High",
   notes:"North access gate found unlocked during scheduled rounds.",emergency:false,
   status:"Open",openedAt:"08:23 EAT",acknowledgedAt:null,responseNote:null,resolvedAt:null},
  {id:"INC-202",shiftId:"SH-102",siteId:"SITE-2",guardId:"GUARD-2",
   title:"Visitor access discrepancy",category:"Access control",severity:"Medium",
   notes:"Visitor entry required verification before access was allowed.",emergency:false,
   status:"Resolved",openedAt:"07:56 EAT",acknowledgedAt:"08:02 EAT",
   responseNote:"Identity cross-checked with the client contact.",resolvedAt:"08:14 EAT"}
 ];
 const evidence=[{id:"PIC-301",shiftId:"SH-103",incidentId:"INC-201",checkpointId:null,
  label:"Gate observation",source:"Sample camera",at:"08:25 EAT"}];
 const events=[
  {id:"EV-401",shiftId:"SH-103",siteId:"SITE-3",guardId:"GUARD-3",role:"Guard",kind:"Incident",detail:"Warehouse gate left unsecured reported",at:"08:23 EAT"},
  {id:"EV-402",shiftId:"SH-103",siteId:"SITE-3",guardId:"GUARD-3",role:"Guard",kind:"Patrol",detail:"North perimeter checkpoint missed",at:"08:20 EAT"},
  {id:"EV-403",shiftId:"SH-102",siteId:"SITE-2",guardId:"GUARD-2",role:"Supervisor",kind:"Incident",detail:"Visitor access discrepancy resolved",at:"08:14 EAT"},
  {id:"EV-404",shiftId:"SH-102",siteId:"SITE-2",guardId:"GUARD-2",role:"Guard",kind:"Attendance",detail:"Guard checked in · sample location verified",at:"07:03 EAT"}
 ];
 return {version:1,seq:2000,company:"Harbor Shield Security",date:DATE,sites,guards,shifts,incidents,evidence,events};
}
const valid=d=>Boolean(d?.version===1&&Array.isArray(d.sites)&&Array.isArray(d.guards)&&
 Array.isArray(d.shifts)&&Array.isArray(d.incidents)&&Array.isArray(d.evidence)&&Array.isArray(d.events)&&
 Number.isSafeInteger(d.seq));
const siteFor=(d,s)=>site(d,s.siteId);
const guardFor=(d,s)=>guard(d,s.guardId);
function shiftStatus(s){return s.state==="scheduled"&&s.late?"Late":s.state==="on-duty"?"On duty":s.state==="completed"?"Completed":"Scheduled";}
function gpsReading(s,mode){
 if(mode==="near")return {distanceM:35,accuracyM:12,source:"Simulated GPS",at:CLOCK};
 if(mode==="far")return {distanceM:360,accuracyM:22,source:"Simulated GPS",at:CLOCK};
 if(mode==="uncertain")return {distanceM:90,accuracyM:95,source:"Simulated GPS",at:CLOCK};
 throw Error("Select a sample location.");
}
function checkIn(d,role,shiftId,mode){
 verifyRole(role,"guard");const s=shift(d,shiftId);
 if(s.guardId!=="GUARD-1")throw Error("Only Kevin's assigned shift is editable in this guard demo.");
 if(s.state!=="scheduled")throw Error("Only a scheduled shift can be checked into.");
 const gps=gpsReading(s,mode),radius=siteFor(d,s).radiusM;
 if(gps.distanceM+gps.accuracyM>radius)throw Error("Location not verified. Outside the "+radius+" m geofence or accuracy insufficient.");
 s.state="on-duty";s.checkIn=gps;s.late=false;
 event(d,s,"Guard","Attendance","Checked in · "+gps.distanceM+" m from post (sample GPS)");
 return s;
}
function verifyCheckpoint(d,role,shiftId,checkpointId){
 verifyRole(role,"guard");const s=shift(d,shiftId);
 if(s.guardId!=="GUARD-1"||s.state!=="on-duty")throw Error("Kevin must be checked in to verify patrol checkpoints.");
 const index=s.checkpoints.findIndex(p=>p.id===checkpointId);
 if(index===-1)throw Error("Checkpoint not found.");
 const cp=s.checkpoints[index];
 if(cp.status!=="pending")throw Error("Checkpoint already processed.");
 if(s.checkpoints.slice(0,index).some(p=>p.status==="pending"))throw Error("Complete earlier patrol checkpoints first.");
 cp.status="verified";cp.verifiedAt=CLOCK;
 event(d,s,"Guard","Patrol",cp.label+" · checkpoint verified");
 return cp;
}
function reportIncident(d,role,shiftId,fields){
 verifyRole(role,"guard");const s=shift(d,shiftId);
 if(s.guardId!=="GUARD-1"||s.state!=="on-duty")throw Error("Check in to report a non-emergency incident.");
 const category=trim(fields.category,"Category");
 if(!CATEGORIES.includes(category))throw Error("Choose a valid incident category.");
 const severity=trim(fields.severity,"Severity");
 if(!SEVERITIES.includes(severity))throw Error("Choose a valid incident severity.");
 const title=trim(fields.title,"Incident title",5,72);
 const notes=trim(fields.notes,"Incident notes",10,350);
 const i={id:uid(d,"INC"),shiftId:s.id,siteId:s.siteId,guardId:s.guardId,title,
  category,severity,notes,emergency:false,status:"Open",openedAt:CLOCK,
  acknowledgedAt:null,responseNote:null,resolvedAt:null};
 d.incidents.unshift(i);event(d,s,"Guard","Incident",title+" reported");
 return i;
}
function sos(d,role,shiftId){
 verifyRole(role,"guard");const s=shift(d,shiftId);
 if(s.guardId!=="GUARD-1"||s.state==="completed")throw Error("SOS is only available on Kevin's assigned shift.");
 const existing=d.incidents.find(i=>i.shiftId===s.id&&i.emergency&&i.status!=="Resolved");
 if(existing)return existing; // repeated tap never creates duplicate alerts
 const i={id:uid(d,"INC"),shiftId:s.id,siteId:s.siteId,guardId:s.guardId,
  title:"Emergency SOS · immediate assistance requested",category:"Emergency",severity:"Critical",
  notes:"Guard triggered an emergency alert. Evidence may be added later only when safe.",
  emergency:true,status:"Open",openedAt:CLOCK,acknowledgedAt:null,responseNote:null,resolvedAt:null};
 d.incidents.unshift(i);event(d,s,"Guard","SOS","Emergency alert raised · supervisor response required");
 return i;
}
function photo(d,role,shiftId,targetType,targetId,label){
 verifyRole(role,"guard");const s=shift(d,shiftId);
 if(s.guardId!=="GUARD-1"||s.state==="completed")throw Error("Only Kevin may attach sample evidence to his active shift.");
 const desc=trim(label,"Photo description");
 if(!PHOTO_LABELS.includes(desc))throw Error("Choose a sample photo description.");
 let incidentId=null,checkpointId=null;
 if(targetType==="incident"){
  const i=incident(d,targetId);
  if(i.shiftId!==s.id||i.status==="Resolved")throw Error("This incident is not open on Kevin's shift.");
  incidentId=i.id;
 }else if(targetType==="checkpoint"){
  if(s.state!=="on-duty")throw Error("Check in first.");
  const cp=s.checkpoints.find(x=>x.id===targetId);
  if(!cp||cp.status!=="verified")throw Error("Verify the checkpoint before adding evidence.");
  checkpointId=cp.id;
 }else throw Error("Choose an evidence destination.");
 const count=d.evidence.filter(p=>incidentId?p.incidentId===incidentId:p.checkpointId===checkpointId).length;
 if(count>=3)throw Error("Three sample photos is the limit for this record.");
 const record={id:uid(d,"PIC"),shiftId:s.id,incidentId,checkpointId,
  label:desc,source:"Simulated camera",at:CLOCK};
 d.evidence.unshift(record);event(d,s,"Guard","Evidence",desc+" · simulated photo saved");
 return record;
}
function acknowledge(d,role,incidentId){
 verifyRole(role,"supervisor");const i=incident(d,incidentId);
 if(i.status!=="Open")throw Error("Only a new incident may be acknowledged.");
 i.status="Acknowledged";i.acknowledgedAt=CLOCK;
 event(d,shift(d,i.shiftId),"Supervisor","Incident",i.id+" acknowledged");
 return i;
}
function respond(d,role,incidentId,notes){
 verifyRole(role,"supervisor");const i=incident(d,incidentId);
 if(i.status!=="Acknowledged")throw Error("Acknowledge this incident before recording response.");
 const response=trim(notes,"Response notes",10,350);
 i.status="Responding";i.responseNote=response;
 event(d,shift(d,i.shiftId),"Supervisor","Incident",i.id+" · response recorded");
 return i;
}
function resolve(d,role,incidentId){
 verifyRole(role,"supervisor");const i=incident(d,incidentId);
 if(i.status!=="Responding"||!i.responseNote)throw Error("Record a supervisor response before resolving.");
 i.status="Resolved";i.resolvedAt=CLOCK;
 event(d,shift(d,i.shiftId),"Supervisor","Incident",i.id+" resolved");
 return i;
}
function handover(d,role,shiftId,note){
 verifyRole(role,"guard");const s=shift(d,shiftId);
 if(s.guardId!=="GUARD-1"||s.state!=="on-duty")throw Error("Kevin must be on duty to prepare handover.");
 if(s.handover)throw Error("Handover already recorded.");
 const text=trim(note,"Handover notes",10,350);
 const unresolved=d.incidents.filter(x=>x.shiftId===s.id&&x.status!=="Resolved").map(x=>x.id);
 s.handover={notes:text,unresolvedIncidentIds:unresolved,at:CLOCK};
 event(d,s,"Guard","Handover","Handover recorded · "+unresolved.length+" unresolved incidents");
 return s.handover;
}
function checkOut(d,role,shiftId){
 verifyRole(role,"guard");const s=shift(d,shiftId);
 if(s.guardId!=="GUARD-1"||s.state!=="on-duty")throw Error("Only Kevin's active shift can be checked out.");
 if(!s.handover)throw Error("Complete shift handover before checking out.");
 if(d.incidents.some(x=>x.shiftId===s.id&&x.emergency&&x.status!=="Resolved"))
  throw Error("An emergency SOS is still open. Supervisor resolution is required before checkout.");
 s.state="completed";s.checkOut={at:CLOCK,source:"Sample checkout"};
 event(d,s,"Guard","Attendance","Checked out · shift completed");
 return s;
}
function reassign(d,role,shiftId,guardId){
 verifyRole(role,"manager");const s=shift(d,shiftId),g=guard(d,guardId);
 if(s.state!=="scheduled")throw Error("Only unstarted shifts may be reassigned.");
 if(s.guardId===g.id)throw Error("This guard is already assigned.");
 if(d.shifts.some(x=>x.id!==s.id&&x.guardId===g.id&&x.state!=="completed"))
  throw Error("This guard is already assigned to an active or scheduled post.");
 const from=guardFor(d,s).name;
 s.guardId=g.id;s.late=false;
 event(d,s,"Operations Manager","Deployment",from+" replaced by "+g.name);
 return s;
}
function metrics(d){
 const onDuty=d.shifts.filter(s=>s.state==="on-duty"),late=d.shifts.filter(s=>s.state==="scheduled"&&s.late);
 const pending=d.shifts.flatMap(s=>s.checkpoints).filter(cp=>cp.status==="pending");
 return {posts:d.sites.length,onDuty:onDuty.length,late:late.length,
  unfilled:d.shifts.filter(s=>s.state!=="on-duty"&&s.state!=="completed").length,
  verified:d.shifts.flatMap(s=>s.checkpoints).filter(cp=>cp.status==="verified").length,
  pending:pending.length,missed:d.shifts.flatMap(s=>s.checkpoints).filter(cp=>cp.status==="missed").length,
  incidents:d.incidents.filter(i=>i.status!=="Resolved").length,
  sos:d.incidents.filter(i=>i.emergency&&i.status!=="Resolved").length,
  photos:d.evidence.length};
}
return {DATE,CLOCK,ROLES,CATEGORIES,SEVERITIES,PHOTO_LABELS,seed,valid,shift,site,guard,incident,siteFor,guardFor,
 shiftStatus,gpsReading,checkIn,verifyCheckpoint,reportIncident,sos,photo,acknowledge,respond,resolve,
 handover,checkOut,reassign,metrics};
})();
