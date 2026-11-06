/* Garage Management System · JoelTechGeek desktop-first views */
const garageViews=(function(){
"use strict";
const e=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const kes=v=>"KES "+Number(v||0).toLocaleString("en-KE",{maximumFractionDigits:2});
const NAV=[["dashboard","Dashboard","◫"],["appointments","Appointments","◷"],["tickets","Tickets","▤"],["vehicles","Customers & Vehicles","▰"],["inventory","Inventory","▣"],["reports","Reports","◩"]];
const btn=(label,action,id="",style="",extra="")=>'<button type="button" class="btn '+style+'" data-action="'+e(action)+'" '+(id?'data-id="'+e(id)+'"':"")+' '+extra+'>'+label+'</button>';
const tag=v=>'<span class="tag '+String(v).toLowerCase().replace(/[^a-z0-9]+/g,"-")+'">'+e(v)+'</span>';
const panel=(heading,body)=>'<section class="panel"><header class="panel-head"><h2>'+e(heading)+'</h2></header>'+body+'</section>';
const heading=(h,desc,action="")=>'<div class="page-head"><div><h1>'+e(h)+'</h1><p>'+e(desc)+'</p></div>'+action+'</div>';
const metric=(label,value,info)=>'<div class="metric"><small>'+e(label)+'</small><strong>'+e(value)+'</strong><span>'+e(info)+'</span></div>';
const empty=(label,info)=>'<div class="empty"><b>'+e(label)+'</b><p>'+e(info)+'</p></div>';
const pair=(k,v)=>'<div class="pair"><span>'+e(k)+'</span><strong>'+e(v??"—")+'</strong></div>';
const tablerow=cells=>'<tr>'+cells.map(x=>'<td>'+x+'</td>').join("")+'</tr>';
const table=(head,body)=>'<div class="table-wrap"><table><thead><tr>'+head.map(h=>'<th>'+e(h)+'</th>').join("")+'</tr></thead><tbody>'+body+'</tbody></table></div>';
const field=(label,name,value="",props="")=>'<label class="field"><span>'+e(label)+'</span><input name="'+name+'" value="'+e(value)+'" '+props+' required></label>';
const area=(label,name,value="")=>'<label class="field"><span>'+e(label)+'</span><textarea name="'+name+'" rows="4" maxlength="550" required>'+e(value)+'</textarea></label>';
const select=(label,name,options,chosen)=>'<label class="field"><span>'+e(label)+'</span><select name="'+name+'">'+options.map(o=>{
 const [value,txt]=Array.isArray(o)?o:[o,o];return '<option value="'+e(value)+'" '+(value===chosen?"selected":"")+'>'+e(txt)+'</option>';
}).join("")+'</select></label>';
const numberField=(label,name,value=1,props='type="number" min="1" step="1"')=>field(label,name,value,props);
const priceField=(label,name,value=0)=>numberField(label,name,value,'type="number" min="0" step="0.01"');
return function(d,ui,c){
 const t=ui.ticketId?d.tickets.find(x=>x.id===ui.ticketId):null;
 const inv=id=>d.inventory.find(i=>i.id===id),veh=id=>d.vehicles.find(v=>v.id===id);
 const vehicleName=v=>v.plate+" · "+v.name;
 function ticketRow(t){const v=c.vehicleFor(d,t),o=c.customerFor(d,t);return tablerow([
  '<b>'+e(t.id)+'</b><small>'+e(t.openedAt)+'</small>',
  '<b>'+e(v.plate)+'</b><small>'+e(v.name+" · "+o.name)+'</small>',
  tag(c.status(t)),btn("Open ›","open-ticket",t.id,"outline compact")]);}
 const ticketTable=list=>list.length?table(["Ticket","Vehicle / customer","Status",""],list.map(ticketRow).join("")):
  empty("No matching tickets","Search another registration or open a new ticket.");
 function history(ticketId=null){const rows=d.events.filter(x=>!ticketId||x.ticketId===ticketId).slice(0,15);
  return rows.length?rows.map(x=>'<div class="event"><span class="event-dot"></span><div><b>'+e(x.message)+'</b>'+
   '<small>'+e(x.at)+" · "+e(x.ticketId)+'</small></div></div>').join(""):empty("No activity","Recorded actions appear here.");
 }
 function dashboard(){const m=c.metrics(d),active=d.tickets.filter(t=>t.status!=="released");
  return heading("Garage overview","Vehicles and repairs · fictional workshop records.",btn("＋ Create ticket","modal","ticket","primary"))+
   '<div class="metrics">'+metric("Vehicles in workshop",m.active,"Open tickets")+metric("Awaiting approval",m.awaitingApproval,"Customer decision pending")+
    metric("Awaiting parts",m.awaitingParts,"Items customer needs to bring")+metric("Repairs in progress",m.inRepair,"Authorized work")+'</div>'+
   panel("Workshop tickets",ticketTable(active.slice(0,6)));
 }
 function tickets(){let rows=d.tickets;
  if(ui.filter&&ui.filter!=="all")rows=rows.filter(x=>x.status===ui.filter);
  if(ui.search){const q=ui.search.toLowerCase();rows=rows.filter(x=>
   [x.id,x.complaint,c.vehicleFor(d,x).plate,c.vehicleFor(d,x).name,c.customerFor(d,x).name].some(v=>String(v).toLowerCase().includes(q)));}
  return heading("Repair tickets","Manage each vehicle from reception through release.",btn("＋ Create ticket","modal","ticket","primary"))+
   '<div class="toolbar"><label class="field search"><span>Search</span><input id="ticket-search" placeholder="Ticket, registration or customer" value="'+e(ui.search||"")+'"/></label>'+
    select("Status","ticket-filter",[["all","All statuses"],...Object.entries(c.STATES).map(([k,v])=>[k,v])],ui.filter||"all")+'</div>'+
   panel(rows.length+" tickets",ticketTable(rows));
 }
 function appointments(){const ap=d.appointments.filter(a=>c.activeAppointment(a)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return heading("Appointments","Upcoming bookings awaiting arrival and ticket creation.",btn("＋ New appointment","modal","appointment","primary"))+
   panel("Active appointments",ap.length?table(["Date · Time","Vehicle","Reported service need","Status",""],ap.map(a=>{
    const v=veh(a.vehicleId);
    return tablerow(['<b>'+e(a.date+" · "+a.time)+'</b>','<b>'+e(v.plate)+'</b><small>'+e(v.name)+'</small>',
      e(a.concern),tag(a.status),btn("Create ticket","convert-appointment",a.id,"primary compact")]);
   }).join("")):empty("No active appointments","New bookings appear here until a ticket is created."))+
   '<p class="footnote">Creating a ticket removes the appointment from this active list; the booking remains linked to the ticket for history.</p>';
 }
 function vehicles(){return heading("Customers & vehicles","Register customers first, then assign vehicles to an existing customer.")+
  '<div class="section-heading"><h2>Customers <span class="section-count">'+d.customers.length+'</span></h2>'+btn("＋ Add customer","modal","customer","primary")+'</div>'+
  panel("Customer directory",d.customers.length?table(["Customer","Phone","Vehicles owned"],d.customers.map(o=>{
   const owned=d.vehicles.filter(v=>v.customerId===o.id);
   return tablerow(['<b>'+e(o.name)+'</b>',e(o.phone),e(owned.length)+
    (owned.length?'<small>'+owned.map(v=>e(v.plate)).join(", ")+'</small>':"")]);
  }).join("")):empty("No customers yet","Add a customer before registering a vehicle."))+
  '<div class="section-heading"><h2>Vehicles <span class="section-count">'+d.vehicles.length+'</span></h2>'+
   btn("＋ Add vehicle","modal","vehicle","primary",d.customers.length?"":'disabled title="Add a customer first"')+'</div>'+
  panel("Registered vehicles",d.vehicles.length?table(["Registration","Owner","Contact","Previous tickets"],d.vehicles.map(v=>{
   const o=d.customers.find(x=>x.id===v.customerId),ts=d.tickets.filter(x=>x.vehicleId===v.id);
   return tablerow(['<b>'+e(v.plate)+'</b><small>'+e(v.name+" · "+v.year+" · "+v.mileage.toLocaleString()+" km")+'</small>',
    e(o?.name||"Unknown owner"),e(o?.phone||"—"),ts.length?ts.map(x=>btn(x.id,"open-ticket",x.id,"outline compact")).join(" "):"—"]);
  }).join("")):empty("No vehicles yet","Add a vehicle and choose its owner from registered customers."));}
 function inventory(){const m=c.metrics(d);return heading("Inventory","Minimal inventory: stock intake, issue to ticket, and returns.",
  '<div class="head-actions">'+btn("＋ New item","modal","item","outline")+btn("＋ Stock in","modal","stock-in","primary")+'</div>')+
  '<div class="metrics three">'+metric("Parts registered",d.inventory.length,"Inventory items")+
   metric("Low / out of stock",m.lowStock,"Two units or less")+metric("Stock movements",d.movements.length,"Intake, issues and returns")+'</div>'+
  panel("Stock on hand",table(["Part","Available","Buying price","Selling price",""],d.inventory.map(i=>tablerow([
   '<b>'+e(i.name)+'</b><small>'+e(i.id)+'</small>',tag(i.quantity===0?"Out of stock":i.quantity<=2?"Low stock":i.quantity+" units"),
   kes(i.buyPrice),kes(i.sellPrice),btn("Stock in","modal","stock-in","outline compact",'data-item-id="'+e(i.id)+'"')
  ])).join("")))+
  panel("Recent movements",table(["Date","Part","Type","Quantity","Ticket"],d.movements.slice(0,20).map(x=>tablerow([
   e(x.at),e(inv(x.itemId)?.name||"Unknown"),tag(x.kind),e(x.quantity>0?"+"+x.quantity:x.quantity),
   x.ticketId?btn(x.ticketId,"open-ticket",x.ticketId,"text compact"):"—"
  ])).join("")));}
 function reports(){const m=c.metrics(d),billed=d.tickets.filter(x=>x.invoice);
  return heading("Reports","Revenue and parts costs are based on posted invoices and confirmed inventory issues.")+
   '<div class="metrics">'+metric("Invoiced revenue",kes(m.revenue),"Parts + completed services")+
    metric("Collected",kes(m.collected),"Recorded sample payments")+
    metric("Outstanding",kes(m.outstanding),"Invoice balances")+
    metric("Gross contribution",kes(m.contribution),"Before operating expenses")+'</div>'+
   panel("Invoiced tickets",table(["Ticket","Vehicle","Service charges","Parts charges","Parts cost","Contribution"],billed.map(x=>{
    const a=c.charges(x);return tablerow([btn(x.id,"open-ticket",x.id,"text"),e(c.vehicleFor(d,x).plate),
     kes(a.services),kes(a.parts),kes(a.cost),'<b>'+kes(a.contribution)+'</b>']);
   }).join("")))+
   panel("Operational overview",pair("Active tickets",m.active)+pair("Released vehicles",m.released)+
    pair("Pending approvals",m.awaitingApproval)+pair("Pending customer parts",m.awaitingParts))+
   '<p class="footnote">Gross contribution excludes staff wages, taxes, rent, utilities and other overhead. It is not net profit.</p>';
 }
 const TABS=[["overview","Overview"],["diagnosis","Diagnosis & Estimate"],["cart","Parts cart"],["billing","Billing"],["history","History"]];
 function stageLock(tab){
  if(tab==="cart"&&!["awaiting-parts","in-repair","ready-for-billing","invoiced","released"].includes(t.status)){
   return {title:"Customer approval required",reason:"Finish the diagnosis, prepare the service and parts estimate, and record the customer's approval before handling inventory.",cta:"Go to Diagnosis & Estimate",target:"diagnosis"};
  }
  if(tab==="billing"&&!["ready-for-billing","invoiced","released","rejected","cannot-repair"].includes(t.status)){
   if(t.status==="open"||t.status==="estimating"||t.status==="awaiting-approval")
    return {title:"Finish diagnosis and approval first",reason:"Complete the estimate and record the customer's decision before billing can begin.",cta:"Go to Diagnosis & Estimate",target:"diagnosis"};
   return {title:"Finish the repair first",reason:"Issue or receive the required parts, complete services and mark the repair finished before creating an invoice.",cta:"Go to Parts Cart",target:"cart"};
  }
  return null;
 }
 function lockedStage(lock){
  return '<section class="stage-lock" role="status" aria-label="'+e(lock.title)+'"><div class="stage-lock-icon" aria-hidden="true">'+
   '<svg viewBox="0 0 64 64" width="76" height="76" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">'+
   '<rect x="13" y="27" width="38" height="31" rx="7"/><path d="M21 27v-9a11 11 0 0 1 22 0v9"/><circle cx="32" cy="41" r="2.5"/><path d="M32 44v5"/></svg></div>'+
   '<span class="stage-lock-eyebrow">NEXT STEP REQUIRED</span><h2>'+e(lock.title)+'</h2><p>'+e(lock.reason)+'</p>'+
   '<button type="button" class="btn primary" data-tab="'+e(lock.target)+'">'+e(lock.cta)+'</button></section>';
 }
  function actions(t){let a=[];
  if(t.status==="open")a.push(btn("Record diagnosis","modal","diagnosis","primary"));
  if(t.status==="estimating")a.push(btn("Request customer approval","request-approval",t.id,"primary"));
  if(t.status==="awaiting-approval")a.push(btn("Customer approved","approve",t.id,"primary"),btn("Customer rejected","modal","reject","outline"));
  if(t.status==="in-repair")a.push(btn("Complete repair","finish-repair",t.id,"primary"));
  if(["ready-for-billing","rejected","cannot-repair"].includes(t.status))a.push(btn("Create invoice","invoice",t.id,"primary"));
  if(["rejected","cannot-repair"].includes(t.status)&&c.charges(t).total===0)a.push(btn("Release vehicle","release",t.id,"outline"));
  if(t.status==="invoiced")a.push(c.charges(t).outstanding>0?btn("Record payment","modal","payment","primary"):btn("Release vehicle","release",t.id,"primary"));
  return a.join("");
 }
 function overview(){const v=c.vehicleFor(d,t),o=c.customerFor(d,t),a=c.charges(t);
  return '<div class="columns two">'+panel("Vehicle & customer",pair("Registration",v.plate)+pair("Model",v.name)+
   pair("Year",v.year)+pair("Mileage",v.mileage.toLocaleString()+" km")+pair("Customer",o.name)+pair("Phone",o.phone))+
   panel("Ticket financials",pair("Completed services",kes(a.services))+pair("Confirmed parts",kes(a.parts))+
    pair("Inventory cost",kes(a.cost))+pair("Gross contribution",kes(a.contribution))+
    pair("Collected",kes(a.collected))+pair("Balance",t.invoice?kes(a.outstanding):"Not invoiced"))+'</div>'+
   panel("Reported issue",'<p class="paragraph">'+e(t.complaint)+'</p>')+
   panel("Next action",'<p class="hint">'+e({
    open:"Inspect the vehicle and record diagnosis.",estimating:"Add service fees and required parts, then request approval.",
    "awaiting-approval":"Contact the customer and record approval or rejection.",
    "awaiting-parts":"Record customer-provided parts, or issue selected parts from available inventory.",
    "in-repair":"Mark services completed and confirm any remaining inventory issues.",
    "ready-for-billing":"Complete the invoice and payment.","cannot-repair":"Bill any agreed diagnosis fee or release directly.",
    rejected:"Repairs declined. Settle any agreed diagnosis fee or release.","invoiced":"Collect outstanding payment before release.",
    released:"Vehicle has been released and the ticket is read-only."
   }[t.status])+'</p>'+actions(t))+panel("Recent ticket activity",history(t.id));
 }
 
 function diagnosis(){
  const x=t.diagnosis;
  const first=panel("1 · Inspection findings",x?pair("Repair possible",x.feasible?"Yes":"No")+
   '<div class="note"><b>Findings</b><p>'+e(x.findings)+'</p></div>'+pair("Recorded",x.at):
   '<p class="hint">Inspect the vehicle and record whether the workshop can perform the repair.</p>'+
   btn("Record diagnosis","modal","diagnosis","primary"));
  const estimate=services()+requirements()+
   (x&&!x.feasible?'<p class="hint">Repair unavailable: only an agreed diagnosis fee can be billed. Parts requirements are read-only.</p>':"");
  const decision=t.approval?.decision==="Approved"?'Customer approved the estimate. Authorized repair work can proceed.':
   t.approval?.decision==="Rejected"?'Customer rejected the proposed repair. Only agreed diagnosis fees may be billed.':
   t.status==="awaiting-approval"?'Waiting for customer approval or rejection. Inventory cannot be issued until approved.':
   t.status==="estimating"?'Add the proposed service and parts lines, then request customer approval.':
   t.status==="open"?'Record inspection findings to enable service and parts estimates.':
   ["cannot-repair"].includes(t.status)?'Repair unavailable; record the agreed diagnosis fee, if any, and proceed to billing or release.':
   'Approval and repair history remain attached to this ticket.';
  const controls=t.status==="open"?'<button type="button" class="btn primary" disabled title="Record inspection findings first">Request customer approval</button>':
   t.status==="estimating"?btn("Request customer approval","request-approval",t.id,"primary"):
   t.status==="awaiting-approval"?btn("Customer approved","approve",t.id,"primary")+btn("Customer rejected","modal","reject","outline"):"";
  const work=["awaiting-parts","in-repair"].includes(t.status)?
   '<div class="stage-next"><b>Repair execution</b><p>Mark authorized services complete here. Use Parts Cart to record customer-provided parts and issue inventory.</p>'+
   (t.status==="in-repair"?btn("Complete repair","finish-repair",t.id,"primary"):'<span>Waiting for required parts before repair can finish.</span>')+'</div>':"";
  return '<div class="workflow-heading"><h2>Diagnosis & Estimate</h2><p>Inspection, service fees, parts requirements and customer decision in one place.</p></div>'+
   first+estimate+panel("4 · Customer approval",'<p class="hint">'+e(decision)+'</p><div class="head-actions">'+controls+'</div>')+work;
 }
 function requirements(){
  const editable=["estimating","awaiting-approval","awaiting-parts","in-repair","ready-for-billing"].includes(t.status)&&!t.invoice;
  const rows=t.requirements.map(r=>{
   const i=r.itemId?inv(r.itemId):null,issued=i?c.issuedQty(t,i.id):0;
   const missing=Math.max(0,r.quantity-r.customerProvided-issued);
   return tablerow(['<b>'+e(r.description)+'</b><small>'+e(r.id)+'</small>',e(r.quantity),
    tag(i?(i.quantity>0?i.quantity+" in stock":"Out of stock"):"Customer to source"),
    i?kes(i.sellPrice-r.discount):"—",
    '<b>'+e(missing)+'</b><small>'+e(r.customerProvided)+" provided · "+e(issued)+" issued</small>"]);
  }).join("");
  return '<div class="sub-head"><div><h2>3 · Parts Requirements & Price List</h2><p>What is needed, what the garage can offer and what the customer may provide.</p></div>'+
   '<div class="head-actions">'+(editable?btn("＋ Add part","modal","requirement","outline"):t.status==="open"?'<button type="button" class="btn outline" disabled title="Record inspection findings first">＋ Add part</button>':"")+
   (t.requirements.length?btn("View / share list","show-document","requirements","primary"):"")+'</div></div>'+
   panel("Required parts · "+t.requirements.length,t.requirements.length?
    table(["Part","Needed","Availability","Our unit offer","Outstanding"],rows):
    empty("No parts requirements","Add catalogue parts or enter a custom part not in inventory."))+
   '<p class="footnote">This is an informational list, not an inventory issue or an invoice.</p>';
 }
 function requirementPicker(){
  const allowed=["awaiting-parts","in-repair"].includes(t.status);
  if(!allowed||!t.requirements.length)return "";
  const rows=t.requirements.map(r=>{
   const i=r.itemId?inv(r.itemId):null;
   const missing=Math.max(0,r.quantity-r.customerProvided-(i?c.issuedQty(t,i.id):0));
   if(missing===0)return tablerow([e(r.description),tag("Fulfilled"),"—"]);
   const quantity=i?Math.min(i.quantity,missing):0;
   const action=i&&quantity>0?
    '<label class="req-check"><input type="checkbox" name="selected" value="'+e(r.id)+'" /> Select</label>'+
    '<input class="quantity-mini" type="number" name="qty-'+e(r.id)+'" min="1" max="'+e(quantity)+'" value="'+e(quantity)+'" aria-label="Quantity for '+e(r.description)+'" />':
    btn("Mark customer part received","modal","receive","outline compact",'data-requirement-id="'+e(r.id)+'"');
   return tablerow(['<b>'+e(r.description)+'</b><small>'+e(missing)+' outstanding</small>',
    tag(i?(i.quantity>0?i.quantity+" in stock":"Out of stock"):"Customer sourced"),action]);
  }).join("");
  return panel("Select from parts requirements",'<form id="requirements-cart">'+
   table(["Required part","Availability","Action"],rows)+
   '<div class="form-footer"><span>Only selected inventory items enter the cart. Customer-provided items do not affect stock.</span>'+
   '<button type="submit" class="btn primary">Add selected to cart</button></div></form>');
 }
 function cart(){
  const allowed=["awaiting-parts","in-repair"].includes(t.status),returnAllowed=allowed||t.status==="ready-for-billing";
  const pending=t.cart.map(row=>{
   const i=inv(row.itemId);
   return tablerow([e(i.name),e(row.quantity),kes(row.unitPrice),kes(row.discount),
    kes((row.unitPrice-row.discount)*row.quantity),allowed?btn("Remove","remove-cart",row.id,"danger-text compact"):"—"]);
  }).join("");
  const issued=t.issues.map(row=>{
   const returned=t.returns.filter(x=>x.issueId===row.id).reduce((sum,x)=>sum+x.quantity,0);
   return tablerow([e(row.name),e(row.quantity-returned)+" / "+e(row.quantity),kes(row.unitPrice-row.discount),
    kes((row.quantity-returned)*(row.unitPrice-row.discount)),returnAllowed?
    btn("Return unused","modal","return","outline compact",'data-issue-id="'+e(row.id)+'"'):"—"]);
  }).join("");
  return '<div class="sub-head"><div><h2>Ticket parts cart</h2><p>Add from requirements, or directly from available inventory.</p></div>'+
   (allowed?btn("＋ Add from inventory","modal","cart","primary"):"")+'</div>'+
   requirementPicker()+panel("Pending cart",pending?table(["Part","Qty","Unit price","Discount per unit","Total",""],pending)+
    '<div class="form-footer"><b>'+kes(t.cart.reduce((s,x)=>s+(x.unitPrice-x.discount)*x.quantity,0))+'</b>'+
     (allowed?btn("Confirm issue & deduct inventory","issue-cart",t.id,"primary"):"")+'</div>':
    empty("No cart items","Check available requirements or select any inventory item, even one not on the list."))+
   panel("Confirmed inventory issues",issued?table(["Part","Net / issued quantity","Net unit price","Net total",""],issued):
    empty("No inventory issued","Only confirmed issues count as inventory consumption."))+
   '<p class="footnote">Add to cart has no stock effect. Confirm Issue deducts inventory. Returns restore quantity and reverse charges before invoicing.</p>';
 }
 
 function services(){
  const canAdd=["estimating","awaiting-approval","awaiting-parts","in-repair","ready-for-billing","cannot-repair"].includes(t.status)&&!t.invoice;
  const canComplete=["awaiting-parts","in-repair"].includes(t.status);
  const rows=t.services.map(l=>tablerow([
   '<b>'+e(l.description)+'</b><small>'+e(l.kind==="diagnosis"?"Diagnosis fee":"Repair service")+'</small>',
   e(l.quantity),kes(l.unitPrice),kes(l.discount),kes((l.unitPrice-l.discount)*l.quantity),
   l.done?tag("Completed"):canComplete?btn("Mark complete","complete-service",l.id,"outline compact"):tag("Proposed")
  ])).join("");
  return '<div class="sub-head"><div><h2>2 · Services & labour estimate</h2><p>Add repair and inspection fees. Mark services complete only after approval.</p></div>'+
   (canAdd?btn("＋ Add service fee","modal","service","primary"):t.status==="open"?'<button type="button" class="btn primary" disabled title="Record inspection findings first">＋ Add service fee</button>':"")+'</div>'+
   panel("Service lines · "+t.services.length,t.services.length?table(["Service","Qty","Fee / unit","Discount","Amount","State"],rows):
    empty("No service fees yet","Add the proposed repair services or a diagnostic fee."))+
   '<p class="footnote">Changing the approved scope requires renewed customer authorization.</p>';
 }
 function billing(){
  const a=c.charges(t),parts=t.issues.map(i=>{
   const returned=t.returns.filter(r=>r.issueId===i.id).reduce((sum,r)=>sum+r.quantity,0);
   return {...i,netQty:i.quantity-returned};
  }).filter(i=>i.netQty>0);
  return '<div class="columns two">'+panel("Ticket financials",
    pair("Completed services",kes(a.services))+pair("Confirmed parts sales",kes(a.parts))+
    pair("Inventory cost",kes(a.cost))+pair("Gross contribution",kes(a.contribution))+
    pair("Invoice",t.invoice?t.invoice.id:"Not posted")+
    pair("Invoice total",t.invoice?kes(t.invoice.total):"—")+
    pair("Collected",kes(a.collected))+pair("Outstanding",t.invoice?kes(a.outstanding):"—"))+
   panel("Payment & invoice",
    t.invoice?'<div class="success-line">Invoice '+e(t.invoice.id)+" · "+e(t.invoice.at)+'</div>'+
      (a.outstanding>0?btn("Record payment","modal","payment","primary"):tag("Fully paid"))+
      '<div class="head-actions spaced">'+btn("Service invoice","show-document","services","outline")+
       btn("Payment receipt","show-document","payment","outline")+'</div>':
     '<p class="hint">Create an invoice after repairs complete, customer rejection or an unsuccessful diagnosis.</p>'+
      (["ready-for-billing","rejected","cannot-repair"].includes(t.status)?btn("Create invoice","invoice",t.id,"primary"):"")
    )+'</div>'+
   panel("Parts receipt · confirmed issues only",parts.length?
    table(["Item","Net issued quantity","Unit price","Discount / unit","Line total"],parts.map(i=>tablerow([
     e(i.name),e(i.netQty),kes(i.unitPrice),kes(i.discount),kes(i.netQty*(i.unitPrice-i.discount))
    ])).join(""))+'<div class="form-footer"><b>'+kes(a.parts)+'</b>'+
    btn("View parts receipt","show-document","parts","outline")+'</div>':
    empty("No parts issued","The receipt contains only stock actually issued against this ticket."))+
   panel("Payment records",t.payments.length?table(["Recorded","Method","Amount"],t.payments.map(x=>tablerow([
    e(x.at),e(x.method),kes(x.amount)])).join("")):empty("No payment records","Record payments after invoicing."))+
   (t.status==="released"?'<div class="release-banner">✓ Vehicle released · '+e(t.release?.reason)+'</div>':
   '<div class="release-bar">'+((t.status==="invoiced"&&a.outstanding<=0)||(["rejected","cannot-repair"].includes(t.status)&&a.total===0)?
    btn("Release vehicle","release",t.id,"primary"):
    '<button type="button" class="btn primary" disabled title="Settle the invoice or complete the applicable closure first">Release vehicle</button>')+
   '<span>Vehicle release requires the appropriate ticket closure and payment settlement.</span></div>');
 }

 function ticketView(){if(!t)return empty("Ticket unavailable","Select a ticket.");
  const v=c.vehicleFor(d,t),o=c.customerFor(d,t),lock=stageLock(ui.tab);
  return '<div class="breadcrumb">'+btn("← Tickets","back","","text")+e(t.id)+'</div>'+
   '<div class="ticket-hero"><div><span class="eyebrow">REPAIR TICKET · '+e(t.id)+'</span><h1>'+e(v.name)+'</h1>'+
    '<p>'+e(v.plate+" · "+o.name+" · "+o.phone)+'</p></div>'+tag(c.status(t))+'</div>'+
   '<div class="ticket-actions">'+actions(t)+'</div>'+
   '<nav class="ticket-tabs" aria-label="Ticket sections">'+TABS.map(([id,label])=>
    '<button class="'+(ui.tab===id?"active":"")+(stageLock(id)?" locked-tab":"")+
    '" data-tab="'+id+'" aria-current="'+(ui.tab===id?"page":"false")+
    '" title="'+e(stageLock(id)?.title||"Available")+'">'+(stageLock(id)?'<span aria-hidden="true">🔒 </span>':"")+e(label)+'</button>').join("")+'</nav>'+
   '<div class="ticket-content">'+(lock?lockedStage(lock):({
    overview,diagnosis,cart,billing,history:()=>panel("Ticket timeline",history(t.id))
   }[ui.tab]||overview)())+'</div>';
 }
 function main(){if(t)return ticketView();
  return ({dashboard,tickets,appointments,vehicles,inventory,reports}[ui.page]||dashboard)();}
 
 function dialog(){
  if(!ui.modal)return"";
  const m=ui.modal,kind=m.kind;let title="",body="",submit="Save";
  if(kind==="customer"){
   title="Add customer";submit="Save customer";
   body=field("Customer name","name")+
    field("Phone","phone","","placeholder=\"07XX XXX XXX\"");
  }else if(kind==="vehicle"){
   title="Add vehicle";submit="Save vehicle";
   body=select("Owner","customerId",d.customers.map(o=>[o.id,o.name+" · "+o.phone]),m.customerId||d.customers[0]?.id)+
    '<div class="form-grid">'+field("Registration","plate","","placeholder=\"KDW 700J\"")+
    field("Make and model","model","","placeholder=\"Toyota Fielder\"")+
    numberField("Year","year",2016,'type="number" min="1970" max="2030" step="1"')+
    numberField("Mileage (km)","mileage",80000,'type="number" min="0" step="1"')+'</div>';
  }else if(kind==="ticket"){
   title="Create repair ticket";submit="Create ticket";
   const options=d.vehicles.filter(v=>!d.tickets.some(t=>t.vehicleId===v.id&&t.status!=="released")&&
    !d.appointments.some(a=>a.vehicleId===v.id&&c.activeAppointment(a))).map(v=>[v.id,vehicleName(v)]);
   body=options.length?select("Vehicle","vehicleId",options,m.vehicleId||options[0]?.[0])+
    area("Customer complaint","complaint"):
    '<p class="hint">No vehicles are available for a new ticket. Vehicles with active appointments must be handled from Appointments; vehicles with active tickets cannot be added again.</p>';
  }else if(kind==="appointment"){
   title="New appointment";submit="Save appointment";
   body=select("Vehicle","vehicleId",d.vehicles.map(v=>[v.id,vehicleName(v)]),d.vehicles[0]?.id)+
    '<div class="form-grid">'+field("Date","date","2026-11-07",'type="date"')+
    field("Time","time","10:00",'type="time"')+'</div>'+
    area("Reported service need","concern");
  }else if(kind==="diagnosis"){
   title="Record diagnosis";submit="Save diagnosis";
   body=area("Inspection findings","findings")+
    select("Can this workshop perform the repair?","feasible",[["yes","Yes — prepare an estimate"],["no","No — release or charge diagnosis"]],"yes");
  }else if(kind==="service"){
   title="Add a service fee";submit="Add service";
   body=field("Service description","description","","placeholder=\"e.g. Brake system repair\"")+
    '<div class="form-grid">'+numberField("Quantity","quantity",1)+
    priceField("Unit fee (KES)","unitPrice",1500)+priceField("Discount / unit (KES)","discount",0)+
    select("Fee type","kind",[["repair","Repair / labour"],["diagnosis","Diagnosis / inspection"]],"repair")+'</div>'+
    '<p class="hint">Adding a service after approval requires renewed customer approval.</p>';
  }else if(kind==="requirement"){
   title="Add parts requirement";submit="Add required part";
   body=select("Part name","partChoice",d.inventory.map(i=>[i.id,i.name]).concat([["custom","Not in catalogue — enter part name"]]),d.inventory[0]?.id||"custom")+
    '<div id="custom-part-field" hidden>'+field("New part name","description","","placeholder='e.g. Rear bumper' maxlength='140' disabled")+'</div>'+
    select("Source","source",[["inventory","From garage inventory"],["manual","Customer to source / provide"]],"inventory")+
    '<div class="form-grid">'+numberField("Quantity required","quantity",1)+
    '<div id="requirement-discount">'+priceField("Discount per unit (KES)","discount",0)+'</div></div>'+
    '<p id="requirement-source-note" class="hint">Catalogue items can be offered from inventory or sourced by the customer. Items not in the catalogue remain informational and do not create inventory stock.</p>'+
    '<p class="hint">This list only informs the customer. Nothing is reserved or deducted.</p>';
  }else if(kind==="cart"){
   title="Add part to ticket cart";submit="Add to cart";
   const itemId=m.itemId||d.inventory.find(i=>i.quantity>0)?.id;
   body=select("Inventory item","itemId",d.inventory.map(i=>[i.id,i.name+" · "+i.quantity+" available · "+kes(i.sellPrice)]),itemId)+
    '<div class="form-grid">'+numberField("Quantity","quantity",m.quantity||1)+
    priceField("Discount / unit (KES)","discount",m.discount||0)+'</div>'+
    '<p class="hint">The inventory quantity changes only after confirming the issue.</p>';
  }else if(kind==="receive"){
   const r=t?.requirements.find(x=>x.id===m.requirementId);if(!r)return"";
   title="Customer-provided parts";submit="Record received quantity";
   body='<p class="form-caption">'+e(r.description)+" · "+e(r.quantity)+" required</p>"+
    numberField("Quantity received","quantity",1);
  }else if(kind==="reject"){
   title="Record estimate rejection";submit="Confirm rejection";
   body=area("Reason","notes","Customer declined proposed repairs.");
  }else if(kind==="return"){
   const issue=t?.issues.find(x=>x.id===m.issueId);if(!issue)return"";
   title="Return unused part";submit="Return to inventory";
   body='<p class="form-caption">'+e(issue.name)+" · "+e(issue.quantity)+" issued</p>"+
    numberField("Quantity returned","quantity",1);
  }else if(kind==="item"){
   title="Register inventory item";submit="Add inventory item";
   body=field("Part name","name","","placeholder=\"e.g. Battery\"")+
   '<div class="form-grid">'+priceField("Buying price (KES)","buyPrice",500)+
   priceField("Selling price (KES)","sellPrice",850)+'</div>'+
   '<p class="hint">New items start with zero quantity. Use Stock in for intake.</p>';
  }else if(kind==="stock-in"){
   title="Stock in";submit="Record inventory intake";
   const i=inv(m.itemId)||d.inventory[0];
   body=select("Inventory item","itemId",d.inventory.map(i=>[i.id,i.name+" · "+i.quantity+" available"]),i.id)+
    '<div class="form-grid">'+numberField("Quantity received","quantity",1)+
    priceField("Buying price / unit (KES)","buyPrice",i.buyPrice)+
    priceField("Selling price / unit (KES)","sellPrice",i.sellPrice)+'</div>';
  }else if(kind==="payment"){
   title="Record sample payment";submit="Record payment";
   const outstanding=c.charges(t).outstanding;
   body='<p class="form-caption">Current outstanding balance: '+kes(outstanding)+'</p>'+
    priceField("Payment amount (KES)","amount",outstanding)+
    select("Method","method",["Cash","M-Pesa (sample)","Bank (sample)"],"Cash");
  }else return"";
  return '<div class="modal-shell"><button type="button" data-action="close-modal" class="shade" aria-label="Close dialog"></button>'+
   '<section role="dialog" aria-modal="true" aria-label="'+e(title)+'" class="dialog">'+
   '<header><h2>'+e(title)+'</h2>'+btn("×","close-modal","","close-icon")+'</header>'+
   '<div class="dialog-body"><form id="garage-form" data-kind="'+e(kind)+'" data-requirement-id="'+e(m.requirementId||"")+
    '" data-issue-id="'+e(m.issueId||"")+'">'+body+
    '<button type="submit" class="btn primary full">'+e(submit)+'</button></form></div></section></div>';
 }

 
 function documentView(){
  if(!ui.document)return"";
  const x=d.tickets.find(t=>t.id===ui.document.ticketId);
  if(!x)return"";
  const v=c.vehicleFor(d,x),owner=c.customerFor(d,x),kind=ui.document.kind,bill=c.charges(x);
  let name="",description="",head=[],rows=[],total=null;
  if(kind==="requirements"){
   name="Parts Requirements & Price List";
   description="Informational document · customer decides which available items to purchase or source independently.";
   head=["Required part","Qty","Availability","Our unit price","Discount / unit","Net unit offer"];
   rows=x.requirements.map(r=>{
    const i=r.itemId?inv(r.itemId):null;
    return [e(r.description),e(r.quantity),e(i?(i.quantity>0?i.quantity+" available":"Unavailable"):"Customer to source"),
     i?kes(i.sellPrice):"—",i?kes(r.discount):"—",i?kes(i.sellPrice-r.discount):"—"];
   });
  }else if(kind==="parts"){
   name="Parts Receipt";description="Only parts actually issued from inventory, net of returns. Not proof of payment.";
   head=["Item issued","Net quantity","Unit price","Discount","Total"];
   rows=x.issues.map(i=>{
    const back=x.returns.filter(r=>r.issueId===i.id).reduce((a,r)=>a+r.quantity,0),q=i.quantity-back;
    return q>0?[e(i.name),e(q),kes(i.unitPrice),kes(i.discount),kes(q*(i.unitPrice-i.discount))]:null;
   }).filter(Boolean);total=bill.parts;
  }else if(kind==="services"){
   name="Service Invoice";description="Service lines completed and billed on this repair ticket.";
   head=["Service","Quantity","Unit fee","Discount","Amount"];
   rows=(x.invoice?.services||[]).map(s=>[e(s.description),e(s.quantity),kes(s.unitPrice),kes(s.discount),
    kes((s.unitPrice-s.discount)*s.quantity)]);
   total=rows.reduce((a,row)=>a+Number(row[4].replace(/[^0-9.]/g,"")),0);
  }else if(kind==="payment"){
   name="Payment Receipt";description="Recorded fictional customer payments; not a real transaction confirmation.";
   head=["Recorded","Method","Amount"];
   rows=x.payments.map(p=>[e(p.at),e(p.method),kes(p.amount)]);
   total=bill.collected;
  }else return"";
  const notice=kind==="requirements"?
   "No sale is made, no stock is reserved and no invoice is created by this list.":
   kind==="parts"?"This receipt lists inventory issues only, not the full parts requirements.":
   kind==="services"?"Inventory issues are shown separately on the parts receipt.":
   "Payment records are simulated. This document has no real-world financial validity.";
  return '<div class="doc-overlay"><button class="doc-shade" data-action="close-document" aria-label="Close document"></button>'+
   '<section class="print-sheet">'+
   '<div class="doc-tools">'+btn("← Back to ticket","close-document","","outline")+
   (kind==="requirements"?btn("Share to WhatsApp","whatsapp",x.id,"outline"):"")+
   btn("Print / Save as PDF","print","","primary")+'</div>'+
   '<div class="doc-brand"><span class="doc-logo">SA</span><div><strong>Summit Auto Service</strong>'+
   '<small>Fictional Nairobi workshop · JoelTechGeek concept</small></div></div>'+
   '<div class="doc-heading"><span>DOCUMENT FOR TICKET '+e(x.id)+'</span><h1>'+e(name)+'</h1><p>'+e(description)+'</p></div>'+
   '<div class="doc-meta"><div><b>Customer</b><span>'+e(owner.name)+'</span><span>'+e(owner.phone)+'</span></div>'+
   '<div><b>Vehicle</b><span>'+e(v.plate)+'</span><span>'+e(v.name)+'</span></div>'+
   '<div><b>Reference</b><span>'+e(x.id)+'</span><span>'+e(d.date)+'</span></div></div>'+
   (rows.length?table(head,rows.map(tablerow).join("")):empty("No line items","Nothing has been added to this document yet."))+
   (total!==null?'<div class="doc-total"><b>Document total</b><strong>'+kes(total)+'</strong></div>':"")+
   '<p class="doc-notice">'+e(notice)+'</p><p class="doc-demo">SAMPLE ONLY · NO REAL GARAGE TRANSACTIONS</p>'+
   '</section></div>';
 }

 return {NAV,main,dialog,documentView,btn,e,kes};
};
})();
