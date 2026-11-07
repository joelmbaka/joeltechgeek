/* Owner-only rental demo UI. Browser-local, fictional records. */
(function(core){
"use strict";
const KEY="jtech-car-rental-v1",root=document.getElementById("app");
if(!root)return;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const usd=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0);
const date=s=>s?new Date(s).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—";
const dateTime=s=>s?new Date(s).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"—";
const formTime=s=>{const d=new Date(s||Date.now()),local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)};
const localDate=s=>new Date(s||Date.now()).toLocaleDateString("en-CA");
const byId=id=>data.vehicles.find(v=>v.id===id);
const cust=id=>data.customers.find(c=>c.id===id);
const rentals=vid=>data.rentals.filter(r=>r.vehicleId===vid).sort((a,b)=>b.start.localeCompare(a.start));
const paid=r=>core.payments(data,r.id),balance=r=>core.due(data,r);
const status=v=>core.status(data,v);
let data;
try{data=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
if(!core.validate(data))data=core.seed();
const ui={tab:"fleet",filter:"All",search:"",vehicleId:null,sub:"details",rentalId:null,customerId:null,dialog:"",toast:"",month:localDate().slice(0,7),gpsIndex:null,gpsTimer:null};
const tabs=[["fleet","Fleet","🚘"],["alerts","Alerts","♢"],["finance","Finance","▤"],["customers","Customers","♙"]];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){ui.toast="Browser storage unavailable. Demo changes may not persist."}};
const pill=(v)=>'<span class="pill '+(v==="Available"||v==="Paid"?"good":v==="Rented"||v==="Partially paid"?"info":v==="Overdue"?"bad":"warn")+'">'+esc(v)+'</span>';
const btn=(txt,act,style="",attrs="")=>'<button type="button" class="btn '+style+'" data-action="'+act+'" '+attrs+'>'+txt+'</button>';
const row=(left,right)=>'<div class="detail-row"><span>'+left+'</span><b>'+right+'</b></div>';
const input=(label,name,value="",type="text",extra="")=>'<label class="field"><span>'+label+'</span><input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+extra+' required></label>';
const optional=(label,name,value="",type="text")=>'<label class="field"><span>'+label+'</span><input name="'+name+'" type="'+type+'" value="'+esc(value)+'"></label>';
const select=(label,name,items,value)=>'<label class="field"><span>'+label+'</span><select name="'+name+'">'+items.map(i=>'<option value="'+esc(i[0])+'" '+(String(i[0])===String(value)?"selected":"")+'>'+esc(i[1])+'</option>').join("")+'</select></label>';
const blank=text=>'<p class="empty">'+esc(text)+'</p>';
const card=(body,extra="")=>'<section class="card '+extra+'">'+body+'</section>';
const moneyAlert=r=>balance(r)>0?'<span class="bad-text">'+usd(balance(r))+' due</span>':'<span class="good-text">Paid</span>';
const title=(heading,action="",back="")=>'<div class="heading">'+(back?btn("←","back","icon-btn"):"")+'<h1>'+esc(heading)+'</h1><div class="heading-actions">'+action+'</div></div>';
function run(fn,message){
 try{const copy=JSON.parse(JSON.stringify(data)),result=fn(copy);data=copy;save();ui.dialog="";ui.toast=message||"Saved.";render();return result;}catch(e){ui.toast=e.message||"Unable to save.";render();return null;}
}
function nav(tab){ui.tab=tab;ui.vehicleId=null;ui.customerId=null;ui.dialog="";ui.gpsIndex=null;stopReplay();render();}
function openVehicle(vid,sub="details"){if(!byId(vid))return;ui.tab="fleet";ui.vehicleId=vid;ui.sub=sub;ui.dialog="";ui.gpsIndex=null;stopReplay();render();}
function stopReplay(){if(ui.gpsTimer){clearInterval(ui.gpsTimer);ui.gpsTimer=null;}}
function vehicleCard(v){
 const r=core.active(data,v.id),s=status(v);
 return '<button class="vehicle-card" type="button" data-action="vehicle" data-id="'+esc(v.id)+'">'+
  '<div class="car-icon">🚙</div><div class="vehicle-main"><strong>'+esc(v.make+" "+v.model)+'</strong><small>'+esc(v.plate)+' · '+usd(v.rate)+'/day</small>'+
  '<div class="meta">'+pill(s)+(r?(core.overdue(r)?'<span class="bad-text">Overdue</span>':'<span>Due '+dateTime(r.due)+'</span>'):'')+'</div></div><span class="chevron">›</span></button>';
}
function fleet(){
 const list=data.vehicles.filter(v=>(ui.filter==="All"||status(v)===ui.filter)&&(v.plate+" "+v.make+" "+v.model).toLowerCase().includes(ui.search.toLowerCase()));
 return title("My Fleet",btn("+ Add vehicle","new-vehicle","primary"))+
 '<div class="filters">'+["All","Rented","Available","Maintenance"].map(s=>'<button class="chip '+(ui.filter===s?"active":"")+'" data-action="filter" data-value="'+s+'">'+s+' <b>'+data.vehicles.filter(v=>s==="All"||status(v)===s).length+'</b></button>').join("")+'</div>'+
 '<input class="search" type="search" id="fleet-search" placeholder="Search registration or vehicle" value="'+esc(ui.search)+'" aria-label="Search fleet">'+
 '<div class="vehicle-list">'+(list.map(vehicleCard).join("")||blank("No matching vehicles."))+'</div>';
}
function vehicleDetail(){
 const v=byId(ui.vehicleId),r=core.active(data,v.id);
 const sections=[["details","Details"],["tracking","GPS"],["history","History"],["maintenance","Maintenance"],["finances","Finances"]];
 let body="";
 if(ui.sub==="details"){
  body=card('<div class="vehicle-hero"><div class="hero-car">🚘</div><div><strong>'+esc(v.make+" "+v.model)+'</strong><span>'+esc(v.plate)+' · '+v.year+'</span></div>'+pill(status(v))+'</div>'+
    '<div class="spec-grid"><div><small>Engine</small><strong>'+v.cc.toLocaleString()+' cc</strong></div><div><small>Seats</small><strong>'+v.seats+'</strong></div><div><small>Daily rate</small><strong>'+usd(v.rate)+'</strong></div></div>'+
    '<p class="subtle">'+esc(v.transmission)+' · '+esc(v.fuel)+' · Odometer '+v.odometer.toLocaleString()+' km</p>');
  if(r){
   body+=card('<div class="card-head"><h2>Current rental</h2>'+pill(core.overdue(r)?"Overdue":"Rented")+'</div>'+
    '<strong>'+esc(cust(r.customerId)?.name||"Unknown")+'</strong><p class="subtle">'+dateTime(r.start)+' – '+dateTime(r.due)+' · '+r.days+' day(s)</p>'+
    row("Rental total",usd(core.total(r)))+row("Received",usd(paid(r)))+row("Outstanding",moneyAlert(r))+
    '<div class="actions">'+btn("Add payment","new-payment","primary")+btn("Extend","extend")+btn("Return vehicle","return","outline")+'</div>');
  }else body+=card('<h2>'+ (v.maintenance?"Under maintenance":"Ready to rent")+'</h2><p class="subtle">'+(v.maintenance?"This vehicle cannot be rented until marked available.":"Start a rental to link the vehicle, customer, duration and payments.")+'</p>'+
   (v.maintenance?btn("Mark available","mark-available","primary"):btn("Start rental","new-rental","primary")) );
  body+=card('<h2>Vehicle information</h2>'+row("Registration",esc(v.plate))+row("Engine",v.cc.toLocaleString()+" cc")+row("Passenger seats",v.seats)+row("Fuel",esc(v.fuel))+row("Transmission",esc(v.transmission))+row("Next service",v.serviceKm?v.serviceKm.toLocaleString()+" km":"Not set"));
 }
 if(ui.sub==="tracking")body=tracking(v);
 if(ui.sub==="history")body=history(v);
 if(ui.sub==="maintenance")body=maintenancePage(v);
 if(ui.sub==="finances")body=vehicleFinance(v);
 return title(v.make+" "+v.model,"",true)+'<p class="subhead">'+esc(v.plate)+' · '+pill(status(v))+'</p><div class="filters sub-tabs">'+sections.map(([s,label])=>'<button data-action="vehicle-section" data-value="'+s+'" class="chip '+(ui.sub===s?"active":"")+'">'+label+'</button>').join("")+'</div>'+body;
}
function tracking(v){
 const route=v.route||[],last=route[route.length-1],at=ui.gpsIndex===null?route.length-1:ui.gpsIndex;
 const p=route[Math.max(0,at)],r=core.active(data,v.id);
 return card('<div class="card-head"><h2>GPS tracking</h2><span class="pill warn">Simulated GPS</span></div>'+
 '<p class="subtle">'+(v.trackerOnline?"Simulated tracker online":"Tracker offline · Last recorded data")+' · '+(p?dateTime(p.at):"No GPS data")+'</p>'+
 '<div id="gps-map" class="gps-map" role="img" aria-label="Interactive map of simulated vehicle route"></div>'+
 (p?'<div class="tracker-stats">'+[['Movement',p.speed>0?"Moving":"Stopped"],["Ignition",p.ignition?"On":"Off"],["Speed",p.speed+" km/h"],["Location",p.lat.toFixed(4)+", "+p.lng.toFixed(4)]].map(i=>'<div><small>'+i[0]+'</small><strong>'+i[1]+'</strong></div>').join("")+'</div>':'')+
 '<div class="card-head"><h2>Route replay</h2><span class="subtle">Fictional movement</span></div>'+
 '<input id="replay-range" type="range" min="0" max="'+Math.max(0,route.length-1)+'" value="'+Math.max(0,at)+'" '+(!route.length?"disabled":"")+' aria-label="Replay position">'+
 '<div class="actions">'+btn(ui.gpsTimer?"Pause":"Play","replay","primary")+btn("Start","replay-start","outline")+btn("End","replay-end","outline")+'</div>'+
 '<div class="timeline">'+route.filter((p,i)=>i===0||i===route.length-1||p.event!=="Moving").map(e=>'<div class="event"><span>'+dateTime(e.at)+'</span><b>'+esc(e.event)+'</b></div>').join("")+'</div>'+
 (r?'<p class="subtle">Rental linked to '+esc(cust(r.customerId)?.name)+'. Route history is vehicle-based, not a guarantee of renter activity.</p>':'')+
 '<p class="subtle">Coordinates, events and speeds are illustrative. A production app needs connected GPS hardware or a supported telematics provider.</p>');
}
function history(v){
 const rr=rentals(v.id);
 return card('<h2>Rental history</h2>'+rr.map(r=>'<button class="history-item" data-action="rental" data-id="'+esc(r.id)+'"><div><b>'+esc(cust(r.customerId)?.name)+'</b><small>'+date(r.start)+' – '+date(r.returnedAt||r.due)+' · '+r.days+' day(s)</small></div><div>'+pill(r.returnedAt?"Completed":core.overdue(r)?"Overdue":"Rented")+'<small>'+usd(core.total(r))+' · '+esc(core.payStatus(data,r))+'</small></div><span>›</span></button>').join("")+'</section>');
}
function maintenancePage(v){
 const list=data.maintenance.filter(m=>m.vehicleId===v.id).sort((a,b)=>b.date.localeCompare(a.date));
 return card('<div class="card-head"><h2>Maintenance</h2>'+btn("+ Record","new-maintenance","primary")+'</div>'+
 row("Odometer",v.odometer.toLocaleString()+" km")+row("Next service",v.serviceKm?v.serviceKm.toLocaleString()+" km":"Not scheduled")+
 '<div class="actions">'+(v.maintenance?btn("Mark available","mark-available","outline"):!core.active(data,v.id)?btn("Mark under maintenance","mark-maintenance","outline"):'')+'</div>'+
 '<div class="timeline">'+(list.map(m=>'<div class="event"><span>'+date(m.date)+'</span><div><b>'+esc(m.type)+'</b><p class="subtle">'+esc(m.notes||"")+'</p></div><b>'+usd(m.cost)+'</b></div>').join("")||blank("No maintenance records."))+'</div>');
}
function vehicleFinance(v){
 const f=core.finance(data,ui.month,v.id),rs=rentals(v.id);
 return card('<h2>Vehicle finances</h2><label class="field"><span>Month</span><input type="month" id="report-month" value="'+esc(ui.month)+'"></label>'+
 row("Completed rental revenue",usd(f.revenue))+row("Collections received",usd(f.collected))+row("Outstanding balance (all rentals)",usd(f.outstanding))+
 row("Vehicle costs including maintenance",usd(f.expenses))+row("Operating contribution",usd(f.net))+
 '<p class="subtle">Revenue is recognized on completed rentals in this simplified demo. Collections are shown separately; corporate overheads are excluded from vehicle contribution.</p>');
}
function rentalDetail(){
 const r=data.rentals.find(r=>r.id===ui.rentalId);if(!r)return blank("Rental not found.");
 const v=byId(r.vehicleId),c=cust(r.customerId),isActive=!r.returnedAt,pays=data.payments.filter(p=>p.rentalId===r.id);
 return title("Rental "+r.id,"",true)+card('<div class="card-head"><div><h2>'+esc(v.make+" "+v.model)+'</h2><p class="subtle">'+esc(v.plate)+'</p></div>'+pill(r.returnedAt?"Completed":core.overdue(r)?"Overdue":"Rented")+'</div>'+
 '<strong>'+esc(c?.name||"Unknown")+'</strong><p class="subtle">'+esc(c?.phone||"")+'</p>'+
 row("Start",dateTime(r.start))+row("Due",dateTime(r.due))+row("Duration",r.days+" × 24 hours")+row("Rate",usd(r.rate)+"/day")+
 (r.returnedAt?row("Returned",dateTime(r.returnedAt)):'')+
 row("Rental charges",usd(r.base))+row("Additional charges",usd(r.extra))+row("Total",usd(core.total(r)))+row("Paid",usd(paid(r)))+row("Outstanding",moneyAlert(r))+
 '<div class="actions">'+(balance(r)>0?btn("Add payment","new-payment","primary"):"")+(isActive?btn("Extend","extend","outline")+btn("Return vehicle","return","outline"):"")+
 btn("GPS history","rental-gps","outline")+'</div>')+
 card('<h2>Payments</h2>'+(pays.length?pays.map(p=>'<div class="detail-row"><span>'+dateTime(p.date)+' · '+esc(p.method)+'</span><b>'+usd(p.amount)+'</b></div>').join(""):blank("No payments received."))+
 '<p class="subtle">Completed rentals may have outstanding payments. Recording payment does not reopen a rental.</p>');
}
function alertsPage(){
 const list=core.alerts(data);return title("Alerts")+card('<h2>Fleet alerts</h2>'+(list.length?list.map(a=>'<button data-action="vehicle" data-id="'+esc(a.vehicleId)+'" class="alert-item"><span class="alert-dot '+a.severity+'">!</span><span><strong>'+esc(a.type)+'</strong><small>'+esc(a.detail)+'</small></span><span>›</span></button>').join(""):blank("No alerts at the moment."))+'<p class="subtle">Tracker warnings are simulated; overdue alerts are calculated from rental due dates.</p>');
}
function financePage(){
 const f=core.finance(data,ui.month);
 return title("Finance",btn("+ Expense","new-expense","primary"))+
 card('<label class="field month"><span>Reporting month</span><input type="month" id="report-month" value="'+esc(ui.month)+'"></label>'+
 '<div class="finance-highlight"><small>Net operating result</small><strong>'+usd(f.net)+'</strong></div>'+
 row("Completed rental revenue",usd(f.revenue))+row("Payments collected",usd(f.collected))+row("Outstanding balances (all rentals)",usd(f.outstanding))+
 row("Expenses including maintenance",usd(f.expenses))+
 '<p class="subtle">Simplified operating result = completed rental revenue minus recorded expenses. It excludes depreciation, tax and financing. A refundable deposit is not included as revenue.</p>')+
 card('<h2>Recent expenses</h2>'+[
 ...data.expenses.map(e=>({id:e.id,date:e.date,vehicleId:e.vehicleId,name:e.category,amount:e.amount,description:e.description})),
 ...data.maintenance.map(m=>({id:m.id,date:m.date,vehicleId:m.vehicleId,name:m.type,amount:m.cost,description:"Maintenance"}))
 ].filter(e=>e.date.slice(0,7)===ui.month).sort((a,b)=>b.date.localeCompare(a.date)).map(e=>'<div class="detail-row"><span>'+esc(e.name)+' <small>'+date(e.date)+(e.vehicleId?" · "+esc(byId(e.vehicleId)?.plate):" · Office")+'</small></span><b>'+usd(e.amount)+'</b></div>').join("")||blank("No expenses this month.")));
}
function customersPage(){
 return title("Customers",btn("+ Add","new-customer","primary"))+
 '<input id="customer-search" class="search" type="search" placeholder="Search name, phone or ID" value="'+esc(ui.search)+'" aria-label="Search customers">'+
 card(data.customers.filter(c=>(c.name+" "+c.phone+" "+c.documentNo).toLowerCase().includes(ui.search.toLowerCase())).map(c=>'<button data-action="customer" data-id="'+esc(c.id)+'" class="customer-item"><span class="avatar">♙</span><span><b>'+esc(c.name)+'</b><small>'+esc(c.phone)+' · '+data.rentals.filter(r=>r.customerId===c.id).length+' rentals</small></span><span>›</span></button>').join("")||blank("No customers found.")); 
}
function customerDetail(){
 const c=cust(ui.customerId),rr=data.rentals.filter(r=>r.customerId===c.id);
 return title("Customer","",true)+card('<h2>'+esc(c.name)+'</h2>'+row("Phone",esc(c.phone))+row("ID number",esc(c.documentNo))+row("Email",esc(c.email||"—")))+
 card('<h2>Rental history</h2>'+rr.map(r=>'<button class="history-item" data-action="rental" data-id="'+esc(r.id)+'"><div><b>'+esc(byId(r.vehicleId)?.plate)+'</b><small>'+date(r.start)+' · '+r.days+' days</small></div><div>'+pill(r.returnedAt?"Completed":core.overdue(r)?"Overdue":"Rented")+'<small>'+moneyAlert(r)+'</small></div></button>').join("")||blank("No rental history."));
}
function dialogContent(){
 if(!ui.dialog)return "";
 const v=byId(ui.vehicleId),r=ui.rentalId?data.rentals.find(x=>x.id===ui.rentalId):v&&core.active(data,v.id);
 let name="",html="";
 if(ui.dialog==="vehicle"){
  name="Add vehicle";html='<form data-form="vehicle" class="form-grid">'+input("Registration","plate")+input("Make","make")+input("Model","model")+
   input("Year","year",2020,"number",'min="1980" max="2035"')+input("Engine (cc)","cc",1500,"number",'min="1" step="1"')+
   input("Seats","seats",5,"number",'min="1" step="1"')+select("Transmission","transmission",["Automatic","Manual"].map(x=>[x,x]),"Automatic")+
   select("Fuel","fuel",["Petrol","Diesel","Hybrid","Electric"].map(x=>[x,x]),"Petrol")+
   input("Daily rental rate ($)","rate",40,"number",'min="0.01" step=".01"')+
   input("Odometer (km)","odometer",0,"number",'min="0" step="1"')+
   optional("Next service odometer (km)","serviceKm",0,"number")+
   '<button class="btn primary full" type="submit">Add vehicle</button></form>';
 }
 if(ui.dialog==="customer"){
  name="Add customer";html='<form data-form="customer" class="form-grid">'+input("Full name","name")+input("Phone","phone")+
   input("ID / passport number","documentNo")+optional("Email","email","","email")+'<button class="btn primary full" type="submit">Add customer</button></form>';
 }
 if(ui.dialog==="rental"){
  name="Start rental";html='<form data-form="rental" class="form-grid">'+
   '<p class="form-note">Rental for '+esc(v.make+" "+v.model)+' · '+esc(v.plate)+'. One day means 24 hours.</p>'+
   select("Customer","customerId",data.customers.map(c=>[c.id,c.name]),data.customers[0]?.id)+
   input("Start date & time","start",formTime(),"datetime-local")+
   input("Number of days","days",3,"number",'min="1" step="1"')+
   input("Rate per day ($)","rate",v.rate,"number",'min="0.01" step=".01"')+
   optional("Initial payment ($)","initialPayment",0,"number")+
   select("Payment method","method",["Cash","Mobile Money","Card","Bank transfer","Other"].map(x=>[x,x]),"Cash")+
   '<button class="btn primary full" type="submit">Start rental</button></form>';
 }
 if(ui.dialog==="payment"){
  name="Add payment";html='<form data-form="payment" class="form-grid"><p class="form-note">Outstanding: '+usd(balance(r))+'</p>'+
   input("Amount received ($)","amount",balance(r),"number",'min="0.01" step=".01" max="'+balance(r)+'"')+
   select("Payment method","method",["Cash","Mobile Money","Card","Bank transfer","Other"].map(x=>[x,x]),"Cash")+
   optional("Reference (optional)","reference")+'<button class="btn primary full" type="submit">Record payment</button></form>';
 }
 if(ui.dialog==="extend"){
  name="Extend rental";html='<form data-form="extend" class="form-grid"><p class="form-note">Current due: '+dateTime(r.due)+' · '+usd(r.rate)+'/day</p>'+
   input("Additional 24-hour days","days",2,"number",'min="1" step="1"')+
   '<button class="btn primary full" type="submit">Extend rental</button></form>';
 }
 if(ui.dialog==="return"){
  name="Return vehicle";html='<form data-form="return" class="form-grid">'+
   '<p class="form-note">Due: '+dateTime(r.due)+' · Current outstanding: '+usd(balance(r))+'</p>'+
   input("Actual return time","returnedAt",formTime(),"datetime-local")+
   input("Final odometer (km)","odometer",v.odometer,"number",'min="'+r.startOdometer+'" step="1"')+
   optional("Additional charges ($)","extra",0,"number")+
   optional("Payment at return ($)","payment",0,"number")+
   select("Payment method","method",["Cash","Mobile Money","Card","Bank transfer","Other"].map(x=>[x,x]),"Cash")+
   '<label class="check"><input type="checkbox" name="maintenance" value="yes"> Set vehicle to maintenance after return</label>'+
   '<button class="btn primary full" type="submit">Complete return</button></form>';
 }
 if(ui.dialog==="expense"){
  name="Record expense";html='<form data-form="expense" class="form-grid">'+
   select("Expense category","category",["Office rent","Wages","Insurance","Fuel","Cleaning","Tracking subscription","Other"].map(x=>[x,x]),"Office rent")+
   select("Assign to vehicle","vehicleId",[["","Business / office"],...data.vehicles.map(v=>[v.id,v.plate+" · "+v.model])],"")+
   input("Amount ($)","amount","","number",'min="0.01" step=".01"')+
   input("Date","date",localDate(),"date")+optional("Description","description")+
   '<button class="btn primary full" type="submit">Save expense</button></form>';
 }
 if(ui.dialog==="maintenance"){
  name="Record maintenance";html='<form data-form="maintenance" class="form-grid">'+
   input("Description","type","Scheduled service")+
   input("Date","date",localDate(),"date")+
   input("Cost ($)","cost",0,"number",'min="0" step=".01"')+
   input("Odometer (km)","odometer",v.odometer,"number",'min="0" step="1"')+
   optional("Notes","notes")+'<button class="btn primary full" type="submit">Record maintenance</button></form>';
 }
 return '<div class="scrim" data-action="close-dialog"><div class="dialog" role="dialog" aria-modal="true" aria-label="'+esc(name)+'"><div class="dialog-heading"><h2>'+esc(name)+'</h2>'+btn("×","close-dialog","icon-btn")+'</div>'+html+'</div></div>';
}
let map=null,mapMarker=null,mapLine=null;
function mountMap(){
 const v=byId(ui.vehicleId);
 if(ui.sub!=="tracking"||!v||!document.getElementById("gps-map"))return;
 const route=v.route||[];
 if(!route.length)return;
 const index=ui.gpsIndex===null?route.length-1:ui.gpsIndex,point=route[Math.min(index,route.length-1)];
 if(window.L){
   if(map){map.remove();map=null;}
   map=window.L.map("gps-map",{zoomControl:true}).setView([point.lat,point.lng],12);
   window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
   mapLine=window.L.polyline(route.slice(0,index+1).map(p=>[p.lat,p.lng]),{color:"#059669",weight:4}).addTo(map);
   mapMarker=window.L.circleMarker([point.lat,point.lng],{radius:9,color:"#064e3b",fillColor:"#10b981",fillOpacity:1,weight:3}).addTo(map);
   map.fitBounds(window.L.latLngBounds(route.map(p=>[p.lat,p.lng])).pad(.2));
 }else{
   const x=p=>40+(p.lng-36.79)*4500,y=p=>240-(p.lat+1.33)*3800;
   const poly=route.slice(0,index+1).map(p=>x(p)+","+y(p)).join(" ");
   document.getElementById("gps-map").innerHTML='<svg viewBox="0 0 440 260" role="img" aria-label="Simulated route schematic"><rect width="440" height="260" fill="#e7f0ed"/><path d="M0 80H440 M0 160H440 M120 0V260 M280 0V260" stroke="#fff" stroke-width="12"/><polyline points="'+poly+'" fill="none" stroke="#059669" stroke-width="5"/><circle cx="'+x(point)+'" cy="'+y(point)+'" r="10" fill="#047857" stroke="white" stroke-width="4"/></svg><span class="map-fallback">Simulated route schematic · Map tiles unavailable</span>';
 }
}
function render(){
 if(map){map.remove();map=null;}
 const visible=ui.rentalId?rentalDetail():ui.customerId?customerDetail():ui.vehicleId?vehicleDetail():ui.tab==="fleet"?fleet():ui.tab==="alerts"?alertsPage():ui.tab==="finance"?financePage():customersPage();
 const nav= tabs.map(([key,label,icon])=>'<button data-nav="'+key+'" class="'+(ui.tab===key?"active":"")+'"><span>'+icon+'</span><small>'+label+'</small></button>').join("");
 root.innerHTML='<div class="shell"><header class="appbar"><div><small>RENTAL FLEET · OWNER</small><strong>Northline Rentals</strong></div><a href="/demos/car-rental" title="About this demo">About demo ↗</a></header>'+
 '<main class="screen">'+visible+'</main><nav class="bottom-nav" aria-label="Main navigation">'+nav+'</nav></div>'+dialogContent()+
 (ui.toast?'<div role="status" class="toast">'+esc(ui.toast)+btn("×","dismiss","icon-btn")+'</div>':"");
 if(ui.vehicleId&&ui.sub==="tracking")mountMap();
}
function formData(form){return Object.fromEntries(new FormData(form).entries());}
document.addEventListener("click",e=>{
 const el=e.target.closest("[data-action],[data-nav]");if(!el||!root.contains(el)&&!el.closest(".scrim")&&!el.closest(".toast"))return;
 if(el.dataset.nav){nav(el.dataset.nav);return;}
 const a=el.dataset.action,id=el.dataset.id;
 if(a==="dismiss"){ui.toast="";render();return;}
 if(a==="close-dialog"){if(el.classList.contains("scrim")&&e.target!==el)return;ui.dialog="";render();return;}
 if(a==="vehicle"){ui.rentalId=null;ui.customerId=null;openVehicle(id);return;}
 if(a==="filter"){ui.filter=el.dataset.value;render();return;}
 if(a==="vehicle-section"){ui.sub=el.dataset.value;ui.rentalId=null;stopReplay();ui.gpsIndex=null;render();return;}
 if(a==="back"){
   if(ui.rentalId){ui.rentalId=null;ui.sub="history";}
   else if(ui.customerId)ui.customerId=null;
   else if(ui.vehicleId)ui.vehicleId=null;
   render();return;
 }
 if(a==="customer"){ui.customerId=id;render();return;}
 if(a==="rental"){ui.rentalId=id;ui.customerId=null;ui.vehicleId= data.rentals.find(r=>r.id===id)?.vehicleId;render();return;}
 if(a==="rental-gps"){ui.rentalId=null;ui.sub="tracking";ui.gpsIndex=null;render();return;}
 if(a==="new-vehicle"){ui.dialog="vehicle";render();return;}
 if(a==="new-customer"){ui.dialog="customer";render();return;}
 if(a==="new-rental"){ui.dialog="rental";render();return;}
 if(a==="new-payment"){const r=ui.rentalId?data.rentals.find(r=>r.id===ui.rentalId):core.active(data,ui.vehicleId);ui.rentalId=r?.id||null;ui.dialog="payment";render();return;}
 if(a==="extend"||a==="return"){const r=ui.rentalId?data.rentals.find(r=>r.id===ui.rentalId):core.active(data,ui.vehicleId);ui.rentalId=r?.id||null;ui.dialog=a;render();return;}
 if(a==="new-expense"){ui.dialog="expense";render();return;}
 if(a==="new-maintenance"){ui.dialog="maintenance";render();return;}
 if(a==="mark-available"||a==="mark-maintenance"){run(d=>core.setMaintenance(d,ui.vehicleId,a==="mark-maintenance"),"Vehicle status updated.");return;}
 if(a==="replay-start"){stopReplay();ui.gpsIndex=0;render();return;}
 if(a==="replay-end"){stopReplay();ui.gpsIndex=byId(ui.vehicleId)?.route?.length-1||0;render();return;}
 if(a==="replay"){if(ui.gpsTimer){stopReplay();render();return;}const steps=byId(ui.vehicleId)?.route?.length||0;if(!steps)return;ui.gpsIndex=ui.gpsIndex===null?0:ui.gpsIndex;ui.gpsTimer=setInterval(()=>{ui.gpsIndex++;if(ui.gpsIndex>=steps-1){ui.gpsIndex=steps-1;stopReplay();}render();},500);render();return;}
 if(a==="reset"){if(window.confirm("Restore all fictional vehicles, rentals and payments?")){stopReplay();data=core.seed();save();nav("fleet");ui.toast="Demo reset.";render();}return;}
});
document.addEventListener("input",e=>{
 if(e.target.id==="fleet-search"||e.target.id==="customer-search"){
   const value=e.target.value,focus=e.target.id,pos=e.target.selectionStart;ui.search=value;render();
   const input=document.getElementById(focus);input?.focus();input?.setSelectionRange(pos,pos);
 }
 if(e.target.id==="replay-range"){stopReplay();ui.gpsIndex=Number(e.target.value);render();}
});
document.addEventListener("change",e=>{if(e.target.id==="report-month"){ui.month=e.target.value;render();}});
document.addEventListener("submit",e=>{
 const form=e.target.closest("[data-form]");if(!form)return;
 e.preventDefault();const f=formData(form);
 if(form.dataset.form==="vehicle"){const v=run(d=>core.addVehicle(d,f),"Vehicle added.");if(v){ui.vehicleId=v.id;ui.sub="details";render();}}
 if(form.dataset.form==="customer"){run(d=>core.addCustomer(d,f),"Customer added.");}
 if(form.dataset.form==="rental"){run(d=>core.startRental(d,{...f,vehicleId:ui.vehicleId}),"Rental started.");}
 if(form.dataset.form==="payment"){run(d=>core.recordPayment(d,{...f,rentalId:ui.rentalId}),"Payment recorded.");}
 if(form.dataset.form==="extend"){run(d=>core.extendRental(d,ui.rentalId,f.days),"Rental extended.");}
 if(form.dataset.form==="return"){run(d=>core.returnVehicle(d,{...f,rentalId:ui.rentalId,maintenance:f.maintenance==="yes"}),"Vehicle returned.");}
 if(form.dataset.form==="expense"){run(d=>core.expense(d,f),"Expense recorded.");}
 if(form.dataset.form==="maintenance"){run(d=>core.maintenance(d,{...f,vehicleId:ui.vehicleId}),"Maintenance recorded.");}
});
render();
})(rentalCore);