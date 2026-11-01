const constructionCore=(function(){
 "use strict";
 const ROLES=["manager","supervisor","stockkeeper","accountant"];
 const roleNames={manager:"Project Manager",supervisor:"Supervisor",stockkeeper:"Stockkeeper",accountant:"Accountant"};
 const now=()=>new Date().toISOString();
 const text=(v,field,max=220)=>{const s=String(v??"").trim();if(!s||s.length>max)throw new Error(field+" is required (max "+max+" characters).");return s;};
 const num=(v,field,min=0)=>{if(v===undefined||v===null||String(v).trim()==="")throw new Error(field+" is required.");const n=Number(v);if(!Number.isFinite(n)||n<min)throw new Error(field+" must be at least "+min+".");return Math.round(n*100)/100;};
 const qty=(v,field)=>{const n=num(v,field,0.01);if(n>1000000)throw new Error(field+" is too large.");return n;};
 const requireRole=(role,...allowed)=>{if(!allowed.includes(role))throw new Error("Only "+allowed.map(r=>roleNames[r]).join(" or ")+" can do this.");};
 const get=(items,id,description)=>{const item=items.find(x=>x.id===id);if(!item)throw new Error(description+" not found.");return item;};
 const next=(d,prefix)=>prefix+"-"+String(d.nextId++).padStart(3,"0");
 const log=(d,title,description,role)=>d.activity.unshift({id:next(d,"EVT"),at:now(),role,title,description});
 const money=v=>Math.round(v*100)/100;
 const seed=()=>({
  version:2,nextId:300,project:{id:"SITE-001",name:"Amani Heights · Block A",location:"Westlands, Nairobi (fictional)",budget:12500000,currency:"KES"},
  users:{manager:{name:"Nia",role:"Project Manager"},supervisor:{name:"Peter",role:"Supervisor"},
   stockkeeper:{name:"Asha",role:"Stockkeeper"},accountant:{name:"Samuel",role:"Accountant"}},
  tasks:[
   {id:"WORK-101",name:"Ground-floor slab",category:"Structure",mode:"Labour",status:"In progress",progress:40,unit:"m²",planned:120,
    description:"Slab reinforcement and concreting",createdAt:"2026-10-15T10:00:00Z"},
   {id:"WORK-102",name:"First-floor masonry",category:"Masonry",mode:"Labour",status:"Awaiting approval",progress:0,unit:"m²",planned:200,
    description:"Lay external and partition blocks",createdAt:"2026-10-28T10:00:00Z"},
   {id:"WORK-103",name:"Electrical first fix",category:"Services",mode:"Subcontract",status:"In progress",progress:25,unit:"%",planned:100,
    description:"Conduit and cabling rough-in",createdAt:"2026-10-20T09:00:00Z"}
  ],
  progress:[
   {id:"PRG-101",taskId:"WORK-101",percent:55,note:"Concrete placement completed in section A.",status:"Submitted",
    evidence:"Sample site photo · Section A",at:"2026-10-31T10:00:00Z"}
  ],
  reports:[
   {id:"RPT-101",title:"Weekly site report",detail:"Slab casting progressing; electrical rough-in underway.",status:"Submitted",at:"2026-10-31T17:00:00Z"},
   {id:"RPT-100",title:"Site safety observation",detail:"Walkways and storage areas inspected.",status:"Approved",at:"2026-10-24T17:00:00Z"}
  ],
  materials:[
   {id:"MAT-101",name:"Cement 50 kg",unit:"bags",stock:6,reorder:12,cost:850},
   {id:"MAT-102",name:"Rebar 12 mm",unit:"pieces",stock:18,reorder:12,cost:1350},
   {id:"MAT-103",name:"Fine sand",unit:"m³",stock:10,reorder:6,cost:2600},
   {id:"MAT-104",name:"PVC conduit 25 mm",unit:"pieces",stock:9,reorder:12,cost:280}
  ],
  requests:[
   {id:"MTR-101",taskId:"WORK-101",materialId:"MAT-101",qty:16,issuedQty:0,status:"Submitted",
    purpose:"Cement needed for slab completion",at:"2026-10-31T09:00:00Z"},
   {id:"MTR-102",taskId:"WORK-101",materialId:"MAT-102",qty:8,issuedQty:0,status:"Approved",
    purpose:"Rebar for the remaining reinforcement",at:"2026-10-28T12:00:00Z"},
   {id:"MTR-103",taskId:"WORK-103",materialId:"MAT-104",qty:15,issuedQty:0,status:"Approved",
    purpose:"Conduit for electrical first fix",at:"2026-10-25T11:00:00Z"}
  ],
  purchases:[
   {id:"PO-101",requestId:"MTR-103",materialId:"MAT-104",supplier:"Peakline Building Supplies (fictional)",
    qty:10,receivedQty:4,unitPrice:280,status:"Partially received",invoiceId:"INV-101",
    at:"2026-10-26T11:00:00Z"}
  ],
  invoices:[
   {id:"INV-101",poId:"PO-101",supplier:"Peakline Building Supplies (fictional)",total:2800,paid:800,status:"Partially paid",
    at:"2026-10-27T12:00:00Z"}
  ],
  payments:[{id:"PAY-101",invoiceId:"INV-101",amount:800,at:"2026-10-29T11:00:00Z",method:"Bank transfer (sample)"}],
  movements:[
   {id:"MOV-101",materialId:"MAT-104",kind:"Receive",qty:4,reference:"PO-101",at:"2026-10-28T09:00:00Z"}
  ],
  activity:[
   {id:"EVT-101",at:"2026-10-31T17:00:00Z",role:"supervisor",title:"Weekly site report submitted",description:"RPT-101 awaiting review"},
   {id:"EVT-100",at:"2026-10-31T10:00:00Z",role:"supervisor",title:"Progress submitted",description:"WORK-101 · 55% awaiting review"}
  ]
 });
 const valid=d=>Boolean(d&&d.version===2&&d.project&&Array.isArray(d.tasks)&&Array.isArray(d.requests)&&Array.isArray(d.purchases)&&Array.isArray(d.progress)&&Array.isArray(d.materials)&&Array.isArray(d.invoices)&&Array.isArray(d.reports)&&Array.isArray(d.activity)&&Number.isSafeInteger(d.nextId));
 function createWork(d,role,input){
  requireRole(role,"supervisor");
  const name=text(input.name,"Work item name",110),category=text(input.category,"Category",70),
   description=text(input.description,"Deliverable"),mode=input.mode;
  if(!["Labour","Subcontract"].includes(mode))throw new Error("Select Labour or Subcontract.");
  const planned=qty(input.planned,"Planned quantity"),unit=text(input.unit,"Unit",15);
  const item={id:next(d,"WORK"),name,category,mode,status:"Awaiting approval",progress:0,planned,unit,description,createdAt:now()};
  d.tasks.unshift(item);log(d,"Work item submitted",item.id+" · "+name,role);return item;
 }
 function reviewWork(d,role,id,decision){
  requireRole(role,"manager");const item=get(d.tasks,id,"Work item");
  if(item.status!=="Awaiting approval")throw new Error("Only submitted work can be reviewed.");
  if(!["Approve","Return"].includes(decision))throw new Error("Choose Approve or Return.");
  item.status=decision==="Approve"?"In progress":"Needs correction";
  log(d,decision==="Approve"?"Work approved and started":"Work returned for correction",item.id,role);return item;
 }
 function resubmitWork(d,role,id){
  requireRole(role,"supervisor");const item=get(d.tasks,id,"Work item");
  if(item.status!=="Needs correction")throw new Error("Only returned work can be resubmitted.");
  item.status="Awaiting approval";log(d,"Work resubmitted",item.id,role);return item;
 }
 function submitProgress(d,role,id,rawPercent,note){
  requireRole(role,"supervisor");const item=get(d.tasks,id,"Work item");
  if(item.status!=="In progress")throw new Error("Work must be in progress.");
  if(d.progress.some(x=>x.taskId===id&&x.status==="Submitted"))throw new Error("Review existing progress before submitting another.");
  const percent=num(rawPercent,"Completion percent",0.01);
  if(percent<=item.progress||percent>100)throw new Error("Progress must exceed approved completion and not exceed 100%.");
  const description=text(note,"Progress note");
  const entry={id:next(d,"PRG"),taskId:id,percent,note:description,status:"Submitted",
   evidence:"Sample site photo · "+item.name,at:now()};
  d.progress.unshift(entry);log(d,"Progress submitted",item.id+" · "+percent+"% awaiting review",role);return entry;
 }
 function reviewProgress(d,role,id,decision){
  requireRole(role,"manager");const entry=get(d.progress,id,"Progress update");
  if(entry.status!=="Submitted")throw new Error("Only submitted progress can be reviewed.");
  if(!["Approve","Return"].includes(decision))throw new Error("Choose Approve or Return.");
  const work=get(d.tasks,entry.taskId,"Work item");
  if(decision==="Approve"){
   if(entry.percent<=work.progress)throw new Error("Submitted progress is no longer ahead of approved progress.");
   work.progress=entry.percent;if(work.progress>=100)work.status="Completed";
  }
  entry.status=decision==="Approve"?"Approved":"Needs correction";
  log(d,"Progress "+(decision==="Approve"?"approved":"returned"),work.id+" · "+entry.percent+"%",role);return entry;
 }
 function requestMaterial(d,role,taskId,materialId,rawQty,purpose){
  requireRole(role,"stockkeeper");
  const task=get(d.tasks,taskId,"Work item"),material=get(d.materials,materialId,"Material");
  if(!["In progress","Completed"].includes(task.status))throw new Error("Choose an approved work item.");
  const amount=qty(rawQty,"Requested quantity"),reason=text(purpose,"Purpose");
  const request={id:next(d,"MTR"),taskId:task.id,materialId:material.id,qty:amount,issuedQty:0,
   purpose:reason,status:"Submitted",at:now()};
  d.requests.unshift(request);log(d,"Material request submitted",request.id+" · "+amount+" "+material.unit,role);return request;
 }
 function reviewRequest(d,role,id,decision){
  requireRole(role,"manager");const request=get(d.requests,id,"Material request");
  if(request.status!=="Submitted")throw new Error("Only submitted material requests can be reviewed.");
  if(!["Approve","Return"].includes(decision))throw new Error("Choose Approve or Return.");
  request.status=decision==="Approve"?"Approved":"Needs correction";
  log(d,decision==="Approve"?"Material request approved":"Material request returned",request.id,role);return request;
 }
 function resubmitRequest(d,role,id){
  requireRole(role,"stockkeeper");const request=get(d.requests,id,"Material request");
  if(request.status!=="Needs correction")throw new Error("Only returned requests can be resubmitted.");
  request.status="Submitted";log(d,"Material request resubmitted",request.id,role);return request;
 }
 function issueMaterial(d,role,id,rawQty){
  requireRole(role,"stockkeeper");const r=get(d.requests,id,"Material request");
  if(!["Approved","Partially issued"].includes(r.status))throw new Error("Only approved requests may be issued.");
  const mat=get(d.materials,r.materialId,"Material"),amount=qty(rawQty,"Issue quantity"),remaining=money(r.qty-r.issuedQty);
  if(amount>remaining)throw new Error("Only "+remaining+" "+mat.unit+" remain authorized.");
  if(amount>mat.stock)throw new Error("Insufficient stock: "+mat.stock+" "+mat.unit+" available.");
  mat.stock=money(mat.stock-amount);r.issuedQty=money(r.issuedQty+amount);
  r.status=r.issuedQty===r.qty?"Issued":"Partially issued";
  const move={id:next(d,"MOV"),materialId:mat.id,kind:"Issue",qty:-amount,reference:r.id,at:now(),taskId:r.taskId};
  d.movements.unshift(move);log(d,"Materials issued",r.id+" · "+amount+" "+mat.unit,role);return r;
 }
 function returnStock(d,role,materialId,rawQty,reason){
  requireRole(role,"stockkeeper");const mat=get(d.materials,materialId,"Material"),amount=qty(rawQty,"Return quantity"),note=text(reason,"Return reason");
  mat.stock=money(mat.stock+amount);
  d.movements.unshift({id:next(d,"MOV"),materialId:mat.id,kind:"Return",qty:amount,reference:note,at:now()});
  log(d,"Material returned",amount+" "+mat.unit+" of "+mat.name,role);return mat;
 }
 function shortage(d,requestId){
  const r=get(d.requests,requestId,"Material request"),mat=get(d.materials,r.materialId,"Material");
  const pending=d.purchases.filter(p=>p.requestId===r.id&&!["Rejected","Cancelled"].includes(p.status))
   .reduce((n,p)=>n+Math.max(0,p.qty-p.receivedQty),0);
  return money(Math.max(0,r.qty-r.issuedQty-mat.stock-pending));
 }
 function createPO(d,role,requestId,supplier,rawQty,rawPrice){
  requireRole(role,"accountant");const r=get(d.requests,requestId,"Material request");
  if(!["Approved","Partially issued"].includes(r.status))throw new Error("A purchase order needs an approved material request.");
  const limit=shortage(d,requestId),amount=qty(rawQty,"Order quantity"),unitPrice=qty(rawPrice,"Unit price");
  if(amount>limit)throw new Error("Only "+limit+" units remain to procure against this shortage.");
  const item={id:next(d,"PO"),requestId:r.id,materialId:r.materialId,supplier:text(supplier,"Supplier",100),
   qty:amount,receivedQty:0,unitPrice,status:"Submitted",invoiceId:null,at:now()};
  d.purchases.unshift(item);log(d,"Purchase order submitted",item.id+" · "+item.supplier,role);return item;
 }
 function reviewPO(d,role,id,decision){
  requireRole(role,"manager");const p=get(d.purchases,id,"Purchase order");
  if(p.status!=="Submitted")throw new Error("Only submitted purchase orders can be reviewed.");
  if(!["Approve","Return"].includes(decision))throw new Error("Choose Approve or Return.");
  p.status=decision==="Approve"?"Approved":"Rejected";
  log(d,"Purchase order "+(decision==="Approve"?"approved":"returned"),p.id,role);return p;
 }
 function sendPO(d,role,id){
  requireRole(role,"accountant");const p=get(d.purchases,id,"Purchase order");
  if(p.status!=="Approved")throw new Error("Only approved purchase orders can be sent.");
  p.status="Issued";
  if(p.invoiceId)throw new Error("A payable already exists for this purchase order.");
  const total=money(p.qty*p.unitPrice),invoice={id:next(d,"INV"),poId:p.id,supplier:p.supplier,total,paid:0,status:"Unpaid",at:now()};
  p.invoiceId=invoice.id;d.invoices.unshift(invoice);
  log(d,"Purchase order sent",p.id+" · supplier payable "+invoice.id,role);return invoice;
 }
 function receivePO(d,role,id,rawQty){
  requireRole(role,"stockkeeper");const p=get(d.purchases,id,"Purchase order");
  if(!["Issued","Partially received"].includes(p.status))throw new Error("Only issued purchase orders accept deliveries.");
  const amount=qty(rawQty,"Received quantity"),remaining=money(p.qty-p.receivedQty);
  if(amount>remaining)throw new Error("Only "+remaining+" units remain on this order.");
  const mat=get(d.materials,p.materialId,"Material");
  mat.stock=money(mat.stock+amount);p.receivedQty=money(p.receivedQty+amount);
  p.status=p.receivedQty===p.qty?"Received":"Partially received";
  d.movements.unshift({id:next(d,"MOV"),materialId:mat.id,kind:"Receive",qty:amount,reference:p.id,at:now()});
  log(d,"Goods received",p.id+" · "+amount+" "+mat.unit,role);return p;
 }
 function recordPayment(d,role,invoiceId,rawAmount){
  requireRole(role,"accountant");const invoice=get(d.invoices,invoiceId,"Payable");
  const amount=qty(rawAmount,"Payment amount"),remaining=money(invoice.total-invoice.paid);
  if(remaining<=0||amount>remaining)throw new Error("Payment exceeds outstanding payable of KES "+remaining+".");
  invoice.paid=money(invoice.paid+amount);invoice.status=invoice.paid===invoice.total?"Paid":"Partially paid";
  const p={id:next(d,"PAY"),invoiceId:invoice.id,amount,at:now(),method:"Bank transfer (sample)"};
  d.payments.unshift(p);log(d,"Payment recorded",invoice.id+" · KES "+amount,role);return p;
 }
 function submitReport(d,role,title,detail){
  requireRole(role,"supervisor");
  const r={id:next(d,"RPT"),title:text(title,"Report title",120),detail:text(detail,"Report details",400),status:"Submitted",at:now()};
  d.reports.unshift(r);log(d,"Site report submitted",r.id+" · "+r.title,role);return r;
 }
 function reviewReport(d,role,id,decision){
  requireRole(role,"manager");const r=get(d.reports,id,"Site report");
  if(r.status!=="Submitted")throw new Error("Only submitted reports can be reviewed.");
  if(!["Approve","Return"].includes(decision))throw new Error("Choose Approve or Return.");
  r.status=decision==="Approve"?"Approved":"Needs correction";
  log(d,"Report "+(decision==="Approve"?"approved":"returned"),r.id,role);return r;
 }
 function metrics(d){
  const pending=d.tasks.filter(x=>x.status==="Awaiting approval").length+d.progress.filter(x=>x.status==="Submitted").length+
   d.reports.filter(x=>x.status==="Submitted").length+d.requests.filter(x=>x.status==="Submitted").length+d.purchases.filter(x=>x.status==="Submitted").length;
  const payable=d.invoices.reduce((n,x)=>n+x.total-x.paid,0);
  const stockValue=d.materials.reduce((n,x)=>n+x.stock*x.cost,0);
  return {pendingReview:pending,openWork:d.tasks.filter(x=>x.status==="In progress").length,
   waitingStock:d.requests.filter(x=>["Approved","Partially issued"].includes(x.status)).length,
   deliveries:d.purchases.filter(x=>["Issued","Partially received"].includes(x.status)).length,
   payable:money(payable),stockValue:money(stockValue),totalPayments:money(d.payments.reduce((n,p)=>n+p.amount,0))};
 }
 return {ROLES,roleNames,seed,valid,metrics,shortage,createWork,reviewWork,resubmitWork,submitProgress,reviewProgress,
  requestMaterial,reviewRequest,resubmitRequest,issueMaterial,returnStock,createPO,reviewPO,sendPO,receivePO,recordPayment,submitReport,reviewReport};
})();
