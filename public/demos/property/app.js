(function(core,createViews){
"use strict";
const root=document.getElementById("app"),KEY="jtech-rental-demo-v2";
let data;try{data=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
if(!core.valid(data))data=core.seed();
const managerTabs=[["rent","Rent","▤"],["leases","Leases","▧"],["tenants","Tenants","♙"],["portfolio","Portfolio","▦"]];
const tenantTabs=[["tenantRent","My rent","▤"],["tenantPayments","Payments","◇"],["tenantLease","My lease","▧"]];
const tabs=()=>ui.role==="manager"?managerTabs:tenantTabs;
const menus=[["Collections & records",[["payments","Payments","◇"],["expenses","Expenses","▣"],["accounting","Accounting","▤"]]],["Operations",[["history","Invoice history","◷"]]]];
const names={rent:"Rent overview",leases:"Leases",tenants:"Tenants",portfolio:"Properties",invoice:"Invoice",property:"Property details",unit:"Unit details",lease:"Lease details",tenant:"Tenant details",payments:"Payments",receipt:"Receipt",expenses:"Expenses",accounting:"Accounting",history:"Settled Invoices",tenantRent:"My rent",tenantPayments:"My payments",tenantLease:"My lease"};
const ui={role:"manager",tenantId:"T-101",tab:"rent",screen:null,id:null,history:[],drawer:false,modal:null,checkoutRequestId:null,notice:"",search:"",status:"all",month:"all",property:"all",tenant:"all",method:"all",expenseProperty:"all",accountProperty:"P-101"};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){ui.notice="Changes could not be saved."}};
const authorized=(screen,id)=>{
 if(!names[screen])return false;
 if(ui.role==="manager")return !["tenantRent","tenantPayments","tenantLease"].includes(screen);
 if(["tenantRent","tenantPayments","tenantLease"].includes(screen))return true;
 if(screen==="invoice")return data.invoices.some(i=>i.id===id&&i.tenantId===ui.tenantId);
 if(screen==="receipt")return data.payments.some(p=>p.id===id&&p.tenantId===ui.tenantId);
 if(screen==="lease")return data.leases.some(l=>l.id===id&&l.tenantId===ui.tenantId);
 return false;
};
const open=(screen,id=null)=>{if(!authorized(screen,id))return;ui.history.push([ui.screen,ui.id]);ui.screen=screen;ui.id=id;ui.drawer=false;ui.notice="";render()};
const back=()=>{if(ui.modal)ui.modal=null;else{const prev=ui.history.pop();ui.screen=prev?.[0]||null;ui.id=prev?.[1]||null;}ui.notice="";render()};
function render(){
 const view=createViews(data,ui,core),e=view.esc;
 const drawer=ui.role==="manager"&&ui.drawer?'<div class="drawer-wrap"><button class="drawer-backdrop" data-action="close-drawer" aria-label="Close menu"></button><aside class="drawer"><div class="drawer-title"><small>PROPERTY WORKSPACE</small><b>'+e(data.workspace.name)+'</b><span>Property Manager</span></div>'+
 menus.map(([group,items])=>'<section class="drawer-section"><h3>'+group+'</h3>'+items.map(([id,text,icon])=>'<button data-drawer="'+id+'"><span>'+icon+'</span>'+text+'<i>›</i></button>').join("")+'</section>').join("")+
 '<section class="drawer-section"><h3>Workspace</h3><button data-action="reset"><span>↻</span>Reset demo data<i>›</i></button></section><a href="/demos/property">← Demo overview</a></aside></div>':"";
 const nav=ui.screen?"":'<nav class="bottom-tabs">'+tabs().map(([key,label,icon])=>'<button data-tab="'+key+'" class="'+(ui.tab===key?"selected":"")+'"><span>'+icon+'</span><small>'+label+'</small></button>').join("")+'</nav>';
 root.innerHTML='<div class="stage"><aside class="intro"><small>PROPERTY OPERATIONS · MOBILE DEMO</small><h2>Rental Management</h2><p>One fictional portfolio, connected rent invoices, payments, expenses and property positions.</p><a href="/demos/property">← Demo overview</a></aside>'+
 '<div class="phone"><div class="status-bar"><span>9:41</span><span>▰ ▱ ▰</span></div><header class="app-header">'+
 (ui.screen?'<button class="back-button" data-action="back" aria-label="Back">‹</button>':
 ui.role==="manager"?'<button class="back-button" data-action="drawer" aria-label="Open menu">☰</button>':
 '<span class="role-home" aria-hidden="true">⌂</span>')+
 '<div class="app-title"><b>'+e(names[ui.screen||ui.tab])+'</b><small>'+e(data.workspace.name)+'</small></div>'+
 '<select id="role-select" class="role-select" aria-label="Demo account"><option value="manager" '+(ui.role==="manager"?"selected":"")+'>Anne (Property Manager)</option><option value="tenant" '+(ui.role==="tenant"?"selected":"")+'>Alex (Tenant)</option></select></header>'+
 '<main class="phone-main"><div class="screen">'+view.page()+'</div></main>'+nav+'<div class="gesture"><span></span></div>'+drawer+'</div>'+
 '<aside class="help"><b>Two connected roles</b><p>Choose Property Manager or Tenant inside the phone. Both see the same fictional rent records.</p>'+(ui.role==="manager"?view.btn("Reset sample data","reset",null,"soft"):"")+'<small>No live collections or tenant messages.</small></aside></div>'+
 view.form()+(ui.notice?'<div class="toast" role="status">'+e(ui.notice)+view.btn("×","dismiss",null,"text")+'</div>':"");
}
const perform=fn=>{try{fn();save();ui.modal=null;ui.notice="Sample record updated.";}catch(ex){ui.notice=ex?.message||"Action unavailable.";}render()};
document.addEventListener("click",event=>{
 const el=event.target.closest("[data-tab],[data-open],[data-drawer],[data-action]");
 if(!el||!root.contains(el))return;const {tab,open:detail,drawer:page,action,id}=el.dataset;
 if(tab){if(tabs().some(x=>x[0]===tab)){ui.tab=tab;ui.screen=null;ui.id=null;ui.history=[];ui.notice="";render()}return;}
 if(detail){if(names[detail])open(detail,id);return;}
 if(page){if(ui.role==="manager"&&menus.some(([group,items])=>items.some(x=>x[0]===page)))open(page);return;}
 if(action==="drawer"){if(ui.role==="manager"){ui.drawer=true;render();}return;}
 if(action==="close-drawer"){ui.drawer=false;render();return;}
 if(action==="back"){back();return;}
 if(action==="close-modal"){ui.modal=null;ui.notice="";render();return;}
 if(action==="dismiss"){ui.notice="";render();return;}
 if(action==="open-payments"){open("payments");return;}
 if(action==="go-lease"){open("lease",id);return;}
 if(action==="go-invoice"){open("invoice",id);return;}
 if(action==="open-tenant-lease"){open("lease",id);return;}
 if(action==="pay-now"){
  if(ui.role!=="tenant")return;
  const i=data.invoices.find(i=>i.id===id&&i.tenantId===ui.tenantId);
  if(!i||core.balance(i)<=0)return;
  ui.checkoutRequestId="demo-checkout-"+data.seq+"-"+i.id;
  ui.modal={type:"checkout",id:i.id};ui.notice="";render();return;
 }
 if(action==="new-payment"){
  if(ui.role==="manager"&&data.invoices.some(i=>i.id===id&&core.balance(i)>0)){ui.modal={type:"payment",id};ui.notice="";render();}
  return;
 }
 if(action==="new-expense"){if(ui.role==="manager"){ui.modal={type:"expense"};ui.notice="";render();}return;}
 if(action==="new-lease"){
  if(ui.role!=="manager")return;
  if(!data.units.some(x=>x.active&&!core.activeLease(data,x.id))){ui.notice="There are no vacant units.";render();return;}
  ui.modal={type:"lease",id};ui.notice="";render();return;
 }
 if(action==="reset"){
  if(ui.role!=="manager")return;
  if(!window.confirm("Reset fictional rent records?"))return;
  data=core.seed();save();ui.screen=null;ui.id=null;ui.history=[];ui.tab="rent";ui.modal=null;ui.drawer=false;ui.notice="Demo records restored.";render();return;
 }
});
document.addEventListener("change",event=>{
 const {id,value}=event.target;
 if(id==="role-select"){
  if(value!=="manager"&&value!=="tenant")return;
  ui.role=value;ui.tab=value==="manager"?"rent":"tenantRent";
  ui.screen=null;ui.id=null;ui.history=[];ui.drawer=false;ui.modal=null;ui.checkoutRequestId=null;ui.notice="";ui.search="";
  render();return;
 }
 if(id==="status-filter"&&ui.role==="manager")ui.status=value;
 else if(id==="month-filter"&&ui.role==="manager")ui.month=value;
 else if(id==="property-filter"&&ui.role==="manager")ui.property=value;
 else if(id==="tenant-filter"&&ui.role==="manager")ui.tenant=value;
 else if(id==="method-filter"&&ui.role==="manager")ui.method=value;
 else if(id==="expense-filter"&&ui.role==="manager")ui.expenseProperty=value;
 else if(id==="account-filter"&&ui.role==="manager")ui.accountProperty=value;
 else return;render();
});
document.addEventListener("input",event=>{
 if(event.target.id!=="rent-search"||ui.role!=="manager")return;
 ui.search=event.target.value;const pos=event.target.selectionStart;render();
 const f=document.getElementById("rent-search");
 if(f&&typeof f.focus==="function"){f.focus();if(typeof f.setSelectionRange==="function")f.setSelectionRange(pos,pos);}
});
document.addEventListener("submit",event=>{
 const f=event.target;if(f.id!=="property-form"||!root.contains(f))return;
 event.preventDefault();const {type,id}=f.dataset;
 if(!ui.modal||ui.modal.type!==type||String(ui.modal.id||"")!==id)return;
 if((ui.role==="tenant"&&type!=="checkout")||(ui.role==="manager"&&type==="checkout"))return;
 const vals=Object.fromEntries(new FormData(f).entries());
 perform(()=>{
  let output;
  if(type==="payment")output=core.settle(data,id,vals);
  else if(type==="checkout")output=core.payNow(data,ui.tenantId,id,{...vals,requestId:ui.checkoutRequestId});
  else if(type==="lease")output=core.createLease(data,vals);
  else if(type==="expense")output=core.addExpense(data,vals);
  else throw new Error("Unknown form.");
  if(type==="payment"||type==="checkout"||type==="lease"){
   ui.history.push([ui.screen,ui.id]);
   ui.screen=type==="lease"?"lease":"receipt";
   ui.id=type==="lease"?output.lease.id:output.id;
   ui.checkoutRequestId=null;
  }
 });
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(ui.modal){ui.modal=null;ui.checkoutRequestId=null;render()}else if(ui.drawer){ui.drawer=false;render()}else if(ui.screen)back();}});
render();
})(rentalCore,rentalViews);
