(function cargoMobile(core){
 "use strict";
 const mount=document.getElementById("app"),KEY="joeltechgeek-cargo-mobile-v2";
 const esc=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
 const money=n=>"KSH "+Number(n||0).toLocaleString("en-KE");
 const place=id=>core.loc(id)?.name||"Unknown location";
 let data;try{data=JSON.parse(localStorage.getItem(KEY)||"null");}catch(ex){}
 if(!core.validate(data))data=core.seed();
 let role="dispatcher",tab="board",screen=null,selected=null,mode="new",formOpen=false,drawer=false,search="",filter="Board",toast="";
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch(ex){toast="Browser storage unavailable."}};
 const own=l=>l.driver?.id===data.driver.id,active=()=>core.active(data);
 const btn=(label,command,id,cls="")=>'<button type="button" class="button '+cls+'" data-action="'+command+'" '+(id?'data-id="'+esc(id)+'"':"")+'>'+label+'</button>';
 const badge=st=>'<span class="badge badge-'+st.toLowerCase().replace(/\s/g,"-")+'">'+esc(st)+'</span>';
 const row=(a,b)=>'<div class="data-row"><span>'+esc(a)+'</span><strong>'+esc(b??"—")+'</strong></div>';
 const route=l=>esc(place(l.originId))+' <span class="route-arrow">→</span> '+esc(place(l.destinationId));
 const group=(h,body)=>'<section class="group"><h2>'+esc(h)+'</h2>'+body+'</section>';
 const blank=(h,p)=>'<div class="blank"><div>▣</div><b>'+esc(h)+'</b><p>'+esc(p)+'</p></div>';
 const list=()=>{
  if(tab==="board")return role==="driver"?data.loads.filter(l=>l.status==="Open"||(own(l)&&l.status==="Booked")):
    filter==="Board"?data.loads.filter(l=>["Open","Booked"].includes(l.status)):filter==="All"?data.loads:data.loads.filter(l=>l.status===filter);
  if(tab==="active")return data.loads.filter(l=>["Assigned","Picked up","In transit","Delivered"].includes(l.status)&&(role==="dispatcher"||own(l)));
  return data.loads.filter(l=>l.status==="Complete"&&(role==="dispatcher"||own(l)));
 };
 const counts=()=>({
  board:role==="driver"?data.loads.filter(l=>l.status==="Open"||(own(l)&&l.status==="Booked")).length:data.loads.filter(l=>["Open","Booked"].includes(l.status)).length,
  active:data.loads.filter(l=>["Assigned","Picked up","In transit","Delivered"].includes(l.status)&&(role==="dispatcher"||own(l))).length,
  history:data.loads.filter(l=>l.status==="Complete"&&(role==="dispatcher"||own(l))).length
 });
 const card=l=>{
  const reserved=l.status==="Booked",visible=tab!=="board"||reserved||filter==="All";
  return '<button class="load-card '+(reserved?"reserved":"")+'" data-load="'+esc(l.id)+'">'+
   '<div class="card-top"><div class="route-name">'+route(l)+'</div>'+(visible?badge(l.status):"")+'<span class="chev">›</span></div>'+
   '<div class="card-stats"><span>🚛 '+(l.containerFeet||40)+'ft</span><span>⚖ '+l.weightTons+' T</span><strong>💰 '+money(l.driverPay)+'</strong></div>'+
   '<div class="card-bottom"><span>🛣 Full trip: '+l.routeMiles+' mi · sample</span><span>🕒 '+esc(l.id)+'</span>'+
   (l.driver?'<span class="driver-name">◉ '+esc(l.driver.name)+'</span>':"")+'</div></button>';
 };
 function board(){
  const items=list(),query=search.trim().toLowerCase();
  const found=items.filter(l=>(l.id+" "+l.containerNo+" "+place(l.originId)+" "+place(l.destinationId)+" "+l.driver?.name+" "+l.driver?.truckPlate).toLowerCase().includes(query));
  return '<div class="board"><div class="board-head"><h1>'+({board:"Board",active:"Active",history:"History"}[tab])+'</h1>'+
   (tab==="board"&&role==="dispatcher"?btn("＋ New Load","new",null,"primary"):"")+'</div>'+
   '<div class="search-field"><span>⌕</span><input id="load-search" aria-label="Search loads" placeholder="Search pickup, destination, container, truck, or driver" value="'+esc(search)+'"/></div>'+
   (role==="dispatcher"&&tab==="board"?'<div class="board-filter"><label>Status <select id="board-filter">'+["Board","All",...core.STATUSES].map(s=>'<option value="'+esc(s)+'" '+(filter===s?"selected":"")+'>'+esc(s==="Board"?"Open & booked":s==="All"?"All statuses":s)+'</option>').join("")+'</select></label><span>'+found.length+' loads</span></div>':
   '<p class="load-total">'+found.length+' '+(tab==="board"?"available or pending":tab==="active"?"active":"completed")+' loads</p>')+
   (found.length?'<div class="load-stack">'+found.map(card).join("")+'</div>':blank("No loads found",search?"Try another search.":tab==="history"?"Completed trips appear here.":"Nothing to show in this section."))+'</div>';
 }
 function docs(l){
  return group("Supporting Documents",'<div class="documents">'+[["pickup","Pickup Photo"],["delivery","Delivery Note"],["eir","Equipment Interchange Receipt (EIR)"]].map(([id,title])=>{
   const x=l.evidence[id];
   return '<div class="document '+(x?"uploaded":"")+'"><div class="document-icon">'+(x?"▣":"▧")+'</div><div><b>'+title+'</b><small>'+(x?"Sample attached":"Not attached")+'</small>'+
    (x?'<div class="document-preview">SAMPLE PREVIEW<small>'+esc(x.reference)+'</small></div>':"")+'</div></div>';
  }).join("")+'</div>');
 }
 function activity(l){
  const rows=data.activity.filter(a=>a.loadId===l.id);
  return group("Tracking Timeline",'<div class="timeline">'+(rows.length?rows:[{title:"Load posted",detail:"Available to drivers"}]).slice(0,9).map(a=>
  '<div class="timeline-item"><span>●</span><div><b>'+esc(a.title)+'</b><p>'+esc(a.detail)+'</p></div></div>').join("")+'</div>');
 }
 function actions(l){
  const buttons=[];
  if(role==="dispatcher"){
   if(l.status==="Open")buttons.push(btn("Edit Load","edit",l.id,"soft"),btn("Delete Load","delete",l.id,"danger"));
   if(l.status==="Booked")buttons.push(btn("Approve Reservation","approve",l.id,"primary"),btn("Decline","decline",l.id,"soft"));
   if(l.status==="Complete"&&l.payment.status!=="Paid")buttons.push(btn("Mark Driver Paid","pay",l.id,"primary"));
  }else if(l.status==="Open"){
   buttons.push(btn(active()?"Complete current load before booking":"Book Load","book",l.id,active()?"disabled":"primary"));
  }else if(own(l)&&l.status==="Booked"){
   buttons.push(btn("Cancel Reservation","cancel",l.id,"danger"));
  }else if(own(l)){
   if(l.status==="Assigned"){if(!l.evidence.pickup)buttons.push(btn("Add Pickup Photo (Sample)","pickup",l.id,"soft"));buttons.push(btn("Mark Picked Up","picked",l.id,"primary"))}
   if(l.status==="Picked up")buttons.push(btn("Mark In Transit","transit",l.id,"primary"));
   if(l.status==="In transit"){if(!l.evidence.delivery)buttons.push(btn("Add Delivery Note (Sample)","delivery",l.id,"soft"));buttons.push(btn("Mark Delivered","delivered",l.id,"primary"))}
   if(l.status==="Delivered"){if(!l.evidence.eir)buttons.push(btn("Add EIR (Sample)","eir",l.id,"soft"));buttons.push(btn("Container Returned · Complete","complete",l.id,"primary"))}
  }
  return buttons.length?group("Actions",'<div class="action-stack">'+buttons.join("")+'</div>'):"";
 }
 function detail(){
  const l=core.find(data,selected);if(!l)return blank("Load not found","Go back to the board.");
  return '<div class="detail"><div class="detail-heading"><h1>'+route(l)+'</h1>'+badge(l.status)+'</div>'+
   (role==="driver"&&l.status==="Open"&&active()?'<div class="hint warning">An active booking is already on your truck. Complete it before booking another load.</div>':"")+
   group("Load Details",row("📏 Container feet",(l.containerFeet||40)+" ft")+row("🔢 Container number",l.containerNo)+
   row("⚖ Weight",l.weightTons+" tons")+row("🚚 Pickup point",place(l.originId))+row("📍 Destination",place(l.destinationId))+
   row("🏢 Consignee",l.consignee||core.CONSIGNEES[0])+row("↩ Empty return depot",place(l.returnId||"mombasa-port"))+
   row("💰 Pay",money(l.driverPay))+row("🛣 Full trip",l.routeMiles+" mi · sample"))+
   (l.driver?group("Driver & Truck",row("Driver",l.driver.name)+row("Truck",l.driver.truckPlate)+
    (l.truck?'<div class="tracking"><b>◉ Truck location (sample)</b><p>'+esc(l.truck.location)+'</p><strong>'+l.truck.miles.toLocaleString()+' miles tracked</strong></div>':"")):"")+
   actions(l)+(l.driver?docs(l):"")+activity(l)+
   (l.status==="Complete"&&role==="dispatcher"?group("Driver Payment",row("Payable",money(l.driverPay))+row("Status",l.payment.status)+
    (l.payment.reference?row("Reference",l.payment.reference):"")):"")+
   '<div class="hint">Fictional data only. Truck locations, image evidence, and payments are simulated.</div></div>';
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
 const drivers=()=>[data.driver,...data.loads.filter(l=>l.driver).map(l=>({id:l.driver.id,name:l.driver.name,truckPlate:l.driver.truckPlate}))].filter((a,i,all)=>all.findIndex(b=>b.id===a.id)===i);
 function directory(){
  if(screen==="fleet")return '<div class="directory"><h1>Fleet</h1>'+data.loads.filter(l=>l.driver).map(l=>
   '<button class="directory-item" data-load="'+esc(l.id)+'"><span class="truck-icon">🚚</span><div><b>'+esc(l.driver.truckPlate)+'</b><small>'+esc(l.driver.name)+'</small><p>◉ '+esc(l.truck?.location||"Not available")+'</p><small>'+Number(l.truck?.miles||0).toLocaleString()+' mi · sample</small></div><span>›</span></button>').join("")+'</div>';
  if(screen==="drivers")return '<div class="directory"><h1>Drivers</h1>'+drivers().map(x=>
   '<article class="directory-item"><span class="truck-icon">◉</span><div><b>'+esc(x.name)+'</b><small>'+esc(x.truckPlate)+'</small></div></article>').join("")+'</div>';
  if(screen==="finance"){
   const completed=data.loads.filter(l=>l.status==="Complete");
   return '<div class="directory"><h1>Finance</h1><div class="finance-banner"><span>Outstanding driver payouts</span><strong>'+money(completed.filter(l=>l.payment.status==="Unpaid").reduce((n,l)=>n+l.driverPay,0))+'</strong><small>Demo balance</small></div>'+
   completed.map(l=>'<button class="directory-item" data-load="'+esc(l.id)+'"><span class="truck-icon">◇</span><div><b>'+esc(l.id)+' · '+money(l.driverPay)+'</b><small>'+esc(l.driver?.name||"Driver")+' · '+esc(l.payment.status)+'</small></div><span>›</span></button>').join("")+'</div>';
  }
  if(screen==="locations")return '<div class="directory"><h1>Locations</h1>'+core.PORTS.map(p=>'<div class="directory-item"><span>📍</span><div><b>'+esc(p.name)+'</b><small>'+esc(p.region)+'</small></div></div>').join("")+'</div>';
  if(screen==="consignees")return '<div class="directory"><h1>Consignees</h1>'+core.CONSIGNEES.map(x=>'<div class="directory-item"><span>▣</span><div><b>'+esc(x)+'</b><small>Fictional consignee</small></div></div>').join("")+'</div>';
  return '<div class="directory"><h1>'+(screen==="profile"?"My Profile":"Settings")+'</h1>'+
   group("Demo Account",row("User",role==="dispatcher"?"Grace (Dispatcher)":"Kevin (Driver)")+
    row("Mode","Fictional / local"))+
   (screen==="profile"?group("Truck",row("Plate",data.driver.truckPlate)+row("Capacity",data.driver.capacityTons+" tons")):"")+
   group("Sample Workspace",'<p class="hint">Reset loads, bookings, mileage and sample document records.</p>'+
    btn("Reset Demo Data","reset",null,"danger"))+'</div>';
 }
 function toolbar(){
  const nested=!!screen;
  const label=screen==="detail"?"Load":
   screen?({fleet:"Fleet",drivers:"Drivers",finance:"Finance",locations:"Locations",consignees:"Consignees",settings:"Settings",profile:"My Profile"}[screen]):
    tab==="board"?(role==="dispatcher"?"Grace (Dispatcher)":"Kevin (Driver)"):tab==="active"?"Active":"History";
  return '<header class="app-header"><button type="button" aria-label="'+(nested?"Go back":"Open menu")+'" class="header-btn" data-action="'+(nested?"back":"menu")+'">'+(nested?"‹":"☰")+'</button>'+
   '<div class="header-heading"><b>'+esc(label)+'</b></div>'+
   (nested?'<span></span>':'<select id="demo-role" aria-label="Demo user"><option value="dispatcher" '+(role==="dispatcher"?"selected":"")+'>Grace (Dispatcher)</option><option value="driver" '+(role==="driver"?"selected":"")+'>Kevin (Driver)</option></select>')+'</header>';
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
 function render(){
  mount.innerHTML='<div class="scene"><aside class="scene-info"><span>INTERACTIVE MOBILE CONCEPT</span><h2>Cargo Dispatch</h2><p>A fleet app built around dispatching, reservations and driver trips.</p><a href="/demos/logistics">← View introduction</a></aside>'+
   '<div class="device"><div class="status-bar"><span>9:41</span><span>▰ ▱ ▰</span></div>'+toolbar()+
   '<main class="app-content">'+(screen==="detail"?detail():screen?directory():board())+'</main>'+tabs()+
   '<div class="gesture"><span></span></div></div>'+
   '<aside class="scene-tools"><b>Demo controls</b><p>Select Grace or Kevin in the header.</p>'+btn("Reset sample data","reset",null,"soft")+'<small>Browser-only · No live GPS, uploads or payments</small></aside></div>'+
   (role==="dispatcher"?sideMenu():"")+cargoFormModal()+
   (toast?'<div class="toast" role="status">'+esc(toast)+btn("×","dismiss",null,"clear")+'</div>':"");
 }
 const done=(callback,msg)=>{try{callback();save();toast=msg;}catch(ex){toast=ex?.message||"Unable to complete action.";}render();};
 const back=()=>{if(formOpen){formOpen=false;}else{screen=null;}toast="";render();};
 document.addEventListener("change",event=>{
  if(!mount.contains(event.target))return;
  if(event.target.id==="demo-role"){role=event.target.value==="driver"?"driver":"dispatcher";screen=null;formOpen=false;tab="board";drawer=false;search="";toast="";render();}
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
  if(a==="modal-close"){formOpen=false;toast="";render();return;}
  if(a==="dismiss"){toast="";render();return;}
  if(a==="reset"){if(!window.confirm("Reset fictional Cargo Dispatch data?"))return;data=core.seed();save();screen=null;formOpen=false;tab="board";filter="Board";search="";drawer=false;toast="Sample loads restored.";render();return;}
  if(a==="new"&&role==="dispatcher"){formOpen=true;mode="new";selected=null;render();return;}
  if(a==="edit"&&role==="dispatcher"){formOpen=true;mode="edit";selected=id;render();return;}
  if(a==="delete"&&role==="dispatcher"){
   if(!window.confirm("Delete open load "+id+"?"))return;
   done(()=>{core.remove(data,id);screen=null;},"Load removed.");return;
  }
  if(a==="approve"&&role==="dispatcher"){done(()=>core.approve(data,id),"Reservation approved.");return;}
  if(a==="decline"&&role==="dispatcher"){done(()=>core.decline(data,id),"Reservation declined.");return;}
  if(a==="pay"&&role==="dispatcher"){done(()=>core.pay(data,id),"Driver payment marked paid (demo).");return;}
  if(role==="driver"){
   if(a==="book"){done(()=>core.book(data,id),"Load booked. Waiting for dispatcher approval.");return;}
   if(a==="cancel"){done(()=>core.cancel(data,id),"Booking cancelled.");return;}
   const proof={pickup:"pickup",delivery:"delivery",eir:"eir"}[a];
   if(proof){done(()=>core.attach(data,id,proof),"Sample "+core.LABELS[proof]+" added. No file uploaded.");return;}
   const next={picked:"Picked up",transit:"In transit",delivered:"Delivered",complete:"Complete"}[a];
   if(next){done(()=>core.progress(data,id,next),"Load marked "+next.toLowerCase()+".");return;}
  }
 });
 document.addEventListener("submit",event=>{
  const form=event.target;if(form.id!=="cargo-form"||!mount.contains(form))return;
  event.preventDefault();if(role!=="dispatcher")return;
  const vals=Object.fromEntries(new FormData(form).entries());
  if(form.dataset.kind==="new")done(()=>{const l=core.post(data,vals);selected=l.id;screen="detail";formOpen=false;},"Load posted.");
  if(form.dataset.kind==="edit")done(()=>{core.edit(data,selected,vals);screen="detail";formOpen=false;},"Load updated.");
 });
 document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(formOpen){formOpen=false;render();}else if(drawer){drawer=false;render();}else if(screen)back();}});
 render();
})(cargoCore);
