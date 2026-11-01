(function(core,createViews){
"use strict";
const root=document.getElementById("app"),KEY="jtech-rental-demo-v2";
let data;try{data=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
if(!core.valid(data))data=core.seed();
const tabs=[["rent","Rent","▤"],["leases","Leases","▧"],["tenants","Tenants","♙"],["portfolio","Portfolio","▦"]];
const menus=[["Finance",[["payments","Payments","◇"],["expenses","Expenses","▣"],["accounting","Accounting","▤"]]],["Operations",[["history","Invoice history","◷"]]]];
const names={rent:"Rent overview",leases:"Leases",tenants:"Tenants",portfolio:"Properties",invoice:"Invoice",property:"Property details",unit:"Unit details",lease:"Lease details",tenant:"Tenant details",payments:"Payments",receipt:"Receipt",expenses:"Expenses",accounting:"Accounting",history:"Settled Invoices"};
const ui={tab:"rent",screen:null,id:null,history:[],drawer:false,modal:null,notice:"",search:"",status:"all",month:"all",property:"all",method:"all",expenseProperty:"all",accountProperty:"P-101"};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){ui.notice="Changes could not be saved."}};
const open=(screen,id=null)=>{ui.history.push([ui.screen,ui.id]);ui.screen=screen;ui.id=id;ui.drawer=false;ui.notice="";render()};
const back=()=>{if(ui.modal)ui.modal=null;else{const prev=ui.history.pop();ui.screen=prev?.[0]||null;ui.id=prev?.[1]||null;}ui.notice="";render()};
function render(){
 const view=createViews(data,ui,core),e=view.esc;
 const drawer=ui.drawer?'<div class="drawer-wrap"><button class="drawer-backdrop" data-action="close-drawer" aria-label="Close menu"></button><aside class="drawer"><div class="drawer-title"><small>PROPERTY WORKSPACE</small><b>'+e(data.workspace.name)+'</b><span>Property Manager</span></div>'+
 menus.map(([group,items])=>'<section class="drawer-section"><h3>'+group+'</h3>'+items.map(([id,text,icon])=>'<button data-drawer="'+id+'"><span>'+icon+'</span>'+text+'<i>›</i></button>').join("")+'</section>').join("")+
 '<section class="drawer-section"><h3>Workspace</h3><button data-action="reset"><span>↻</span>Reset demo data<i>›</i></button></section><a href="/demos/property">← Demo overview</a></aside></div>':"";
 const nav=ui.screen?"":'<nav class="bottom-tabs">'+tabs.map(([key,label,icon])=>'<button data-tab="'+key+'" class="'+(ui.tab===key?"selected":"")+'"><span>'+icon+'</span><small>'+label+'</small></button>').join("")+'</nav>';
 root.innerHTML='<div class="stage"><aside class="intro"><small>PROPERTY OPERATIONS · MOBILE DEMO</small><h2>Rental Management</h2><p>One fictional portfolio, connected rent invoices, payments, expenses and property positions.</p><a href="/demos/property">← Demo overview</a></aside>'+
 '<div class="phone"><div class="status-bar"><span>9:41</span><span>▰ ▱ ▰</span></div><header class="app-header"><button class="back-button" data-action="'+(ui.screen?"back":"drawer")+'" aria-label="'+(ui.screen?"Back":"Open menu")+'">'+(ui.screen?"‹":"☰")+'</button>'+
 '<div class="app-title"><b>'+e(names[ui.screen||ui.tab])+'</b><small>'+e(data.workspace.name)+'</small></div><span class="app-mark">⌂</span></header>'+
 '<main class="phone-main"><div class="screen">'+view.page()+'</div></main>'+nav+'<div class="gesture"><span></span></div>'+drawer+'</div>'+
 '<aside class="help"><b>Landlord workspace</b><p>Use Rent, Leases, Tenants, Portfolio and the in-phone menu.</p>'+view.btn("Reset sample data","reset",null,"soft")+'<small>No live collections or tenant messages.</small></aside></div>'+
 view.form()+(ui.notice?'<div class="toast" role="status">'+e(ui.notice)+view.btn("×","dismiss",null,"text")+'</div>':"");
}
const perform=fn=>{try{fn();save();ui.modal=null;ui.notice="Sample record updated.";}catch(ex){ui.notice=ex?.message||"Action unavailable.";}render()};
document.addEventListener("click",event=>{
 const el=event.target.closest("[data-tab],[data-open],[data-drawer],[data-action]");
 if(!el||!root.contains(el))return;const {tab,open:detail,drawer:page,action,id}=el.dataset;
 if(tab){if(tabs.some(x=>x[0]===tab)){ui.tab=tab;ui.screen=null;ui.id=null;ui.history=[];ui.notice="";render()}return;}
 if(detail){if(names[detail])open(detail,id);return;}
 if(page){if(menus.some(([group,items])=>items.some(x=>x[0]===page)))open(page);return;}
 if(action==="drawer"){ui.drawer=true;render();return;}
 if(action==="close-drawer"){ui.drawer=false;render();return;}
 if(action==="back"){back();return;}
 if(action==="close-modal"){ui.modal=null;ui.notice="";render();return;}
 if(action==="dismiss"){ui.notice="";render();return;}
 if(action==="open-payments"){open("payments");return;}
 if(action==="go-lease"){open("lease",id);return;}
 if(action==="go-invoice"){open("invoice",id);return;}
 if(action==="new-payment"){
  if(data.invoices.some(i=>i.id===id&&core.balance(i)>0)){ui.modal={type:"payment",id};ui.notice="";render();}
  return;
 }
 if(action==="new-expense"){ui.modal={type:"expense"};ui.notice="";render();return;}
 if(action==="new-lease"){
  if(!data.units.some(x=>x.active&&!core.activeLease(data,x.id))){ui.notice="There are no vacant units.";render();return;}
  ui.modal={type:"lease",id};ui.notice="";render();return;
 }
 if(action==="reset"){
  if(!window.confirm("Reset fictional rent records?"))return;
  data=core.seed();save();ui.screen=null;ui.id=null;ui.history=[];ui.tab="rent";ui.modal=null;ui.drawer=false;ui.notice="Demo records restored.";render();return;
 }
});
document.addEventListener("change",event=>{
 const {id,value}=event.target;
 if(id==="status-filter")ui.status=value;
 else if(id==="month-filter")ui.month=value;
 else if(id==="property-filter")ui.property=value;
 else if(id==="method-filter")ui.method=value;
 else if(id==="expense-filter")ui.expenseProperty=value;
 else if(id==="account-filter")ui.accountProperty=value;
 else return;render();
});
document.addEventListener("input",event=>{
 if(event.target.id!=="rent-search")return;
 ui.search=event.target.value;const pos=event.target.selectionStart;render();
 const f=document.getElementById("rent-search");
 if(f&&typeof f.focus==="function"){f.focus();if(typeof f.setSelectionRange==="function")f.setSelectionRange(pos,pos);}
});
document.addEventListener("submit",event=>{
 const f=event.target;if(f.id!=="property-form"||!root.contains(f))return;
 event.preventDefault();const {type,id}=f.dataset;
 if(!ui.modal||ui.modal.type!==type||String(ui.modal.id||"")!==id)return;
 const vals=Object.fromEntries(new FormData(f).entries());
 perform(()=>{
  let output;
  if(type==="payment")output=core.settle(data,id,vals);
  else if(type==="lease")output=core.createLease(data,vals);
  else if(type==="expense")output=core.addExpense(data,vals);
  else throw new Error("Unknown form.");
  if(type==="payment"||type==="lease"){ui.history.push([ui.screen,ui.id]);ui.screen=type==="payment"?"receipt":"lease";ui.id=type==="payment"?output.id:output.lease.id;}
 });
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(ui.modal){ui.modal=null;render()}else if(ui.drawer){ui.drawer=false;render()}else if(ui.screen)back();}});
render();
})(rentalCore,rentalViews);
