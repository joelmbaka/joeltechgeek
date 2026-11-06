/* Garage Management System — single-operator browser demo */
(function(c,makeViews){
"use strict";
const KEY="jtech-garage-demo-v1",root=document.getElementById("app");
if(!root)return;
let d;
try{d=JSON.parse(localStorage.getItem(KEY)||"null");}catch(_){}
if(!c.valid(d))d=c.seed();
const ui={page:"dashboard",ticketId:null,tab:"overview",search:"",filter:"all",modal:null,
 document:null,mobileMenu:false,toast:""};
let lastViewKey=null;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(d));}catch(_){ui.toast="Browser storage is unavailable. Changes may not persist.";}}
const setToast=message=>{ui.toast=message;render();};
function change(fn,message,after){
 try{
  const copy=JSON.parse(JSON.stringify(d));
  const result=fn(copy);
  d=copy;save();ui.modal=null;ui.toast=message||"Demo record saved.";
  if(after)after(result);
  render();
  return result;
 }catch(error){
  ui.toast=error?.message||"The action could not be completed.";render();return null;
 }
}
function navigate(page){
 if(!makeViews(d,ui,c).NAV.some(x=>x[0]===page))return;
 ui.page=page;ui.ticketId=null;ui.tab="overview";ui.modal=null;ui.document=null;ui.mobileMenu=false;ui.toast="";
 render();
}
function openTicket(ticketId){
 if(!d.tickets.some(t=>t.id===ticketId))return;
 ui.page="tickets";ui.ticketId=ticketId;ui.tab="overview";
 ui.modal=null;ui.document=null;ui.mobileMenu=false;ui.toast="";render();
}
function openModal(kind,attrs={}){
 const valid=["customer","ticket","appointment","diagnosis","service","requirement","cart","receive","reject",
 "return","item","stock-in","payment"];
 if(!valid.includes(kind))return;
 if(["diagnosis","service","requirement","cart","receive","reject","return","payment"].includes(kind)&&!ui.ticketId)return;
 ui.document=null;ui.modal={kind,itemId:attrs.itemId||null,requirementId:attrs.requirementId||null,
 issueId:attrs.issueId||null,vehicleId:attrs.vehicleId||null};ui.toast="";render();
}
function openDocument(kind){
 if(!ui.ticketId||!["requirements","parts","services","payment"].includes(kind))return;
 ui.modal=null;ui.document={ticketId:ui.ticketId,kind};ui.toast="";render();
}
function whatsappText(t){
 const v=c.vehicleFor(d,t),p=c.customerFor(d,t);
 const rows=t.requirements.map((r,index)=>{
  const i=r.itemId?d.inventory.find(x=>x.id===r.itemId):null;
  const price=i&&i.quantity>0?"KES "+(i.sellPrice-r.discount).toLocaleString("en-KE")+
   (r.discount?" (discount KES "+r.discount+")":""):"Not available / customer to source";
  return (index+1)+". "+r.description+" · "+r.quantity+" required · "+price;
 });
 return "SUMMIT AUTO SERVICE (DEMO)\nParts Requirements & Price List\n"+
  "Ticket: "+t.id+"\nVehicle: "+v.plate+" — "+v.name+"\nCustomer: "+p.name+"\n\n"+
  rows.join("\n")+"\n\nAvailable parts are optional purchases. You may bring your own parts."+
  "\nThis is an informational list, not a receipt or an invoice.";
}
function render(){
 const key=[ui.page,ui.ticketId,ui.tab].join(":"),
  scroll=document.scrollingElement?.scrollTop||0,preserve=lastViewKey===key;
 const v=makeViews(d,ui,c);
 const links=v.NAV.map(([id,label,icon])=>'<button class="side-link '+(ui.page===id&&!ui.ticketId?"active":"")+
  '" data-nav="'+id+'"><span aria-hidden="true">'+icon+'</span>'+v.e(label)+'</button>').join("");
 const shade=ui.mobileMenu?'<button class="menu-shade" data-action="close-menu" aria-label="Close navigation"></button>':"";
 root.innerHTML='<div class="garage-shell">'+shade+
 '<aside class="sidebar '+(ui.mobileMenu?"expanded":"")+'">'+
 '<div class="logo"><span class="logo-mark">SA</span><span><strong>Garage Management</strong>'+
 '<small>JoelTechGeek · Web demo</small></span></div>'+
 '<div class="side-group"><span>WORKSPACE</span><nav aria-label="Garage modules">'+links+'</nav></div>'+
 '<div class="sidebar-footer"><strong>Summit Auto Service</strong><small>Fictional garage · Nairobi</small>'+
 '<a href="/demos/garage">← About this demo</a></div></aside>'+
 '<div class="workspace"><header class="topbar"><button class="menu-trigger" data-action="toggle-menu" aria-label="Open navigation">☰</button>'+
 '<div class="topbar-title"><b>Summit Auto Service</b><small>Front desk workspace · Sample records</small></div>'+
 '<div class="topbar-actions"><span class="web-badge">Web demo</span>'+
 v.btn("↻ Reset","reset","","reset-button")+'</div></header>'+
 '<main class="content" id="main-content">'+v.main()+
 '<p class="demo-footnote">Fictional workshop, vehicles, prices and transactions · No real inventory, messages or payments</p>'+
 '</main></div></div>'+v.dialog()+v.documentView()+
 (ui.toast?'<div class="toast" role="status"><span>'+v.e(ui.toast)+'</span>'+
 v.btn("×","dismiss","","toast-dismiss")+'</div>':"");
 if(preserve&&document.scrollingElement)document.scrollingElement.scrollTop=scroll;
 lastViewKey=key;
}
document.addEventListener("click",event=>{
 const el=event.target.closest("[data-nav],[data-tab],[data-action]");
 if(!el||!root.contains(el))return;
 const {nav,tab,action,id,itemId,requirementId,issueId}=el.dataset;
 if(nav){navigate(nav);return;}
 if(tab){if(["overview","diagnosis","requirements","cart","services","billing","history"].includes(tab)&&ui.ticketId){
  ui.tab=tab;ui.toast="";render();
 }return;}
 if(action==="toggle-menu"){ui.mobileMenu=!ui.mobileMenu;render();return;}
 if(action==="close-menu"){ui.mobileMenu=false;render();return;}
 if(action==="dismiss"){ui.toast="";render();return;}
 if(action==="back"){navigate("tickets");return;}
 if(action==="open-ticket"){openTicket(id);return;}
 if(action==="modal"){openModal(id,{itemId,requirementId,issueId});return;}
 if(action==="open-customer"){openModal("customer");return;}
 if(action==="close-modal"){ui.modal=null;ui.toast="";render();return;}
 if(action==="show-document"){openDocument(id);return;}
 if(action==="close-document"){ui.document=null;render();return;}
 if(action==="print"){window.print?.();return;}
 if(action==="whatsapp"){
  const current=d.tickets.find(t=>t.id===id);
  if(!current)return;
  const text=whatsappText(current);
  window.open?.("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
  setToast("WhatsApp message prepared. Choose a recipient and send it yourself.");return;
 }
 if(action==="reset"){
  if(!window.confirm?.("Restore all fictional garage records?"))return;
  d=c.seed();save();ui.page="dashboard";ui.ticketId=null;ui.tab="overview";
  ui.modal=null;ui.document=null;ui.search="";ui.filter="all";ui.mobileMenu=false;
  setToast("Demo records restored.");return;
 }
 if(action==="convert-appointment"){
  change(w=>{
   const a=w.appointments.find(x=>x.id===id);if(!a)throw Error("Appointment unavailable.");
   return c.openTicket(w,{vehicleId:a.vehicleId,complaint:a.concern,appointmentId:a.id});
  },"Appointment converted to a repair ticket.",res=>openState(res.id));return;
 }
 if(action==="request-approval")return void change(w=>c.requestApproval(w,id),"Estimate submitted for customer approval.");
 if(action==="approve")return void change(w=>c.approve(w,id),"Customer approval recorded.");
 if(action==="finish-repair")return void change(w=>c.finishRepair(w,id),"Repair completed · ready for billing.");
 if(action==="invoice")return void change(w=>c.invoiceTicket(w,id),"Ticket invoice posted.");
 if(action==="release")return void change(w=>c.release(w,id),"Vehicle released.");
 if(action==="issue-cart")return void change(w=>c.issueCart(w,id),"Inventory issue confirmed. Stock quantities updated.");
 if(action==="complete-service")return void change(w=>c.completeService(w,ui.ticketId,id),"Service marked complete.");
 if(action==="remove-cart")return void change(w=>c.removeCart(w,ui.ticketId,id),"Cart item removed.");
});
function openState(id){ui.ticketId=id;ui.page="tickets";ui.tab="overview";}
document.addEventListener("change",event=>{
 if(event.target.name==="ticket-filter"&&!ui.ticketId){ui.filter=event.target.value;render();}
});
document.addEventListener("input",event=>{
 if(event.target.id!=="ticket-search"||ui.ticketId)return;
 const value=event.target.value,pos=event.target.selectionStart;
 ui.search=value;render();
 const replacement=document.getElementById("ticket-search");
 if(replacement){replacement.focus();try{replacement.setSelectionRange(pos,pos);}catch(_){}}
});
document.addEventListener("submit",event=>{
 const form=event.target;if(!root.contains(form))return;
 if(form.id!=="garage-form"&&form.id!=="requirements-cart")return;
 event.preventDefault();
 const fd=new FormData(form),p=Object.fromEntries(fd.entries());
 if(form.id==="requirements-cart"){
  if(!ui.ticketId)return;
  const selected=fd.getAll("selected");
  if(!selected.length){setToast("Select at least one available requirement.");return;}
  change(w=>{
   for(const rid of selected){
    const t=c.ticket(w,ui.ticketId),r=t.requirements.find(x=>x.id===rid);
    if(!r?.itemId)throw Error("Only available inventory items can be added.");
    c.addToCart(w,t.id,r.itemId,fd.get("qty-"+rid),r.discount);
   }
  },"Selected requirements added to the ticket cart.");return;
 }
 if(!ui.modal||ui.modal.kind!==form.dataset.kind)return;
 const kind=ui.modal.kind;
 if(kind==="customer"){
  change(w=>c.createCustomerVehicle(w,p),"Customer and vehicle saved.",vehicle=>{
   ui.modal={kind:"ticket",vehicleId:vehicle.id};
  });return;
 }
 if(kind==="ticket"){
  change(w=>c.openTicket(w,p),"Repair ticket opened.",newTicket=>openState(newTicket.id));return;
 }
 if(kind==="appointment")return void change(w=>c.createAppointment(w,p),"Appointment saved.");
 if(kind==="diagnosis")return void change(w=>c.diagnose(w,ui.ticketId,p),"Diagnosis recorded.");
 if(kind==="service")return void change(w=>c.addService(w,ui.ticketId,p),"Service fee added to ticket.");
 if(kind==="requirement"){
  if(p.source==="manual")return void change(w=>c.addRequirement(w,ui.ticketId,{description:p.description,
   quantity:p.quantity,itemId:null,discount:0}),"Customer-sourced requirement recorded.");
  return void change(w=>c.requireInventory(w,ui.ticketId,p.itemId,p.quantity,p.discount),"Inventory-linked requirement added.");
 }
 if(kind==="cart")return void change(w=>c.addToCart(w,ui.ticketId,p.itemId,p.quantity,p.discount),"Inventory item added to ticket cart.");
 if(kind==="receive")return void change(w=>c.receiveCustomerPart(w,ui.ticketId,form.dataset.requirementId,p.quantity),"Customer-provided part received.");
 if(kind==="reject")return void change(w=>c.reject(w,ui.ticketId,p.notes),"Customer rejection recorded.");
 if(kind==="return")return void change(w=>c.returnIssue(w,ui.ticketId,form.dataset.issueId,p.quantity),"Unused part returned. Quantity and charges reversed.");
 if(kind==="item")return void change(w=>c.addInventory(w,p),"Inventory item registered.");
 if(kind==="stock-in")return void change(w=>c.stockIn(w,p.itemId,p.quantity,p.buyPrice,p.sellPrice),"Stock intake recorded.");
 if(kind==="payment")return void change(w=>c.payment(w,ui.ticketId,p),"Sample payment recorded.");
});
document.addEventListener("keydown",event=>{
 if(event.key!=="Escape")return;
 if(ui.document){ui.document=null;render();}
 else if(ui.modal){ui.modal=null;render();}
 else if(ui.mobileMenu){ui.mobileMenu=false;render();}
});
render();
})(garageCore,garageViews);
