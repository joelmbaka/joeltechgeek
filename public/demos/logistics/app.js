(function boot(core){
 const root=document.getElementById("app"),KEY="joeltechgeek-cargo-mobile-v2";
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const money=n=>"KES "+Number(n).toLocaleString("en-KE");
 const place=id=>core.loc(id)?.name||"Unknown";
 const status=s=>'<span class="status '+esc(s.toLowerCase().replace(/ /g,"-"))+'">'+esc(s)+'</span>';
 let data;try{data=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
 if(!core.validate(data))data=core.seed();
 const ui={role:"dispatcher",tab:"home",filter:"All",drawer:null,message:""};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){ui.message="Browser storage unavailable."}};
 const action=(label,cmd,id,style="")=>'<button type="button" class="btn '+style+'" data-cmd="'+cmd+'" data-id="'+esc(id||"")+'">'+label+'</button>';
 const active=()=>core.active(data);
 const roleNames={dispatcher:"Grace · Dispatcher",driver:"Kevin · Driver"};
 const tabs={dispatcher:[["home","Overview","▦"],["loads","Loads","▤"],["fleet","Fleet","◉"],["pay","Payments","◇"]],
 driver:[["available","Find loads","⌕"],["myload","My trip","▣"],["history","History","☑"],["truck","Truck","🚚"]]};
 const msg=(t,d)=>'<div class="empty"><strong>'+esc(t)+'</strong><p>'+esc(d)+'</p></div>';
 const location=l=>'<span class="route"><b>'+esc(place(l.originId))+'</b><span>→</span><b>'+esc(place(l.destinationId))+'</b></span>';
 function card(l){
  const mine=l.driver?.id===data.driver.id;
  let controls=action("Details","detail",l.id,"ghost");
  if(ui.role==="dispatcher"){
   if(l.status==="Open")controls+=action("Edit","edit",l.id,"subtle")+action("Delete","delete",l.id,"danger");
   if(l.status==="Booked")controls+=action("Approve","approve",l.id,"primary");
   if(l.status==="Complete"&&l.payment.status!=="Paid")controls+=action("Mark paid","pay",l.id,"primary");
  }else if(l.status==="Open"){
   controls+=action(active()?"Finish current load first":"Book load","book",l.id,active()?"disabled":"primary");
  }else if(mine)controls+=action("Manage trip","detail",l.id,"primary");
  return '<article class="load"><div class="line"><b>'+esc(l.id)+'</b>'+status(l.status)+'</div>'+
  '<small class="ref">'+esc(l.containerNo)+'</small>'+location(l)+
  '<div class="info-row"><span>'+esc(l.cargo)+'</span><span>'+l.weightTons+' t · '+l.routeMiles+' est. miles</span></div>'+
  '<div class="fee"><div><small>Driver pay</small><strong>'+money(l.driverPay)+'</strong></div><div class="right"><small>'+esc(l.driver?.name||"Unassigned")+'</small><span>'+esc(l.payment.status)+'</span></div></div>'+
  (l.truck?'<div class="position">◉ '+esc(l.truck.location)+'<b>'+l.truck.miles.toLocaleString()+' mi · sample</b></div>':'')+
  '<div class="actions">'+controls+'</div></article>';
 }
 const metric=(t,v,s)=>'<div class="metric"><small>'+esc(t)+'</small><strong>'+v+'</strong><span>'+esc(s)+'</span></div>';
 function home(){
  const m=core.metrics(data);
  return '<div class="heading"><small>DISPATCH OPERATIONS</small><h1>Welcome, Grace</h1><p>Manage loads, drivers and deliveries.</p>'+action("+ Post load","post",null,"primary")+'</div>'+
   '<div class="metrics">'+metric("Total loads",m.total,"All statuses")+metric("Available",m.open,"Open loads")+
   metric("In delivery",m.moving,"Pickup to delivered")+metric("To pay",m.unpaid,money(m.owed))+'</div>'+
   '<div class="subhead"><h2>Latest loads</h2><button data-tab="loads">View all →</button></div>'+data.loads.slice(0,5).map(card).join("");
 }
 function loads(){
  const opts=["All",...core.STATUSES];
  const filtered=data.loads.filter(l=>ui.filter==="All"||l.status===ui.filter);
  return '<div class="heading"><small>FLEET DISPATCH</small><h1>Load board</h1><p>Manage status, rates and driver bookings.</p>'+action("+ Post load","post",null,"primary")+'</div>'+
   '<div class="select-filter"><label for="filter">Filter by status</label><select id="filter">'+opts.map(s=>'<option'+(ui.filter===s?" selected":"")+' value="'+esc(s)+'">'+esc(s)+'</option>').join("")+'</select><b>'+filtered.length+' loads</b></div>'+
   (filtered.length?filtered.map(card).join(""):msg("No matching loads","Try another status."));
 }
 function fleet(){
  return '<div class="heading"><small>FLEET</small><h1>Truck locations</h1><p>Miles and locations shown are illustrative.</p></div>'+
  '<div class="notice">No GPS or vehicle telemetry is connected. Locations update as demo trip stages change.</div>'+
  data.loads.filter(l=>l.driver).map(l=>'<article class="load"><div class="line"><b>'+esc(l.driver.truckPlate)+'</b>'+status(l.status)+'</div>'+
  '<p>'+esc(l.driver.name)+'</p><h2 class="mileage">'+l.truck.miles.toLocaleString()+' <small>sample miles</small></h2>'+
  '<div class="position">◉ '+esc(l.truck.location)+'</div><div class="actions">'+action("View "+l.id,"detail",l.id,"ghost")+'</div></article>').join("");
 }
 function pay(){
  const due=data.loads.filter(l=>l.status==="Complete"&&l.payment.status==="Unpaid");
  const paid=data.loads.filter(l=>l.payment.status==="Paid");
  return '<div class="heading"><small>DRIVER COMPENSATION</small><h1>Payments</h1><p>Rates are set when loads are posted.</p></div>'+
  '<div class="metrics">'+metric("Ready to pay",due.length,"Completed trips")+metric("Amount due",money(core.metrics(data).owed),"Sample only")+'</div>'+
  '<div class="subhead"><h2>Outstanding</h2></div>'+(due.length?due.map(card).join(""):msg("Nothing outstanding","No completed unpaid trips."))+
  '<div class="subhead"><h2>Paid</h2></div>'+(paid.length?paid.map(card).join(""):msg("No payments","Simulated payments will appear here."));
 }
 function available(){
  const list=data.loads.filter(l=>l.status==="Open"),current=active();
  return '<div class="heading"><small>AVAILABLE CARGO</small><h1>Find a load</h1><p>'+list.length+' open loads · '+data.driver.capacityTons+'-tonne truck</p></div>'+
  (current?'<div class="notice warning">You already booked '+esc(current.id)+'. Complete it before booking another.</div>':'')+
  (list.length?list.map(card).join(""):msg("No loads available","Dispatcher can post new loads."));
 }
 function evidence(l,key,name){
  const item=l.evidence[key];
  return '<div class="evidence '+(item?"attached":"")+'"><span>'+ (item?"▣":"▧")+'</span><div><b>'+esc(name)+'</b><small>'+(item?"SAMPLE IMAGE / DOCUMENT ATTACHED":"No sample evidence")+'</small>'+
  (item?'<p class="preview">SAMPLE PREVIEW<br>'+esc(item.reference)+'</p>':'')+'</div></div>';
 }
 function trip(l){
  const mine=l.driver?.id===data.driver.id,controls=[];
  if(mine){
   if(l.status==="Assigned"){if(!l.evidence.pickup)controls.push(action("+ Add pickup photo placeholder","pickup",l.id,"subtle"));controls.push(action("Mark picked up","picked",l.id,"primary"))}
   if(l.status==="Picked up")controls.push(action("Mark in transit","transit",l.id,"primary"));
   if(l.status==="In transit"){if(!l.evidence.delivery)controls.push(action("+ Add delivery note placeholder","delivery",l.id,"subtle"));controls.push(action("Mark delivered","delivered",l.id,"primary"))}
   if(l.status==="Delivered"){if(!l.evidence.eir)controls.push(action("+ Add EIR placeholder","eir",l.id,"subtle"));controls.push(action("Container returned to port · Complete","complete",l.id,"primary"))}
  }
  return '<section class="trip"><div class="subhead"><h2>Trip details</h2>'+status(l.status)+'</div>'+
   '<div class="detail-grid"><div><small>Pickup</small><b>'+esc(place(l.originId))+'</b></div><div><small>Delivery</small><b>'+esc(place(l.destinationId))+'</b></div>'+
   '<div><small>Container</small><b>'+esc(l.containerNo)+'</b></div><div><small>Driver pay</small><b>'+money(l.driverPay)+'</b></div>'+
   '<div><small>Truck</small><b>'+esc(l.driver?.truckPlate||"Unassigned")+'</b></div><div><small>Route miles</small><b>'+l.routeMiles+' est.</b></div></div>'+
   (l.truck?'<div class="position">◉ '+esc(l.truck.location)+'<b>'+l.truck.miles+' miles (sample)</b></div>':'')+
   '<div class="subhead"><h2>Delivery evidence</h2><small>Placeholders only</small></div>'+
   evidence(l,"pickup","Pickup photo")+evidence(l,"delivery","Delivery note")+evidence(l,"eir","Equipment Interchange Receipt (EIR)")+
   '<div class="trip-buttons">'+controls.join("")+'</div>'+
   (l.status==="Complete"?'<div class="notice good">✓ Empty container returned to Mombasa Port. Trip complete.</div>':'')+'</section>';
 }
 function myload(){
  const l=active();
  return '<div class="heading"><small>MY OPERATIONS</small><h1>My load</h1><p>Current booking, trip updates and evidence.</p></div>'+
   (l?card(l)+trip(l):msg("No active load","Book a load from Find loads."))+
   '<div class="notice">Pickup photo, delivery note and EIR are visible placeholders. No files, camera or location service is accessed.</div>';
 }
 function history(){
  const completed=data.loads.filter(l=>l.driver?.id===data.driver.id&&l.status==="Complete");
  return '<div class="heading"><small>DRIVER HISTORY</small><h1>Completed loads</h1><p>Trips completed by this sample driver.</p></div>'+
  (completed.length?completed.map(card).join(""):msg("No completed loads","Returned containers will appear here."));
 }
 function truck(){
  const t=data.driver,l=active();
  return '<div class="heading"><small>MY VEHICLE</small><h1>Truck</h1><p>Fictional vehicle details and trip stats.</p></div>'+
  '<div class="truck-card"><div>🚚</div><h2>'+esc(t.truckPlate)+'</h2><b>'+esc(t.name)+'</b><p>Capacity: '+t.capacityTons+' tonnes</p></div>'+
  '<div class="metrics">'+metric("Active booking",l?.id||"None","One at a time")+metric("Trip miles",l?l.truck?.miles+" mi":"—","Sample only")+'</div>'+
  '<div class="notice">◉ '+esc(l?.truck?.location||"No active trip. Sample location unavailable.")+'</div>';
 }
 function drawer(){
  const a=ui.drawer;if(!a)return "";
  let contents="",title="",l=a.id?core.find(data,a.id):null;
  if(a.kind==="post"||a.kind==="edit"){
   title=a.kind==="post"?"Post a load":"Edit "+l?.id;
   const select=id=>core.PORTS.map(p=>'<option value="'+esc(p.id)+'"'+(p.id===id?" selected":"")+'>'+esc(p.name+", "+p.region)+'</option>').join("");
   contents='<form data-form="'+a.kind+'" data-id="'+esc(a.id||"")+'"><div class="form-grid">'+
    '<label>Pickup location<select name="originId" required>'+select(l?.originId||"mombasa-port")+'</select></label>'+
    '<label>Delivery location<select name="destinationId" required>'+select(l?.destinationId||"nairobi-icd")+'</select></label>'+
    '<label class="wide">Cargo description<input name="cargo" minlength="4" maxlength="130" required value="'+esc(l?.cargo||"40-ft containerized general cargo")+'"/></label>'+
    '<label>Container number<input name="containerNo" minlength="4" maxlength="50" required value="'+esc(l?.containerNo||"DEMO-CONT-"+data.nextId)+'"/></label>'+
    '<label>Cargo weight (tonnes)<input name="weightTons" type="number" min="0.5" max="28" step="0.1" required value="'+(l?.weightTons||20)+'"/></label>'+
    '<label>Pay driver (KES)<input name="driverPay" type="number" min="1000" max="5000000" required step="1" value="'+(l?.driverPay||280000)+'"/></label>'+
    '<label>Estimated route miles<input name="routeMiles" type="number" min="1" max="1500" required step="1" value="'+(l?.routeMiles||305)+'"/></label>'+
    '</div><button type="submit" class="btn primary full">'+(a.kind==="post"?"Post load":"Save changes")+'</button></form>';
  }else if(a.kind==="detail"&&l){
   title=l.id+" · "+l.status;
   contents=trip(l)+'<div class="actions">'+(ui.role==="dispatcher"?
    (l.status==="Open"?action("Edit","edit",l.id,"subtle")+action("Delete","delete",l.id,"danger"):
     l.status==="Booked"?action("Approve driver","approve",l.id,"primary"):
     l.status==="Complete"&&l.payment.status!=="Paid"?action("Mark paid","pay",l.id,"primary"):""):
    l.status==="Open"?action(active()?"Finish active trip first":"Book load","book",l.id,active()?"disabled":"primary"):"")+'</div>';
  }
  return '<div class="veil"><section class="drawer" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="handle"></div>'+
  '<header><h2>'+esc(title)+'</h2><button data-cmd="close" aria-label="Close dialog">×</button></header>'+contents+'</section></div>';
 }
 function render(){
  const views={home,loads,fleet,pay,available,myload,history,truck};
  const pages=tabs[ui.role];if(!pages.some(x=>x[0]===ui.tab))ui.tab=pages[0][0];
  root.innerHTML='<div class="outer"><aside class="intro"><small>INTERACTIVE MOBILE CONCEPT</small><h2>Dispatch in your pocket.</h2>'+
  '<p>One shared fictional cargo board. Dispatcher manages rates, loads and drivers; the driver handles one delivery at a time.</p>'+
  '<a href="/demos/logistics">← Back to introduction</a></aside>'+
  '<div class="phone"><div class="phone-status">9:41 <span>▰  ▱  ▰</span></div>'+
  '<header class="app-header"><div class="brand"><b>↗</b><span><strong>Cargo Dispatch</strong><small>Fleet operations · Demo</small></span></div>'+
  '<select id="role" aria-label="Simulated account"><option value="dispatcher"'+(ui.role==="dispatcher"?" selected":"")+'>Grace · Dispatcher</option>'+
  '<option value="driver"'+(ui.role==="driver"?" selected":"")+'>Kevin · Driver</option></select></header>'+
  '<main class="screen">'+views[ui.tab]()+'</main>'+
  '<nav class="bottom" aria-label="Cargo application tabs">'+pages.map(([id,label,icon])=>
    '<button class="'+(ui.tab===id?"active":"")+'" data-tab="'+id+'"><span>'+icon+'</span><small>'+esc(label)+'</small></button>').join("")+'</nav>'+
  '<div class="home-line"><span></span></div></div>'+
  '<div class="side"><a href="/demos/logistics">About this demo</a><button data-cmd="reset">↻ Reset demo data</button><small>No real GPS, uploads, payment or notifications</small></div>'+
  '</div>'+drawer()+(ui.message?'<div class="toast" role="status">'+esc(ui.message)+'<button data-cmd="dismiss">×</button></div>':'');
 }
 function success(fn,msg){try{fn();save();ui.drawer=null;ui.message=msg;}catch(e){ui.message=e?.message||"Action failed.";}render();}
 document.addEventListener("change",e=>{
  if(!root.contains(e.target))return;
  if(e.target.id==="role"){ui.role=e.target.value==="driver"?"driver":"dispatcher";ui.tab=tabs[ui.role][0][0];ui.drawer=null;ui.message="Switched to "+roleNames[ui.role]+".";render();}
  if(e.target.id==="filter"){ui.filter=core.STATUSES.includes(e.target.value)?e.target.value:"All";render();}
 });
 document.addEventListener("click",e=>{
  const el=e.target.closest("[data-cmd],[data-tab]");if(!el||!root.contains(el))return;
  if(el.dataset.tab){ui.tab=el.dataset.tab;ui.drawer=null;ui.message="";render();return;}
  const cmd=el.dataset.cmd,id=el.dataset.id;
  if(cmd==="close"){ui.drawer=null;ui.message="";render();return;}
  if(cmd==="dismiss"){ui.message="";render();return;}
  if(cmd==="reset"){if(window.confirm("Reset all fictional cargo loads?")){data=core.seed();ui.drawer=null;ui.filter="All";save();ui.message="Sample cargo board restored.";render();}return;}
  if(["post","edit","detail"].includes(cmd)){
   if(cmd!=="detail"&&ui.role!=="dispatcher")return;
   ui.drawer={kind:cmd,id};render();return;
  }
  if(ui.role==="dispatcher"){
   if(cmd==="delete"&&window.confirm("Delete open load "+id+"?"))success(()=>core.remove(data,id),"Open load deleted.");
   if(cmd==="approve")success(()=>core.approve(data,id),"Driver booking approved.");
   if(cmd==="pay")success(()=>core.pay(data,id),"Driver payment marked paid (simulated).");
  }else{
   if(cmd==="book")success(()=>core.book(data,id),"Booking submitted to Grace for approval.");
   const evidence={pickup:"pickup",delivery:"delivery",eir:"eir"}[cmd];
   if(evidence)success(()=>core.attach(data,id,evidence),"Sample "+core.LABELS[evidence]+" attached. No actual file uploaded.");
   const next={picked:"Picked up",transit:"In transit",delivered:"Delivered",complete:"Complete"}[cmd];
   if(next)success(()=>core.progress(data,id,next),"Load marked "+next.toLowerCase()+".");
  }
 });
 document.addEventListener("submit",e=>{
  const form=e.target;if(!form.dataset?.form||!root.contains(form))return;e.preventDefault();
  if(ui.role!=="dispatcher")return;
  const fields=Object.fromEntries(new FormData(form).entries());
  if(form.dataset.form==="post")success(()=>core.post(data,fields),"Load posted.");
  if(form.dataset.form==="edit")success(()=>core.edit(data,form.dataset.id,fields),"Load edited.");
 });
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&ui.drawer){ui.drawer=null;render();}});
 render();
})(cargoCore);
