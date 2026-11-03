(function fieldApp(core){
 "use strict";
 const KEY="joeltechgeek-fieldservices-demo-v1";
 const root=document.getElementById("app");
 const TECH="TECH-101";
 const roles={
  dispatcher:{name:"Grace · Dispatcher",views:["overview","tickets","maintenance","parts","settings"],start:"tickets"},
  technician:{name:"Daniel · Technician",views:["overview","mywork","parts","settings"],start:"mywork"},
  manager:{name:"Nia · Service Manager",views:["overview","tickets","reviews","maintenance","reports","settings"],start:"reviews"},
  billing:{name:"Amina · Billing",views:["overview","billing","reports","settings"],start:"billing"}
 };
 const nav=[
  ["overview","Overview","▦"],["tickets","Service requests","▤"],["mywork","My field jobs","⚒"],
  ["reviews","Manager reviews","✓"],["maintenance","Asset calendar","▧"],
  ["parts","Spare parts","▣"],["billing","Invoices","◇"],["reports","Reports","↗"],["settings","Demo settings","⚙"]
 ];
 const esc=x=>String(x===undefined||x===null?"":x).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const money=x=>"KES "+new Intl.NumberFormat("en-KE",{maximumFractionDigits:2}).format(Number(x)||0);
 const fmtDate=x=>{if(!x)return "Not scheduled";const d=new Date(x);return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat("en-KE",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(d)};
 const customer=id=>data.customers.find(c=>c.id===id);
 const asset=id=>data.assets.find(a=>a.id===id);
 const part=id=>data.parts.find(p=>p.id===id);
 const ticket=id=>data.tickets.find(j=>j.id===id);
 const invoice=id=>data.invoices.find(i=>i.id===id);
 const allowed=view=>roles[ui.role].views.includes(view);
 const is=role=>ui.role===role;
 function load(){
  try{
   const d=JSON.parse(localStorage.getItem(KEY)||"null");
   if(d&&d.version===1&&["tickets","parts","invoices","customers","assets","activity","movements"].every(k=>Array.isArray(d[k])))return d;
  }catch(error){}
  return core.seed();
 }
 let data=load();
 const ui={role:"dispatcher",view:"tickets",modal:null,message:""};
 const btn=(text,act,opts="")=>'<button type="button" class="btn" data-act="'+act+'" '+opts+'>'+text+'</button>';
 const pill=s=>'<span class="pill '+(["Approved","Paid"].includes(s)?"good":["Returned","Attention","Urgent"].includes(s)?"bad":s==="Awaiting review"||s==="Unpaid"?"warn":"neutral")+'">'+esc(s)+'</span>';
 const empty=s=>'<div class="empty">'+esc(s)+'</div>';
 const stat=(label,value,help,icon)=>'<div class="stat"><div class="stat-top"><span>'+esc(label)+'</span><span class="stat-icon">'+icon+'</span></div><strong>'+value+'</strong><small>'+help+'</small></div>';
 const header=(over,title,description,button="")=>'<div class="page-head"><div><div class="eyebrow">'+esc(over)+'</div><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p></div>'+button+'</div>';
 const table=(heads,rows)=>'<div class="table-scroll"><table><thead><tr>'+heads.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>';
 const option=(items,selected,fn)=>items.map(i=>{const [id,label]=fn(i);return '<option value="'+esc(id)+'" '+(selected===id?"selected":"")+'>'+esc(label)+'</option>';}).join("");
 const viewButton=(job,act,label)=>'<button class="link" data-act="'+act+'" data-id="'+esc(job.id)+'">'+label+'</button>';
 const latest=j=>j.reports[j.reports.length-1];
 function overview(){
  const m=core.metrics(data),links={dispatcher:["tickets","Manage requests →"],technician:["mywork","Open field jobs →"],manager:["reviews","Review service reports →"],billing:["billing","Open billing →"]};
  const [dest,label]=links[ui.role];
  return header("FIELD SERVICE COMMAND CENTRE / FICTIONAL RECORDS","Service overview",
   "Northstar Field Services · one connected maintenance workflow",
   '<button class="btn primary" data-nav="'+dest+'">'+label+'</button>')+
   '<section class="hero"><div><span class="hero-kicker">BROWSER-ONLY OPERATIONS DEMO</span><h2>Every service visit, from request to payment.</h2><p>Dispatch a fictional maintenance job, perform technician checks, issue spare parts, review the result and create a sample invoice.</p></div><div class="hero-number"><span>Active service requests</span><strong>'+m.open+'</strong><small>Manager review required before billing</small></div></section>'+
   '<div class="stats">'+stat("Total jobs",m.jobs,"Fictional tickets","▤")+stat("Open workflow",m.open,"Not yet manager-approved","◷")+
   stat("Awaiting review",m.review,"Technician reports submitted","✓")+stat("Sample billed",money(m.billed),"No real payment processing","◇")+'</div>'+
   '<div class="cols"><section class="card"><div class="card-title"><div><h2>Current service jobs</h2><p>Changes appear here immediately.</p></div></div>'+
   table(["Job","Customer / asset","Status","Priority"],data.tickets.slice(0,6).map(j=>
   '<tr><td>'+viewButton(j,"job",esc(j.id))+'<span class="sub">'+esc(j.title)+'</span></td><td><b>'+esc(customer(j.customerId)?.name||"Customer")+'</b><span class="sub">'+esc(asset(j.assetId)?.name||"Asset")+'</span></td><td>'+pill(j.status)+'</td><td>'+pill(j.priority)+'</td></tr>'))+'</section>'+
   '<section class="card"><div class="card-title"><div><h2>Latest service activity</h2><p>Sample actions within this browser only.</p></div></div>'+
   '<div class="activity">'+data.activity.slice(0,6).map(a=>'<div class="activity-row"><span class="dot"></span><div><b>'+esc(a.title)+'</b><p>'+esc(a.detail)+'</p><small>'+fmtDate(a.at)+'</small></div></div>').join("")+'</div></section></div>'+
   '';
 }
 function tickets(){
  return header("DISPATCH / CUSTOMER REQUESTS","Service requests","Create, assign and track maintenance or repair requests.",
   is("dispatcher")?'<button class="btn primary" data-act="new-job">+ New service request</button>':"")+
   '<section class="card"><div class="card-title"><div><h2>Job register</h2><p>Assignment records a technician and scheduled appointment.</p></div></div>'+
   table(["Job / fault","Customer / equipment","Priority","Scheduled","Status","Action"],data.tickets.map(j=>{
    const action=is("dispatcher")&&j.status==="New"?viewButton(j,"assign","Assign technician →"):viewButton(j,"job","Details →");
    return '<tr><td><b>'+esc(j.id)+'</b><span class="sub">'+esc(j.title)+'</span></td><td>'+esc(customer(j.customerId)?.name||"Customer")+'<span class="sub">'+esc(asset(j.assetId)?.name||"Asset")+'</span></td><td>'+pill(j.priority)+'</td><td>'+fmtDate(j.scheduledAt)+'</td><td>'+pill(j.status)+'</td><td>'+action+'</td></tr>';
   }))+'</section>'+
   '<div class="notice section"><b>Scheduling rule:</b> New requests do not become technician jobs until a dispatcher assigns a technician and visit date. Submitted reports require manager review before a bill can be issued.</div>';
 }
 function mywork(){
  const jobs=data.tickets.filter(j=>j.techId===TECH);
  return header("FIELD TECHNICIAN / ASSIGNED VISITS","My field jobs","Start an assigned visit, record spare parts, complete the checklist and submit your service report.")+
   '<section class="card"><div class="card-title"><div><h2>Daniel’s service visits</h2><p>Jobs are assigned explicitly by Dispatcher. This is a simulated technician account.</p></div></div>'+
   (jobs.length?'<div class="job-grid">'+jobs.map(j=>{
    const actions=j.status==="Assigned"||j.status==="Returned"?'<button class="btn primary" data-act="start" data-id="'+esc(j.id)+'">'+(j.status==="Returned"?"Resume returned work":"Start service visit")+'</button>':
      j.status==="In progress"?'<button class="btn primary" data-act="report" data-id="'+esc(j.id)+'">Submit service report →</button>':'';
    return '<article class="job-card"><div class="row"><b>'+esc(j.id)+'</b>'+pill(j.status)+'</div><h3>'+esc(j.title)+'</h3><p>'+esc(customer(j.customerId)?.name||"Customer")+'</p>'+
     '<div class="job-facts"><span>Asset: '+esc(asset(j.assetId)?.name||"Asset")+'</span><span>Visit: '+fmtDate(j.scheduledAt)+'</span><span>Parts used: '+j.partsUsed.reduce((n,p)=>n+p.qty,0)+' units</span></div>'+
     (j.status==="Returned"?'<div class="notice alert">Returned for correction: '+esc(j.reviewNote)+'</div>':'')+
     '<div class="job-actions">'+(j.status==="In progress"?'<button class="btn" data-act="part" data-id="'+esc(j.id)+'">+ Use spare part</button>':'')+
     actions+'<button class="link" data-act="job" data-id="'+esc(j.id)+'">View details →</button></div></article>';
   }).join("")+'</div>':empty("No jobs assigned to Daniel. Switch to Dispatcher to assign one."))+'</section>';
 }
 function reviews(){
  const pending=data.tickets.filter(j=>j.status==="Awaiting review");
  return header("SERVICE QUALITY / REVIEW CONTROL","Manager reviews","Approve only passing service reports, or return work to the technician for correction.")+
   '<div class="stats compact">'+stat("Awaiting review",pending.length,"Needs manager decision","✓")+
   stat("Approved work",data.tickets.filter(j=>["Approved","Invoiced","Paid"].includes(j.status)).length,"Eligible for billing","↗")+
   stat("Returned work",data.tickets.filter(j=>j.status==="Returned").length,"Needs technician rework","↩")+'</div>'+
   '<section class="card"><div class="card-title"><div><h2>Submitted service reports</h2><p>Review checklist results and technician notes.</p></div></div>'+
   (pending.length?table(["Job","Asset / client","Checklist","Submitted","Action"],pending.map(j=>{
    const report=latest(j),issues=report.checks.filter(c=>c.result==="Attention").length;
    return '<tr><td><b>'+esc(j.id)+'</b><span class="sub">'+esc(j.title)+'</span></td><td>'+esc(asset(j.assetId)?.name||"Equipment")+'<span class="sub">'+esc(customer(j.customerId)?.name||"Customer")+'</span></td><td>'+pill(issues?issues+" need attention":"All passed")+'</td><td>'+fmtDate(report.at)+'</td><td>'+viewButton(j,"review","Review →")+'</td></tr>';
   })):empty("No reports await review. Complete a technician job to create one."))+'</section>'+
   '<div class="notice section">An item marked <b>Attention</b> cannot be approved until the technician reworks the job and submits a fresh all-passing report.</div>';
 }
 function maintenance(){
  return header("CUSTOMER ASSETS / PREVENTIVE SERVICE","Asset calendar","Browse fictional customer equipment and upcoming service dates.",
   is("dispatcher")?'<button class="btn primary" data-act="new-job">+ New request</button>':"")+
   '<section class="card"><div class="card-title"><div><h2>Registered equipment</h2><p>Dates are illustrative reminders; no real alerts are sent.</p></div></div>'+
   table(["Equipment","Customer","Category","Reference","Next planned check","Action"],data.assets.map(a=>
   '<tr><td><b>'+esc(a.name)+'</b></td><td>'+esc(customer(a.customerId)?.name||"Customer")+'</td><td>'+esc(a.type)+'</td><td>'+esc(a.serial)+'</td><td>'+esc(a.nextDue)+'</td><td>'+
   (is("dispatcher")?'<button class="link" data-act="asset-request" data-id="'+esc(a.id)+'">Open request →</button>':'<span class="muted">Scheduled reference</span>')+'</td></tr>'))+'</section>';
 }
 function parts(){
  return header("FIELD INVENTORY / SPARE PARTS","Spare parts","Track quantities available for service visits. Parts are deducted only when a technician records usage.")+
   '<div class="stats compact">'+stat("Part types",data.parts.length,"Fictional inventory items","▣")+
   stat("Low-stock parts",core.metrics(data).lowParts,"At or below reorder point","!")+
   stat("Recorded part issues",data.movements.length,"Linked to service jobs","⇄")+'</div>'+
   '<section class="card"><div class="card-title"><div><h2>Current stock</h2><p>Unit pricing is for sample billing only.</p></div></div>'+
   table(["Spare part","On hand","Reorder at","Cost","Demo billing rate","Status"],data.parts.map(p=>
    '<tr><td><b>'+esc(p.name)+'</b><span class="sub">'+esc(p.id)+'</span></td><td><b>'+p.stock+' '+esc(p.unit)+'</b></td><td>'+p.reorder+'</td><td>'+money(p.cost)+'</td><td>'+money(p.price)+'</td><td>'+pill(p.stock<=p.reorder?"Low stock":"Available")+'</td></tr>'))+'</section>'+
   '<section class="card section"><div class="card-title"><div><h2>Part usage history</h2><p>All movement quantities are saved locally.</p></div></div>'+
   (data.movements.length?table(["Part","Quantity","Service job","Time"],data.movements.map(m=>'<tr><td>'+esc(part(m.partId)?.name||"Part")+'</td><td><b class="negative">'+m.qty+'</b></td><td>'+esc(m.jobId)+'</td><td>'+fmtDate(m.at)+'</td></tr>')):empty("Part usage will appear when a technician issues stock to a job."))+'</section>';
 }
 function billing(){
  const ready=data.tickets.filter(j=>j.status==="Approved");
  return header("SERVICE BILLING / FICTIONAL TRANSACTIONS","Invoices","Create sample invoices only after manager approval. Payment recording is simulated.")+
   '<div class="stats compact">'+stat("Ready to invoice",ready.length,"Manager-approved work","◇")+
   stat("Unpaid invoices",data.invoices.filter(i=>i.status==="Unpaid").length,"Awaiting simulated payment","◷")+
   stat("Paid sample value",money(core.metrics(data).paid),"No real money collected","✓")+'</div>'+
   '<section class="card"><div class="card-title"><div><h2>Approved work awaiting billing</h2><p>Labour and parts used flow into the sample bill.</p></div></div>'+
   (ready.length?table(["Job","Customer","Labour","Parts","Action"],ready.map(j=>
    '<tr><td><b>'+esc(j.id)+'</b><span class="sub">'+esc(j.title)+'</span></td><td>'+esc(customer(j.customerId)?.name||"Customer")+'</td><td>'+j.laborHours+' h</td><td>'+j.partsUsed.reduce((n,p)=>n+p.qty,0)+' units</td><td><button class="btn primary mini" data-act="invoice-create" data-id="'+esc(j.id)+'">Generate sample invoice</button></td></tr>')):empty("No approved jobs awaiting billing. A manager must approve a passing technician report."))+'</section>'+
   '<section class="card section"><div class="card-title"><div><h2>Invoice register</h2><p>All totals and payment references are fictitious.</p></div></div>'+
   (data.invoices.length?table(["Invoice","Customer / job","Total","Status","Action"],data.invoices.map(i=>
    '<tr><td><b>'+esc(i.id)+'</b><span class="sub">'+fmtDate(i.createdAt)+'</span></td><td>'+esc(customer(i.customerId)?.name||"Customer")+'<span class="sub">'+esc(i.jobId)+'</span></td><td><b>'+money(i.total)+'</b></td><td>'+pill(i.status)+'</td><td>'+
      (i.status==="Unpaid"?'<button class="btn primary mini" data-act="payment" data-id="'+esc(i.id)+'">Record simulated payment</button>':
       '<button class="link" data-act="invoice" data-id="'+esc(i.id)+'">View invoice →</button>')+'</td></tr>')):empty("No invoices generated yet."))+'</section>';
 }
 function reports(){
  const m=core.metrics(data);
  const counts=["New","Assigned","In progress","Awaiting review","Returned","Approved","Invoiced","Paid"].map(s=>({name:s,value:data.tickets.filter(j=>j.status===s).length}));
  const max=Math.max(1,...counts.map(x=>x.value));
  return header("SERVICE INSIGHTS / DEMO REPORTS","Reports","Inspect how job progress, consumables and sample billing update together.")+
   '<div class="stats">'+stat("Completed jobs",m.completed,"Manager-approved or later","✓")+
   stat("Total billed",money(m.billed),"Illustrative labour and parts","◇")+
   stat("Sample paid",money(m.paid),"Recorded locally only","↗")+
   stat("Unpaid balance",money(m.unpaid),"Not a real receivable","◷")+'</div>'+
   '<div class="cols"><section class="card"><div class="card-title"><div><h2>Jobs by stage</h2><p>A snapshot of the current demo workflow.</p></div></div>'+
   '<div class="bars">'+counts.map(x=>'<div class="bar-row"><div class="row"><b>'+esc(x.name)+'</b><span>'+x.value+' jobs</span></div><div class="bar"><span style="width:'+(x.value/max*100)+'%"></span></div></div>').join("")+'</div></section>'+
   '<section class="card"><div class="card-title"><div><h2>Recent milestones</h2><p>Fictional operational history.</p></div></div>'+
   '<div class="activity">'+data.activity.slice(0,9).map(a=>'<div class="activity-row"><span class="dot"></span><div><b>'+esc(a.title)+'</b><p>'+esc(a.detail)+'</p><small>'+fmtDate(a.at)+'</small></div></div>').join("")+'</div></section></div>'+
   '<div class="notice section">This is not an accounts receivable ledger, tax report, maintenance compliance certificate, or real service history. No data is transmitted to customers.</div>';
 }
 function settings(){
  return header("DEMO CONTROLS / LOCAL STATE","Demo settings","Switch simulated team views or reset the fictional service operation.")+
   '<div class="cols"><section class="card padded"><h2>Demo roles</h2><p class="muted">These are illustrative perspectives; there is no authentication or permission enforcement outside the demo.</p>'+
   Object.entries(roles).map(([id,r])=>'<button class="role-option '+(is(id)?"selected":"")+'" data-act="role" data-role="'+id+'"><b>'+esc(r.name)+'</b><span>'+(is(id)?"Current role ✓":"Switch role →")+'</span></button>').join("")+'</section>'+
   '<section class="card padded"><h2>Sample dataset</h2><p class="muted">State is stored in localStorage in this browser only. No messages, payments, bookings or live integrations occur.</p>'+
   '<div class="setting-row"><span>Customers</span><b>'+data.customers.length+'</b></div>'+
   '<div class="setting-row"><span>Assets</span><b>'+data.assets.length+'</b></div>'+
   '<div class="setting-row"><span>Service jobs</span><b>'+data.tickets.length+'</b></div>'+
   '<div class="setting-row"><span>Invoices</span><b>'+data.invoices.length+'</b></div>'+
   '<button class="btn danger full" data-act="reset">Reset sample operation</button></section></div>';
 }
 function invoiceHtml(i){
  return '<div class="invoice-sheet"><div class="invoice-brand">NORTHSTAR FIELD SERVICES</div><div class="invoice-sub">SAMPLE SERVICE INVOICE · FICTIONAL</div>'+
   '<div class="watermark">DEMO ONLY — NOT A REAL INVOICE OR PAYMENT RECEIPT</div>'+
   '<div class="invoice-meta"><span>Invoice <b>'+esc(i.id)+'</b></span><span>Job <b>'+esc(i.jobId)+'</b></span><span>Date <b>'+fmtDate(i.createdAt)+'</b></span>'+
   '<span>Customer <b>'+esc(customer(i.customerId)?.name||"Customer")+'</b></span><span>Status <b>'+esc(i.status)+'</b></span></div>'+
   '<div class="invoice-rows">'+i.rows.map(r=>'<div class="invoice-row"><span>'+esc(r.label)+'<small>'+r.qty+' × '+money(r.unitPrice)+'</small></span><b>'+money(r.qty*r.unitPrice)+'</b></div>').join("")+'</div>'+
   '<div class="invoice-total"><span>Total (no tax calculated)</span><strong>'+money(i.total)+'</strong></div>'+
   (i.status==="Paid"?'<div class="invoice-paid">SIMULATED '+esc(i.paymentMethod)+' · Reference '+esc(i.reference)+'</div>':'')+
   '<p class="invoice-foot">Concept preview only. No real customer, compliance paperwork, tax invoice, payment or finance integration.</p></div>';
 }
 function modal(){
  if(!ui.modal)return "";
  const x=ui.modal;
  let content="";
  if(x.type==="new-job"){
   const selected=asset(x.assetId)||data.assets[0];
   content='<h2>Create service request</h2><p class="muted">Create a fictional work order linked to an existing customer asset.</p>'+
    '<form data-form="new-job"><div class="form-grid"><label class="wide">Customer asset<select class="field" name="assetId" required>'+option(data.assets,selected.id,a=>[a.id,(customer(a.customerId)?.name||"Customer")+" · "+a.name])+'</select></label>'+
    '<label class="wide">Request title<input class="field" name="title" minlength="5" maxlength="100" required placeholder="e.g. Pump inspection and repair"/></label>'+
    '<label>Priority<select class="field" name="priority"><option>Standard</option><option>Urgent</option></select></label>'+
    '<label class="wide">Reported problem<textarea class="field" name="description" rows="3" maxlength="320" required placeholder="Describe the equipment fault or service requirement"></textarea></label></div>'+
    '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn primary" type="submit">Create request</button></div></form>';
  }else if(x.type==="assign"){
   const j=ticket(x.id);
   const tomorrow=new Date(Date.now()+86400000);
   const localDate=new Date(tomorrow.getTime()-tomorrow.getTimezoneOffset()*60000).toISOString().slice(0,16);
   content=j?'<h2>Assign technician</h2><p class="muted">'+esc(j.id)+' · '+esc(j.title)+'</p>'+
    '<div class="info-panel"><b>'+esc(customer(j.customerId)?.name||"Customer")+'</b><p>'+esc(asset(j.assetId)?.name||"Asset")+'</p></div>'+
    '<form data-form="assign" data-id="'+esc(j.id)+'"><div class="form-grid">'+
    '<label>Technician<select class="field" name="techId">'+option(data.technicians,TECH,t=>[t.id,t.name])+'</select></label>'+
    '<label>Scheduled visit<input class="field" type="datetime-local" name="schedule" value="'+localDate+'" required/></label></div>'+
    '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn primary" type="submit">Confirm assignment</button></div></form>':empty("Job not found.");
  }else if(x.type==="job"){
   const j=ticket(x.id),report=j&&latest(j);
   content=j?'<h2>Service job '+esc(j.id)+'</h2><p class="muted">'+esc(j.title)+'</p>'+
    '<div class="info-panel"><div class="row">'+pill(j.status)+pill(j.priority)+'</div><p>'+esc(j.description)+'</p><div class="info-grid">'+
    '<span>Customer<b>'+esc(customer(j.customerId)?.name||"Customer")+'</b></span><span>Asset<b>'+esc(asset(j.assetId)?.name||"Asset")+'</b></span>'+
    '<span>Technician<b>'+esc(data.technicians.find(t=>t.id===j.techId)?.name||"Unassigned")+'</b></span><span>Visit<b>'+fmtDate(j.scheduledAt)+'</b></span></div></div>'+
    (report?'<div class="section-mini"><h3>Latest technician report</h3><p>'+esc(report.notes)+'</p>'+
      core.CHECKS.map(item=>{const status=report.checks.find(c=>c.id===item.id)?.result||"—";return '<div class="history-row"><span>'+esc(item.title)+'</span>'+pill(status)+'</div>'}).join("")+
      '<p class="muted tiny">Labour: '+report.hours+' hours · Report '+esc(report.id)+'</p></div>':'')+
    (j.partsUsed.length?'<div class="section-mini"><h3>Spare parts used</h3>'+j.partsUsed.map(u=>'<div class="history-row"><span>'+esc(part(u.partId)?.name||"Part")+'</span><b>'+u.qty+' × '+money(u.unitPrice)+'</b></div>').join("")+'</div>':'')+
    (j.reviewNote&&j.status==="Returned"?'<div class="notice alert">Manager return reason: '+esc(j.reviewNote)+'</div>':'')+
    '<div class="modal-actions">'+btn("Close","close")+(is("dispatcher")&&j.status==="New"?'<button class="btn primary" data-act="assign" data-id="'+esc(j.id)+'">Assign technician</button>':'')+'</div>':empty("Job not found.");
  }else if(x.type==="part"){
   const j=ticket(x.id);
   content=j?'<h2>Record spare-parts usage</h2><p class="muted">'+esc(j.id)+' · '+esc(j.title)+'</p>'+
    '<form data-form="part" data-id="'+esc(j.id)+'"><div class="form-grid"><label class="wide">Part<select class="field" name="partId">'+option(data.parts,null,p=>[p.id,p.name+" · "+p.stock+" in stock"])+'</select></label>'+
    '<label>Quantity used<input class="field" name="qty" type="number" min="1" step="1" required placeholder="e.g. 2"/></label></div>'+
    '<div class="notice section">Parts are deducted from stock immediately and carried into the sample invoice at the recorded rate.</div>'+
    '<div class="modal-actions">'+btn("Cancel","close")+'<button type="submit" class="btn primary">Record part issue</button></div></form>':empty("Job not found.");
  }else if(x.type==="report"){
   const j=ticket(x.id);
   content=j?'<h2>Submit technician report</h2><p class="muted">'+esc(j.id)+' · '+esc(j.title)+'</p>'+
    '<form data-form="report" data-id="'+esc(j.id)+'"><div class="checklist"><h3>Service checklist · complete all four checks</h3>'+
    core.CHECKS.map((check,index)=>'<label class="check-row"><div><span>'+(index+1)+'.</span> <b>'+esc(check.title)+'</b></div>'+
      '<select class="field" name="check-'+esc(check.id)+'" required><option value="">Select result</option><option value="Pass">Pass</option><option value="Attention">Needs attention</option></select></label>').join("")+'</div>'+
    '<div class="form-grid"><label>Labour hours<input class="field" name="hours" type="number" min="0.25" max="24" step="0.25" required placeholder="e.g. 2"/></label>'+
    '<label class="wide">Service work notes<textarea class="field" name="notes" rows="3" maxlength="400" required placeholder="Describe work completed, testing and any outstanding issues"></textarea></label></div>'+
    '<div class="notice section">If any check needs attention, the manager must return the job for correction before approving it.</div>'+
    '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn primary" type="submit">Submit for manager review</button></div></form>':empty("Job not found.");
  }else if(x.type==="review"){
   const j=ticket(x.id),report=j&&latest(j);
   content=j&&report?'<h2>Review service work</h2><p class="muted">'+esc(j.id)+' · '+esc(j.title)+'</p>'+
    '<div class="info-panel"><b>Technician: '+esc(data.technicians.find(t=>t.id===j.techId)?.name||"Technician")+'</b><p>'+esc(report.notes)+'</p><p>Labour: '+report.hours+' hours</p></div>'+
    '<div class="checklist">'+core.CHECKS.map(item=>{
     const result=report.checks.find(c=>c.id===item.id)?.result||"—";
     return '<div class="review-check"><span>'+esc(item.title)+'</span>'+pill(result)+'</div>';
    }).join("")+'</div>'+
    '<div class="section-mini"><h3>Manager review</h3><p class="muted">Approval requires every check to pass. A returned job can be resumed and resubmitted.</p></div>'+
    '<form data-form="return" data-id="'+esc(j.id)+'"><label class="field-label">Reason for returning (required for return)</label>'+
    '<textarea class="field" name="reason" rows="2" maxlength="220" placeholder="Explain corrections needed before approval"></textarea>'+
    '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn" type="submit">Return for rework</button>'+
    '<button class="btn primary" data-act="approve" data-id="'+esc(j.id)+'" type="button">Approve passing work</button></div></form>':empty("Report not found.");
  }else if(x.type==="invoice"){
   const i=invoice(x.id);
   content=i?'<h2>Sample invoice</h2><p class="muted">Printable concept, not an official tax document or proof of payment.</p>'+invoiceHtml(i)+
    '<div class="modal-actions">'+btn("Close","close")+'<button class="btn primary" data-act="print">Print / Save PDF</button></div>':empty("Invoice not found.");
  }else if(x.type==="payment"){
   const i=invoice(x.id);
   content=i?'<h2>Record simulated payment</h2><p class="muted">'+esc(i.id)+' · Amount '+money(i.total)+'</p>'+
    '<div class="notice">This records a fictional payment locally. No mobile-money prompt, transaction request or cash movement occurs.</div>'+
    '<form data-form="payment" data-id="'+esc(i.id)+'"><label class="field-label">Demo payment method</label>'+
    '<select class="field" name="method"><option value="Cash">Cash (simulated)</option><option value="M-Pesa (simulated)">M-Pesa (simulated)</option></select>'+
    '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn primary" type="submit">Mark sample invoice paid</button></div></form>':empty("Invoice not found.");
  }
  return '<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="Field service action"><div class="modal-head"><span>NORTHSTAR · INTERACTIVE CONCEPT</span><button class="close" data-act="close" aria-label="Close dialog">×</button></div>'+content+'</section></div>';
 }
 let lastDesktopViewKey=null;
function render(){
 const viewKey=[ui.role,ui.view].join(':');
 const previousPosition=document.scrollingElement?.scrollTop||0;
 const preservePosition=lastDesktopViewKey===viewKey;
  const views={overview,tickets,mywork,reviews,maintenance,parts,billing,reports,settings};
  if(!allowed(ui.view))ui.view=roles[ui.role].start;
  const name=nav.find(([id])=>id===ui.view)?.[1]||"Overview";
  root.innerHTML='<div class="app-shell"><aside class="sidebar"><div class="logo"><div class="logo-icon">N</div><div><b>Northstar</b><small>FIELD SERVICES · DEMO</small></div></div>'+
   '<a class="back-site" href="/demos/field-services">← Back to JoelTechGeek</a><div class="nav-label">FIELD WORKSPACE</div>'+
   '<nav class="side-nav" aria-label="Field service navigation">'+nav.filter(([id])=>allowed(id)).map(([id,label,icon])=>'<button class="nav-link '+(ui.view===id?"active":"")+'" data-nav="'+id+'"><span>'+icon+'</span>'+esc(label)+'</button>').join("")+'</nav>'+
   '<div class="sidebar-foot"><b>● FICTIONAL SERVICE ENVIRONMENT</b><p>No real customers, technicians, payment processing or service approvals.</p><button data-act="reset">↻ Reset sample</button></div></aside>'+
   '<div class="workspace"><header class="topbar"><div class="breadcrumb"><a class="mobile-back" href="/demos/field-services" aria-label="Back to JoelTechGeek">←</a><span>Northstar</span><span>/</span><b>'+esc(name)+'</b></div>'+
   '<div class="top-right"><span class="concept">Interactive concept</span><label class="sr-only" for="role-select">Simulated role</label><select class="role-select" id="role-select">'+
   Object.entries(roles).map(([id,r])=>'<option value="'+id+'" '+(is(id)?"selected":"")+'>'+esc(r.name)+'</option>').join("")+'</select>'+
   '<span class="avatar">'+({dispatcher:"GO",technician:"DK",manager:"NM",billing:"AW"}[ui.role])+'</span></div></header>'+
   '<main class="content">'+views[ui.view]()+'</main></div>'+
   '<nav class="bottom-nav" aria-label="Mobile demo navigation">'+nav.filter(([id])=>allowed(id)).map(([id,label,icon])=>'<button class="'+(ui.view===id?"active":"")+'" data-nav="'+id+'"><span>'+icon+'</span><small>'+esc(label)+'</small></button>').join("")+'</nav></div>'+
   (ui.message?'<div class="toast" role="status"><span>'+esc(ui.message)+'</span><button data-act="dismiss" aria-label="Dismiss notification">×</button></div>':'')+
   modal()+
   (ui.modal?.type==="invoice"&&invoice(ui.modal.id)?'<div class="print-only">'+invoiceHtml(invoice(ui.modal.id))+'</div>':'');
 if(preservePosition&&document.scrollingElement)document.scrollingElement.scrollTop=previousPosition;
 lastDesktopViewKey=viewKey;
 }
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(error){ui.message="Browser storage unavailable; changes are temporary.";}}
 function notify(message){ui.message=message;render();}
 function safe(fn){try{fn()}catch(error){notify(error?.message||"The demo action could not be completed.");}}
 function switchRole(role){if(!roles[role])return;ui.role=role;ui.view=roles[role].start;ui.modal=null;notify("Switched to "+roles[role].name+" (simulated).");}
 function navigate(view){if(!allowed(view))return;ui.view=view;ui.modal=null;ui.message="";render();}
 document.addEventListener("click",event=>{
  const el=event.target.closest("[data-nav],[data-act]");
  if(!el||!root.contains(el))return;
  if(el.dataset.nav){navigate(el.dataset.nav);return;}
  const act=el.dataset.act,id=el.dataset.id;
  if(act==="dismiss"){ui.message="";render();return;}
  if(act==="close"){ui.modal=null;ui.message="";render();return;}
  if(act==="role"){switchRole(el.dataset.role);return;}
  if(act==="reset"){
   if(!window.confirm("Reset all fictional Northstar Field Services data in this browser?"))return;
   data=core.seed();ui.modal=null;ui.view=roles[ui.role].start;persist();notify("Sample field-service data restored.");return;
  }
  if(act==="new-job"&&is("dispatcher")){ui.modal={type:"new-job"};render();return;}
  if(act==="asset-request"&&is("dispatcher")){ui.modal={type:"new-job",assetId:id};render();return;}
  if(act==="assign"&&is("dispatcher")){ui.modal={type:"assign",id};render();return;}
  if(act==="start"&&is("technician")){safe(()=>{
   core.startJob(data,id,TECH);persist();notify("Service visit started. Record parts and complete the checklist.");});return;}
  if(act==="part"&&is("technician")){ui.modal={type:"part",id};render();return;}
  if(act==="report"&&is("technician")){ui.modal={type:"report",id};render();return;}
  if(act==="review"&&is("manager")){ui.modal={type:"review",id};render();return;}
  if(act==="approve"&&is("manager")){safe(()=>{
   core.reviewJob(data,id,"Approve");persist();ui.modal=null;notify("Passing service report approved. Billing may now create an invoice.");});return;}
  if(act==="invoice-create"&&is("billing")){safe(()=>{
   const i=core.createInvoice(data,id);persist();ui.modal={type:"invoice",id:i.id};notify("Sample invoice "+i.id+" generated.");});return;}
  if(act==="payment"&&is("billing")){ui.modal={type:"payment",id};render();return;}
  if(act==="invoice"){ui.modal={type:"invoice",id};render();return;}
  if(act==="job"){ui.modal={type:"job",id};render();return;}
  if(act==="print"){window.print();return;}
 });
 document.addEventListener("change",event=>{
  const el=event.target;if(!root.contains(el))return;
  if(el.id==="role-select")switchRole(el.value);
 });
 document.addEventListener("submit",event=>{
  const form=event.target,kind=form.dataset?.form;
  if(!kind||!root.contains(form))return;
  event.preventDefault();
  safe(()=>{
   const fields=Object.fromEntries(new FormData(form).entries());
   let message="";
   if(kind==="new-job"&&is("dispatcher")){
    const a=asset(fields.assetId);if(!a)throw new Error("Choose a registered customer asset.");
    const j=core.createTicket(data,{...fields,customerId:a.customerId});
    message="New service request "+j.id+" created.";
   }else if(kind==="assign"&&is("dispatcher")){
    core.assignTicket(data,form.dataset.id,fields.techId,fields.schedule);
    message="Technician assigned and visit scheduled.";
   }else if(kind==="part"&&is("technician")){
    core.usePart(data,form.dataset.id,TECH,fields.partId,fields.qty);
    message="Spare part usage recorded. Inventory updated.";
   }else if(kind==="report"&&is("technician")){
    const checks=core.CHECKS.map(check=>({id:check.id,result:fields["check-"+check.id]}));
    core.submitReport(data,form.dataset.id,TECH,{hours:fields.hours,notes:fields.notes,checks});
    message="Service report submitted for manager review.";
   }else if(kind==="return"&&is("manager")){
    core.reviewJob(data,form.dataset.id,"Return",fields.reason);
    message="Job returned to technician with a correction reason.";
   }else if(kind==="payment"&&is("billing")){
    core.recordPayment(data,form.dataset.id,fields.method);
    message="Sample invoice marked paid. No real payment occurred.";
   }else return;
   persist();ui.modal=null;notify(message);
  });
 });
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&ui.modal){ui.modal=null;render();}
 });
 render();
})(fieldCore);
