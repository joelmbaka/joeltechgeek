/* Garage Management System · JoelTechGeek desktop-first views */
const garageViews=(function(){
"use strict";
const e=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const kes=v=>"KES "+Number(v||0).toLocaleString("en-KE",{maximumFractionDigits:2});
const NAV=[["dashboard","Dashboard","◫"],["tickets","Tickets","▤"],["appointments","Appointments","◷"],["vehicles","Customers & Vehicles","▰"],["inventory","Inventory","▣"],["reports","Reports","◩"]];
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
  return heading("Garage overview","Vehicles, repairs and revenue · fictional operating records.",btn("＋ Open ticket","modal","ticket","primary"))+
   '<div class="metrics">'+metric("Vehicles in workshop",m.active,"Open tickets")+metric("Awaiting approval",m.awaitingApproval,"Customer decision pending")+
    metric("Awaiting parts",m.awaitingParts,"Items customer needs to bring")+metric("Repairs in progress",m.inRepair,"Authorized work")+'</div>'+
   '<div class="metrics three">'+metric("Invoiced revenue",kes(m.revenue),"Confirmed invoices")+
    metric("Money collected",kes(m.collected),"Recorded payments")+metric("Gross contribution",kes(m.contribution),"Before rent and wages")+'</div>'+
   '<div class="columns two">'+panel("Workshop tickets",ticketTable(active.slice(0,6)))+panel("Recent activity",history())+'</div>';
 }
 function tickets(){let rows=d.tickets;
  if(ui.filter&&ui.filter!=="all")rows=rows.filter(x=>x.status===ui.filter);
  if(ui.search){const q=ui.search.toLowerCase();rows=rows.filter(x=>
   [x.id,x.complaint,c.vehicleFor(d,x).plate,c.vehicleFor(d,x).name,c.customerFor(d,x).name].some(v=>String(v).toLowerCase().includes(q)));}
  return heading("Repair tickets","Manage each vehicle from reception through release.",btn("＋ Open ticket","modal","ticket","primary"))+
   '<div class="toolbar"><label class="field search"><span>Search</span><input id="ticket-search" placeholder="Ticket, registration or customer" value="'+e(ui.search||"")+'"/></label>'+
    select("Status","ticket-filter",[["all","All statuses"],...Object.entries(c.STATES).map(([k,v])=>[k,v])],ui.filter||"all")+'</div>'+
   panel(rows.length+" tickets",ticketTable(rows));
 }
 function appointments(){const ap=d.appointments.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return heading("Appointments","Staff enter customer phone and WhatsApp requests manually.",btn("＋ New appointment","modal","appointment","primary"))+
   panel("Service bookings",table(["Date · Time","Vehicle","Reported service need","Status",""],ap.map(a=>{
    const v=veh(a.vehicleId);
    return tablerow(['<b>'+e(a.date+" · "+a.time)+'</b>','<b>'+e(v.plate)+'</b><small>'+e(v.name)+'</small>',
      e(a.concern),tag(a.status),a.ticketId?btn("Open ticket","open-ticket",a.ticketId,"outline compact"):
      btn("Open ticket","convert-appointment",a.id,"primary compact")]);
   }).join("")))+'<p class="footnote">Appointments do not reserve mechanics, bays or staff shifts.</p>';
 }
 function vehicles(){return heading("Customers & vehicles","Vehicle history organized by registration number.",btn("＋ New customer & vehicle","modal","customer","primary"))+
  panel(d.vehicles.length+" vehicles",table(["Registration","Customer","Contact","Previous tickets"],d.vehicles.map(v=>{
   const o=d.customers.find(x=>x.id===v.customerId),ts=d.tickets.filter(x=>x.vehicleId===v.id);
   return tablerow(['<b>'+e(v.plate)+'</b><small>'+e(v.name+" · "+v.year+" · "+v.mileage.toLocaleString()+" km")+'</small>',
    e(o.name),e(o.phone),ts.length?ts.map(x=>btn(x.id,"open-ticket",x.id,"outline compact")).join(" "):"—"]);
  }).join("")));}
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
 const TABS=[["overview","Overview"],["diagnosis","Diagnosis"],["requirements","Parts requirements"],["cart","Parts cart"],["services","Services & fees"],["billing","Billing"],["history","History"]];
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
 /*GARAGE_DETAIL_FUNCTIONS*/
 function ticketView(){if(!t)return empty("Ticket unavailable","Select a ticket.");
  const v=c.vehicleFor(d,t),o=c.customerFor(d,t);
  return '<div class="breadcrumb">'+btn("← Tickets","back","","text")+e(t.id)+'</div>'+
   '<div class="ticket-hero"><div><span class="eyebrow">REPAIR TICKET · '+e(t.id)+'</span><h1>'+e(v.name)+'</h1>'+
    '<p>'+e(v.plate+" · "+o.name+" · "+o.phone)+'</p></div>'+tag(c.status(t))+'</div>'+
   '<div class="ticket-actions">'+actions(t)+'</div>'+
   '<nav class="ticket-tabs" aria-label="Ticket sections">'+TABS.map(([id,label])=>
    '<button class="'+(ui.tab===id?"active":"")+'" data-tab="'+id+'">'+e(label)+'</button>').join("")+'</nav>'+
   '<div class="ticket-content">'+({
    overview,diagnosis,requirements,cart,services,billing,history:()=>panel("Ticket timeline",history(t.id))
   }[ui.tab]||overview)()+'</div>';
 }
 function main(){if(t)return ticketView();
  return ({dashboard,tickets,appointments,vehicles,inventory,reports}[ui.page]||dashboard)();}
 /*GARAGE_MODAL_FUNCTIONS*/
 /*GARAGE_DOCUMENT_FUNCTIONS*/
 return {NAV,main,dialog,documentView,btn,e,kes};
};
})();
