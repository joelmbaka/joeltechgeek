(function constructionApp(core){
  "use strict";
  const KEY="joeltechgeek-siteflow-demo-v1";
  const root=document.getElementById("app");
  const nav=[
    ["overview","Site overview","▦"],["tasks","Site tasks","▤"],["requests","Material requests","⇄"],
    ["materials","Store & stock","▥"],["purchases","Purchasing","▣"],
    ["costs","Site expenses","◇"],["reports","Project reports","▧"],["settings","Demo settings","⚙"]
  ];
  const roles={
    manager:{label:"Nia · Project Manager",views:["overview","tasks","requests","materials","purchases","costs","reports","settings"],start:"overview"},
    supervisor:{label:"Peter · Supervisor",views:["overview","tasks","requests","settings"],start:"tasks"},
    storekeeper:{label:"Asha · Storekeeper",views:["overview","requests","materials","purchases","settings"],start:"requests"},
    accountant:{label:"Samuel · Accountant",views:["overview","costs","reports","settings"],start:"costs"}
  };
  const escape=s=>String(s===undefined||s===null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const amount=n=>"KES "+new Intl.NumberFormat("en-KE",{maximumFractionDigits:2}).format(Number(n)||0);
  const date=s=>{const dt=new Date(s);return Number.isNaN(dt.getTime())?"—":new Intl.DateTimeFormat("en-KE",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(dt);};
  function load(){
    try{
      const d=JSON.parse(localStorage.getItem(KEY)||"null");
      if(d&&d.version===1&&d.project&&["tasks","materials","requests","purchases","expenses","movements","activity"].every(k=>Array.isArray(d[k])))return d;
    }catch(err){}
    return core.seed();
  }
  let data=load();
  const ui={view:"overview",role:"manager",modal:null,notice:"",deliveryDraft:{}};
  const task=id=>data.tasks.find(x=>x.id===id);
  const material=id=>data.materials.find(x=>x.id===id);
  const purchase=id=>data.purchases.find(x=>x.id===id);
  const request=id=>data.requests.find(x=>x.id===id);
  const can=(view)=>roles[ui.role].views.includes(view);
  const is=(role)=>ui.role===role;
  const progressValue=(p)=>'<div class="progress-bar" role="progressbar" aria-valuenow="'+p+'" aria-valuemin="0" aria-valuemax="100"><div style="width:'+p+'%"></div></div>';
  const empty=text=>'<div class="empty">'+escape(text)+'</div>';
  const badge=s=>'<span class="badge '+(s==="Issued"||s==="Received"||s==="Completed"?"ok":s==="Rejected"?"bad":s==="Pending"?"pending":"open")+'">'+escape(s)+'</span>';
  const btn=(label,action,opts="")=>'<button class="btn" type="button" data-action="'+action+'" '+opts+'>'+label+'</button>';
  const header=(eyebrow,title,description,cta="")=>'<div class="page-head"><div><div class="eyebrow">'+escape(eyebrow)+'</div><h1>'+escape(title)+'</h1><p>'+escape(description)+'</p></div>'+cta+'</div>';
  const stat=(name,value,description,symbol)=>'<div class="stat"><div class="stat-meta"><span>'+escape(name)+'</span><span class="stat-symbol">'+symbol+'</span></div><div class="stat-value">'+value+'</div><div class="stat-help">'+description+'</div></div>';
  const table=(headers,rows)=>'<div class="table-scroll"><table><thead><tr>'+headers.map(h=>'<th>'+escape(h)+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>';
  const option=(list,selected,mapper)=>list.map(x=>{const [value,label]=mapper(x);return '<option value="'+escape(value)+'" '+(value===selected?"selected":"")+'>'+escape(label)+'</option>';}).join("");
  function overview(){
    const m=core.metrics(data);
    const actions={
      manager:['requests','Review requests →'],
      supervisor:['requests','Request materials →'],
      storekeeper:['requests','Issue approved stock →'],
      accountant:['costs','Record site expense →']
    };
    const [dest,label]=actions[ui.role];
    return header("PROJECT COMMAND CENTRE / FICTIONAL DATA","Site overview",
        data.project.name+" · "+data.project.location,
        '<button class="btn primary" data-nav="'+dest+'">'+label+'</button>')+
      '<section class="intro-banner"><div><span class="banner-kicker">ACTIVE DEMO PROJECT</span><h2>'+escape(data.project.name)+'</h2>'+
      '<p>Follow one connected site workflow from a supervisor request to manager approval, store issue, progress, and project costs.</p></div><div class="banner-balance"><span>Illustrative project budget</span><b>'+amount(data.project.budget)+'</b><small>No real client, contract, or accounting records</small></div></section>'+
      '<div class="stats">'+stat("Average task progress",m.progress+"%","Across "+data.tasks.length+" work items","↗")+
      stat("Requests awaiting approval",m.pending,"Manager action needed","◎")+
      stat("Approved issues pending",m.approved,"Stockkeeper action needed","⇄")+
      stat("Estimated costs",amount(m.spent),"Issues + site expenses","◈")+'</div>'+
      '<div class="cols"><section class="card"><div class="section-head"><div><h2>Work programme</h2><p>Task progress updates flow through the project.</p></div>'+(can("tasks")?'<button class="text-link" data-nav="tasks">View tasks →</button>':'')+'</div>'+
      '<div class="stack">'+data.tasks.slice(0,5).map(t=>'<div class="task-preview"><div class="row"><b>'+escape(t.name)+'</b><span>'+t.progress+'%</span></div>'+progressValue(t.progress)+'<div class="muted tiny">'+escape(t.phase)+' · Planned '+t.planned+'%</div></div>').join("")+'</div></section>'+
      '<section class="card"><div class="section-head"><div><h2>Latest activity</h2><p>Actions in this browser, not real site events.</p></div></div>'+
      '<div class="activity">'+(data.activity.length?data.activity.slice(0,6).map(a=>'<div class="activity-item"><span class="activity-dot"></span><div><b>'+escape(a.title)+'</b><p>'+escape(a.detail)+'</p><small>'+date(a.at)+'</small></div></div>').join(""):empty("No activity recorded"))+'</div></section></div>'+
      '<section class="card journey"><div class="section-head"><div><h2>Try the cross-role workflow</h2><p>Use the role selector at the top to act as each fictional team member.</p></div></div><div class="journey-grid">'+
      [["01","Peter · Supervisor","Submit a material request and later update task progress."],["02","Nia · Manager","Approve the request and inspect the project budget."],["03","Asha · Storekeeper","Issue the approved quantity; watch physical stock decrease."],["04","Samuel · Accountant","Record a site expense, then inspect the updated cost report."]].map(x=>'<div><span>'+x[0]+'</span><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div>').join("")+'</div></section>';
  }
  function tasks(){
    return header("SITE DELIVERY / WORK PROGRAMME","Site tasks","Monitor construction activities and record progress with a reason.")+
      '<div class="card"><div class="section-head"><div><h2>Work items</h2><p>Task progress is illustrative; it is not a certified site measurement.</p></div></div>'+
      table(["Work item","Phase","Progress","Target","Status","Action"],
      data.tasks.map(t=>'<tr><td><b>'+escape(t.name)+'</b><span class="sub">'+escape(t.id)+'</span></td><td>'+escape(t.phase)+'</td><td><div class="cell-progress"><b>'+t.progress+'%</b>'+progressValue(t.progress)+'</div></td><td>'+t.planned+'%</td><td>'+badge(t.progress===100?"Completed":t.progress>0?"In progress":"Not started")+'</td><td>'+
      (is("supervisor")&&t.progress<100?'<button class="text-link" data-action="progress" data-id="'+escape(t.id)+'">Update progress →</button>':
      '<button class="text-link" data-action="task" data-id="'+escape(t.id)+'">Details →</button>')+'</td></tr>'))+'</div>'+
      '<section class="card section"><div class="section-head"><div><h2>Progress history</h2><p>Updates show the previous and new completion percentage.</p></div></div>'+
      (data.progressHistory.length?table(["Work item","Change","Note","Time"],data.progressHistory.slice(0,12).map(h=>'<tr><td>'+escape(task(h.taskId)?.name||h.taskId)+'</td><td><b>'+h.from+'% → '+h.to+'%</b></td><td>'+escape(h.note)+'</td><td>'+date(h.at)+'</td></tr>')):empty("No new progress updates yet. Switch to Supervisor to record one."))+'</section>';
  }
  function requests(){
    const cta=is("supervisor")?'<button class="btn primary" data-action="new-request">+ Request materials</button>':"";
    return header("MATERIAL FLOW / CONTROLLED ISSUES","Material requests",
      "Supervisor submits → manager approves → storekeeper issues approved quantities.",cta)+
      '<div class="card"><div class="section-head"><div><h2>Request register</h2><p>Approvals alone do not reduce inventory. Stock changes only when issued.</p></div></div>'+
      table(["Request","Work item","Material","Requested","Issued / remaining","Status","Action"],
      data.requests.map(r=>{const m=material(r.materialId);
        let actions='<button class="text-link" data-action="request" data-id="'+escape(r.id)+'">Details →</button>';
        if(is("manager")&&r.status==="Pending")actions='<button class="text-link" data-action="review" data-id="'+escape(r.id)+'">Review request →</button>';
        if(is("storekeeper")&&["Approved","Partially issued"].includes(r.status))actions='<button class="btn primary mini" data-action="issue" data-id="'+escape(r.id)+'">Issue stock</button>';
        return '<tr><td><b>'+escape(r.id)+'</b><span class="sub">'+date(r.createdAt)+'</span></td><td>'+escape(task(r.taskId)?.name||r.taskId)+'</td><td>'+escape(m?.name||r.materialId)+'</td><td>'+r.qty+' '+escape(m?.unit||"units")+'</td><td>'+r.issuedQty+' / '+(r.qty-r.issuedQty)+' remaining</td><td>'+badge(r.status)+'</td><td>'+actions+'</td></tr>';
      }))+'</div>'+
      '<div class="notice section">Only a manager can approve a request. Storekeepers may issue fewer units than approved, but never more than the remaining approved quantity or available stock. These are simulated roles rather than access-controlled accounts.</div>';
  }
  function materials(){
    const low=data.materials.filter(m=>m.stock<=m.reorder).length;
    return header("PROJECT STORES / INVENTORY","Store & stock","Stock increases when supplier deliveries are received and falls only when approved materials are issued.",
      can("purchases")?'<button class="btn primary" data-nav="purchases">Purchase materials →</button>':"")+
      '<div class="stats compact">'+stat("Material categories",data.materials.length,"Fictional store items","▥")+
      stat("Low-stock items",low,"At or below reorder level","!")+
      stat("Inventory at cost",amount(core.metrics(data).materialValue),"Illustrative weighted-average carrying value","◇")+'</div>'+
      '<section class="card"><div class="section-head"><div><h2>Current balances</h2><p>Physical stock is kept separate from task expenses.</p></div></div>'+
      table(["Material","On hand","Reorder","Average unit cost","Status"],data.materials.map(m=>'<tr><td><b>'+escape(m.name)+'</b><span class="sub">'+escape(m.id)+'</span></td><td><b>'+m.stock+' '+escape(m.unit)+'</b></td><td>'+m.reorder+'</td><td>'+amount(m.cost)+'</td><td>'+badge(m.stock<=m.reorder?"Low stock":"In stock")+'</td></tr>'))+'</section>'+
      '<section class="card section"><div class="section-head"><div><h2>Stock movement history</h2><p>Supplier receipts and issues to work items.</p></div></div>'+
      (data.movements.length?table(["Material","Movement","Source","Value at event","Time"],data.movements.slice(0,20).map(m=>
        '<tr><td>'+escape(material(m.materialId)?.name||m.materialId)+'</td><td><b class="'+(m.qty>0?"positive":"negative")+'">'+(m.qty>0?"+":"")+m.qty+'</b></td><td>'+escape(m.reference)+'</td><td>'+amount(Math.abs(m.qty)*m.unitCost)+'</td><td>'+date(m.at)+'</td></tr>')):empty("Movements appear after a delivery or stock issue."))+'</section>';
  }
  function purchases(){
    const cta=is("manager")?'<button class="btn primary" data-action="new-purchase">+ New purchase order</button>':"";
    const m=core.metrics(data);
    return header("PROCUREMENT / DELIVERIES","Purchasing","Order project materials and receive only the quantities actually delivered.",cta)+
      '<div class="stats compact">'+stat("Open purchase orders",m.openPO,"Draft or partly received","▣")+
      stat("Outstanding order value",amount(m.committed),"Unreceived material value","◇")+
      stat("Completed orders",data.purchases.filter(p=>p.status==="Received").length,"Fully received","✓")+'</div>'+
      '<section class="card"><div class="section-head"><div><h2>Supplier orders</h2><p>Purchase receipts add inventory, not direct project consumption.</p></div></div>'+
      (data.purchases.length?table(["Order","Supplier","Ordered / received","Value","Status","Action"],data.purchases.map(p=>{
        const ordered=p.lines.reduce((n,l)=>n+l.qty,0),received=p.lines.reduce((n,l)=>n+l.receivedQty,0);
        return '<tr><td><b>'+escape(p.id)+'</b><span class="sub">'+date(p.createdAt)+'</span></td><td>'+escape(p.supplier)+'</td><td>'+received+' / '+ordered+' units</td><td>'+amount(p.lines.reduce((n,l)=>n+l.qty*l.unitCost,0))+'</td><td>'+badge(p.status)+'</td><td>'+
          (is("storekeeper")&&p.status!=="Received"?'<button class="btn primary mini" data-action="receive" data-id="'+escape(p.id)+'">Receive stock</button>':'<button class="text-link" data-action="purchase" data-id="'+escape(p.id)+'">Details →</button>')+'</td></tr>';
      })):empty("No purchase orders yet. As Project Manager, create a sample order."))+'</section>';
  }
  function costs(){
    const m=core.metrics(data);
    return header("SITE FINANCE / ILLUSTRATIVE COSTS","Site expenses",
      "Record direct site expenses and review material value issued to work items.",
      is("accountant")?'<button class="btn primary" data-action="new-expense">+ Record expense</button>':"")+
      '<div class="stats compact">'+stat("Direct site expenses",amount(m.expenseCost),"Expense records entered in this demo","◇")+
      stat("Materials issued",amount(m.issuedCost),"Quantity × unit cost when issued","⇄")+
      stat("Estimated direct cost",amount(m.spent),"No VAT or overhead modelling","↗")+'</div>'+
      '<div class="cols"><section class="card"><div class="section-head"><div><h2>Site expense register</h2><p>Fictional direct expenses recorded by Accountant.</p></div></div>'+
      (data.expenses.length?table(["Reference","Category","Description","Amount"],data.expenses.map(e=>'<tr><td><b>'+escape(e.id)+'</b></td><td>'+escape(e.category)+'</td><td>'+escape(e.description)+'</td><td><b>'+amount(e.amount)+'</b></td></tr>')):empty("No expenses recorded."))+'</section>'+
      '<section class="card"><div class="section-head"><div><h2>Consumption by task</h2><p>Only issued material quantities are counted.</p></div></div>'+
      (data.movements.some(x=>x.kind==="issue")?table(["Work item","Consumed material cost"],data.tasks.map(t=>({name:t.name,total:data.movements.filter(x=>x.kind==="issue"&&x.taskId===t.id).reduce((n,x)=>n+Math.abs(x.qty)*x.unitCost,0)})).filter(x=>x.total>0).map(x=>'<tr><td>'+escape(x.name)+'</td><td><b>'+amount(x.total)+'</b></td></tr>')):empty("Issue approved materials to see work-item costs."))+'</section></div>';
  }
  function reports(){
    const m=core.metrics(data),rate=Math.max(0,Math.min(100,m.spent/data.project.budget*100));
    return header("PROJECT INSIGHTS / DEMO ESTIMATES","Project reports",
      "Review work progress, outstanding approvals, stock risk and illustrative direct costs.")+
      '<section class="budget"><div><div class="eyebrow light">ILLUSTRATIVE PROJECT BUDGET</div><h2>'+amount(data.project.budget)+'</h2><p>Project allowance, not a contractual budget or audited financial statement.</p></div>'+
      '<div class="budget-side"><div class="budget-pair"><span>Estimated direct cost</span><b>'+amount(m.spent)+'</b></div>'+
      '<div class="budget-meter"><span style="width:'+rate+'%"></span></div>'+
      '<div class="budget-pair"><span>Illustrative remaining budget</span><b>'+amount(m.budgetRemaining)+'</b></div></div></section>'+
      '<div class="stats">'+stat("Overall task progress",m.progress+"%","Simple mean of demo task progress","↗")+
      stat("Pending manager approvals",m.pending,"Material request queue","◎")+
      stat("Open supplier orders",m.openPO,"May need goods receiving","▣")+
      stat("Low-stock materials",m.lowStock,"Below or at reorder level","!")+'</div>'+
      '<div class="cols"><section class="card"><div class="section-head"><div><h2>Progress by activity</h2><p>Actual vs sample planned percentage.</p></div></div><div class="report-bars">'+
      data.tasks.map(t=>'<div class="report-row"><div class="row"><b>'+escape(t.name)+'</b><span>'+t.progress+'% / '+t.planned+'% planned</span></div>'+
        '<div class="dual-bar"><span class="target" style="width:'+t.planned+'%"></span><span class="actual" style="width:'+t.progress+'%"></span></div></div>').join("")+'</div></section>'+
      '<section class="card"><div class="section-head"><div><h2>Cost composition</h2><p>Amounts respond to stock issuance and direct expense entries.</p></div></div>'+
      '<div class="cost-bars"><div class="cost-line"><span>Issued material cost</span><b>'+amount(m.issuedCost)+'</b></div>'+progressValue(m.spent?Math.round(m.issuedCost/m.spent*100):0)+
      '<div class="cost-line"><span>Direct site expenses</span><b>'+amount(m.expenseCost)+'</b></div>'+progressValue(m.spent?Math.round(m.expenseCost/m.spent*100):0)+
      '<p class="disclaimer">Supplier deliveries increase stock balances; they are not added to cost a second time. These figures omit payroll, accruals, taxes and accounting journals.</p></div></section></div>';
  }
  function settings(){
    return header("DEMO CONTROLS / FICTIONAL DATA","Demo settings","Switch the simulated team view or restore the initial project.")+
      '<div class="cols"><section class="card padded"><h2>Explore each team role</h2><p class="muted">These are interface perspectives, not authenticated user accounts or production permissions.</p>'+
      Object.entries(roles).map(([id,r])=>'<button class="role-option '+(ui.role===id?"selected":"")+'" data-action="role" data-role="'+id+'"><b>'+escape(r.label)+'</b><span>'+ (ui.role===id?"Current view ✓":"Switch view →")+'</span></button>').join("")+'</section>'+
      '<section class="card padded"><h2>Browser-only example</h2><p class="muted">Actions use only localStorage in your current browser. No actual work orders, purchase agreements, messages or payments are created.</p>'+
      '<div class="setting-row"><span>Site tasks</span><b>'+data.tasks.length+'</b></div><div class="setting-row"><span>Material requests</span><b>'+data.requests.length+'</b></div>'+
      '<div class="setting-row"><span>Purchase orders</span><b>'+data.purchases.length+'</b></div><div class="setting-row"><span>Site expenses</span><b>'+data.expenses.length+'</b></div>'+
      '<button class="btn danger full" data-action="reset">Reset fictional project</button></section></div>'+
      '<div class="notice section">A JoelTechGeek Systems industry concept. The project, company, staff, suppliers, quantities, budgets and reports are entirely fictional. This demo does not represent any real client deployment or safety approval.</div>';
  }
  function modal(){
    if(!ui.modal)return "";
    const x=ui.modal;
    let content="";
    if(x.type==="request-new"){
      content='<h2>Request materials</h2><p class="muted">A supervisor request needs manager approval before the storekeeper can issue stock.</p>'+
      '<form data-form="request"><div class="form-grid"><label>Work item<select class="field" name="taskId" required>'+option(data.tasks,null,t=>[t.id,t.name])+'</select></label>'+
      '<label>Material<select class="field" name="materialId" required>'+option(data.materials,null,m=>[m.id,m.name+" · "+m.unit])+'</select></label>'+
      '<label>Quantity requested<input class="field" name="qty" type="number" min="1" step="1" required placeholder="e.g. 12"/></label>'+
      '<label class="wide">Reason / site requirement<textarea class="field" name="note" rows="3" maxlength="220" required placeholder="Why these materials are needed for this work item"></textarea></label></div>'+
      '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn primary" type="submit">Submit request</button></div></form>';
    }else if(x.type==="review"){
      const r=request(x.id),m=material(r?.materialId);
      content=r?'<h2>Review material request</h2><p class="muted">'+escape(r.id)+' · '+escape(task(r.taskId)?.name||r.taskId)+'</p>'+
      '<div class="review-panel"><b>'+r.qty+' '+escape(m?.unit||"units")+' · '+escape(m?.name||"Material")+'</b><p>'+escape(r.note)+'</p><small>Available in store: '+(m?.stock||0)+' '+escape(m?.unit||"units")+'</small></div>'+
      '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn danger" data-action="decision" data-id="'+escape(r.id)+'" data-decision="Rejected">Reject</button><button class="btn primary" data-action="decision" data-id="'+escape(r.id)+'" data-decision="Approved">Approve</button></div>':empty("Request not found.");
    }else if(x.type==="issue"){
      const r=request(x.id),m=material(r?.materialId);
      content=r?'<h2>Issue approved materials</h2><p class="muted">'+escape(r.id)+' · '+escape(task(r.taskId)?.name||r.taskId)+'</p>'+
      '<div class="review-panel"><b>'+escape(m?.name||"Material")+'</b><div class="mini-stats"><span>Approved: <strong>'+r.qty+'</strong></span><span>Issued: <strong>'+r.issuedQty+'</strong></span>'+
      '<span>Remaining: <strong>'+(r.qty-r.issuedQty)+'</strong></span><span>In store: <strong>'+(m?.stock||0)+'</strong></span></div></div>'+
      '<form data-form="issue" data-id="'+escape(r.id)+'"><label>Quantity to issue now<input class="field" name="qty" type="number" min="1" max="'+Math.min(r.qty-r.issuedQty,m?.stock||0)+'" step="1" required placeholder="Actual units being issued"/></label>'+
      '<div class="notice section">You may issue part of the approved quantity. It cannot exceed approved units remaining or stock on hand.</div>'+
      '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn primary" type="submit">Confirm stock issue</button></div></form>':empty("Request not found.");
    }else if(x.type==="request"){
      const r=request(x.id),m=material(r?.materialId);
      content=r?'<h2>Request '+escape(r.id)+'</h2><p class="muted">'+escape(task(r.taskId)?.name||r.taskId)+'</p>'+
      '<div class="review-panel"><b>'+escape(m?.name||"Material")+'</b><p>'+escape(r.note)+'</p><div class="mini-stats"><span>Requested <strong>'+r.qty+'</strong></span><span>Issued <strong>'+r.issuedQty+'</strong></span><span>Outstanding <strong>'+(r.qty-r.issuedQty)+'</strong></span></div></div>'+
      '<div class="row small-gap">'+badge(r.status)+'<small class="muted">Created '+date(r.createdAt)+'</small></div>'+
      (r.issues.length?'<div class="section-mini"><h3>Issue history</h3>'+r.issues.map(i=>'<div class="history-row"><span>'+date(i.at)+'</span><b>'+i.qty+' '+escape(m?.unit||"units")+'</b></div>').join("")+'</div>':'')+
      '<div class="modal-actions">'+btn("Close","close")+'</div>':empty("Request not found.");
    }else if(x.type==="progress"){
      const t=task(x.id);
      content=t?'<h2>Update site progress</h2><p class="muted">'+escape(t.name)+'</p><div class="review-panel"><b>Current progress: '+t.progress+'%</b>'+progressValue(t.progress)+'</div>'+
      '<form data-form="progress" data-id="'+escape(t.id)+'"><div class="form-grid"><label>New completion percentage<input class="field" name="percent" type="number" min="'+Math.min(100,t.progress+1)+'" max="100" step="1" required placeholder="0–100"/></label>'+
      '<label class="wide">Site update note<textarea class="field" name="note" rows="3" maxlength="220" required placeholder="Work completed or site observation"></textarea></label></div>'+
      '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn primary" type="submit">Record progress</button></div></form>':empty("Work item not found.");
    }else if(x.type==="task"){
      const t=task(x.id);
      content=t?'<h2>'+escape(t.name)+'</h2><p class="muted">'+escape(t.id)+' · '+escape(t.phase)+'</p><div class="review-panel"><b>'+t.progress+'% complete</b>'+progressValue(t.progress)+'<p>Sample planned progress: '+t.planned+'%</p><p>Last note: '+escape(t.notes)+'</p></div>'+
      '<div class="modal-actions">'+btn("Close","close")+'</div>':empty("Work item not found.");
    }else if(x.type==="purchase-new"){
      content='<h2>New supplier purchase order</h2><p class="muted">Create a fictional draft order. Goods are added to inventory only when actually received.</p>'+
      '<form data-form="purchase"><div class="form-grid"><label class="wide">Supplier name<input class="field" name="supplier" value="Summit Materials Supply (fictional)" maxlength="100" required/></label>'+
      '<label>Material<select class="field" name="materialId">'+option(data.materials,null,m=>[m.id,m.name+" · "+m.unit])+'</select></label>'+
      '<label>Quantity ordered<input class="field" name="qty" type="number" min="1" step="1" placeholder="e.g. 30" required/></label>'+
      '<label>Unit cost (KES)<input class="field" name="unitCost" type="number" min="0.01" step="0.01" placeholder="e.g. 820" required/></label></div>'+
      '<div class="modal-actions">'+btn("Cancel","close")+'<button type="submit" class="btn primary">Create draft order</button></div></form>';
    }else if(x.type==="receive"){
      const p=purchase(x.id);
      content=p?'<h2>Record supplier delivery</h2><p class="muted">'+escape(p.id)+' · '+escape(p.supplier)+'</p>'+
      '<form data-form="receive" data-id="'+escape(p.id)+'"><div class="receipt-lines">'+p.lines.map(l=>{
        const m=material(l.materialId),remaining=l.qty-l.receivedQty;
        return '<div class="receive-row"><div><b>'+escape(m?.name||"Unknown material")+'</b><span class="sub">Ordered '+l.qty+' · Previously received '+l.receivedQty+' · Remaining '+remaining+' '+escape(m?.unit||"units")+'</span></div>'+
        (remaining?'<label class="receive-input">Received now<input class="field" name="receive-'+escape(l.materialId)+'" type="number" min="0" max="'+remaining+'" step="1" placeholder="0" value="'+escape(ui.deliveryDraft[l.materialId]??"")+'"/></label>':
        '<span class="badge ok">Fully received</span>')+'</div>';
      }).join("")+'</div>'+
      '<div class="notice section">Only confirmed units add to inventory. Enter 0 or leave blank for products not delivered; no item can exceed its remaining ordered balance.</div>'+
      '<div class="modal-actions">'+btn("Cancel","close")+'<button type="submit" class="btn primary">Confirm received quantities</button></div></form>':empty("Purchase order not found.");
    }else if(x.type==="purchase"){
      const p=purchase(x.id);
      content=p?'<h2>Purchase order '+escape(p.id)+'</h2><p class="muted">'+escape(p.supplier)+'</p>'+
      '<div class="row small-gap">'+badge(p.status)+'<small class="muted">Created '+date(p.createdAt)+'</small></div><div class="receipt-lines">'+p.lines.map(l=>
        '<div class="history-row"><div><b>'+escape(material(l.materialId)?.name||"Material")+'</b><span class="sub">Ordered '+l.qty+' · Received '+l.receivedQty+' · Remaining '+(l.qty-l.receivedQty)+'</span></div><b>'+amount(l.unitCost*l.qty)+'</b></div>').join("")+'</div>'+
      (p.receipts.length?'<div class="section-mini"><h3>Delivery history</h3>'+p.receipts.map(r=>'<div class="history-row"><span>'+escape(r.id)+' · '+date(r.at)+'</span><b>'+r.lines.reduce((n,l)=>n+l.qty,0)+' units</b></div>').join("")+'</div>':'')+
      '<div class="modal-actions">'+btn("Close","close")+(is("storekeeper")&&p.status!=="Received"?'<button type="button" class="btn primary" data-action="receive" data-id="'+escape(p.id)+'">Receive stock</button>':'')+'</div>':empty("Purchase order not found.");
    }else if(x.type==="expense-new"){
      content='<h2>Record direct site expense</h2><p class="muted">A fictional cost entry, not a real payment, invoice or accounting journal.</p>'+
      '<form data-form="expense"><div class="form-grid"><label>Expense category<select class="field" name="category">'+
      ["Transport","Equipment hire","Site logistics","Labour support","Other"].map(x=>'<option>'+escape(x)+'</option>').join("")+'</select></label>'+
      '<label>Amount (KES)<input class="field" name="amount" type="number" min="0.01" step="0.01" required placeholder="e.g. 7500"/></label>'+
      '<label class="wide">Description<input class="field" name="description" maxlength="180" required placeholder="Describe the fictional site expense"/></label></div>'+
      '<div class="modal-actions">'+btn("Cancel","close")+'<button class="btn primary" type="submit">Record expense</button></div></form>';
    }
    return '<div class="overlay" data-overlay="true"><section class="modal" role="dialog" aria-modal="true" aria-label="Construction demo action"><header class="modal-bar"><span>AMANI HEIGHTS · CONCEPT DEMO</span><button class="close-btn" data-action="close" aria-label="Close dialog">×</button></header>'+content+'</section></div>';
  }
  function render(){
    const views={overview,tasks,requests,materials,purchases,costs,reports,settings};
    if(!can(ui.view))ui.view=roles[ui.role].start;
    const pageTitle=nav.find(n=>n[0]===ui.view)?.[1]||"Overview";
    root.innerHTML='<div class="app-shell"><aside class="sidebar"><div class="logo"><div class="logo-icon">S</div><div><b>SiteFlow</b><small>CONSTRUCTION · DEMO</small></div></div>'+
      '<a class="back-link" href="/demos/construction">← Back to JoelTechGeek</a><div class="nav-caption">PROJECT WORKSPACE</div><nav class="nav-group" aria-label="Construction demo navigation">'+
      nav.filter(n=>can(n[0])).map(([id,label,icon])=>'<button class="nav-item '+(ui.view===id?"active":"")+'" data-nav="'+id+'"><span>'+icon+'</span>'+escape(label)+'</button>').join("")+'</nav>'+
      '<div class="sidebar-foot"><b>● FICTIONAL WORKSPACE</b><p>No actual site, compliance records, payments or permissions.</p><button data-action="reset">↻ Reset demo</button></div></aside>'+
      '<div class="workspace"><header class="topbar"><div class="crumb"><a class="mobile-back" href="/demos/construction" aria-label="Back to JoelTechGeek">←</a><span>SiteFlow</span><span class="sep">/</span><b>'+escape(pageTitle)+'</b></div>'+
      '<div class="top-actions"><span class="concept">Interactive concept</span><label class="sr-only" for="role-select">Simulated team role</label><select class="role-select" id="role-select">'+
      Object.entries(roles).map(([id,r])=>'<option value="'+id+'" '+(ui.role===id?"selected":"")+'>'+escape(r.label)+'</option>').join("")+
      '</select><span class="avatar">'+({manager:"NM",supervisor:"PO",storekeeper:"AW",accountant:"SK"}[ui.role])+'</span></div></header>'+
      '<main class="content">'+views[ui.view]()+'</main></div>'+
      '<nav class="bottom-nav" aria-label="Mobile navigation">'+nav.filter(n=>can(n[0])).map(([id,label,icon])=>'<button data-nav="'+id+'" class="'+(ui.view===id?"active":"")+'"><span>'+icon+'</span><small>'+escape(label)+'</small></button>').join("")+'</nav></div>'+
      (ui.notice?'<div class="toast" role="status">'+escape(ui.notice)+' <button data-action="dismiss" aria-label="Dismiss message">×</button></div>':"")+
      modal();
  }
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(err){ui.notice="Browser storage unavailable. Demo changes are temporary.";}}
  const notify=s=>{ui.notice=String(s);render();};
  const safe=fn=>{try{fn()}catch(err){notify(err?.message||"Unable to complete action.");}};
  const changeRole=role=>{
    if(!roles[role])return;
    ui.role=role;ui.view=roles[role].start;ui.modal=null;ui.notice="Switched to "+roles[role].label+" (simulated).";render();
  };
  document.addEventListener("click",event=>{
    const target=event.target.closest("[data-nav],[data-action]");
    if(!target||!root.contains(target))return;
    const view=target.dataset.nav,action=target.dataset.action,id=target.dataset.id;
    if(view){if(can(view)){ui.view=view;ui.modal=null;ui.notice="";render();}return;}
    if(action==="dismiss"){ui.notice="";render();return;}
    if(action==="close"){ui.modal=null;ui.notice="";render();return;}
    if(action==="role"){changeRole(target.dataset.role);return;}
    if(action==="reset"){
      if(!window.confirm("Reset this fictional construction project? All changes in this browser will be lost."))return;
      data=core.seed();ui.modal=null;ui.deliveryDraft={};ui.view=roles[ui.role].start;save();notify("Fictional project restored.");return;
    }
    if(action==="new-request"&&is("supervisor")){ui.modal={type:"request-new"};render();return;}
    if(action==="review"&&is("manager")){ui.modal={type:"review",id};render();return;}
    if(action==="decision"&&is("manager")){safe(()=>{
      const r=core.decideRequest(data,id,target.dataset.decision);save();ui.modal=null;notify("Request "+r.status.toLowerCase()+".");
    });return;}
    if(action==="issue"&&is("storekeeper")){ui.modal={type:"issue",id};render();return;}
    if(action==="new-purchase"&&is("manager")){ui.modal={type:"purchase-new"};render();return;}
    if(action==="receive"&&is("storekeeper")){
      const p=purchase(id);if(!p||p.status==="Received"){notify("The order is already fully received.");return;}
      ui.deliveryDraft={};ui.modal={type:"receive",id};render();return;
    }
    if(action==="progress"&&is("supervisor")){ui.modal={type:"progress",id};render();return;}
    if(action==="new-expense"&&is("accountant")){ui.modal={type:"expense-new"};render();return;}
    if(action==="request"||action==="task"||action==="purchase"){ui.modal={type:action,id};render();return;}
  });
  document.addEventListener("change",event=>{
    const target=event.target;
    if(!root.contains(target))return;
    if(target.id==="role-select"){changeRole(target.value);}
  });
  document.addEventListener("input",event=>{
    const target=event.target;
    if(!root.contains(target))return;
    if(target.name?.startsWith("receive-"))ui.deliveryDraft[target.name.slice(8)]=target.value;
  });
  document.addEventListener("submit",event=>{
    const form=event.target,kind=form.dataset?.form;
    if(!kind||!root.contains(form))return;
    event.preventDefault();
    safe(()=>{
      const fields=Object.fromEntries(new FormData(form).entries());
      let message="";
      if(kind==="request"&&is("supervisor")){
        const r=core.requestMaterial(data,fields.taskId,fields.materialId,fields.qty,fields.note);
        message="Material request "+r.id+" submitted for manager approval.";
      }else if(kind==="issue"&&is("storekeeper")){
        const r=core.issueMaterial(data,form.dataset.id,fields.qty);
        message=r.issuedQty+" / "+r.qty+" units issued. "+r.status+".";
      }else if(kind==="progress"&&is("supervisor")){
        const update=core.updateProgress(data,form.dataset.id,fields.percent,fields.note);
        message="Progress recorded: "+update.to+"%.";
      }else if(kind==="purchase"&&is("manager")){
        const po=core.createPurchase(data,fields.supplier,[{materialId:fields.materialId,qty:fields.qty,unitCost:fields.unitCost}]);
        message="Draft order "+po.id+" created; stock unchanged until receipt.";
      }else if(kind==="receive"&&is("storekeeper")){
        const p=purchase(form.dataset.id);if(!p)throw new Error("Purchase order not found.");
        const delivery=p.lines.filter(l=>l.receivedQty<l.qty).map(l=>({materialId:l.materialId,qty:fields["receive-"+l.materialId]===""?"0":fields["receive-"+l.materialId]??"0"}));
        const units=delivery.reduce((n,l)=>n+(Number(l.qty)||0),0);
        const po=core.receivePurchase(data,p.id,delivery);
        ui.deliveryDraft={};message=units+" units received. "+po.status+".";
      }else if(kind==="expense"&&is("accountant")){
        const expense=core.addExpense(data,fields.category,fields.description,fields.amount);
        message="Site expense "+expense.id+" recorded; project costs updated.";
      }else return;
      save();ui.modal=null;notify(message);
    });
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&ui.modal){ui.modal=null;render();}
  });
  render();
})(constructionCore);
