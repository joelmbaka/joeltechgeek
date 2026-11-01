const rentalViews=(function(){
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kes=n=>"KES "+Number(n||0).toLocaleString("en-KE",{maximumFractionDigits:2});
const period=s=>{const [y,m]=s.split("-").map(Number);return new Date(y,m-1).toLocaleDateString("en-KE",{month:"long",year:"numeric"})};
const btn=(text,action,id="",variant="")=>'<button type="button" class="btn '+variant+'" data-action="'+action+'" '+(id?'data-id="'+esc(id)+'"':"")+'>'+text+'</button>';
const badge=status=>'<span class="badge '+esc(String(status).toLowerCase().replace(/\s+/g,"-"))+'">'+esc(status)+'</span>';
const pair=(k,v)=>'<div class="pair"><span>'+esc(k)+'</span><strong>'+esc(v??"—")+'</strong></div>';
const panel=(name,content)=>'<section class="panel"><h2>'+esc(name)+'</h2>'+content+'</section>';
const heading=(title,sub="")=>'<div class="heading"><h1>'+esc(title)+'</h1>'+(sub?'<p>'+esc(sub)+'</p>':"")+'</div>';
const empty=(title,message)=>'<div class="empty"><b>'+esc(title)+'</b><p>'+esc(message)+'</p></div>';
const select=(label,id,items,value)=>'<label class="select-wrap">'+esc(label)+'<select id="'+id+'">'+items.map(([key,title])=>'<option value="'+esc(key)+'" '+(String(value)===String(key)?"selected":"")+'>'+esc(title)+'</option>').join("")+'</select></label>';
const input=(label,key,value,type="text",attrs="")=>'<label>'+esc(label)+'<input name="'+key+'" type="'+type+'" value="'+esc(value)+'" '+attrs+' required /></label>';
const formSelect=(label,key,items,value)=>'<label>'+esc(label)+'<select name="'+key+'">'+items.map(([id,text])=>'<option value="'+esc(id)+'" '+(String(id)===String(value)?"selected":"")+'>'+esc(text)+'</option>').join("")+'</select></label>';
return function(d,ui,c){
 const get=(arr,id)=>arr.find(x=>x.id===id);
 const unit=id=>get(d.units,id),tenant=id=>get(d.tenants,id),lease=id=>get(d.leases,id),prop=id=>get(d.properties,id),invoice=id=>get(d.invoices,id),payment=id=>get(d.payments,id);
 const name=id=>id?prop(id)?.name||"Property":"Standalone unit";
 const list=(title,sub,tag,screen,id)=>'<button class="list-card" data-open="'+screen+'" data-id="'+esc(id)+'"><span><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></span><span class="list-end">'+tag+'</span><i>›</i></button>';
 const invoiceCard=i=>'<button class="invoice-card" data-open="invoice" data-id="'+esc(i.id)+'"><div class="card-head"><b>'+esc(tenant(i.tenantId)?.name)+" · "+esc(unit(i.unitId)?.code)+'</b>'+badge(c.status(i))+'</div><p>'+esc(name(i.propertyId))+" · "+esc(period(i.month))+'</p><div class="large-value"><strong>'+kes(c.balance(i))+'</strong><small>'+(c.balance(i)?"Outstanding":"Settled")+'</small></div><div class="card-footer"><span>'+esc(i.reference)+'</span><span>Due '+esc(i.dueDate)+' ›</span></div></button>';
 const paymentCard=p=>'<button class="payment-card" data-open="receipt" data-id="'+esc(p.id)+'"><div class="card-head"><strong>'+kes(p.received)+'</strong>'+badge(p.status)+'</div><b>'+esc(tenant(p.tenantId)?.name)+'</b><p>'+esc(name(p.propertyId))+" · "+esc(unit(p.unitId)?.code)+'</p><small>'+esc(p.method)+' · '+esc(p.reference)+' · '+esc(p.date)+'</small><div class="card-footer"><span>Applied '+kes(p.applied)+(p.credit?" · Credit "+kes(p.credit):"")+'</span><span>Receipt ›</span></div></button>';
 function rent(){
  const m=c.metrics(d),query=ui.search.trim().toLowerCase();
  let invoices=d.invoices.filter(i=>c.balance(i)>0);
  if(ui.status==="overdue")invoices=invoices.filter(i=>c.status(i)==="Overdue");
  if(ui.status==="due")invoices=invoices.filter(i=>c.status(i)!=="Overdue");
  if(ui.month!=="all")invoices=invoices.filter(i=>i.month===ui.month);
  if(ui.property!=="all")invoices=invoices.filter(i=>i.propertyId===(ui.property==="standalone"?null:ui.property));
  if(ui.tenant!=="all")invoices=invoices.filter(i=>i.tenantId===ui.tenant);
  if(query)invoices=invoices.filter(i=>[i.reference,tenant(i.tenantId)?.name,unit(i.unitId)?.code,name(i.propertyId),i.month,String(i.total)].join(" ").toLowerCase().includes(query));
  invoices=invoices.slice().sort((a,b)=>(c.status(a)==="Overdue"?0:1)-(c.status(b)==="Overdue"?0:1)||a.dueDate.localeCompare(b.dueDate));
  const stat=(k,v)=>'<div class="metric"><span>'+k+'</span><strong>'+v+'</strong></div>';
  return heading("Rent overview")+'<div class="search"><span>⌕</span><input id="rent-search" value="'+esc(ui.search)+'" placeholder="Search tenant, property, unit or invoice" aria-label="Search rent"/></div>'+
   panel("Rent position",'<div class="metrics">'+stat("Collected in November",kes(m.collected))+stat("Invoiced in November",kes(m.billed))+stat("Outstanding now",kes(m.outstanding))+stat("Occupancy now",m.occupied+" of "+m.rentable+" units")+'</div>')+
   '<div class="quick-actions">'+btn("＋ Create lease","new-lease",null,"soft")+btn("View payments","open-payments",null,"soft")+'</div>'+
   '<div class="subhead"><h2>Open invoices</h2><p>Balances that still need to be settled.</p></div>'+
   '<div class="filters">'+select("Status","status-filter",[["all","All open"],["due","Due"],["overdue","Overdue"]],ui.status)+
   select("Period","month-filter",[["all","All periods"],["2026-11","November 2026"],["2026-10","October 2026"]],ui.month)+'</div>'+
   '<div class="filters">'+select("Property","property-filter",[["all","All properties"],...d.properties.map(p=>[p.id,p.name]),["standalone","Standalone"]],ui.property)+
   select("Tenant","tenant-filter",[["all","All tenants"],...d.tenants.map(t=>[t.id,t.name])],ui.tenant)+"</div>"+
   '<p class="count">'+invoices.length+' open invoices</p>'+
   (invoices.map(invoiceCard).join("")||empty("No matching invoices","Try changing the filters."));
 }
 function leases(){
  const active=d.leases.filter(l=>l.status==="Active");
  return heading("Leases",active.length+" active agreements")+'<div class="toolbar"><h2>Active leases</h2>'+btn("＋ Add new","new-lease",null,"soft")+'</div>'+
   (active.map(l=>list(unit(l.unitId)?.code,tenant(l.tenantId)?.name+" · "+name(unit(l.unitId)?.propertyId)+" · "+kes(l.rent+l.serviceCharge)+" / month",badge(l.status),"lease",l.id)).join("")||empty("No active leases","Create a lease for a vacant unit."));
 }
 function tenants(){
  return heading("Tenants",d.tenants.length+" tenant records")+
   d.tenants.map(t=>{const l=d.leases.find(x=>x.tenantId===t.id&&x.status==="Active");return list(t.name,t.phone+" · "+(l?unit(l.unitId)?.code+" · "+name(unit(l.unitId)?.propertyId):"No active lease"),l?badge("Active"):"","tenant",t.id)}).join("");
 }
 function portfolio(){
  return heading("Properties",d.properties.length+" properties · "+d.units.length+" total units")+
   d.properties.map(p=>{const units=d.units.filter(u=>u.propertyId===p.id),occupied=units.filter(u=>c.activeLease(d,u.id)).length;
    return '<button class="property-card" data-open="property" data-id="'+esc(p.id)+'"><span class="building">▦</span><span class="property-copy"><b>'+esc(p.name)+'</b><small>'+esc(p.area+", "+p.city)+'</small><span>'+units.length+' units · '+occupied+' occupied · '+(units.length-occupied)+' vacant</span></span><i>›</i></button>';
   }).join("")+
   panel("Standalone units",d.units.filter(u=>!u.propertyId).map(u=>list(u.code,kes(u.rent)+" / month",badge(c.activeLease(d,u.id)?"Occupied":"Vacant"),"unit",u.id)).join(""));
 }
 function invoiceDetails(){
  const i=invoice(ui.id);if(!i||(ui.role==="tenant"&&i.tenantId!==ui.tenantId))return empty("Invoice unavailable","Not found.");
  const bal=c.balance(i),related=d.payments.filter(p=>p.invoiceId===i.id),u=unit(i.unitId),t=tenant(i.tenantId);
  return heading("Invoice",i.reference)+'<div class="invoice-hero"><div class="card-head"><b>'+esc(i.reference)+'</b>'+badge(c.status(i))+'</div><p>'+esc(t?.name)+" · "+esc(u?.code)+'</p><div class="hero-values"><div><small>Amount paid</small><strong>'+kes(i.paid)+'</strong></div><div><small>Outstanding</small><strong>'+kes(bal)+'</strong></div></div></div>'+
   panel("Invoice details",pair("Property",name(i.propertyId))+pair("Unit",u?.code)+pair("Tenant",t?.name)+pair("Phone",t?.phone)+pair("Billing period",period(i.month))+pair("Due date",i.dueDate)+pair("Rent",kes(i.baseRent))+pair("Service charge",kes(i.serviceCharge))+pair("Deposit",kes(i.deposit))+pair("Gross payable",kes(i.total))+pair("Paid",kes(i.paid))+pair("Outstanding",kes(bal)))+
   panel("Payment activity",related.map(p=>list(kes(p.received),p.date+" · "+p.reference,"Receipt","receipt",p.id)).join("")||'<p class="hint">No payment activity recorded yet.</p>')+
   (ui.role==="tenant"?(bal===0?'<div class="settled">✓ Invoice fully paid</div>':'<p class="hint">Payments made to the property manager will appear here once recorded.</p>'):
    bal>0?btn("Record manual payment","new-payment",i.id,"primary full"):'<div class="settled">✓ Invoice fully paid</div>')+
   (ui.role==="manager"?'<p class="hint">Payments are recorded as already received outside this demo; no STK is initiated.</p>':"");
 }
 function propertyDetails(){
  const p=prop(ui.id);if(!p)return empty("Property unavailable","Not found.");
  const units=d.units.filter(u=>u.propertyId===p.id),occupied=units.filter(u=>c.activeLease(d,u.id)).length;
  return heading("Property details",p.name)+panel("Property",pair("Location",p.area+", "+p.city)+pair("Owner",p.owner)+pair("Status",p.status)+pair("Units",units.length)+pair("Occupied",occupied)+pair("Vacant",units.length-occupied))+
   panel("Units",units.map(u=>list(u.code,kes(u.rent+u.serviceCharge)+" / month",badge(c.activeLease(d,u.id)?"Occupied":"Vacant"),"unit",u.id)).join(""));
 }
 function unitDetails(){
  const u=unit(ui.id);if(!u)return empty("Unit unavailable","Not found.");
  const l=c.activeLease(d,u.id),recent=d.invoices.filter(i=>i.unitId===u.id).sort((a,b)=>b.month.localeCompare(a.month))[0];
  return heading("Unit details",u.code)+panel("Unit",pair("Property",name(u.propertyId))+pair("Rent",kes(u.rent))+pair("Service charge",kes(u.serviceCharge))+pair("Occupancy",l?"Occupied":"Vacant"))+
   panel("Lease",l?pair("Tenant",tenant(l.tenantId)?.name)+pair("Reference",l.id)+btn("View lease","go-lease",l.id,"soft full"):
    '<p class="hint">Vacant unit</p>'+btn("Create lease","new-lease",u.id,"primary full"))+
   (recent?panel("Latest invoice",invoiceCard(recent)):"");
 }
 function leaseDetails(){
  const l=lease(ui.id);if(!l||(ui.role==="tenant"&&l.tenantId!==ui.tenantId))return empty("Lease unavailable","Not found.");
  const u=unit(l.unitId);
  return heading("Lease details",u?.code)+panel("Lease",pair("Reference",l.id)+pair("Status",l.status)+pair("Property",name(u?.propertyId))+pair("Unit",u?.code)+pair("Tenant",tenant(l.tenantId)?.name)+pair("Monthly rent",kes(l.rent))+pair("Service charge",kes(l.serviceCharge))+pair("Start date",l.start)+pair("Billing cycle","Monthly"))+
   panel("Related invoices",d.invoices.filter(i=>i.leaseId===l.id).map(invoiceCard).join("")||'<p class="hint">No invoices.</p>');
 }
 function tenantDetails(){
  const t=tenant(ui.id);if(!t)return empty("Tenant unavailable","Not found.");
  const l=d.leases.find(x=>x.tenantId===t.id&&x.status==="Active"),credit=d.credits.filter(x=>x.tenantId===t.id).reduce((n,x)=>n+x.remaining,0);
  return heading("Tenant details",t.name)+panel("Tenant",pair("Phone",t.phone)+pair("Property",l?name(unit(l.unitId)?.propertyId):"—")+pair("Unit",l?unit(l.unitId)?.code:"—")+pair("Lease",l?.id)+pair("Available credit",kes(credit)))+
   panel("Rent invoices",d.invoices.filter(i=>i.tenantId===t.id).map(invoiceCard).join("")||'<p class="hint">No invoices.</p>');
 }
 function payments(){
  const items=d.payments.filter(p=>ui.method==="all"||p.method===ui.method);
  return heading("Payments",d.payments.length+" recorded transactions")+'<div class="mini-summary"><span>Total received</span><b>'+kes(d.payments.reduce((n,x)=>n+x.received,0))+'</b></div>'+
   select("Source","method-filter",[["all","All methods"],["M-Pesa received externally","M-Pesa (external)"],["Bank transfer","Bank transfer"],["Cash","Cash"]],ui.method)+
   (items.map(paymentCard).join("")||empty("No payments","Try another source."));
 }
 function receipt(){
  const p=payment(ui.id);if(!p||(ui.role==="tenant"&&p.tenantId!==ui.tenantId))return empty("Receipt unavailable","Not found.");
  return heading("Receipt",p.receipt)+'<div class="receipt-hero"><span>✓</span><b>Payment received</b><strong>'+kes(p.received)+'</strong><small>'+esc(p.date)+" · "+esc(p.method)+'</small></div>'+
   panel("Allocation",pair("Received",kes(p.received))+pair("Applied to invoice",kes(p.applied))+pair("Credit created",kes(p.credit))+pair("Status",p.status))+
   panel("Transaction",pair("Tenant",tenant(p.tenantId)?.name)+pair("Property",name(p.propertyId))+pair("Unit",unit(p.unitId)?.code)+pair("Invoice",invoice(p.invoiceId)?.reference)+pair("Payment reference",p.reference)+pair("Receipt number",p.receipt)+pair("Receiving account",p.destination))+
   btn("Open invoice","go-invoice",p.invoiceId,"soft full")+'<p class="hint">Fictional receipt; no money was moved.</p>';
 }
 function history(){
  const items=d.invoices.filter(i=>c.balance(i)===0);
  return heading("Settled Invoices",items.length+" paid rent invoices")+(items.map(invoiceCard).join("")||empty("No settled invoices","Fully paid invoices appear here."));
 }
 function expenses(){
  const items=d.expenses.filter(x=>ui.expenseProperty==="all"||x.propertyId===ui.expenseProperty);
  return heading("Expenses","Property operating costs")+'<div class="mini-summary"><span>Expenses in selection</span><b>'+kes(items.reduce((n,x)=>n+x.amount,0))+'</b></div>'+
   '<div class="toolbar">'+select("Property","expense-filter",[["all","All properties"],...d.properties.map(p=>[p.id,p.name])],ui.expenseProperty)+btn("＋ Record expense","new-expense",null,"primary")+'</div>'+
   (items.map(x=>'<article class="expense-card"><span><b>'+esc(x.title)+'</b><small>'+esc(name(x.propertyId))+" · "+esc(x.category)+" · "+esc(x.date)+'</small></span><strong>'+kes(x.amount)+'</strong></article>').join("")||empty("No expenses","Record a fictional expense."));
 }
 function accounting(){
  const s=c.statement(d,ui.accountProperty);
  return heading("Accounting","Read-only illustrative property position")+
   select("Property","account-filter",d.properties.map(p=>[p.id,p.name]),ui.accountProperty)+
   '<div class="overview-banner"><small>Net collections · November 2026</small><strong>'+kes(s.net)+'</strong><span>'+esc(s.property.owner)+'</span></div>'+
   panel("Owner position",pair("Owner",s.property.owner)+pair("Property",s.property.name)+pair("Rent invoiced",kes(s.billed))+pair("Rent collected",kes(s.received))+pair("Outstanding",kes(s.outstanding))+pair("Property expenses",kes(s.expenses))+pair("Net collections",kes(s.net)))+
   panel("Expenses",s.expenseItems.map(x=>pair(x.title,kes(x.amount))).join("")||'<p class="hint">No expenses.</p>')+
   '<p class="hint">A simplified illustrative position; not full accounting journals or owner settlements.</p>';
 }

 function tenantRent(){
  const own=tenant(ui.tenantId),related=d.invoices.filter(i=>i.tenantId===ui.tenantId);
  const active=d.leases.find(l=>l.tenantId===ui.tenantId&&l.status==="Active");
  const open=related.filter(i=>c.balance(i)>0).slice().sort((a,b)=>b.month.localeCompare(a.month));
  const paid=related.filter(i=>c.balance(i)===0).slice().sort((a,b)=>b.month.localeCompare(a.month));
  const outstanding=open.reduce((n,i)=>n+c.balance(i),0);
  return heading("My rent",own?.name+" · "+(active?unit(active.unitId)?.code:"No active unit"))+
   '<div class="overview-banner"><small>Outstanding rent</small><strong>'+kes(outstanding)+'</strong><span>'+esc(active?name(unit(active.unitId)?.propertyId)+" · "+unit(active.unitId)?.code:"Rent overview")+'</span></div>'+
   '<div class="tenant-stats">'+
   '<div><small>Open invoices</small><b>'+open.length+'</b></div>'+
   '<div><small>Paid invoices</small><b>'+paid.length+'</b></div></div>'+
   panel("Open invoices",open.map(invoiceCard).join("")||empty("All caught up","No open rent invoices."))+
   panel("Previous & settled invoices",paid.map(invoiceCard).join("")||empty("No previous payments","Paid invoices will appear here."));
 }
 function tenantPayments(){
  const own=tenant(ui.tenantId),items=d.payments.filter(p=>p.tenantId===ui.tenantId);
  return heading("My payments",own?.name+" · "+items.length+" recorded payments")+
   '<div class="mini-summary"><span>Payments recorded</span><b>'+kes(items.reduce((n,p)=>n+p.received,0))+'</b></div>'+
   (items.map(paymentCard).join("")||empty("No payments yet","Your rent receipts appear when the property manager records payment."));
 }
 function tenantLease(){
  const own=tenant(ui.tenantId),l=d.leases.find(l=>l.tenantId===ui.tenantId&&l.status==="Active");
  if(!l)return heading("My lease")+empty("No active lease","You have no active tenancy on this demo account.");
  const u=unit(l.unitId);
  return heading("My lease",own?.name)+
   panel("Tenancy details",pair("Property",name(u?.propertyId))+pair("Unit",u?.code)+pair("Tenant",own?.name)+
    pair("Lease reference",l.id)+pair("Status",l.status)+pair("Start date",l.start)+
    pair("Monthly rent",kes(l.rent))+pair("Service charge",kes(l.serviceCharge))+
    pair("Total each month",kes(l.rent+l.serviceCharge)))+
   panel("Rent invoices",d.invoices.filter(i=>i.tenantId===ui.tenantId).map(invoiceCard).join("")||empty("No invoices","No invoices are available."));
 }

 const map={rent,leases,tenants,portfolio,invoice:invoiceDetails,property:propertyDetails,unit:unitDetails,lease:leaseDetails,tenant:tenantDetails,payments,receipt,history,expenses,accounting,tenantRent,tenantPayments,tenantLease};
 function form(){
  if(!ui.modal||ui.role!=="manager")return"";
  const {type,id}=ui.modal;let title="",fields="",submit="";
  if(type==="payment"){
   const i=invoice(id);if(!i)return"";
   title="Record manual payment";submit="Record received payment";
   fields='<p class="form-note">'+esc(tenant(i.tenantId)?.name)+" · "+esc(unit(i.unitId)?.code)+" · Outstanding "+kes(c.balance(i))+'</p>'+
    input("Amount received (KES)","amount",c.balance(i),"number",'step="0.01" min="0.01" max="3000000"')+
    formSelect("Received via","method",[["M-Pesa received externally","M-Pesa received externally"],["Bank transfer","Bank transfer"],["Cash","Cash"]],"M-Pesa received externally")+
    formSelect("Received into","destination",d.settlementAccounts.map(a=>[a.name,a.name]),d.settlementAccounts[0].name)+
    input("Transaction date","date","2026-11-01","date")+
    input("Payment reference","reference","","text",'maxlength="70" placeholder="e.g. DEMO-MPESA-1234"')+
    '<p class="form-note">An overpayment becomes tenant credit. No payment gateway is called.</p>';
  }else if(type==="lease"){
   const available=d.units.filter(u=>u.active&&!c.activeLease(d,u.id));
   title="Create lease";submit="Save lease";
   fields=formSelect("Vacant unit","unitId",available.map(u=>[u.id,u.code+" · "+name(u.propertyId)]),id||available[0]?.id)+
    input("Tenant name","name","","text",'maxlength="90" placeholder="Tenant full name"')+
    input("Tenant phone","phone","0722000066","tel",'maxlength="10"')+
    input("Lease start","start","2026-11-01","date")+
    input("Monthly rent (KES)","rent",unit(id||available[0]?.id)?.rent||22000,"number",'step="0.01" min="0.01"')+
    input("Service charge (KES)","serviceCharge",unit(id||available[0]?.id)?.serviceCharge||0,"number",'step="0.01" min="0"')+
    formSelect("First invoice","createInvoice",[["yes","Generate November invoice"],["no","Skip first invoice"]],"yes");
  }else if(type==="expense"){
   title="Record property expense";submit="Save expense";
   fields=formSelect("Property","propertyId",d.properties.map(p=>[p.id,p.name]),d.properties[0].id)+
    input("Expense","title","Water tank cleaning","text",'maxlength="90"')+
    formSelect("Category","category",[["Maintenance","Maintenance"],["Utilities","Utilities"],["Repairs","Repairs"],["Other","Other"]],"Maintenance")+
    input("Amount (KES)","amount",3500,"number",'step="0.01" min="0.01"')+
    input("Date","date","2026-11-01","date");
  }
  return '<div class="modal-overlay"><button class="modal-backdrop" data-action="close-modal" aria-label="Close dialog"></button><section class="modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><header><h2>'+esc(title)+'</h2>'+btn("×","close-modal",null,"icon")+'</header>'+
   '<div class="modal-body"><form id="property-form" data-type="'+type+'" data-id="'+esc(id||"")+'"><div class="fields">'+fields+'</div><button class="btn primary full" type="submit">'+submit+'</button></form></div></section></div>';
 }
 return {page:()=>((map[ui.screen||ui.tab]||rent)()),form,btn,esc};
};
})();
