/* Waypoint: fictional vehicle tracking demo. No live tracking, notifications or vehicle commands. */
(function(){
"use strict";
const C=trackingCore,KEY="jtg_vehicle_tracking_demo_v1",root=document.getElementById("app");
if(!root)return;
let data,role="owner",tab="track",selected="V-101",playbackStep=0,playing=false,timer=null,notice="";
try{data=JSON.parse(localStorage.getItem(KEY)||"null");if(!C.validate(data))data=C.seed();}
catch(_){data=C.seed();}
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const vehicle=id=>C.get(data,id||selected);
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch(_){notice="Browser storage unavailable; changes may not persist.";}};
const stop=()=>{if(timer!==null)clearInterval(timer);timer=null;playing=false;};
const tone=status=>status==="online"?"online":status==="offline"?"offline":"neutral";
const status=v=>v.status==="online"?(v.ignition?"Moving":"Parked"):"Offline";
const seen=v=>v.status==="offline"?v.lastSeenMinutes+" min ago":v.lastSeenMinutes===0?"Just now":v.lastSeenMinutes+" min ago";
const pin=v=>C.position(v);
const icon=(name)=>({car:"🚙",truck:"🛻",sedan:"🚗"}[name]||"🚗");
const vIcon=v=>v.id==="V-101"?"car":v.id==="V-102"?"truck":"sedan";
function title(eyebrow,heading,desc){return '<div class="heading"><span>'+esc(eyebrow)+'</span><h1>'+esc(heading)+'</h1><p>'+esc(desc)+'</p></div>';}
function stat(value,label,kind){return '<div class="stat"><strong class="'+esc(kind||"")+'">'+esc(value)+'</strong><span>'+esc(label)+'</span></div>';}
function badge(value,kind){return '<span class="badge '+esc(kind||"")+'">'+esc(value)+'</span>';}
function vehiclePicker(){
 return '<div class="vehicle-scroll" role="group" aria-label="Choose a sample vehicle">'+data.vehicles.map(v=>
 '<button type="button" class="vehicle-chip '+(selected===v.id?"selected":"")+'" data-action="choose" data-id="'+esc(v.id)+'">'+
 '<span class="vehicle-emoji">'+icon(vIcon(v))+'</span><span class="chip-meta"><b>'+esc(v.plate)+'</b><small>'+esc(v.name)+'</small></span>'+
 '<i class="signal '+tone(v.status)+'" aria-label="'+esc(v.status)+'"></i></button>').join("")+'</div>';
}
function baseMap(){
 return '<defs><pattern id="blocks" width="41" height="38" patternUnits="userSpaceOnUse"><path d="M0 38H41M41 0V38" fill="none" stroke="#dfebe8" stroke-width="1"/></pattern><filter id="pinshadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#26465d" flood-opacity=".25"/></filter></defs>'+
 '<rect width="400" height="320" fill="#edf5f0"/><rect width="400" height="320" fill="url(#blocks)"/>'+
 '<path d="M0 60Q95 20 150 42T400 22V0H0Z" fill="#d9eee4"/>'+
 '<path d="M0 232Q91 206 127 249T248 269T400 228V320H0Z" fill="#e1f0e3"/>'+
 '<path class="map-road-under" d="M-30 52Q85 103 156 92T428 190 M-12 296Q102 253 158 189T405 -9 M-12 149Q113 166 230 121T427 60 M34 -20Q105 91 168 159T410 328 M-30 222Q125 219 245 240T430 260"/>'+
 '<path class="map-road" d="M-30 52Q85 103 156 92T428 190 M-12 296Q102 253 158 189T405 -9 M-12 149Q113 166 230 121T427 60 M34 -20Q105 91 168 159T410 328 M-30 222Q125 219 245 240T430 260"/>'+
 '<path class="map-main-road" d="M-20 288Q140 185 212 151T414 66"/>'+
 '<g class="map-places"><text x="35" y="67">WESTLANDS</text><text x="268" y="54">PARKLANDS</text><text x="265" y="112">CBD</text><text x="112" y="186">KILIMANI</text><text x="230" y="229">SOUTH B</text><text x="28" y="277">KAREN</text><text x="290" y="286">INDUSTRIAL AREA</text><text x="224" y="157">UPPER HILL</text></g>';
}
function map(v,options={}){
 const points=C.route(v.id),playback=!!options.playback,idx=playback?playbackStep:v.position;
 const point=points[idx],path=points.map(p=>p.x+","+p.y).join(" ");
 const travelled=points.slice(0,idx+1).map(p=>p.x+","+p.y).join(" ");
 const drawn='<polyline class="route-base" points="'+path+'"/><polyline class="route-progress" points="'+travelled+'"/>';
 const marker='<g transform="translate('+point.x+' '+point.y+')" filter="url(#pinshadow)"><circle r="18" fill="'+(v.status==="offline"&&!playback?"#eb9b4c":"#0b9478")+'" stroke="white" stroke-width="4"/><path d="M-8 -2H8L10 3H-10Z M-6 -7H6L8 -2H-8Z" fill="#fff"/><circle cx="-5.5" cy="4" r="2" fill="#fff"/><circle cx="5.5" cy="4" r="2" fill="#fff"/></g>';
 return '<div class="map-panel"><div class="map-toolbar"><span><span class="live-dot '+(v.status==="offline"&&!playback?"amber":"")+'"></span>'+(playback?"RECORDED ROUTE":v.status==="online"?"SIMULATED POSITION":"LAST KNOWN POSITION")+'</span><span class="map-grid-icon">⌖  Nairobi</span></div>'+
 '<svg class="map" role="img" aria-label="Illustrative Nairobi-style map with '+esc(v.plate)+' sample '+(playback?"route":"location")+'" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice">'+baseMap()+(playback||v.status==="online"?drawn:"")+marker+'</svg>'+
 '<div class="map-bottom"><span>ILLUSTRATIVE MAP · NO LIVE GPS</span><span>'+esc(point.label)+'</span></div></div>';
}
function fleetCard(v,compact){
 const active=selected===v.id;
 return '<button type="button" data-action="choose" data-id="'+esc(v.id)+'" class="fleet-row '+(active?"focused":"")+'">'+
 '<span class="fleet-icon">'+icon(vIcon(v))+'</span><span class="fleet-label"><b>'+esc(v.plate)+'</b><small>'+esc(v.name)+' · '+esc(C.position(v).label)+'</small></span>'+
 '<span class="fleet-right">'+badge(status(v),tone(v.status))+'<small>'+esc(seen(v))+'</small></span></button>';
}
function ownerTrack(){
 const v=vehicle(),point=pin(v),offline=v.status==="offline";
 return title("YOUR VEHICLES","Know where it is.","See a sample location, vehicle condition and the age of its most recent update.")+
 vehiclePicker()+
 '<div class="selected-heading"><div><small>SELECTED VEHICLE</small><h2>'+esc(v.name)+'</h2><p>'+esc(v.plate)+' · '+esc(v.owner)+'</p></div>'+badge(status(v),tone(v.status))+'</div>'+
 map(v)+
 (offline?'<div class="safety-banner"><b>⚠ Location may be outdated</b><p>No new position has arrived for '+v.lastSeenMinutes+' minutes. This marker is the <strong>last known</strong> location—not a claim about where the vehicle is now.</p></div>':
 '<div class="healthy-banner"><b>● Tracker connected (simulation)</b><span>Last report: '+esc(seen(v))+'</span></div>')+
 '<div class="info-grid">'+stat(offline?"Unknown":point.speed+" km/h","Speed",offline?"dim":"")+stat(offline?"Unknown":v.ignition?"On":"Off","Ignition",offline?"dim":"")+
 stat(esc(seen(v)),"Last location report",offline?"warn":"")+'</div>'+
 '<section class="panel"><div class="section-heading"><h3>Try a scenario</h3>'+badge("SIMULATED","muted")+'</div>'+
 (offline?'<p class="panel-intro">The location is stale. Restore sample connectivity to see how the app responds.</p><button class="primary full" data-action="restore" data-id="'+esc(v.id)+'">Simulate reconnection</button>':
 '<p class="panel-intro">Move a fictional vehicle, test a boundary alert or simulate a signal interruption.</p><div class="action-grid"><button class="secondary" data-action="move" data-id="'+esc(v.id)+'">↗ Move vehicle</button><button class="secondary" data-action="geofence" data-id="'+esc(v.id)+'" '+(v.geofenceOutside?"disabled":"")+'>◇ Geofence exit</button><button class="danger-outline span-2" data-action="signal" data-id="'+esc(v.id)+'">⚠ Simulate signal loss</button></div>')+
 '</section>';
}
function ownerTrips(){
 const v=vehicle(),points=C.trip(v.id),p=points[playbackStep],complete=playbackStep===points.length-1;
 return title("TRIP HISTORY","Replay the journey.","Watch pre-recorded, fictional location points advance on a sample route.")+
 vehiclePicker()+map(v,{playback:true})+
 '<section class="panel"><div class="trip-head"><div><small>ILLUSTRATIVE JOURNEY</small><h3>'+esc(points[0].label)+' → '+esc(points[points.length-1].label)+'</h3></div>'+badge((playbackStep+1)+"/"+points.length+" points","neutral")+'</div>'+
 '<div class="trip-timeline"><b>'+esc(p.at)+'</b><span>'+esc(p.label)+' · '+p.speed+' km/h</span></div>'+
 '<div class="progress-track"><div style="width:'+Math.round((playbackStep+1)/points.length*100)+'%"></div></div>'+
 '<div class="action-grid"><button class="primary" data-action="'+(playing?"pause":complete?"replay":"play")+'">'+(playing?"Ⅱ Pause":complete?"↺ Replay":"▶ Play trip")+'</button><button class="secondary" data-action="restart">↺ Start over</button></div>'+
 '<p class="smallprint">This playback uses fixed fictional timestamps and locations. It is not a real GPS recording.</p></section>';
}
function alertCard(a,desk){
 const v=vehicle(a.vehicleId),newAlert=a.status==="new";
 return '<article class="alert-card"><div class="alert-glyph '+(a.severity==="high"?"critical":"info")+'">'+(a.severity==="high"?"!":"i")+'</div><div class="alert-copy"><div class="alert-top"><b>'+esc(a.kind)+'</b>'+badge(newAlert?"New":"Acknowledged",newAlert?"offline":"muted")+'</div>'+
 '<p>'+esc(a.detail)+'</p><div class="meta-line">'+esc(v.plate)+' · '+esc(a.at)+'</div>'+
 (desk&&newAlert?'<button class="secondary small" data-action="acknowledge" data-id="'+esc(a.id)+'">Acknowledge alert</button>':'')+'</div></article>';
}
function ownerAlerts(){
 return title("SECURITY EVENTS","Your alerts.","Important sample events across your three vehicles.")+
 '<div class="notice-quiet">These alerts are simulated. No real push notifications or emergency responses are sent.</div>'+
 (data.alerts.length?data.alerts.map(a=>alertCard(a,false)).join(""):'<div class="empty">No simulated alerts yet.</div>');
}
function requestCard(t,desk){
 const v=vehicle(t.vehicleId);
 return '<article class="request-card"><div class="request-top"><div><small>'+esc(t.id)+' · '+esc(v.plate)+'</small><h3>'+esc(t.category)+'</h3></div>'+badge(t.status,t.status==="Resolved"?"online":t.status==="In progress"?"neutral":"offline")+'</div>'+
 '<p>'+esc(t.note)+'</p>'+(t.reply?'<div class="response"><b>Monitoring update</b><p>'+esc(t.reply)+'</p></div>':'')+
 (desk&&t.status!=="Resolved"?'<button class="primary" data-action="progress" data-id="'+esc(t.id)+'">'+(t.status==="Open"?"Start review":"Mark resolved")+'</button>':'')+'</article>';
}
function ownerSupport(){
 return title("GET ASSISTANCE","Report a problem.","A request goes to the fictional Monitoring Desk and changes status as it is handled.")+
 '<form id="support-form" class="panel support-form">'+
 '<label>Vehicle<select name="vehicleId">'+data.vehicles.map(v=>'<option value="'+esc(v.id)+'" '+(v.id===selected?"selected":"")+'>'+esc(v.plate)+' · '+esc(v.name)+'</option>').join("")+'</select></label>'+
 '<label>Issue type<select name="category"><option>Tracking not updating</option><option>Wrong location</option><option>Playback issue</option><option>Other</option></select></label>'+
 '<label>What happened?<textarea name="note" maxlength="240" minlength="3" rows="3" required placeholder="Describe the issue so the monitoring team can investigate."></textarea></label>'+
 '<p class="smallprint">Demo only. No information is sent to Nebsam or to a real support desk.</p><button class="primary full" type="submit">Submit sample request</button></form>'+
 '<div class="section-heading outside"><h2>My requests</h2>'+badge(data.tickets.length+" total","muted")+'</div>'+data.tickets.map(t=>requestCard(t,false)).join("");
}
function deskFleet(){
 const s=C.summary(data),v=vehicle(),offline=v.status==="offline";
 return title("MONITORING DESK","Fleet overview.","Review fictional tracker conditions and see what a support agent needs to investigate.")+
 '<div class="metrics">'+stat(s.online,"Connected")+stat(s.offline,"Offline","warn")+stat(s.openAlerts,"Unreviewed alerts","warn")+stat(s.openRequests,"Open requests")+'</div>'+
 '<div class="section-heading outside"><h2>Vehicle status</h2><small>3 SAMPLE VEHICLES</small></div>'+
 data.vehicles.map(v=>fleetCard(v)).join("")+
 '<div class="section-heading outside"><h2>Selected tracker</h2>'+badge(v.status==="online"?"Connected":"No signal",tone(v.status))+'</div>'+
 map(v)+
 '<div class="detail-list"><div><span>Vehicle</span><b>'+esc(v.plate)+' · '+esc(v.name)+'</b></div><div><span>Last location</span><b>'+esc(seen(v))+'</b></div><div><span>Position confidence</span><b>'+(!offline?"Illustrative · current":"Stale · location unknown")+'</b></div></div>'+
 (offline?'<div class="safety-banner"><b>Attention needed</b><p>Signal loss is visible here without misleading the customer about the current vehicle location.</p></div>':'');
}
function deskAlerts(){
 return title("MONITORING DESK","Security events.","Acknowledge sample geofence and connectivity alerts raised in the owner app.")+
 '<div class="notice-quiet">Acknowledging means a staff member reviewed the demo record. It does not contact a driver or activate a real response.</div>'+
 data.alerts.map(a=>alertCard(a,true)).join("");
}
function deskRequests(){
 return title("MONITORING DESK","Support queue.","Progress a customer issue from Open to In progress and Resolved.")+
 (data.tickets.length?data.tickets.map(t=>requestCard(t,true)).join(""):'<div class="empty">There are no support requests.</div>');
}
const ownerTabs=[["track","Track","⌖"],["trips","Trips","↗"],["alerts","Alerts","♢"],["support","Help","☰"]];
const deskTabs=[["fleet","Fleet","▦"],["events","Alerts","♢"],["requests","Requests","☰"]];
function navbar(){
 const tabs=role==="owner"?ownerTabs:deskTabs;
 return '<nav class="bottom-nav" aria-label="Demo navigation">'+tabs.map(([id,label,symbol])=>
 '<button type="button" data-action="tab" data-id="'+id+'" class="'+(tab===id?"active":"")+'" aria-current="'+(tab===id?"page":"false")+'"><span>'+symbol+'</span><small>'+label+'</small></button>').join("")+'</nav>';
}
let lastViewScrollKey=null;
function render(){
 const scrollKey=[role,tab].join(":");
 const previousScroll=root.querySelector?.("#tracking-screen")?.scrollTop||0;
 const keepScroll=lastViewScrollKey===scrollKey;
 if(role==="owner"&&!ownerTabs.some(x=>x[0]===tab))tab="track";
 if(role==="desk"&&!deskTabs.some(x=>x[0]===tab))tab="fleet";
 const owner={track:ownerTrack,trips:ownerTrips,alerts:ownerAlerts,support:ownerSupport};
 const desk={fleet:deskFleet,events:deskAlerts,requests:deskRequests};
 const screen=(role==="owner"?owner:desk)[tab]();
 root.innerHTML='<div class="scene"><aside class="introduction"><div class="kicker">JOELTECHGEEK · INTERACTIVE CONCEPT</div><h2>Confidence in every journey.</h2><p>Explore a connected vehicle-security experience with clear location freshness, trip playback, alerts and a responsive monitoring desk.</p><a href="/demos/vehicle-tracking">← About this concept</a>'+
 '<div class="side-divider"></div><span class="trust-note">All vehicles, GPS locations, events and support actions are fictional.</span></aside>'+
 '<div class="device"><div class="system-bar"><span>9:41</span><span>●●● ◕ ▰</span></div>'+
 '<header class="topbar"><div class="brand"><span class="brand-mark">⌖</span><span><strong>Waypoint</strong><small>VEHICLE SECURITY · DEMO</small></span></div>'+
 '<label class="role-label">Perspective<select id="role-select" aria-label="Choose demo role"><option value="owner" '+(role==="owner"?"selected":"")+'>Vehicle Owner</option><option value="desk" '+(role==="desk"?"selected":"")+'>Monitoring Desk</option></select></label></header>'+
 '<div class="screen" id="tracking-screen">'+screen+'</div>'+
 navbar()+'<div class="device-home"><i></i></div></div>'+
 '<aside class="guide"><div class="kicker">TRY THESE SCENARIOS</div><h3>Track. Respond. Resolve.</h3><ol><li>Select a vehicle and explore its sample map.</li><li>Play a recorded trip.</li><li>Simulate signal loss or a geofence alert.</li><li>Submit a support request.</li><li>Switch to Monitoring Desk to respond.</li></ol>'+
 '<button type="button" class="reset-button" data-action="reset">↺ Reset fictional data</button><a href="/demos">All software demos ↗</a><p class="fine-print">No real vehicle commands, GPS readings, backend connectivity or alerts.</p></aside></div>'+
 (notice?'<div class="flash-toast" role="status"><span>'+esc(notice)+'</span><button type="button" data-action="dismiss" aria-label="Dismiss notification">×</button></div>':"");
 if(keepScroll){const host=root.querySelector?.("#tracking-screen");if(host)host.scrollTop=previousScroll;}
 lastViewScrollKey=scrollKey;
}
function handleAction(action,id){
  if(action==="dismiss"){notice="";return;}
 if(action==="tab"){stop();tab=id;notice="";return;}
 if(action==="choose"){C.get(data,id);stop();selected=id;playbackStep=0;notice="";return;}
 if(action==="reset"){if(!window.confirm("Reset all fictional tracking data and requests?"))return;stop();data=C.seed();selected="V-101";playbackStep=0;role="owner";tab="track";persist();notice="Sample data restored.";return;}
 if(action==="play"||action==="replay"){
  stop();
  if(role!=="owner"||tab!=="trips")throw Error("Open Trips to play a sample route.");
  if(action==="replay")playbackStep=0;
  playing=true;
  timer=setInterval(()=>{
   if(!playing)return;
   const n=C.route(selected).length-1;
   if(playbackStep>=n){stop();render();return;}
   playbackStep+=1;
   if(playbackStep>=n)stop();
   render();
  },800);
  return;
 }
 if(action==="pause"){stop();return;}
 if(action==="restart"){stop();playbackStep=0;return;}
 if(role==="owner"){
  if(action==="move"){C.move(data,id);notice="Fictional vehicle location advanced.";}
  else if(action==="geofence"){C.geofence(data,id);notice="Sample geofence alert created. Check Alerts or Monitoring Desk.";}
  else if(action==="signal"){C.loseSignal(data,id);notice="Signal loss simulated. Last known location is preserved.";}
  else if(action==="restore"){C.restoreSignal(data,id);notice="Sample tracker connection restored.";}
  else throw Error("This action is not available here.");
 }else{
  if(action==="acknowledge"){C.acknowledge(data,id);notice="Sample alert acknowledged.";}
  else if(action==="progress"){const t=C.progressTicket(data,id);notice=t.id+" moved to "+t.status+".";}
  else throw Error("This action is not available here.");
 }
 persist();
}
root.addEventListener("change",event=>{
 if(event.target?.id==="role-select"){
  stop();role=event.target.value==="desk"?"desk":"owner";tab=role==="owner"?"track":"fleet";notice="";render();
 }
});
root.addEventListener("click",event=>{
 const btn=event.target.closest?.("[data-action]");
 if(!btn||!root.contains(btn)||btn.disabled)return;
 try{handleAction(btn.dataset.action,btn.dataset.id);render();}
 catch(err){notice=err.message||"The demo action could not be completed.";render();}
});
root.addEventListener("submit",event=>{
 if(event.target?.id!=="support-form")return;
 event.preventDefault();
 try{
  if(role!=="owner"||tab!=="support")throw Error("Open the Vehicle Owner support view first.");
  const fields=new FormData(event.target);
  const t=C.createTicket(data,fields.get("vehicleId"),fields.get("category"),fields.get("note"));
  persist();notice=t.id+" opened. Switch to Monitoring Desk to review it.";render();
 }catch(err){notice=err.message||"Unable to open sample request.";render();}
});
window.addEventListener("pagehide",stop);
render();
})();
