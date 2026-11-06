/* Garage Management System — fictional browser-only domain */
const garageCore=(function(){
"use strict";
const NOW="2026-11-06 · 11:10 EAT";
const STATES={open:"Diagnosis",estimating:"Preparing estimate","awaiting-approval":"Awaiting approval","awaiting-parts":"Awaiting customer parts","in-repair":"In repair","ready-for-billing":"Ready for billing",invoiced:"Awaiting payment",rejected:"Estimate rejected","cannot-repair":"Cannot repair",released:"Released"};
const get=(a,id,what)=>a.find(x=>x.id===id)||(()=>{throw Error(what+" not found.")})();
const ticket=(d,id)=>get(d.tickets,id,"Ticket"),stock=(d,id)=>get(d.inventory,id,"Inventory item"),vehicle=(d,id)=>get(d.vehicles,id,"Vehicle"),customer=(d,id)=>get(d.customers,id,"Customer");
const text=(v,name,min=1,max=320)=>{const s=String(v??"").trim();if(s.length<min||s.length>max)throw Error(name+" must be "+min+"–"+max+" characters.");return s};
const num=(v,name,min=0,max=1e8)=>{if(v===""||v===undefined||v===null||!Number.isFinite(+v)||+v<min||+v>max)throw Error("Enter a valid "+name+".");return +v};
const qty=(v,name="Quantity",min=1,max=100000)=>{const n=num(v,name,min,max);if(!Number.isInteger(n))throw Error(name+" must be a whole number.");return n};
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const money=(u,disc,q)=>round((u-disc)*q);
const id=(d,p)=>p+"-"+String(++d.sequence).padStart(4,"0");
const note=(d,t,message)=>{d.events.unshift({id:id(d,"EV"),ticketId:t.id,at:NOW,message});};
const edit=t=>{if(t.status==="released"||t.invoice)throw Error("This ticket is closed for changes.");};
const line=(key,desc,unitPrice,kind="repair",done=false)=>({id:key,description:desc,quantity:1,unitPrice,discount:0,kind,done});
const request=(key,desc,quantity,itemId=null)=>({id:key,description:desc,quantity,itemId,discount:0,customerProvided:0});
const blank=(key,vehicleId,complaint,status="open")=>({id:key,vehicleId,complaint,status,openedAt:NOW,diagnosis:null,services:[],requirements:[],cart:[],issues:[],returns:[],approval:null,invoice:null,payments:[],release:null,appointmentId:null});
function seed(){
 const customers=[["CU-1","James Mwangi"],["CU-2","Susan Wanjiku"],["CU-3","Peter Otieno"],["CU-4","Mercy Chebet"],["CU-5","David Kamau"]].map(([id,name],i)=>({id,name,phone:"0700 111 00"+(i+1)}));
 const names=[["VH-1","CU-1","KDM 123A","Toyota Axio",2016,123400],["VH-2","CU-2","KDN 456B","Subaru Forester",2017,95800],["VH-3","CU-3","KDP 789C","Toyota Probox",2015,174000],["VH-4","CU-4","KDR 321D","Isuzu D-Max",2019,89000],["VH-5","CU-5","KDS 654E","Mazda Demio",2014,143200],["VH-6","CU-1","KDT 987F","Toyota Prado",2018,110400],["VH-7","CU-2","KDU 246G","Nissan Note",2016,114300],["VH-8","CU-3","KDV 135H","Toyota Vitz",2015,138800],["VH-9","CU-4","KDW 732J","Toyota Fielder",2018,80200]];
 const vehicles=names.map(([id,customerId,plate,name,year,mileage])=>({id,customerId,plate,name,year,mileage}));
 const inventory=[["SKU-1","Brake fluid 1L",5,520,850],["SKU-2","Oil filter · Toyota",8,700,1200],["SKU-3","Engine oil 1L",17,520,800],["SKU-4","Air filter",6,610,990],["SKU-5","Wiper blades",4,450,750],["SKU-6","Car air freshener",12,180,350],["SKU-7","Brake pads · Front",0,1900,2900]].map(([id,name,quantity,buyPrice,sellPrice])=>({id,name,quantity,buyPrice,sellPrice}));
 const ts=[
  blank("T-1041","VH-1","Brakes squeal when slowing down."),
  blank("T-1042","VH-2","Oil warning light and overdue scheduled service.","awaiting-approval"),
  blank("T-1043","VH-3","Rear bumper damaged and lights loose.","awaiting-parts"),
  blank("T-1044","VH-4","Brake fluid top-up and brake system inspection.","in-repair"),
  blank("T-1045","VH-5","Transmission intermittently fails to engage."),
  blank("T-1046","VH-6","Front suspension knocks over bumps.","awaiting-approval"),
  blank("T-1047","VH-7","Replace filter and perform an oil service.","ready-for-billing"),
  blank("T-1048","VH-8","Routine engine service.","released")
 ];
 const diag=(t,findings)=>{t.diagnosis={findings,feasible:true,at:NOW}};
 diag(ts[1],"Engine oil and filter replacement advised; confirm preferred parts.");
 ts[1].services=[line("SV-1","Oil change labour",1800),line("SV-2","General inspection",1000,"diagnosis",true)];
 ts[1].requirements=[request("RQ-1","Engine oil 1L",4,"SKU-3"),request("RQ-2","Oil filter",1,"SKU-2"),request("RQ-3","Front brake pads",1,"SKU-7")];
 diag(ts[2],"Bumper replacement and rear-light mounting required.");
 ts[2].services=[line("SV-3","Fit rear bumper",3200)];
 ts[2].requirements=[request("RQ-4","Rear bumper",1),{...request("RQ-5","Rear mounting clips",4),customerProvided:4}];
 ts[2].approval={decision:"Approved",at:NOW,notes:"Customer will bring replacement bumper."};
 diag(ts[3],"Brake fluid replacement and brake system bleeding required.");
 ts[3].services=[line("SV-4","Brake system bleeding",2300)];
 ts[3].requirements=[request("RQ-6","Brake fluid 1L",1,"SKU-1")];
 ts[3].approval={decision:"Approved",at:NOW,notes:"Customer approved on phone."};
 ts[3].issues=[{id:"ISS-1",itemId:"SKU-1",name:"Brake fluid 1L",quantity:1,unitPrice:850,discount:0,unitCost:520,at:NOW}];
 diag(ts[5],"Front suspension overhaul needed.");
 ts[5].services=[line("SV-5","Front suspension repair labour",6500)];
 ts[5].requirements=[request("RQ-7","Front lower-arm assembly",2)];
 diag(ts[6],"Scheduled servicing required.");
 ts[6].services=[line("SV-6","Oil change labour",1500,"repair",true),line("SV-7","Inspection",700,"diagnosis",true)];
 ts[6].requirements=[request("RQ-8","Oil filter",1,"SKU-2")];
 ts[6].issues=[{id:"ISS-2",itemId:"SKU-2",name:"Oil filter · Toyota",quantity:1,unitPrice:1200,discount:100,unitCost:700,at:NOW}];
 ts[6].approval={decision:"Approved",at:NOW,notes:"Approved."};
 diag(ts[7],"Routine servicing complete.");ts[7].services=[line("SV-8","Engine oil service",1800,"repair",true)];
 ts[7].issues=[{id:"ISS-3",itemId:"SKU-3",name:"Engine oil 1L",quantity:3,unitPrice:800,discount:0,unitCost:520,at:NOW}];
 ts[7].approval={decision:"Approved",at:NOW,notes:"Approved."};
 ts[7].invoice={id:"INV-1048",at:NOW,services:[{id:"SV-8",description:"Engine oil service",quantity:1,unitPrice:1800,discount:0}],parts:[{...ts[7].issues[0]}],total:4200};
 ts[7].payments=[{id:"PAY-1048",amount:4200,method:"M-Pesa (sample)",at:NOW}];
 ts[7].release={at:NOW,reason:"Completed and paid"};
 const appointments=[{id:"APT-21",vehicleId:"VH-1",date:"2026-11-06",time:"09:00",concern:"Brake noise",status:"Arrived",ticketId:"T-1041"},
 {id:"APT-22",vehicleId:"VH-2",date:"2026-11-06",time:"11:00",concern:"Routine service",status:"Arrived",ticketId:"T-1042"},
 {id:"APT-23",vehicleId:"VH-9",date:"2026-11-07",time:"10:30",concern:"Suspension check",status:"Scheduled",ticketId:null}];
 return {version:1,sequence:2000,shop:"Summit Auto Service",date:"2026-11-06",customers,vehicles,inventory,tickets:ts,appointments,
  events:[{id:"EV-1",ticketId:"T-1044",at:NOW,message:"Brake fluid issued from inventory"},{id:"EV-2",ticketId:"T-1048",at:NOW,message:"Vehicle released after payment"}],
  movements:[{id:"MOV-1",itemId:"SKU-1",ticketId:"T-1044",kind:"Issue",quantity:-1,at:NOW},
   {id:"MOV-2",itemId:"SKU-2",ticketId:"T-1047",kind:"Issue",quantity:-1,at:NOW},
   {id:"MOV-3",itemId:"SKU-3",ticketId:"T-1048",kind:"Issue",quantity:-3,at:NOW}]};
}
const valid=d=>!!(d&&d.version===1&&Number.isSafeInteger(d.sequence)&&["customers","vehicles","tickets","inventory","appointments","movements","events"].every(k=>Array.isArray(d[k])));
const status=t=>STATES[t.status]||t.status;
const vehicleFor=(d,t)=>vehicle(d,t.vehicleId),customerFor=(d,t)=>customer(d,vehicleFor(d,t).customerId);
const issuedQty=(t,itemId)=>t.issues.filter(x=>x.itemId===itemId).reduce((s,x)=>s+x.quantity,0)-t.returns.filter(x=>x.itemId===itemId).reduce((s,x)=>s+x.quantity,0);
const missingRequirements=t=>t.requirements.map(r=>({...r,missing:Math.max(0,r.quantity-r.customerProvided-(r.itemId?issuedQty(t,r.itemId):0))})).filter(r=>r.missing>0);
const syncParts=t=>{if(["awaiting-parts","in-repair"].includes(t.status))t.status=missingRequirements(t).length?"awaiting-parts":"in-repair"};
const feeLines=t=>t.services.filter(s=>s.done&&(s.kind==="diagnosis"||!["rejected","cannot-repair"].includes(t.status)));
function charges(t){
 const services=round(feeLines(t).reduce((s,l)=>s+money(l.unitPrice,l.discount,l.quantity),0));
 const parts=round(t.issues.reduce((s,l)=>s+money(l.unitPrice,l.discount,l.quantity),0)-t.returns.reduce((s,r)=>s+r.reversalTotal,0));
 const cost=round(t.issues.reduce((s,l)=>s+l.unitCost*l.quantity,0)-t.returns.reduce((s,r)=>s+r.costTotal,0));
 const collected=round(t.payments.reduce((s,p)=>s+p.amount,0));
 return {services,parts,cost,total:round(services+parts),contribution:round(services+parts-cost),collected,outstanding:round((t.invoice?.total||0)-collected)};
}
function createCustomer(d,p){
 const name=text(p.name,"Customer name",2,80),phone=text(p.phone,"Phone",7,30);
 const c={id:id(d,"CU"),name,phone};d.customers.push(c);return c;
}
function createVehicle(d,p){
 const owner=customer(d,p.customerId);
 const plate=text(p.plate,"Registration",4,16).toUpperCase(),model=text(p.model,"Vehicle model",3,80);
 if(d.vehicles.some(v=>v.plate===plate))throw Error("Registration already exists.");
 const year=qty(p.year,"Year",1970,2030),mileage=qty(p.mileage,"Mileage",0,9999999);
 const v={id:id(d,"VH"),customerId:owner.id,plate,name:model,year,mileage};
 d.vehicles.push(v);return v;
}
function createAppointment(d,p){
 vehicle(d,p.vehicleId);
 const date=text(p.date,"Date",10,10),time=text(p.time,"Time",5,5),concern=text(p.concern,"Concern",5,240);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+"T12:00:00"))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error("Enter a valid appointment date and time.");
 const a={id:id(d,"APT"),vehicleId:p.vehicleId,date,time,concern,status:"Scheduled",ticketId:null};
 d.appointments.push(a);return a;
}
const activeAppointment=a=>!a.ticketId&&["Scheduled","Arrived"].includes(a.status);
function createTicket(d,p){
 vehicle(d,p.vehicleId);const complaint=text(p.complaint,"Reported issue",6,400);
 if(d.tickets.some(t=>t.vehicleId===p.vehicleId&&t.status!=="released"))throw Error("Vehicle already has an active ticket.");
 const pending=d.appointments.filter(a=>a.vehicleId===p.vehicleId&&activeAppointment(a));
 if(!p.appointmentId&&pending.length)throw Error("This vehicle has an active appointment. Create its ticket from Appointments.");
 const a=p.appointmentId?get(d.appointments,p.appointmentId,"Appointment"):null;
 if(a&&(a.vehicleId!==p.vehicleId||!activeAppointment(a)))throw Error("Appointment cannot be converted.");
 if(a&&(pending.length!==1||pending[0].id!==a.id))throw Error("Resolve overlapping appointments before creating a ticket.");
 const t=blank(id(d,"T"),p.vehicleId,complaint);t.appointmentId=a?.id||null;
 d.tickets.unshift(t);
 if(a){a.status="Completed";a.ticketId=t.id;}
 note(d,t,a?"Ticket created from appointment":"Ticket created for walk-in");return t;
}
function diagnose(d,key,p){
 const t=ticket(d,key);edit(t);if(t.status!=="open")throw Error("Diagnosis already recorded.");
 const findings=text(p.findings,"Findings",8,550),feasible=p.feasible===true||p.feasible==="yes";
 if(![true,false,"yes","no"].includes(p.feasible))throw Error("Choose repair feasibility.");
 t.diagnosis={findings,feasible,at:NOW};t.status=feasible?"estimating":"cannot-repair";
 note(d,t,feasible?"Diagnosis completed · repair feasible":"Diagnosis completed · repair unavailable");return t;
}
function revise(d,t){if(t.approval?.decision==="Approved"&&["awaiting-parts","in-repair","ready-for-billing"].includes(t.status)){
 t.approval=null;t.status="awaiting-approval";note(d,t,"Estimate revised · renewed approval required");
}}
function addService(d,key,p){
 const t=ticket(d,key);edit(t);
 if(!["estimating","awaiting-approval","awaiting-parts","in-repair","ready-for-billing","cannot-repair"].includes(t.status))throw Error("Complete diagnosis before adding fees.");
 const description=text(p.description,"Service description",3,120),quantity=qty(p.quantity||1),unitPrice=round(num(p.unitPrice,"Service fee",0,1e7));
 const discount=round(num(p.discount??0,"Discount",0,unitPrice)),kind=p.kind==="diagnosis"?"diagnosis":"repair";
 if(t.status==="cannot-repair"&&kind!=="diagnosis")throw Error("Only diagnosis fees apply when repair unavailable.");
 const s={id:id(d,"SV"),description,quantity,unitPrice,discount,kind,done:kind==="diagnosis"};
 t.services.push(s);revise(d,t);note(d,t,description+" · service fee added");return s;
}
function addRequirement(d,key,p){
 const t=ticket(d,key);edit(t);
 if(!["estimating","awaiting-approval","awaiting-parts","in-repair","ready-for-billing"].includes(t.status))throw Error("Complete a feasible diagnosis first.");
 const description=text(p.description,"Required part",2,140),quantity=qty(p.quantity);
 const itemId=p.itemId?stock(d,p.itemId).id:null,discount=round(num(p.discount??0,"Discount",0,itemId?stock(d,itemId).sellPrice:0));
 const r={id:id(d,"RQ"),description,quantity,itemId,discount,customerProvided:0};
 t.requirements.push(r);revise(d,t);syncParts(t);note(d,t,"Required part added · "+description);return r;
}
const requireInventory=(d,key,itemId,quantity,discount=0)=>addRequirement(d,key,{description:stock(d,itemId).name,quantity,itemId,discount});
function requestApproval(d,key){
 const t=ticket(d,key);edit(t);
 if(!["estimating","awaiting-approval"].includes(t.status)||!t.diagnosis?.feasible)throw Error("Prepare an estimate after diagnosis.");
 if(!t.services.some(s=>s.kind==="repair")&&!t.requirements.length)throw Error("Add services or parts requirements first.");
 t.status="awaiting-approval";t.approval=null;note(d,t,"Estimate awaiting customer approval");return t;
}
function approve(d,key,notes=""){
 const t=ticket(d,key);edit(t);if(t.status!=="awaiting-approval")throw Error("Ticket is not awaiting approval.");
 t.approval={decision:"Approved",notes:String(notes).trim().slice(0,280),at:NOW};
 t.status=missingRequirements(t).length?"awaiting-parts":"in-repair";note(d,t,"Estimate approved by customer");return t;
}
function reject(d,key,notes=""){
 const t=ticket(d,key);edit(t);if(t.status!=="awaiting-approval")throw Error("Ticket is not awaiting approval.");
 const reason=text(notes||"Customer declined repairs.","Reason",6,280);
 t.approval={decision:"Rejected",notes:reason,at:NOW};t.status="rejected";t.cart=[];
 note(d,t,"Customer rejected estimate");return t;
}
function receiveCustomerPart(d,key,reqId,count){
 const t=ticket(d,key);edit(t);
 if(!["awaiting-parts","in-repair"].includes(t.status))throw Error("Approve the repair before receiving customer parts.");
 const r=get(t.requirements,reqId,"Required part"),n=qty(count),fromStock=r.itemId?issuedQty(t,r.itemId):0;
 if(n>r.quantity-r.customerProvided-fromStock)throw Error("Received quantity exceeds outstanding requirements.");
 r.customerProvided+=n;syncParts(t);note(d,t,n+" × "+r.description+" received from customer");return r;
}
function addToCart(d,key,itemId,count,discount=0){
 const t=ticket(d,key);edit(t);
 if(!["awaiting-parts","in-repair"].includes(t.status))throw Error("Customer approval is required before adding cart items.");
 const i=stock(d,itemId),n=qty(count),disc=round(num(discount,"Discount",0,i.sellPrice));
 const prev=t.cart.find(x=>x.itemId===i.id);
 if(prev&&prev.discount!==disc)throw Error("This item has a different discount in cart. Remove the existing row.");
 if((prev?.quantity||0)+n>i.quantity)throw Error("Insufficient available inventory.");
 if(prev)prev.quantity+=n;else t.cart.push({id:id(d,"CART"),itemId:i.id,quantity:n,unitPrice:i.sellPrice,discount:disc});
 note(d,t,n+" × "+i.name+" added to parts cart");return t.cart;
}
function removeCart(d,key,cartId){
 const t=ticket(d,key);edit(t);
 if(!["awaiting-parts","in-repair"].includes(t.status))throw Error("Cart is locked.");
 const index=t.cart.findIndex(x=>x.id===cartId);if(index<0)throw Error("Cart row not found.");
 t.cart.splice(index,1);note(d,t,"Cart row removed");return t.cart;
}
function issueCart(d,key){
 const t=ticket(d,key);edit(t);
 if(!["awaiting-parts","in-repair"].includes(t.status))throw Error("Customer approval is required before issuing stock.");
 if(!t.cart.length)throw Error("Cart has no items.");
 const totals=new Map();for(const row of t.cart)totals.set(row.itemId,(totals.get(row.itemId)||0)+row.quantity);
 for(const [k,q] of totals)if(stock(d,k).quantity<q)throw Error("Insufficient inventory for "+stock(d,k).name);
 const rows=t.cart.map(row=>{const i=stock(d,row.itemId);return {id:id(d,"ISS"),itemId:i.id,name:i.name,quantity:row.quantity,unitPrice:row.unitPrice,discount:row.discount,unitCost:i.buyPrice,at:NOW}});
 for(const row of rows){stock(d,row.itemId).quantity-=row.quantity;d.movements.unshift({id:id(d,"MOV"),itemId:row.itemId,ticketId:t.id,kind:"Issue",quantity:-row.quantity,at:NOW});}
 t.issues.push(...rows);t.cart=[];syncParts(t);note(d,t,"Inventory issued to ticket");return rows;
}
function returnIssue(d,key,issueId,count){
 const t=ticket(d,key);edit(t);
 if(!["awaiting-parts","in-repair","ready-for-billing"].includes(t.status))throw Error("Returns are allowed before invoicing only.");
 const line=get(t.issues,issueId,"Issued part"),n=qty(count);
 const already=t.returns.filter(r=>r.issueId===line.id).reduce((a,r)=>a+r.quantity,0);
 if(n>line.quantity-already)throw Error("Return quantity exceeds issued quantity.");
 const r={id:id(d,"RET"),issueId:line.id,itemId:line.itemId,quantity:n,reversalTotal:money(line.unitPrice,line.discount,n),costTotal:round(line.unitCost*n),at:NOW};
 t.returns.push(r);stock(d,line.itemId).quantity+=n;
 d.movements.unshift({id:id(d,"MOV"),itemId:line.itemId,ticketId:t.id,kind:"Return",quantity:n,at:NOW});
 if(t.status==="ready-for-billing")t.status="in-repair";
 syncParts(t);note(d,t,n+" × "+line.name+" returned to inventory");return r;
}
function completeService(d,key,serviceId){
 const t=ticket(d,key);edit(t);
 if(!["awaiting-parts","in-repair"].includes(t.status))throw Error("Approve the repair first.");
 const s=get(t.services,serviceId,"Service");if(s.done)throw Error("Service already completed.");
 s.done=true;note(d,t,s.description+" completed");return s;
}
function finishRepair(d,key){
 const t=ticket(d,key);edit(t);
 if(t.status!=="in-repair"||missingRequirements(t).length)throw Error("Fulfil parts requirements before completing repair.");
 if(t.cart.length)throw Error("Confirm or remove pending cart items.");
 if(t.services.some(s=>!s.done))throw Error("Mark all services complete first.");
 t.status="ready-for-billing";note(d,t,"Repair completed · ready for billing");return t;
}
function invoiceTicket(d,key){
 const t=ticket(d,key);edit(t);
 if(!["ready-for-billing","rejected","cannot-repair"].includes(t.status))throw Error("Ticket is not ready for billing.");
 if(t.cart.length)throw Error("Clear pending cart first.");
 if(["rejected","cannot-repair"].includes(t.status)&&t.issues.length)throw Error("Rejected repairs cannot include inventory issues.");
 const bill=charges(t);
 t.invoice={id:id(d,"INV"),at:NOW,services:feeLines(t).map(s=>({id:s.id,description:s.description,quantity:s.quantity,unitPrice:s.unitPrice,discount:s.discount})),
  parts:t.issues.map(x=>({...x})),total:bill.total};
 t.status="invoiced";note(d,t,"Invoice posted · KES "+bill.total);return t.invoice;
}
function payment(d,key,p){
 const t=ticket(d,key);if(t.status!=="invoiced"||!t.invoice)throw Error("Post invoice before taking payment.");
 const balance=charges(t).outstanding,amount=round(num(p.amount,"Payment amount",.01,1e8));
 if(amount>balance)throw Error("Payment exceeds the outstanding balance.");
 const method=text(p.method,"Payment method");if(!["Cash","M-Pesa (sample)","Bank (sample)"].includes(method))throw Error("Invalid payment method.");
 const row={id:id(d,"PAY"),amount,method,at:NOW};t.payments.push(row);note(d,t,"Payment recorded · KES "+amount);return row;
}
function release(d,key){
 const t=ticket(d,key);if(t.status==="released")throw Error("Already released.");
 if(["cannot-repair","rejected"].includes(t.status)){
  if(charges(t).total>0)throw Error("Invoice and settle any diagnostic fee before release.");
 }else if(t.status!=="invoiced")throw Error("Finish the ticket before releasing the vehicle.");
 if(t.invoice&&charges(t).outstanding>0)throw Error("Settle outstanding balance before release.");
 if(t.cart.length)throw Error("Clear pending cart.");
 const reason=t.status==="cannot-repair"?"Repair unavailable":t.status==="rejected"?"Customer declined repairs":"Completed and paid";
 t.status="released";t.release={at:NOW,reason};note(d,t,"Vehicle released · "+reason);return t.release;
}
function addInventory(d,p){
 const name=text(p.name,"Inventory item",3,100),buyPrice=round(num(p.buyPrice,"Buying price",0,1e7)),
 sellPrice=round(num(p.sellPrice,"Selling price",0,1e7));
 if(d.inventory.some(i=>i.name.toLowerCase()===name.toLowerCase()))throw Error("Item already exists.");
 const i={id:id(d,"SKU"),name,quantity:0,buyPrice,sellPrice};d.inventory.push(i);return i;
}
function stockIn(d,itemId,count,buyPrice,sellPrice){
 const i=stock(d,itemId),n=qty(count),cost=round(num(buyPrice,"Buying price",0,1e7)),sell=round(num(sellPrice,"Selling price",0,1e7));
 i.buyPrice=round((i.quantity*i.buyPrice+n*cost)/(i.quantity+n));i.sellPrice=sell;i.quantity+=n;
 const m={id:id(d,"MOV"),itemId:i.id,ticketId:null,kind:"Stock in",quantity:n,unitCost:cost,at:NOW};
 d.movements.unshift(m);return m;
}
function metrics(d){
 const billed=d.tickets.filter(t=>t.invoice),revenue=round(billed.reduce((a,t)=>a+t.invoice.total,0)),
 collected=round(billed.reduce((a,t)=>a+charges(t).collected,0)),cost=round(billed.reduce((a,t)=>a+charges(t).cost,0));
 return {active:d.tickets.filter(t=>t.status!=="released").length,
  awaitingApproval:d.tickets.filter(t=>t.status==="awaiting-approval").length,
  awaitingParts:d.tickets.filter(t=>t.status==="awaiting-parts").length,
  inRepair:d.tickets.filter(t=>t.status==="in-repair").length,
  released:d.tickets.filter(t=>t.status==="released").length,revenue,collected,
  outstanding:round(revenue-collected),cost,contribution:round(revenue-cost),
  lowStock:d.inventory.filter(i=>i.quantity<=2).length};
}
return {NOW,STATES,seed,valid,status,ticket,stock,vehicle,customer,vehicleFor,customerFor,issuedQty,missingRequirements,
 charges,createCustomer,createVehicle,createAppointment,createTicket,activeAppointment,diagnose,addService,addRequirement,requireInventory,
 requestApproval,approve,reject,receiveCustomerPart,addToCart,removeCart,issueCart,returnIssue,
 completeService,finishRepair,invoiceTicket,payment,release,addInventory,stockIn,metrics};
})();
