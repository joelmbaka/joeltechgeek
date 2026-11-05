(function cargoMobile(core){
 "use strict";
 const mount=document.getElementById("app"),KEY="joeltechgeek-cargo-mobile-v4";
 const esc=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
 const money=n=>"KSH "+Number(n||0).toLocaleString("en-KE");
 const place=id=>core.loc(id)?.name||"Unknown location";
 let data;try{data=JSON.parse(localStorage.getItem(KEY)||"null");}catch(ex){}
 if(!core.validate(data))data=core.seed();
 let role="dispatcher",driverId=data.driver.id,tab="board",screen=null,selected=null,mode="new",formOpen=false,drawer=false,search="",filter="Board",toast="",assignmentFor=null,proofFor=null,pairFor=null;
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch(ex){toast="Browser storage unavailable."}};
 const currentDriver=()=>data.drivers.find(x=>x.id===driverId)||data.driver;
 const truckFor=(id)=>core.pairedTruck(data,id);
 const truckName=(id)=>data.fleet.find(x=>x.id===id)?.truckPlate||"Unassigned";
 const own=l=>l.driver?.id===driverId,active=()=>core.active(data,driverId);
 const btn=(label,command,id,cls="")=>'<button type="button" class="button '+cls+'" data-action="'+command+'" '+(id?'data-id="'+esc(id)+'"':"")+'>'+label+'</button>';
 const badge=st=>'<span class="badge badge-'+st.toLowerCase().replace(/\s/g,"-")+'">'+esc(st)+'</span>';
 const row=(a,b)=>'<div class="data-row"><span>'+esc(a)+'</span><strong>'+esc(b??"—")+'</strong></div>';
 const route=l=>esc(place(l.originId))+' <span class="route-arrow">→</span> '+esc(place(l.destinationId));
 const group=(h,body)=>'<section class="group"><h2>'+esc(h)+'</h2>'+body+'</section>';
 const blank=(h,p)=>'<div class="blank"><div>▣</div><b>'+esc(h)+'</b><p>'+esc(p)+'</p></div>';
 const boardRank={"Assigned":0,"In transit":1,"Delivered":2,"Open":3,"Complete":4};
 const prioritized=loads=>loads.slice().sort((a,b)=>(boardRank[a.status]??99)-(boardRank[b.status]??99));
 const list=()=>{
  if(tab==="board")return role==="driver"?prioritized(data.loads.filter(l=>own(l)&&l.status!=="Complete")):
    prioritized(filter==="Board"?data.loads.filter(l=>l.status!=="Complete"):filter==="All"?data.loads:data.loads.filter(l=>l.status===filter));
  if(tab==="active")return data.loads.filter(l=>["Assigned","In transit","Delivered"].includes(l.status)&&(role==="dispatcher"||own(l)));
  return data.loads.filter(l=>l.status==="Complete"&&(role==="dispatcher"||own(l)));
 };
 const counts=()=>({
  board:role==="driver"?data.loads.filter(l=>own(l)&&l.status!=="Complete").length:data.loads.filter(l=>l.status!=="Complete").length,
  active:data.loads.filter(l=>["Assigned","In transit","Delivered"].includes(l.status)&&(role==="dispatcher"||own(l))).length,
  history:data.loads.filter(l=>l.status==="Complete"&&(role==="dispatcher"||own(l))).length
 });
 const card=l=>{
  return '<button class="load-card" data-load="'+esc(l.id)+'">'+
   '<div class="card-top"><div class="route-name">'+route(l)+'</div>'+badge(l.status)+'<span class="chev">›</span></div>'+
   '<div class="card-stats"><span>🚛 '+(l.containerFeet||40)+'ft</span><span>⚖ '+l.weightTons+' T</span><strong>💰 '+money(l.driverPay)+'</strong></div>'+
   '<div class="card-bottom"><span>🛣 Full trip: '+l.routeMiles+' mi · sample</span><span>🕒 '+esc(l.id)+'</span>'+
   (l.driver?'<span class="driver-name">◉ '+esc(l.driver.name)+'</span>':"")+'</div></button>';
 };
 function board(){
  const items=list(),query=search.trim().toLowerCase();
  const found=items.filter(l=>(l.id+" "+l.containerNo+" "+place(l.originId)+" "+place(l.destinationId)+" "+l.driver?.name+" "+truckFor(l.driver?.id)?.truckPlate).toLowerCase().includes(query));
  return '<div class="board"><div class="board-head"><h1>'+({board:"Board",active:"Active",history:"History"}[tab])+'</h1>'+
   (tab==="board"&&role==="dispatcher"?btn("＋ New Load","new",null,"primary"):"")+'</div>'+
   '<div class="search-field"><span>⌕</span><input id="load-search" aria-label="Search loads" placeholder="Search pickup, destination, container, truck, or driver" value="'+esc(search)+'"/></div>'+
   (role==="dispatcher"&&tab==="board"?'<div class="board-filter"><label>Status <select id="board-filter">'+["Board","All",...core.STATUSES].map(s=>'<option value="'+esc(s)+'" '+(filter===s?"selected":"")+'>'+esc(s==="Board"?"Open & assigned":s==="All"?"All statuses":s)+'</option>').join("")+'</select></label><span>'+found.length+' loads</span></div>':
   '<p class="load-total">'+found.length+' '+(tab==="board"?"assigned":tab==="active"?"active":"completed")+' loads</p>')+
   (found.length?'<div class="load-stack">'+found.map(card).join("")+'</div>':blank("No loads found",search?"Try another search.":tab==="history"?"Completed trips appear here.":"Nothing to show in this section."))+'</div>';
 }
 function docs(l){
  return group("Trip evidence",'<div class="documents">'+[["pickup","Loaded truck photo · container visible"],["delivery","Delivery note"],["eir","Equipment Interchange Receipt (EIR)"]].map(([id,title])=>{
   const x=l.evidence[id],image=x&&typeof x.preview==="string"&&/^data:image\/jpeg;base64,/.test(x.preview);
   return '<div class="document '+(x?"uploaded":"")+'"><div class="document-icon">'+(x?"▣":"▧")+'</div><div><b>'+title+'</b><small>'+(x?(x.placeholder?"Sample reference only":esc(x.filename||"Photo attached locally")):"Not attached")+'</small>'+
    (image?'<img class="evidence-photo" src="'+esc(x.preview)+'" alt="'+esc(title)+'"/>':
     x?'<div class="document-preview">SAMPLE REFERENCE<small>'+esc(x.reference||"Fictional document")+'</small></div>':"")+'</div></div>';
  }).join("")+'</div>');
 }
 function activity(l){
  const rows=data.activity.filter(a=>a.loadId===l.id);
  return group("Tracking Timeline",'<div class="timeline">'+(rows.length?rows:[{title:"Load posted",detail:"Available to drivers"}]).slice(0,9).map(a=>
  '<div class="timeline-item"><span>●</span><div><b>'+esc(a.title)+'</b><p>'+esc(a.detail)+'</p></div></div>').join("")+'</div>');
 }
 const nextFor={"Assigned":"In transit","In transit":"Delivered","Delivered":"Complete"};
 const stepLabel={"Assigned":"Start In Transit · Loaded Truck Photo","In transit":"Mark Delivered · Delivery Note","Delivered":"Complete · EIR"};
 function actions(l){
  const buttons=[];
  if(role==="dispatcher"){
   if(l.status==="Open")buttons.push(btn("Edit Load","edit",l.id,"soft"),btn("Delete Load","delete",l.id,"danger"),btn("Assign Truck","assign",l.id,"primary"));
   if(l.status==="Complete"&&l.payment.status!=="Paid")buttons.push(btn("Mark Driver Paid","pay",l.id,"soft"));
  }
  if((role==="dispatcher"||own(l))&&nextFor[l.status]){
   buttons.push(btn((role==="dispatcher"?"Update: ":"")+stepLabel[l.status],"proof",l.id,"primary"));
  }
  return buttons.length?group("Actions",'<div class="action-stack">'+buttons.join("")+'</div>'):"";
 }
 function detail(){
  const l=core.find(data,selected);if(!l)return blank("Load not found","Go back to the board.");
  return '<div class="detail"><div class="detail-heading"><h1>'+route(l)+'</h1>'+badge(l.status)+'</div>'+
   group("Load Details",row("📏 Container feet",(l.containerFeet||40)+" ft")+row("🔢 Container number",l.containerNo)+
   row("⚖ Weight",l.weightTons+" tons")+row("🚚 Pickup point",place(l.originId))+row("📍 Destination",place(l.destinationId))+
   row("🏢 Consignee",l.consignee||core.CONSIGNEES[0])+row("↩ Empty return depot",place(l.returnId||"mombasa-port"))+
   row("💰 Pay",money(l.driverPay))+row("🛣 Full trip",l.routeMiles+" mi · sample"))+
   (l.driver?group("Driver & Truck",row("Assigned driver",l.driver.name)+row("Truck",truckName(l.truck?.id||truckFor(l.driver.id)?.id))+
    (l.truck?'<div class="tracking"><b>◉ Truck location (sample)</b><p>'+esc(l.truck.location)+'</p><strong>'+l.truck.miles.toLocaleString()+' miles tracked</strong></div>':"")):"")+
   actions(l)+(l.driver?docs(l):"")+activity(l)+
   (l.status==="Complete"&&role==="dispatcher"?group("Driver Payment",row("Payable",money(l.driverPay))+row("Status",l.payment.status)+
    (l.payment.reference?row("Reference",l.payment.reference):"")):"")+
   '<div class="hint">Fictional fleet and sample locations. New evidence photos are kept in this browser only; no files are uploaded to a server or shared with other users.</div></div>';
 }
 const opts=(selectedValue)=>core.PORTS.map(p=>'<option value="'+esc(p.id)+'" '+(p.id===selectedValue?"selected":"")+'>'+esc(p.name+" ("+p.region+")")+'</option>').join("");
 function create(){
  const editing=mode==="edit",l=editing?core.find(data,selected):null;
  return '<div class="form-view"><form id="cargo-form" data-kind="'+mode+'">'+
   '<div class="form-fields">'+
   '<label>📏 Container feet<select name="containerFeet"><option value="20" '+((l?.containerFeet||40)===20?"selected":"")+'>20 ft</option><option value="40" '+((l?.containerFeet||40)===40?"selected":"")+'>40 ft</option></select></label>'+
   '<label>🔢 Container number<input required minlength="4" maxlength="50" name="containerNo" value="'+esc(l?.containerNo||"DEMO-CONT-"+data.nextId)+'"/></label>'+
   '<label>⚖ Weight (tons)<input required name="weightTons" type="number" min="0.5" max="28" step="0.1" value="'+esc(l?.weightTons??20)+'"/></label>'+
   '<label>📍 Destination<select name="destinationId">'+opts(l?.destinationId||"nairobi-icd")+'</select></label>'+
   '<label>🚚 Pickup point<select name="originId">'+opts(l?.originId||"mombasa-port")+'</select></label>'+
   '<label>🏢 Consignee<select name="consignee">'+core.CONSIGNEES.map(c=>'<option '+((l?.consignee||core.CONSIGNEES[0])===c?"selected":"")+'>'+esc(c)+'</option>').join("")+'</select></label>'+
   '<label>↩ Empty return depot<select name="returnId">'+opts(l?.returnId||"mombasa-port")+'</select></label>'+
   '<label>💰 Pay (KSH)<input name="driverPay" type="number" min="1000" max="5000000" step="1" required value="'+esc(l?.driverPay??280000)+'"/></label>'+
   '<label>🛣 Full trip miles<input name="routeMiles" type="number" min="1" max="1500" step="1" required value="'+esc(l?.routeMiles??305)+'"/></label>'+
   '<label>Cargo description<input name="cargo" required minlength="4" maxlength="130" value="'+esc(l?.cargo||"40-ft shipping container · general cargo")+'"/></label></div>'+
   '<button type="submit" class="button primary wide">'+(editing?"Save Changes":"Create Load")+'</button></form>'+
   '<p class="hint">Sample data only. Locations and consignees are fictional selections.</p></div>';
 }
 function cargoFormModal(){
  if(!formOpen)return "";
  return '<div class="cargo-modal-overlay">'+
   '<button type="button" class="cargo-modal-backdrop" data-action="modal-close" aria-label="Close form"></button>'+
   '<section class="cargo-modal" role="dialog" aria-modal="true" aria-labelledby="cargo-modal-title">'+
   '<header class="cargo-modal-header"><h2 id="cargo-modal-title">'+(mode==="edit"?"Edit Load":"Post a load")+'</h2>'+
   '<button type="button" class="cargo-modal-close" data-action="modal-close" aria-label="Close form">×</button></header>'+
   '<div class="cargo-modal-body">'+create()+'</div></section></div>';
 }

 function assignmentModal(){
  if(!assignmentFor)return "";
  const l=core.find(data,assignmentFor);
  if(!l||l.status!=="Open")return "";
  const choices=data.drivers.map(x=>{
   const truck=truckFor(x.id),overweight=truck&&l.weightTons>truck.capacityTons;
   return '<option value="'+esc(x.id)+'" '+(overweight?"disabled":"")+'>'+
    esc(x.name+" · "+(truck?truck.truckPlate:"No truck paired yet")+
       (overweight?" (truck capacity exceeded)":core.active(data,x.id)?" (active trip; load queued)":""))+'</option>';
  }).join("");
  const available=data.drivers.some(x=>!truckFor(x.id)||l.weightTons<=truckFor(x.id).capacityTons);
  return '<div class="cargo-modal-overlay"><button type="button" class="cargo-modal-backdrop" data-action="assignment-close" aria-label="Close assignment"></button>'+
   '<section class="cargo-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title">'+
   '<header class="cargo-modal-header"><h2 id="assignment-modal-title">Assign driver · '+esc(l.id)+'</h2>'+
   '<button type="button" class="cargo-modal-close" data-action="assignment-close" aria-label="Close assignment">×</button></header>'+
   '<div class="cargo-modal-body"><form id="assignment-form" class="form-view"><div class="form-fields">'+
   '<label>👤 Driver<select name="driverId" required>'+choices+'</select></label></div>'+
   '<p class="hint">Assign to a driver, not a truck. Allocate the driver's truck in Fleet. Additional assigned loads can be queued, but only one trip may be active in transit.</p>'+
   (available?'<button class="button primary wide" type="submit">Assign to Driver</button>':'<p class="hint warning">No eligible driver for this load.</p>')+
   '</form></div></section></div>';
 }
 function evidenceModal(){
  if(!proofFor)return "";
  const l=core.find(data,proofFor.id);
  if(!l)return "";
  const spec={
   "In transit":["Loaded truck photo","Take or select a photo of the loaded truck with its container clearly visible before starting transit."],
   "Delivered":["Delivery note","Take or select a legible photo of the delivery note as proof of delivery."],
   "Complete":["Equipment Interchange Receipt (EIR)","Take or select a clear photo of the EIR after the empty container has been returned."]
  }[proofFor.next];
  if(!spec)return "";
  return '<div class="cargo-modal-overlay"><button type="button" class="cargo-modal-backdrop" data-action="proof-close" aria-label="Close evidence form"></button>'+
   '<section class="cargo-modal" role="dialog" aria-modal="true" aria-labelledby="evidence-modal-title">'+
   '<header class="cargo-modal-header"><h2 id="evidence-modal-title">'+esc(proofFor.next)+' · '+esc(l.id)+'</h2>'+
   '<button type="button" class="cargo-modal-close" data-action="proof-close" aria-label="Close evidence form">×</button></header>'+
   '<div class="cargo-modal-body"><form id="evidence-form" class="form-view">'+
   '<p class="hint"><strong>'+esc(spec[0])+' required.</strong> '+esc(spec[1])+'</p>'+
   '<div class="proof-input"><label for="evidence-image">📷 '+esc(spec[0])+'</label>'+
   '<input id="evidence-image" name="evidence" type="file" accept="image/*" required/></div>'+
   '<button type="submit" class="button primary wide">Confirm '+esc(proofFor.next)+'</button>'+
   '<p class="hint">Demo only: selected photos are resized and stored in this browser, not uploaded to any server.</p>'+
   '</form></div></section></div>';
 }
 async function imageEvidence(file){
  if(!file||!file.type.startsWith("image/"))throw new Error("Select a valid photo.");
  if(file.size>12*1024*1024)throw new Error("Choose a photo under 12 MB.");
  const bitmap=await createImageBitmap(file);
  try{
   const factor=Math.min(1,900/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(bitmap.width*factor));
   canvas.height=Math.max(1,Math.round(bitmap.height*factor));
   const ctx=canvas.getContext("2d");
   if(!ctx)throw new Error("Unable to process this photo.");
   ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const preview=canvas.toDataURL("image/jpeg",0.58);
   if(preview.length>750000)throw new Error("Photo is too large after compression; choose a smaller image.");
   return {filename:file.name.slice(0,120),preview};
  }finally{bitmap.close?.();}
 }

 const drivers=()=>data.drivers;
 function fleetDirectory(){
  const cards=data.fleet.map(t=>{
   const driver=data.drivers.find(d=>d.id===t.driverId);
   const trips=data.loads.filter(l=>l.truck?.id===t.id).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
   const current=trips[0],ongoing=trips.find(l=>["In transit","Delivered"].includes(l.status));
   const history=trips.filter(l=>l.status==="Complete");
   return '<article class="fleet-truck"><div class="fleet-truck-head"><span class="truck-icon">🚚</span><div><b>'+esc(t.truckPlate)+'</b><small>'+esc(t.capacityTons)+' tonnes · demo fleet</small></div></div>'+
    '<div class="fleet-facts">'+row("Assigned driver",driver?.name||"Unassigned")+
    row("Active trip",ongoing?.id||"None")+
    row("Sample mileage",Number(current?.truck?.miles||0).toLocaleString()+" mi")+
    row("Last sample location",current?.truck?.location||"Not available")+'</div>'+
    '<div class="action-stack">'+btn("Assign / Change Driver","pair-truck",t.id,"soft")+'</div>'+
    '<div class="fleet-history-heading">Load history <small>Completed only</small></div>'+
    (history.length?'<ul class="fleet-history">'+history.map(l=>'<li><strong>'+esc(l.id)+'</strong><span>'+esc(place(l.originId))+' → '+esc(place(l.destinationId))+'</span></li>').join("")+'</ul>':
     '<p class="fleet-no-history">No completed deliveries recorded yet.</p>')+'</article>';
  }).join("");
  return '<div class="directory"><h1>Fleet</h1><p class="directory-description">Manage driver-to-truck pairings here. Consignments are assigned to drivers in the load board.</p>'+
   (cards||blank("No trucks","No trucks in this demo."))+'</div>';
 }
 function financeDirectory(){
  const completed=data.loads.filter(l=>l.status==="Complete");
  const due=completed.filter(l=>l.payment.status==="Unpaid").reduce((n,l)=>n+l.driverPay,0);
  return '<div class="directory"><h1>Finance</h1><div class="finance-banner"><span>Outstanding driver payouts</span><strong>'+money(due)+'</strong><small>Demo balance</small></div>'+
   (completed.length?completed.map(l=>'<article class="finance-record"><div class="finance-record-top"><b>'+esc(l.id)+'</b><strong>'+money(l.driverPay)+'</strong></div>'+
    '<p>'+esc(l.driver?.name||"Driver")+'</p><div class="finance-record-bottom"><span class="finance-status '+(l.payment.status==="Paid"?"paid":"")+'">'+esc(l.payment.status)+'</span>'+
    (l.payment.status==="Unpaid"?btn("Mark paid","pay",l.id,"primary"):"")+'</div></article>').join(""):
    blank("No completed loads","Driver settlements appear after a completed load."))+'</div>';
 }
 function directory(){
  if(screen==="fleet")return fleetDirectory();
  if(screen==="finance")return financeDirectory();
  if(screen==="drivers")return '<div class="directory"><h1>Drivers</h1>'+drivers().map(x=>
   '<article class="directory-item"><span class="truck-icon">◉</span><div><b>'+esc(x.name)+'</b><small>'+esc(truckFor(x.id)?.truckPlate||"No assigned truck")+'</small></div>'+
   btn("Assign / Change Truck","pair-driver",x.id,"soft")+'</article>').join("")+'</div>';
  if(screen==="locations")return '<div class="directory"><h1>Locations</h1>'+core.PORTS.map(p=>'<div class="directory-item"><span>📍</span><div><b>'+esc(p.name)+'</b><small>'+esc(p.region)+'</small></div></div>').join("")+'</div>';
  if(screen==="consignees")return '<div class="directory"><h1>Consignees</h1>'+core.CONSIGNEES.map(x=>'<div class="directory-item"><span>▣</span><div><b>'+esc(x)+'</b><small>Fictional consignee</small></div></div>').join("")+'</div>';
  return '<div class="directory"><h1>'+(screen==="profile"?"My Profile":"Settings")+'</h1>'+
   group("Demo Account",row("User",role==="dispatcher"?"Grace (Dispatcher)":currentDriver().name)+
    row("Mode","Fictional / local"))+
   (screen==="profile"?group("Truck",row("Plate",truckFor(driverId)?.truckPlate||"Not paired")+row("Capacity",truckFor(driverId)?truckFor(driverId).capacityTons+" tons":"Not paired")):"")+
   group("Sample Workspace",'<p class="hint">Reset loads, assignments, mileage and browser-local evidence.</p>'+
    btn("Reset Demo Data","reset",null,"danger"))+'</div>';
 }
 function toolbar(){
  const nested=!!screen;
  const label=screen==="detail"?"Load":
   screen?({fleet:"Fleet",drivers:"Drivers",finance:"Finance",locations:"Locations",consignees:"Consignees",settings:"Settings",profile:"My Profile"}[screen]):
    tab==="board"?(role==="dispatcher"?"Grace (Dispatcher)":"Kevin (Driver)"):tab==="active"?"Active":"History";
  return '<header class="app-header"><button type="button" aria-label="'+(nested?"Go back":"Open menu")+'" class="header-btn" data-action="'+(nested?"back":"menu")+'">'+(nested?"‹":"☰")+'</button>'+
   '<div class="header-heading"><b>'+esc(label)+'</b></div>'+
   (nested?'<span></span>':'<select id="demo-role" aria-label="Demo user"><option value="dispatcher" '+(role==="dispatcher"?"selected":"")+'>Grace (Dispatcher)</option>'+
    data.drivers.map(x=>'<option value="driver:'+esc(x.id)+'" '+(role==="driver"&&driverId===x.id?"selected":"")+'>'+esc(x.name.split(" ")[0]+" (Driver)")+'</option>').join("")+'</select>')+'</header>';
 }
 function tabs(){
  if(screen)return "";
  const n=counts();
  return '<nav class="bottom-tabs" aria-label="Cargo tabs">'+[["board","Board","▤"],["active","Active","🚚"],["history","History","◷"]].map(([id,label,icon])=>
   '<button class="'+(id===tab?"current":"")+'" data-tab="'+id+'"><span>'+icon+'</span><small>'+label+"("+n[id]+")"+'</small></button>').join("")+'</nav>';
 }
 function sideMenu(){
  if(!drawer)return "";
  const items=[["fleet","Fleet","🚚"],["drivers","Drivers","◉"],["finance","Finance","◇"],["locations","Locations","📍"],["consignees","Consignees","▤"],["settings","Settings","⚙"]];
  return '<div class="menu-wrap"><button class="menu-backdrop" data-action="menu-close" aria-label="Close menu"></button><aside class="drawer">'+
   '<div class="drawer-banner"><b>Dispatcher</b><p>Grace · Fictional fleet</p></div>'+
   items.map(([key,label,icon])=>'<button data-page="'+key+'"><span>'+icon+'</span>'+label+'<span class="drawer-arrow">›</span></button>').join("")+
   '<a href="/demos/logistics">← Back to demos</a></aside></div>';
 }
 let lastViewScrollKey=null;
function render(){
 const scrollKey=[role,tab,screen,selected].join(':');
 const previousScroll=mount.querySelector?.(".app-content")?.scrollTop||0;
 const keepScroll=lastViewScrollKey===scrollKey;
  mount.innerHTML='<div class="scene"><aside class="scene-info"><span>INTERACTIVE MOBILE CONCEPT</span><h2>Cargo Dispatch</h2><p>A fleet app for dispatcher-led truck assignment and evidence-backed trips.</p><a href="/demos/logistics">← View introduction</a></aside>'+
   '<div class="device"><div class="status-bar"><span>9:41</span><span>▰ ▱ ▰</span></div>'+toolbar()+
   '<main class="app-content">'+(screen==="detail"?detail():screen?directory():board())+'</main>'+tabs()+
   '<div class="gesture"><span></span></div>'+(role==="dispatcher"?sideMenu():"")+'</div>'+
   '<aside class="scene-tools"><b>Demo controls</b><p>Select Grace or Kevin in the header.</p>'+btn("Reset sample data","reset",null,"soft")+'<small>Browser-only · Photo previews saved locally · No live GPS or payments</small></aside></div>'+
   cargoFormModal()+assignmentModal()+pairingModal()+evidenceModal()+
   (toast?'<div class="toast" role="status">'+esc(toast)+btn("×","dismiss",null,"clear")+'</div>':"");
 if(keepScroll){const host=mount.querySelector?.(".app-content");if(host)host.scrollTop=previousScroll;}
 lastViewScrollKey=scrollKey;
 }
 const done=(callback,msg)=>{try{callback();save();toast=msg;}catch(ex){toast=ex?.message||"Unable to complete action.";}render();};
 const back=()=>{if(formOpen){formOpen=false;}else{screen=null;}toast="";render();};
 document.addEventListener("change",event=>{
  if(!mount.contains(event.target))return;
  if(event.target.id==="demo-role"){const value=event.target.value;role=value.startsWith("driver:")?"driver":"dispatcher";if(role==="driver")driverId=value.slice(7);screen=null;formOpen=false;assignmentFor=null;proofFor=null;tab="board";drawer=false;search="";toast="";render();}
  if(event.target.id==="board-filter"){filter=event.target.value;render();}
 });
 document.addEventListener("input",event=>{
  if(!mount.contains(event.target)||event.target.id!=="load-search")return;
  search=event.target.value;const start=event.target.selectionStart,end=event.target.selectionEnd;render();
  const next=document.getElementById("load-search");
  if(next&&typeof next.focus==="function"){next.focus();if(typeof next.setSelectionRange==="function")next.setSelectionRange(start,end);}
 });
 document.addEventListener("click",event=>{
  const el=event.target.closest("[data-action],[data-tab],[data-load],[data-page]");
  if(!el||!mount.contains(el))return;
  if(el.dataset.tab){tab=el.dataset.tab;screen=null;drawer=false;search="";toast="";render();return;}
  if(el.dataset.load){selected=el.dataset.load;screen="detail";drawer=false;toast="";render();return;}
  if(el.dataset.page&&role==="dispatcher"){screen=el.dataset.page;drawer=false;toast="";render();return;}
  const a=el.dataset.action,id=el.dataset.id;
  if(a==="menu"){if(role==="dispatcher"){drawer=!drawer;}else{screen="profile";}render();return;}
  if(a==="menu-close"){drawer=false;render();return;}
  if(a==="back"){back();return;}
  if(a==="assignment-close"){assignmentFor=null;render();return;}
  if(a==="proof-close"){proofFor=null;render();return;}
  if(a==="assign"&&role==="dispatcher"){assignmentFor=id;render();return;}
  if(a==="proof"){const l=core.find(data,id);if(!l||!(role==="dispatcher"||own(l))||!nextFor[l.status])return;proofFor={id,next:nextFor[l.status]};render();return;}
  if(a==="modal-close"){formOpen=false;toast="";render();return;}
  if(a==="dismiss"){toast="";render();return;}
  if(a==="reset"){if(!window.confirm("Reset fictional Cargo Dispatch data and local evidence photos?"))return;data=core.seed();driverId=data.driver.id;save();screen=null;formOpen=false;assignmentFor=null;proofFor=null;tab="board";filter="Board";search="";drawer=false;toast="Sample loads restored.";render();return;}
  if(a==="new"&&role==="dispatcher"){formOpen=true;mode="new";selected=null;render();return;}
  if(a==="edit"&&role==="dispatcher"){formOpen=true;mode="edit";selected=id;render();return;}
  if(a==="delete"&&role==="dispatcher"){
   if(!window.confirm("Delete open load "+id+"?"))return;
   done(()=>{core.remove(data,id);screen=null;},"Load removed.");return;
  }
  if(a==="pay"&&role==="dispatcher"){done(()=>core.pay(data,id),"Driver payment marked paid (demo).");return;}
 });
 document.addEventListener("submit",event=>{
  const form=event.target;
  if(!mount.contains(form))return;
  if(form.id==="assignment-form"){
   event.preventDefault();if(role!=="dispatcher"||!assignmentFor)return;
   const id=assignmentFor,driver=String(new FormData(form).get("driverId")||"");
   done(()=>{core.assign(data,id,driver);assignmentFor=null;},"Load assigned to driver.");return;
  }
  if(form.id==="evidence-form"){
   event.preventDefault();if(!proofFor)return;
   const ctx={...proofFor},load=core.find(data,ctx.id);
   if(!load||!(role==="dispatcher"||own(load)))return;
   const file=form.querySelector('input[type="file"]')?.files?.[0];
   const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
   (async()=>{
    try{
     const evidence=await imageEvidence(file);
     core.progress(data,ctx.id,ctx.next,evidence);
     proofFor=null;save();toast="Load marked "+ctx.next.toLowerCase()+"; photo attached locally.";
    }catch(ex){toast=ex?.message||"Could not attach evidence.";}
    render();
   })();
   return;
  }
  if(form.id!=="cargo-form")return;
  event.preventDefault();if(role!=="dispatcher")return;
  const vals=Object.fromEntries(new FormData(form).entries());
  if(form.dataset.kind==="new")done(()=>{const l=core.post(data,vals);selected=l.id;screen="detail";formOpen=false;},"Load posted.");
  if(form.dataset.kind==="edit")done(()=>{core.edit(data,selected,vals);screen="detail";formOpen=false;},"Load updated.");
 });
 document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(proofFor){proofFor=null;render();}else if(assignmentFor){assignmentFor=null;render();}else if(formOpen){formOpen=false;render();}else if(drawer){drawer=false;render();}else if(screen)back();}});
 render();
})(cargoCore);
