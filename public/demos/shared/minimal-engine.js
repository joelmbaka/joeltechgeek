const initMinimalDemo=function initMinimalDemo(def){
  "use strict";
  const root=document.getElementById("app");
  if(!root)throw new Error("Demo mount element is missing.");
  const KEY="joeltechgeek-mini-"+def.slug+"-v1";
  const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const roleMap=Object.fromEntries(def.roles.map(r=>[r.id,r]));
  function load(){
    try{
      const val=JSON.parse(localStorage.getItem(KEY)||"null");
      if(val&&val.version===1&&Array.isArray(val.activity)&&def.valid(val))return val;
    }catch(e){}
    return def.seed();
  }
  let data=load();
  const ui={role:def.roles[0].id,view:"overview",message:""};
  const role=id=>roleMap[id];
  const status=step=>step.done(data)?"completed":step.ready(data)?"available":"blocked";
  const stats=()=>def.metrics(data).map(m=>'<div class="stat"><div class="stat-top"><span>'+esc(m.label)+'</span><span class="mini-dot">●</span></div><strong>'+esc(m.value)+'</strong><small>'+esc(m.detail||"")+'</small></div>').join("");
  const formField=(field,stepId)=>{
    const label=esc(field.label),name=esc(field.name);
    const required=field.required===false?"":" required";
    if(field.type==="select"){
      const opts=typeof field.options==="function"?field.options(data):field.options;
      return '<label>'+label+'<select class="field" name="'+name+'"'+required+'>'+
        (field.placeholder?'<option value="">'+esc(field.placeholder)+'</option>':"")+
        opts.map(o=>'<option value="'+esc(o.value)+'">'+esc(o.label)+'</option>').join("")+'</select></label>';
    }
    if(field.type==="textarea")return '<label class="wide">'+label+'<textarea class="field" name="'+name+'" rows="3" maxlength="'+(field.maxlength||250)+'" placeholder="'+esc(field.placeholder||"")+'"'+required+'></textarea></label>';
    return '<label>'+label+'<input class="field" name="'+name+'" type="'+esc(field.type||"text")+'"'+
       (field.min!==undefined?' min="'+esc(field.min)+'"':"")+
       (field.max!==undefined?' max="'+esc(field.max)+'"':"")+
       (field.step!==undefined?' step="'+esc(field.step)+'"':"")+
       (field.maxlength!==undefined?' maxlength="'+esc(field.maxlength)+'"':"")+
       ' placeholder="'+esc(field.placeholder||"")+'"'+(field.value!==undefined?' value="'+esc(field.value)+'"':"")+required+'/></label>';
  };
  const stepsHtml=()=>def.steps.map((s,i)=>{
    const st=status(s),mine=ui.role===s.role,canSubmit=mine&&s.ready(data);
    const cls=st==="completed"?"done":st==="available"?"ready":"locked";
    const tag=st==="completed"?"Completed":st==="available"?"Ready":"Waiting";
    return '<article class="step '+cls+'" id="step-'+esc(s.id)+'">'+
      '<div class="step-number">'+String(i+1).padStart(2,"0")+'</div>'+
      '<div class="step-main"><div class="step-heading"><div><small>'+esc(role(s.role).name)+' · '+esc(s.category||"Workflow")+'</small><h3>'+esc(s.title)+'</h3></div><span class="pill '+cls+'">'+tag+'</span></div>'+
      '<p>'+esc(s.description)+'</p>'+
      (canSubmit?'<form data-step="'+esc(s.id)+'"><div class="form-grid">'+(s.fields||[]).map(f=>formField(f,s.id)).join("")+'</div><button class="btn primary" type="submit">'+esc(s.button||"Save step")+' →</button></form>':
       mine?'<div class="step-note">'+esc(st==="completed"?(s.completedText||"This action has been completed."):s.blockedText||"Complete the preceding steps first.")+'</div>':
       '<button class="link switch" type="button" data-role="'+esc(s.role)+'">Switch to '+esc(role(s.role).name)+' →</button>')+
      '</div></article>';
  }).join("");
  const shortWorkflow=()=>'<div class="path">'+def.steps.map((s,i)=>{
    const cls=status(s)==="completed"?"completed":status(s)==="available"?"available":"blocked";
    return '<div class="path-item '+cls+'"><span class="path-num">'+(i+1)+'</span><div><b>'+esc(s.title)+'</b><small>'+esc(role(s.role).name)+'</small></div></div>';
  }).join("")+'</div>';
  const records=()=>def.sections.map(s=>{
    const rows=s.rows(data);
    return '<section class="card section"><div class="section-head"><h2>'+esc(s.title)+'</h2><p>'+esc(s.description||"")+'</p></div>'+
      (rows.length?'<div class="table-scroll"><table><thead><tr>'+s.columns.map(col=>'<th>'+esc(col.title)+'</th>').join("")+'</tr></thead><tbody>'+
        rows.map(row=>'<tr>'+s.columns.map(col=>'<td>'+esc(row[col.key]??"—")+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>':
       '<div class="empty">No records yet. Complete a workflow step to see records appear here.</div>')+'</section>';
  }).join("");
  function render(){
    const num=def.steps.filter(s=>s.done(data)).length,total=def.steps.length;
    const navs=[["overview","Overview","▦"],["workflow","Interactive workflow","⇄"],["records","Records & reports","▤"]];
    root.innerHTML='<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-icon">'+esc(def.mark||"◆")+'</div><div><b>'+esc(def.product)+'</b><small>'+esc(def.category)+' · DEMO</small></div></div>'+
      '<a class="back" href="/demos/'+esc(def.slug)+'">← Back to JoelTechGeek</a>'+
      '<div class="nav-caption">SIMULATED WORKSPACE</div><nav aria-label="Demo navigation" class="side-nav">'+navs.map(([id,name,ico])=>'<button class="nav-item '+(ui.view===id?"active":"")+'" data-nav="'+id+'"><span>'+ico+'</span>'+name+'</button>').join("")+'</nav>'+
      '<div class="side-footer"><b>● FICTIONAL DATA</b><p>No production connection, actual transactions or real customer records.</p><button data-reset="true">↻ Reset demo</button></div></aside>'+
      '<div class="main-wrap"><header class="topbar"><div class="crumb"><a class="mobile-back" href="/demos/'+esc(def.slug)+'">←</a><span>'+esc(def.product)+'</span><span>/</span><b>'+esc(navs.find(n=>n[0]===ui.view)[1])+'</b></div>'+
      '<div class="top-right"><span class="concept">Interactive concept</span><label for="role-select" class="sr-only">Simulated team member</label><select id="role-select" class="role-select">'+def.roles.map(r=>'<option value="'+esc(r.id)+'"'+(ui.role===r.id?" selected":"")+'>'+esc(r.name)+'</option>').join("")+'</select></div></header>'+
      '<main class="content"><div class="page-heading"><div><div class="eyebrow">'+esc(def.category.toUpperCase())+' · '+esc(ui.view.toUpperCase())+'</div><h1>'+esc(ui.view==="overview"?def.headline:ui.view==="workflow"?"Interactive workflow":"Demo records & reports")+'</h1><p>'+esc(ui.view==="overview"?def.intro:ui.view==="workflow"?"Work through each operation by switching simulated staff roles. All changes remain in this browser.": "Review the fictional records generated by your actions.")+'</p></div>'+
      (ui.view!=="workflow"?'<button class="btn primary" data-nav="workflow">Try the workflow →</button>':'')+'</div>'+
      (ui.view==="overview"?'<section class="hero"><div><span>EXISTING PRODUCT · INTERACTIVE CONCEPT</span><h2>'+esc(def.hero)+'</h2><p>'+esc(def.heroDescription)+'</p></div><div class="hero-count"><small>Completed stages</small><strong>'+num+' / '+total+'</strong><span>Reset to try again</span></div></section>'+
       '<div class="stats">'+stats()+'</div><div class="two-col"><section class="card"><div class="section-head"><h2>How the workflow connects</h2><p>Each stage updates the same sample records.</p></div>'+shortWorkflow()+'</section>'+
       '<section class="card"><div class="section-head"><h2>Activity log</h2><p>Changes made in this browser.</p></div>'+activity()+'</section></div>':
       ui.view==="workflow"?'<div class="workflow-grid"><section class="card process"><div class="section-head"><h2>Run the demo</h2><p>Role: <b>'+esc(role(ui.role).name)+'</b> · Follow the sequence below.</p></div>'+stepsHtml()+'</section><aside class="sidebar-right"><section class="card hint"><h2>How to use this demo</h2><p>'+esc(def.instructions)+'</p><div class="progress"><span style="width:'+(100*num/total)+'%"></span></div><small>'+num+' of '+total+' milestones completed</small></section><section class="card hint"><h2>Sample activity</h2>'+activity(5)+'</section></aside></div>':
       '<div class="stats">'+stats()+'</div>'+records())+
      '<div class="notice"><b>Demo only.</b> '+esc(def.disclaimer)+' Fictional sample data is stored only in this browser. Role switching does not authenticate users or enforce backend permissions.</div>'+
      '</main></div><nav class="mobile-nav" aria-label="Mobile demo navigation">'+navs.map(([id,name,ico])=>'<button data-nav="'+id+'" class="'+(ui.view===id?"active":"")+'"><span>'+ico+'</span><small>'+name+'</small></button>').join("")+'</nav></div>'+
      (ui.message?'<div class="toast" role="status"><span>'+esc(ui.message)+'</span><button data-dismiss="true" aria-label="Dismiss message">×</button></div>':'');
  }
  function activity(limit=6){
    return '<div class="activity">'+(data.activity.length?data.activity.slice(0,limit).map(a=>'<div class="event"><span class="dot"></span><div><b>'+esc(a.title)+'</b><p>'+esc(a.detail)+'</p></div></div>').join(""):'<div class="empty">No demo activity yet.</div>')+'</div>';
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(error){ui.message="Storage is unavailable; changes will not survive a reload.";}}
  document.addEventListener("change",ev=>{
    const el=ev.target;
    if(!root.contains(el))return;
    if(el.id==="role-select"&&roleMap[el.value]){ui.role=el.value;ui.message="Switched to "+role(el.value).name+" (simulated).";render();}
  });
  document.addEventListener("click",ev=>{
    const el=ev.target.closest("[data-nav],[data-role],[data-reset],[data-dismiss]");
    if(!el||!root.contains(el))return;
    if(el.dataset.nav){ui.view=el.dataset.nav;ui.message="";render();return;}
    if(el.dataset.role&&roleMap[el.dataset.role]){ui.role=el.dataset.role;ui.message="Switched to "+role(el.dataset.role).name+" (simulated).";render();return;}
    if(el.dataset.dismiss){ui.message="";render();return;}
    if(el.dataset.reset){
      if(!window.confirm("Reset the fictional "+def.product+" demo? Changes in this browser will be lost."))return;
      data=def.seed();ui.view="overview";persist();ui.message="Sample data restored.";render();
    }
  });
  document.addEventListener("submit",ev=>{
    const form=ev.target,id=form.dataset?.step;
    if(!id||!root.contains(form))return;
    ev.preventDefault();
    const step=def.steps.find(s=>s.id===id);
    if(!step||step.role!==ui.role||!step.ready(data)){ui.message="This step is not available for the selected role or current state.";render();return;}
    try{
      const fields=Object.fromEntries(new FormData(form).entries());
      const result=step.run(data,fields);
      data.activity.unshift({title:step.title,detail:result||"Fictional workflow step completed."});
      persist();
      ui.message=result||"Workflow step completed.";
    }catch(error){ui.message=error?.message||"Unable to complete action.";}
    render();
  });
  render();
};
