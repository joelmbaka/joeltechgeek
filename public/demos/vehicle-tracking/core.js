/* Vehicle Tracking & Security: fictional, browser-only demo. No GPS, device commands or remote APIs. */
var trackingCore=(function(){
"use strict";
const ROUTES={
  "V-101":[
    {x:66,y:263,at:"08:12",speed:0,label:"Karen"},
    {x:112,y:235,at:"08:19",speed:36,label:"Lang'ata"},
    {x:181,y:193,at:"08:27",speed:48,label:"Kilimani"},
    {x:245,y:145,at:"08:35",speed:42,label:"Upper Hill"},
    {x:300,y:97,at:"08:43",speed:26,label:"CBD"}
  ],
  "V-102":[
    {x:95,y:97,at:"07:50",speed:0,label:"Westlands"},
    {x:153,y:117,at:"08:03",speed:31,label:"Parklands"},
    {x:211,y:145,at:"08:16",speed:23,label:"Museum Hill"},
    {x:255,y:178,at:"08:26",speed:0,label:"Upper Hill"}
  ],
  "V-103":[
    {x:346,y:259,at:"08:05",speed:0,label:"Industrial Area"},
    {x:308,y:225,at:"08:19",speed:37,label:"Mombasa Road"},
    {x:254,y:199,at:"08:30",speed:29,label:"South B"},
    {x:224,y:176,at:"08:41",speed:0,label:"South C"}
  ]
};
const copy=v=>JSON.parse(JSON.stringify(v));
const route=id=>ROUTES[id]||[];
function seed(){
 return {
  version:1,seq:202,vehicles:[
   {id:"V-101",name:"Toyota Prado",plate:"KDX 482R",owner:"Amani Mwangi",status:"online",ignition:true,position:3,lastSeenMinutes:0,geofenceOutside:false},
   {id:"V-102",name:"Isuzu D-Max",plate:"KCU 917Q",owner:"Daniel Otieno",status:"online",ignition:false,position:3,lastSeenMinutes:1,geofenceOutside:false},
   {id:"V-103",name:"Toyota Fielder",plate:"KDD 318A",owner:"Lydia Wanjiku",status:"offline",ignition:null,position:3,lastSeenMinutes:45,geofenceOutside:false}
  ],
  alerts:[
   {id:"AL-201",vehicleId:"V-103",kind:"Connection lost",detail:"No position received for 45 minutes. Displaying last known location.",severity:"high",status:"new",at:"09:41 EAT"},
   {id:"AL-200",vehicleId:"V-101",kind:"Trip started",detail:"Simulated ignition-on event near Kilimani.",severity:"info",status:"acknowledged",at:"08:12 EAT"}
  ],
  tickets:[
   {id:"REQ-202",vehicleId:"V-103",category:"Tracking not updating",note:"The tracker has not sent a recent location update.",status:"Open",at:"09:41 EAT",reply:""}
  ],
  activity:[{label:"Tracker status reported offline",detail:"KDD 318A · 09:41 EAT"}]
 };
}
function validate(d){
 return Boolean(d&&d.version===1&&Number.isSafeInteger(d.seq)&&Array.isArray(d.vehicles)&&d.vehicles.length===3&&
 Array.isArray(d.alerts)&&Array.isArray(d.tickets)&&Array.isArray(d.activity)&&
 d.vehicles.every(v=>route(v.id).length>0&&["online","offline"].includes(v.status)&&Number.isInteger(v.position)&&v.position>=0&&v.position<route(v.id).length&&Number.isFinite(v.lastSeenMinutes)&&v.lastSeenMinutes>=0));
}
function get(d,id){const v=d.vehicles.find(v=>v.id===id);if(!v)throw Error("Vehicle not found.");return v;}
function alert(d,vehicleId,kind,detail,severity){
 const item={id:"AL-"+(++d.seq),vehicleId,kind,detail,severity,status:"new",at:"Demo · 09:41 EAT"};
 d.alerts.unshift(item);d.activity.unshift({label:kind,detail:get(d,vehicleId).plate+" · Simulated"});return item;
}
function move(d,id){
 const v=get(d,id);if(v.status!=="online")throw Error("Location unavailable. This tracker is offline.");
 v.position=(v.position+1)%route(id).length;v.lastSeenMinutes=0;v.ignition=true;
 d.activity.unshift({label:"Sample location advanced",detail:v.plate+" · "+route(id)[v.position].label});
 return v;
}
function geofence(d,id){
 const v=get(d,id);if(v.status!=="online")throw Error("Geofence simulation requires a connected tracker.");
 if(v.geofenceOutside)throw Error("Geofence exit already simulated. Reset to replay.");
 v.geofenceOutside=true;
 return alert(d,id,"Geofence exit","The fictional vehicle crossed its illustrative safe zone.","high");
}
function loseSignal(d,id){
 const v=get(d,id);if(v.status==="offline")throw Error("Tracker is already offline.");
 v.status="offline";v.lastSeenMinutes=32;v.ignition=null;
 return alert(d,id,"Connection lost","No new GPS telemetry. Last known position is retained; current location is unknown.","high");
}
function restoreSignal(d,id){
 const v=get(d,id);if(v.status==="online")throw Error("Tracker is already connected.");
 v.status="online";v.lastSeenMinutes=0;v.ignition=false;
 return alert(d,id,"Connection restored","Simulated tracker connection is available again.","info");
}
function acknowledge(d,id){
 const item=d.alerts.find(a=>a.id===id);if(!item)throw Error("Alert not found.");
 if(item.status==="acknowledged")throw Error("Alert already acknowledged.");
 item.status="acknowledged";
 d.activity.unshift({label:"Alert acknowledged",detail:item.id+" · "+item.kind});
 return item;
}
const clean=(v,label,max)=>{
 const s=String(v||"").trim();
 if(s.length<3||s.length>max)throw Error(label+" must be between 3 and "+max+" characters.");
 return s;
};
function createTicket(d,vehicleId,category,note){
 get(d,vehicleId);
 if(!["Tracking not updating","Wrong location","Playback issue","Other"].includes(category))throw Error("Select an issue type.");
 const item={id:"REQ-"+(++d.seq),vehicleId,category,note:clean(note,"Description",240),status:"Open",at:"Demo · 09:41 EAT",reply:""};
 d.tickets.unshift(item);d.activity.unshift({label:"Support request opened",detail:item.id+" · "+get(d,vehicleId).plate});
 return item;
}
function progressTicket(d,id){
 const t=d.tickets.find(t=>t.id===id);if(!t)throw Error("Support request not found.");
 if(t.status==="Resolved")throw Error("Request already resolved.");
 t.status=t.status==="Open"?"In progress":"Resolved";
 t.reply=t.status==="In progress"?"Monitoring desk is reviewing sample telemetry.":"Sample follow-up completed. Actual device connectivity was not tested.";
 d.activity.unshift({label:"Support request "+t.status.toLowerCase(),detail:t.id});
 return t;
}
function summary(d){
 return {online:d.vehicles.filter(v=>v.status==="online").length,offline:d.vehicles.filter(v=>v.status==="offline").length,openAlerts:d.alerts.filter(a=>a.status==="new").length,openRequests:d.tickets.filter(t=>t.status!=="Resolved").length};
}
function position(v){return route(v.id)[v.position];}
function trip(id){return copy(route(id));}
return {ROUTES,seed,validate,get,route,position,trip,move,geofence,loseSignal,restoreSignal,acknowledge,createTicket,progressTicket,summary};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=trackingCore;
