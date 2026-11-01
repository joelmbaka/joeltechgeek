(function constructionApp(core){
"use strict";
const root=document.getElementById("app"),KEY="siteflow-milliol-v2";
const esc=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const kes=n=>"KES "+Number(n||0).toLocaleString("en-KE",{maximumFractionDigits:2});
const num=n=>Number(n||0).toLocaleString("en-KE",{maximumFractionDigits:2});
const find=(items,id)=>items.find(x=>x.id===id);
let data;try{data=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
if(!core.valid(data))data=core.seed();
const users={manager:"Nia (Project Manager)",supervisor:"Peter (Supervisor)",stockkeeper:"Asha (Stockkeeper)",accountant:"Samuel (Accountant)"};
const tabs={
 manager:[["home","Home","▦"],["review","Review","◎"],["finance","Finance","◇"]],
 supervisor:[["work","Work","▤"],["reports","Reports","▣"]],
 stockkeeper:[["todo","To do","☑"],["stock","Stock","▥"],["history","History","◷"]],
 accountant:[["todo","To do","☑"],["invoices","Invoices","▣"],["payments","Payments","◇"]]
};
const ui={role:"manager",tab:"home",screen:null,kind:null,id:null,modal:null,drawer:false,stockQueue:"requests",acctQueue:"create",toast:""};
const task=id=>find(data.tasks,id),mat=id=>find(data.materials,id),req=id=>find(data.requests,id),po=id=>find(data.purchases,id),inv=id=>find(data.invoices,id);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){ui.toast="Browser storage unavailable"}};
const badge=s=>`<span class="badge badge-${esc(String(s).toLowerCase().replace(/\s+/g,"-"))}">${esc(s)}</span>`;
const btn=(s,a,id="",cls="")=>`<button type="button" class="btn ${cls}" data-action="${a}" ${id?`data-id="${esc(id)}"`:""}>${s}</button>`;
const info=(k,v)=>`<div class="info-row"><span>${esc(k)}</span><strong>${esc(v??"—")}</strong></div>`;
const panel=(title,body)=>`<section class="panel"><h2>${esc(title)}</h2>${body}</section>`;
const heading=(s,extra="")=>`<div class="page-head"><h1>${esc(s)}</h1>${extra}</div>`;
const empty=(s,desc)=>`<div class="empty"><b>${esc(s)}</b><p>${esc(desc)}</p></div>`;
const card=(name,detail,status,kind,id,right="")=>`<button class="item-card" data-open="${kind}" data-id="${esc(id)}"><div class="item-main"><b>${esc(name)}</b><small>${esc(detail)}</small></div><div class="item-meta">${status?badge(status):""}${right?`<strong>${esc(right)}</strong>`:""}</div><span class="chevron">›</span></button>`;
const listTasks=(filter=()=>true)=>data.tasks.filter(filter).map(w=>card(w.name,`${w.category} · ${w.mode} · ${num(w.progress)}% complete`,w.status,"work",w.id)).join("");
const listRequests=(filter=()=>true)=>data.requests.filter(filter).map(r=>card(mat(r.materialId)?.name||"Material",`${r.id} · ${num(r.qty)} ${mat(r.materialId)?.unit||"units"} · ${task(r.taskId)?.name||"Work"}`,r.status,"request",r.id)).join("");
const listPO=(filter=()=>true)=>data.purchases.filter(filter).map(p=>card(`${p.id} · ${p.supplier}`,`${num(p.receivedQty)}/${num(p.qty)} received`,p.status,"po",p.id,kes(p.qty*p.unitPrice))).join("");
const listInvoices=(filter=()=>true)=>data.invoices.filter(filter).map(i=>card(`${i.id} · ${i.supplier}`,`Outstanding ${kes(i.total-i.paid)}`,i.status,"invoice",i.id,kes(i.total))).join("");
const listReports=(filter=()=>true)=>data.reports.filter(filter).map(r=>card(r.title,`${r.id} · ${r.detail}`,r.status,"report",r.id)).join("");
const reviewEntries=()=>[
 ...data.tasks.filter(x=>x.status==="Awaiting approval").map(x=>["work",x.id,x.name,"Work item · Supervisor",x.status]),
 ...data.progress.filter(x=>x.status==="Submitted").map(x=>["progress",x.id,task(x.taskId)?.name||"Progress",`Progress to ${num(x.percent)}% · sample evidence`,x.status]),
 ...data.requests.filter(x=>x.status==="Submitted").map(x=>["request",x.id,mat(x.materialId)?.name||"Material","Material request · Stockkeeper",x.status]),
 ...data.purchases.filter(x=>x.status==="Submitted").map(x=>["po",x.id,x.supplier,`PO · ${kes(x.qty*x.unitPrice)}`,x.status]),
 ...data.reports.filter(x=>x.status==="Submitted").map(x=>["report",x.id,x.title,"Site report · Supervisor",x.status])
];
const roleDest=()=>ui.role==="manager"?[["work","Work","▤"],["materials","Materials","▥"],["stock","Stock","▣"],["reports","Reports","▧"],["activity","Activity","◷"]]:
 ui.role==="accountant"?[["purchases","Purchase Orders","▧"],["work","Work","▤"]]:[];
function home(){
 const m=core.metrics(data),metric=(label,value,sub)=>`<div class="metric"><span>${label}</span><strong>${value}</strong><small>${sub}</small></div>`;
 return heading("Project overview")+`<div class="project-banner"><small>ACTIVE PROJECT · FICTIONAL</small><h2>${esc(data.project.name)}</h2><p>${esc(data.project.location)}</p></div>`+
 `<div class="metrics">${metric("Awaiting review",m.pendingReview,"Submitted work & requests")}${metric("Active work",m.openWork,"In progress")}${metric("Deliveries",m.deliveries,"Expected")}${metric("Supplier balance",kes(m.payable),"Outstanding")}</div>`+
 `<div class="section-title"><h2>Needs attention</h2>${btn("Open review","review-page","","text")}</div>`+
 (reviewEntries().slice(0,4).map(([kind,id,name,sub,status])=>card(name,sub,status,kind,id)).join("")||empty("All caught up","Nothing needs approval."))+
 panel("Recent activity",data.activity.slice(0,4).map(x=>`<div class="activity"><b>${esc(x.title)}</b><small>${esc(x.description)}</small></div>`).join(""));
}
function review(){return heading("Review")+`<p class="hint">Approve or return submitted work, progress, material requests, purchase orders, and reports.</p>`+
 (reviewEntries().map(([kind,id,name,sub,status])=>card(name,sub,status,kind,id)).join("")||empty("No pending reviews","The queue is clear."));}
function finance(){const m=core.metrics(data);return heading("Project finance")+
 `<div class="finance-hero"><small>SUPPLIER PAYABLES OUTSTANDING</small><strong>${kes(m.payable)}</strong><span>Read-only for Project Manager</span></div>`+
 panel("Payables",listInvoices()||empty("No payables","An issued PO creates a payable."));}
function work(){return heading("Work",ui.role==="supervisor"?btn("＋ New Work","new-work","","primary"):"")+
 `<p class="hint">Supervisor creates work; Project Manager approval starts execution.</p>`+
 (listTasks()||empty("No work items","Create a new work item."));}
function reports(){return heading("Reports",ui.role==="supervisor"?btn("＋ New Report","new-report","","primary"):"")+
 `<p class="hint">Supervisor submits reports for Project Manager review.</p>`+
 (listReports()||empty("No reports","Submit a site report."));}
function stockTodo(){
 const requests=data.requests.filter(r=>["Submitted","Needs correction","Approved","Partially issued"].includes(r.status));
 const deliveries=data.purchases.filter(p=>["Issued","Partially received"].includes(p.status));
 return heading("To do",btn("＋ Material Request","new-request","","primary"))+
 `<div class="segment"><button data-stock-queue="requests" class="${ui.stockQueue==="requests"?"chosen":""}">Material Requests (${requests.length})</button><button data-stock-queue="deliveries" class="${ui.stockQueue==="deliveries"?"chosen":""}">Expected Deliveries (${deliveries.length})</button></div>`+
 (ui.stockQueue==="requests"?(listRequests(r=>requests.includes(r))||empty("No material tasks","Create a material request.")):
 (listPO(p=>deliveries.includes(p))||empty("No expected deliveries","Awaiting sent purchase orders.")));
}
function stock(){
 return heading("Stock",ui.role==="stockkeeper"?btn("＋ Return","new-return","","soft"):"")+
 `<p class="hint">Receipts, approved issues and returns change on-hand quantities.</p>`+
 data.materials.map(m=>`<article class="stock-card"><div><b>${esc(m.name)}</b><small>${esc(m.id)}</small></div><div><strong>${num(m.stock)} ${esc(m.unit)}</strong>${m.stock<=m.reorder?'<span class="low">Low stock</span>':""}</div></article>`).join("");
}
function history(){return heading("Stock history")+`<p class="hint">Record of stock movements.</p>`+
 (data.movements.map(m=>card(`${m.kind} · ${mat(m.materialId)?.name||"Material"}`,`${m.reference} · ${m.qty>0?"+":""}${num(m.qty)} ${mat(m.materialId)?.unit||"units"}`,null,"movement",m.id)).join("")||empty("No movement history","Record a stock movement."));}
function accountantTodo(){
 const toCreate=data.requests.filter(r=>["Approved","Partially issued"].includes(r.status)&&core.shortage(data,r.id)>0);
 const toSend=data.purchases.filter(x=>x.status==="Approved");
 const toPay=data.invoices.filter(x=>x.total>x.paid);
 return heading("To do")+`<div class="segment three">${[["create","Create PO",toCreate.length],["send","Send",toSend.length],["pay","Pay",toPay.length]].map(([key,label,n])=>`<button data-account-queue="${key}" class="${ui.acctQueue===key?"chosen":""}">${label} (${n})</button>`).join("")}</div>`+
 (ui.acctQueue==="create"?listRequests(r=>toCreate.includes(r))||empty("No shortages","Approved material shortages appear here."):
 ui.acctQueue==="send"?listPO(x=>toSend.includes(x))||empty("No approved POs","Project Manager approvals appear here."):
 listInvoices(x=>toPay.includes(x))||empty("No payables","All supplier payables are paid."));
}
function invoices(){return heading("Invoices")+`<p class="hint">Sending an approved PO creates its supplier payable.</p>`+(listInvoices()||empty("No invoices","Send an approved PO."));}
function payments(){return heading("Payments")+`<p class="hint">Fictional bank transfers recorded by Accountant.</p>`+
 (data.payments.map(p=>card(p.id+" · "+kes(p.amount),`${p.method} · ${p.invoiceId}`,"Recorded","invoice",p.invoiceId)).join("")||empty("No payments","Record payment against an invoice."));}
function purchases(){return heading("Purchase Orders")+`<p class="hint">Accountant creates orders from approved shortages; Project Manager approves.</p>`+(listPO()||empty("No POs","Approved shortages appear in To do."));}
function materials(){return heading("Materials")+panel("Material requests",listRequests()||empty("No requests","Requests appear here."))+
 panel("Purchase orders",listPO()||empty("No purchase orders","Purchase orders appear here."));}
function activity(){return heading("Project activity")+data.activity.map(a=>`<div class="activity-card"><b>${esc(a.title)}</b><p>${esc(a.description)}</p><small>${esc(core.roleNames[a.role]||"System")}</small></div>`).join("");}
function detail(){
 const {kind,id,role}=ui;
 let result="",buttons=[];
 if(kind==="work"){
  const w=task(id);if(!w)return empty("Not found","Work was removed.");
  result=heading(w.name)+panel("Work item",info("Reference",w.id)+info("Status",w.status)+info("Category",w.category)+info("Execution",w.mode)+info("Deliverable",w.description)+info("Planned",num(w.planned)+" "+w.unit)+info("Approved progress",num(w.progress)+"%"));
  const progress=data.progress.filter(p=>p.taskId===id);
  result+=panel("Progress",`<div class="progress-bar"><span style="width:${w.progress}%"></span></div>`+
   (progress.map(p=>card(num(p.percent)+"% completion",p.note,p.status,"progress",p.id)).join("")||`<p class="hint">No progress updates yet.</p>`));
  if(role==="manager"&&w.status==="Awaiting approval")buttons=[btn("Approve & start","approve-work",id,"primary"),btn("Return for correction","return-work",id,"soft")];
  if(role==="supervisor"&&w.status==="In progress"&&w.progress<100)buttons=[btn("Submit progress","new-progress",id,"primary")];
  if(role==="supervisor"&&w.status==="Needs correction")buttons=[btn("Resubmit work","resubmit-work",id,"primary")];
 }else if(kind==="progress"){
  const p=find(data.progress,id),w=p&&task(p.taskId);if(!p)return empty("Not found","Progress unavailable.");
  result=heading("Progress update")+panel("Progress submission",info("Work",w?.name)+info("Submitted completion",num(p.percent)+"%")+info("Currently approved",num(w?.progress)+"%")+info("Notes",p.note)+info("Status",p.status))+
   panel("Sample evidence",`<div class="evidence"><span>▣</span><div><b>Site photo (sample)</b><small>${esc(p.evidence)}</small></div></div>`);
  if(role==="manager"&&p.status==="Submitted")buttons=[btn("Approve progress","approve-progress",id,"primary"),btn("Return for correction","return-progress",id,"soft")];
 }else if(kind==="request"){
  const r=req(id);if(!r)return empty("Not found","Request unavailable.");
  const m=mat(r.materialId);
  result=heading("Material request")+panel("Request details",info("Reference",r.id)+info("Work",task(r.taskId)?.name)+info("Material",m?.name)+info("Requested",num(r.qty)+" "+m?.unit)+info("Issued",num(r.issuedQty)+" "+m?.unit)+info("Purpose",r.purpose)+info("Status",r.status))+
   panel("Stock & shortage",info("On hand",num(m?.stock)+" "+m?.unit)+info("Still to issue",num(r.qty-r.issuedQty)+" "+m?.unit)+info("Uncovered shortage",num(core.shortage(data,id))+" "+m?.unit));
  const linked=data.purchases.filter(p=>p.requestId===id);if(linked.length)result+=panel("Purchase orders",listPO(p=>linked.includes(p)));
  if(role==="manager"&&r.status==="Submitted")buttons=[btn("Approve request","approve-request",id,"primary"),btn("Return for correction","return-request",id,"soft")];
  if(role==="stockkeeper"&&["Approved","Partially issued"].includes(r.status)&&r.qty>r.issuedQty)buttons=[btn("Issue materials","new-issue",id,"primary")];
  if(role==="stockkeeper"&&r.status==="Needs correction")buttons=[btn("Resubmit request","resubmit-request",id,"primary")];
  if(role==="accountant"&&["Approved","Partially issued"].includes(r.status)&&core.shortage(data,id)>0)buttons=[btn("Create purchase order","new-po",id,"primary")];
 }else if(kind==="po"){
  const p=po(id);if(!p)return empty("Not found","Order unavailable.");const m=mat(p.materialId);
  result=heading("Purchase order")+panel("Order details",info("Reference",p.id)+info("Supplier",p.supplier)+info("Material",m?.name)+info("Ordered",num(p.qty)+" "+m?.unit)+info("Received",num(p.receivedQty)+" "+m?.unit)+info("Unit price",kes(p.unitPrice))+info("Total",kes(p.qty*p.unitPrice))+info("Status",p.status)+info("Material request",p.requestId));
  if(p.invoiceId)result+=panel("Supplier payable",info("Invoice",p.invoiceId)+info("Status",inv(p.invoiceId)?.status)+info("Balance",kes(inv(p.invoiceId)?.total-inv(p.invoiceId)?.paid)));
  if(role==="manager"&&p.status==="Submitted")buttons=[btn("Approve PO","approve-po",id,"primary"),btn("Return PO","return-po",id,"soft")];
  if(role==="accountant"&&p.status==="Approved")buttons=[btn("Send purchase order","send-po",id,"primary")];
  if(role==="stockkeeper"&&["Issued","Partially received"].includes(p.status))buttons=[btn("Receive delivery","new-receive",id,"primary")];
 }else if(kind==="invoice"){
  const i=inv(id);if(!i)return empty("Not found","Payable unavailable.");
  result=heading("Supplier payable")+panel("Invoice details",info("Reference",i.id)+info("Supplier",i.supplier)+info("Purchase order",i.poId)+info("Total",kes(i.total))+info("Paid",kes(i.paid))+info("Outstanding",kes(i.total-i.paid))+info("Status",i.status))+
   panel("Payment history",data.payments.filter(p=>p.invoiceId===id).map(p=>`<div class="activity"><b>${kes(p.amount)}</b><small>${esc(p.id)} · ${esc(p.method)}</small></div>`).join("")||`<p class="hint">No payments recorded.</p>`);
  if(role==="accountant"&&i.paid<i.total)buttons=[btn("Record payment","new-payment",id,"primary")];
 }else if(kind==="report"){
  const r=find(data.reports,id);if(!r)return empty("Not found","Report unavailable.");
  result=heading(r.title)+panel("Site report",info("Reference",r.id)+info("Status",r.status)+`<p class="report-body">${esc(r.detail)}</p>`);
  if(role==="manager"&&r.status==="Submitted")buttons=[btn("Approve report","approve-report",id,"primary"),btn("Return for correction","return-report",id,"soft")];
 }else if(kind==="movement"){
  const m=find(data.movements,id);if(!m)return empty("Not found","Movement unavailable.");
  result=heading("Stock movement")+panel("Movement",info("Type",m.kind)+info("Material",mat(m.materialId)?.name)+info("Quantity",num(m.qty)+ " "+(mat(m.materialId)?.unit||"units"))+info("Reference",m.reference));
 }
 return result+(buttons.length?panel("Available actions",`<div class="button-stack">${buttons.join("")}</div>`):"");
}
const select=(label,name,pairs)=>`<label>${esc(label)}<select name="${name}" required>${pairs.map(([value,caption])=>`<option value="${esc(value)}">${esc(caption)}</option>`).join("")}</select></label>`;
const field=(label,name,type,value,extra="")=>`<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${extra} required/></label>`;
const textarea=(label,name)=>`<label>${esc(label)}<textarea rows="3" name="${name}" required></textarea></label>`;
function form(){
 if(!ui.modal)return "";
 const {type,id}=ui.modal;let body="",label="",submit="Save";
 if(type==="work"){label="New work item";submit="Submit work item";body=field("Work name","name","text","Ground floor finishing",'maxlength="110"')+select("Category","category",["Structure","Masonry","Services","Finishes"].map(x=>[x,x]))+
   select("Execution","mode",[["Labour","Labour"],["Subcontract","Subcontract"]])+field("Planned quantity","planned","number",100,'min="0.01" step="0.01"')+
   select("Unit","unit",["m²","m³","pieces","%"].map(x=>[x,x]))+textarea("Deliverable","description");}
 if(type==="progress"){label="Submit progress";submit="Submit for review";const w=task(id);
  body=`<div class="form-context">${esc(w?.name)} · Approved ${num(w?.progress)}%</div>`+
   field("Overall completion (%)","percent","number",Math.min(100,(w?.progress||0)+15),'min="0.01" max="100" step="0.01"')+textarea("Progress notes","note")+
   `<p class="form-context">▣ Fictional site photo will be shown after submission.</p>`;}
 if(type==="request"){label="Material request";submit="Submit request";body=select("Approved work item","taskId",data.tasks.filter(x=>["In progress","Completed"].includes(x.status)).map(x=>[x.id,x.name]))+
   select("Material","materialId",data.materials.map(x=>[x.id,x.name+" · "+x.unit]))+field("Quantity","qty","number",12,'min="0.01" step="0.01"')+textarea("Purpose","purpose");}
 if(type==="issue"){label="Issue approved materials";submit="Issue";const r=req(id),m=mat(r?.materialId);
  body=`<p class="form-context">${esc(m?.name)} · ${num(r?.qty-r?.issuedQty)} remaining · ${num(m?.stock)} in stock</p>`+field("Issue quantity","qty","number",Math.min(r.qty-r.issuedQty,m.stock),'min="0.01" step="0.01"');}
 if(type==="po"){label="Create purchase order";submit="Submit for approval";const r=req(id),m=mat(r?.materialId);
  body=`<p class="form-context">${esc(m?.name)} · ${num(core.shortage(data,id))} ${esc(m?.unit)} shortage</p>`+
   field("Supplier","supplier","text","Peakline Building Supplies (fictional)",'maxlength="100"')+
   field("Order quantity","qty","number",core.shortage(data,id),'min="0.01" step="0.01"')+
   field("Unit price (KES)","unitPrice","number",m?.cost||500,'min="0.01" step="0.01"');}
 if(type==="receive"){label="Receive delivery";submit="Confirm received";const p=po(id),m=mat(p?.materialId);
  body=`<p class="form-context">${esc(p?.id)} · ${esc(m?.name)} · ${num(p?.qty-p?.receivedQty)} remaining</p>`+
   field("Accepted quantity","qty","number",p.qty-p.receivedQty,'min="0.01" step="0.01"');}
 if(type==="return"){label="Return materials";submit="Record return";body=select("Material","materialId",data.materials.map(x=>[x.id,x.name+" · "+x.unit]))+
   field("Quantity","qty","number",2,'min="0.01" step="0.01"')+field("Reason","reason","text","Unused material returned",'maxlength="140"');}
 if(type==="payment"){label="Record supplier payment";submit="Record payment";const i=inv(id);
  body=`<p class="form-context">${esc(i?.id)} · Outstanding ${kes(i.total-i.paid)}</p>`+
   field("Payment (KES)","amount","number",i.total-i.paid,'min="0.01" step="0.01"')+`<p class="form-context">No real bank transfer is made.</p>`;}
 if(type==="report"){label="New site report";submit="Submit report";body=field("Title","title","text","Daily site report",'maxlength="120"')+textarea("Site observations","detail");}
 return `<div class="modal-overlay"><button class="modal-backdrop" data-action="close-modal" aria-label="Close form"></button>`+
  `<section class="modal" role="dialog" aria-modal="true" aria-label="${esc(label)}"><header><h2>${esc(label)}</h2>${btn("×","close-modal","","icon")}</header>`+
  `<div class="modal-inner"><form id="construction-form" data-form="${type}" data-id="${esc(id||"")}"><div class="fields">${body}</div><button type="submit" class="btn primary wide">${submit}</button></form></div></section></div>`;
}
function drawer(){
 if(!ui.drawer)return "";
 return `<div class="drawer-wrap"><button class="drawer-backdrop" data-action="close-drawer" aria-label="Close drawer"></button><aside class="drawer"><div class="drawer-head"><b>${esc(data.project.name)}</b><small>${esc(users[ui.role])}</small></div>`+
  roleDest().map(([id,title,icon])=>`<button data-screen="${id}"><span>${icon}</span>${title}<i>›</i></button>`).join("")+
  `<button data-action="reset"><span>↻</span>Reset sample data<i>›</i></button><a href="/demos/construction">← Overview</a></aside></div>`;
}
function header(){
 const nested=!!ui.screen;
 const title=nested?(ui.screen==="detail"?"Details":ui.screen==="purchases"?"Purchase Orders":ui.screen[0].toUpperCase()+ui.screen.slice(1)):
  tabs[ui.role].find(x=>x[0]===ui.tab)?.[1]||"SiteFlow";
 return `<header class="app-header"><button class="header-back" data-action="${nested?"back":"drawer"}" aria-label="${nested?"Back":"Open menu"}">${nested?"‹":"☰"}</button>`+
  `<div class="header-title"><b>${esc(title)}</b><small>${esc(data.project.name)}</small></div>`+
  `<select id="role-select" aria-label="Choose demo user">${Object.entries(users).map(([k,name])=>`<option value="${k}" ${ui.role===k?"selected":""}>${esc(name)}</option>`).join("")}</select></header>`;
}
function bottom(){return ui.screen?"":`<nav class="bottom-nav">${tabs[ui.role].map(([key,title,icon])=>`<button data-tab="${key}" class="${ui.tab===key?"selected":""}"><span>${icon}</span><small>${title}</small></button>`).join("")}</nav>`;}
function page(){
 if(ui.screen==="detail")return detail();
 if(ui.screen)return ({work,materials,stock,reports,activity,purchases}[ui.screen]||home)();
 if(ui.role==="manager")return ({home,review,finance}[ui.tab]||home)();
 if(ui.role==="supervisor")return ({work,reports}[ui.tab]||work)();
 if(ui.role==="stockkeeper")return ({todo:stockTodo,stock,history}[ui.tab]||stockTodo)();
 return ({todo:accountantTodo,invoices,payments}[ui.tab]||accountantTodo)();
}
function render(){
 root.innerHTML=`<div class="stage"><aside class="stage-intro"><small>MOBILE CONSTRUCTION DEMO</small><h2>SiteFlow Construction</h2>`+
  `<p>A connected fictional project with the four site roles and their real operational handoffs.</p><a href="/demos/construction">← Demo overview</a></aside>`+
  `<div class="phone"><div class="phone-status"><span>9:41</span><span>▰ ▱ ▰</span></div>${header()}<main class="phone-main"><div class="screen">${page()}</div></main>${bottom()}<div class="gesture"><span></span></div>${drawer()}</div>`+
  `<aside class="stage-guide"><b>Switch roles</b><p>Nia, Peter, Asha and Samuel share the same fictional project records.</p>${btn("Reset sample data","reset","","soft")}<small>No real uploads, stock or payments.</small></aside></div>`+
  form()+(ui.toast?`<div role="status" class="toast">${esc(ui.toast)}${btn("×","dismiss","","icon")}</div>`:"");
}
const change=(action,message)=>{try{action();save();ui.toast=message||"Updated.";ui.modal=null;}catch(err){ui.toast=err?.message||"Unable to perform this action.";}render()};
const open=(kind,id)=>{ui.screen="detail";ui.kind=kind;ui.id=id;ui.drawer=false;ui.modal=null;ui.toast="";render()};
const openForm=(type,id)=>{ui.modal={type,id};ui.drawer=false;ui.toast="";render()};
const back=()=>{if(ui.modal)ui.modal=null;else{ui.screen=null;ui.kind=null;ui.id=null;}ui.toast="";render()};
const commands={
 "approve-work":id=>core.reviewWork(data,ui.role,id,"Approve"),
 "return-work":id=>core.reviewWork(data,ui.role,id,"Return"),
 "resubmit-work":id=>core.resubmitWork(data,ui.role,id),
 "approve-progress":id=>core.reviewProgress(data,ui.role,id,"Approve"),
 "return-progress":id=>core.reviewProgress(data,ui.role,id,"Return"),
 "approve-request":id=>core.reviewRequest(data,ui.role,id,"Approve"),
 "return-request":id=>core.reviewRequest(data,ui.role,id,"Return"),
 "resubmit-request":id=>core.resubmitRequest(data,ui.role,id),
 "approve-po":id=>core.reviewPO(data,ui.role,id,"Approve"),
 "return-po":id=>core.reviewPO(data,ui.role,id,"Return"),
 "send-po":id=>core.sendPO(data,ui.role,id),
 "approve-report":id=>core.reviewReport(data,ui.role,id,"Approve"),
 "return-report":id=>core.reviewReport(data,ui.role,id,"Return")
};
const formRoles={work:"supervisor",progress:"supervisor",request:"stockkeeper",issue:"stockkeeper",po:"accountant",receive:"stockkeeper",return:"stockkeeper",payment:"accountant",report:"supervisor"};
document.addEventListener("change",event=>{
 if(event.target.id!=="role-select")return;
 const role=event.target.value;if(!users[role])return;
 ui.role=role;ui.tab=tabs[role][0][0];ui.screen=null;ui.modal=null;ui.drawer=false;ui.kind=null;ui.id=null;ui.toast="";render();
});
document.addEventListener("click",event=>{
 const el=event.target.closest("[data-action],[data-tab],[data-open],[data-screen],[data-stock-queue],[data-account-queue]");
 if(!el||!root.contains(el))return;
 const {action,id}=el.dataset;
 if(el.dataset.tab){if(tabs[ui.role].some(x=>x[0]===el.dataset.tab)){ui.tab=el.dataset.tab;ui.screen=null;render();}return;}
 if(el.dataset.open){open(el.dataset.open,id);return;}
 if(el.dataset.screen){if(roleDest().some(x=>x[0]===el.dataset.screen)){ui.screen=el.dataset.screen;ui.drawer=false;render();}return;}
 if(el.dataset.stockQueue){ui.stockQueue=el.dataset.stockQueue;render();return;}
 if(el.dataset.accountQueue){ui.acctQueue=el.dataset.accountQueue;render();return;}
 if(action==="drawer"){if(roleDest().length){ui.drawer=!ui.drawer;render();}return;}
 if(action==="close-drawer"){ui.drawer=false;render();return;}
 if(action==="back"){back();return;}
 if(action==="close-modal"){ui.modal=null;ui.toast="";render();return;}
 if(action==="dismiss"){ui.toast="";render();return;}
 if(action==="review-page"){ui.tab="review";ui.screen=null;render();return;}
 if(action==="reset"){if(!window.confirm("Reset the fictional construction workspace?"))return;data=core.seed();save();ui.tab=tabs[ui.role][0][0];ui.screen=null;ui.drawer=false;ui.modal=null;ui.toast="Sample project restored.";render();return;}
 const forms={"new-work":["work","supervisor"],"new-progress":["progress","supervisor"],"new-request":["request","stockkeeper"],
  "new-issue":["issue","stockkeeper"],"new-po":["po","accountant"],"new-receive":["receive","stockkeeper"],
  "new-return":["return","stockkeeper"],"new-payment":["payment","accountant"],"new-report":["report","supervisor"]};
 if(forms[action]&&ui.role===forms[action][1]){openForm(forms[action][0],id);return;}
 if(commands[action]){change(()=>commands[action](id),"Record updated.");return;}
});
document.addEventListener("submit",event=>{
 if(event.target.id!=="construction-form"||!root.contains(event.target))return;
 event.preventDefault();
 const {form:kind,id}=event.target.dataset;
 if(!ui.modal||ui.modal.type!==kind||ui.modal.id!==(id||undefined)||formRoles[kind]!==ui.role)return;
 const values=Object.fromEntries(new FormData(event.target).entries());
 change(()=>{
  let result;
  if(kind==="work")result=core.createWork(data,ui.role,values);
  if(kind==="progress")result=core.submitProgress(data,ui.role,id,values.percent,values.note);
  if(kind==="request")result=core.requestMaterial(data,ui.role,values.taskId,values.materialId,values.qty,values.purpose);
  if(kind==="po")result=core.createPO(data,ui.role,id,values.supplier,values.qty,values.unitPrice);
  if(kind==="report")result=core.submitReport(data,ui.role,values.title,values.detail);
  if(kind==="issue")result=core.issueMaterial(data,ui.role,id,values.qty);
  if(kind==="receive")result=core.receivePO(data,ui.role,id,values.qty);
  if(kind==="return")result=core.returnStock(data,ui.role,values.materialId,values.qty,values.reason);
  if(kind==="payment")result=core.recordPayment(data,ui.role,id,values.amount);
  if(["work","request","po","report"].includes(kind)){ui.screen="detail";ui.kind=kind;ui.id=result.id;}
 },"Saved in fictional workspace.");
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(ui.modal){ui.modal=null;render();}else if(ui.drawer){ui.drawer=false;render();}else if(ui.screen)back();}});
render();
})(constructionCore);
