const initMinimalDemo=function app(def){
"use strict";
const root=document.getElementById("app"),KEY="joeltechgeek-mini-"+def.slug+"-v1";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sectionsByRole={education:{admin:[0],guardian:[0,1,2],finance:[1,2]},property:{manager:[0,1,2],finance:[0,1]},healthcare:{reception:[0],nurse:[0],clinician:[0,1],cashier:[1,2]}};
const moduleTitle={education:{admin:"Term billing",guardian:"Parent account",finance:"Finance & payments"},property:{manager:"Property operations",finance:"Rent allocation"},healthcare:{reception:"Patient reception",nurse:"Triage desk",clinician:"Consultation desk",cashier:"Service billing"}};
const roleNames=Object.fromEntries(def.roles.map(r=>[r.id,r.name]));
const nav=[["home","Overview","▦"],["work","Workspace","▤"],["records","Records","☷"]];
let state;
try{state=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
if(!(state?.version===1&&Array.isArray(state.activity)&&def.valid(state)))state=def.seed();
const ui={role:def.roles[0].id,view:"home",modal:null,message:""};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){ui.message="Storage unavailable; changes may not persist."}};
const title=()=>moduleTitle[def.slug]?.[ui.role]||"Operations";
const available=()=>def.steps.filter(s=>s.role===ui.role&&s.ready(state));
const action=(label,id)=>'<button type="button" class="btn primary" data-action="'+esc(id)+'">'+esc(label)+'</button>';
const metrics=()=>'<div class="metrics">'+def.metrics(state).map(m=>'<div class="metric"><small>'+esc(m.label)+'</small><strong>'+esc(m.value)+'</strong><span>'+esc(m.detail||"")+'</span></div>').join("")+'</div>';
function registers(filter){
 const indexes=sectionsByRole[def.slug]?.[ui.role];
 return def.sections.map((sec,i)=>{
  if(filter&&indexes&&!indexes.includes(i))return "";
  const rows=sec.rows(state);
  return '<section class="data-section"><div class="subhead"><h2>'+esc(sec.title)+'</h2></div><p>'+esc(sec.description||"")+'</p>'+
    (rows.length?'<div class="table-wrap"><table><thead><tr>'+sec.columns.map(c=>'<th>'+esc(c.title)+'</th>').join("")+'</tr></thead><tbody>'+
    rows.map(row=>'<tr>'+sec.columns.map(c=>'<td>'+esc(row[c.key]??"—")+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>':
    '<div class="empty"><strong>No entries yet</strong><p>Records appear here as your team works.</p></div>')+'</section>';
 }).join("");
}
function actions(){
 const ready=available();
 return '<div class="operation-buttons">'+(ready.length?ready.map(s=>action(s.button||s.title,s.id)).join(""):
  '<div class="notice">No action is available for this account right now. You can review existing records or switch team members.</div>')+'</div>';
}
const heading=(k,t,desc)=>'<div class="heading"><small>'+esc(k)+'</small><h1>'+esc(t)+'</h1><p>'+esc(desc)+'</p></div>';
function home(){
 return heading(def.category.toUpperCase(),def.headline,def.intro)+
 '<section class="app-feature"><span>'+esc(def.category)+'</span><h2>'+esc(def.hero)+'</h2><p>'+esc(def.heroDescription)+'</p></section>'+
 metrics()+'<section class="section-panel"><div class="subhead"><h2>'+esc(title())+'</h2><button class="text-link" data-nav="work">Open →</button></div>'+
 actions()+'</section><div class="subhead"><h2>Recent activity</h2></div>'+activity()+
 '<div class="notice">All information and transactions are fictional. There is no backend or live account access.</div>';
}
function activity(){
 return '<div class="activity-list">'+(state.activity.length?state.activity.slice(0,6).map(a=>
 '<article class="activity-item"><span class="bullet">●</span><div><b>'+esc(a.title)+'</b><p>'+esc(a.detail)+'</p></div></article>').join(""):
 '<div class="empty"><strong>No activity yet</strong><p>Your actions will appear here.</p></div>')+'</div>';
}
function work(){
 return heading(def.category.toUpperCase(),title(),"Work with current records and role-specific actions.")+
 '<section class="section-panel"><div class="subhead"><h2>Available actions</h2><span>'+available().length+' available</span></div>'+actions()+'</section>'+registers(true);
}
function records(){
 return heading("OPERATIONS REGISTER","Records & reports","Current fictional business data across this workspace.")+metrics()+registers(false);
}
function field(f){
 const value=f.value!==undefined?String(f.value):"";
 const options=typeof f.options==="function"?f.options(state):f.options;
 const required=f.required===false?"":" required";
 if(f.type==="select")return '<label>'+esc(f.label)+'<select name="'+esc(f.name)+'"'+required+'>'+
   (f.placeholder?'<option value="">'+esc(f.placeholder)+'</option>':"")+
   options.map(o=>'<option value="'+esc(o.value)+'">'+esc(o.label)+'</option>').join("")+'</select></label>';
 if(f.type==="textarea")return '<label class="wide">'+esc(f.label)+'<textarea name="'+esc(f.name)+'" rows="3" maxlength="'+(f.maxlength||250)+'"'+required+' placeholder="'+esc(f.placeholder||"")+'"></textarea></label>';
 return '<label>'+esc(f.label)+'<input name="'+esc(f.name)+'" type="'+esc(f.type||"text")+'"'+
   (f.min!==undefined?' min="'+esc(f.min)+'"':"")+(f.max!==undefined?' max="'+esc(f.max)+'"':"")+
   (f.step!==undefined?' step="'+esc(f.step)+'"':"")+(f.maxlength!==undefined?' maxlength="'+esc(f.maxlength)+'"':"")+
   ' value="'+esc(value)+'" placeholder="'+esc(f.placeholder||"")+'"'+required+'/></label>';
}
function modal(){
 if(!ui.modal)return "";
 const s=def.steps.find(s=>s.id===ui.modal);if(!s)return "";
 return '<div class="veil"><section class="drawer" role="dialog" aria-modal="true" aria-label="'+esc(s.title)+'">'+
 '<div class="handle"></div><header><h2>'+esc(s.title)+'</h2><button type="button" data-close="1" aria-label="Close">×</button></header>'+
 '<p class="modal-context">'+esc(s.description)+'</p>'+
 '<form data-step="'+esc(s.id)+'"><div class="form-grid">'+(s.fields||[]).map(field).join("")+'</div>'+
 '<button type="submit" class="btn primary full">'+esc(s.button||"Save")+'</button></form></section></div>';
}
function render(){
 const pages={home,work,records};
 root.innerHTML='<div class="outer"><aside class="intro"><small>INTERACTIVE INDUSTRY CONCEPT</small><h2>'+esc(def.hero)+'</h2>'+
 '<p>'+esc(def.heroDescription)+'</p><a href="/demos/'+esc(def.slug)+'">← Back to introduction</a></aside>'+
 '<div class="phone"><div class="phone-status">9:41 <span>▰  ▱  ▰</span></div>'+
 '<header class="app-header"><div class="brand"><b>'+esc(def.mark||"◆")+'</b><span><strong>'+esc(def.product)+'</strong><small>'+esc(def.category)+' · Demo</small></span></div>'+
 '<select id="role-select" aria-label="Simulated account">'+def.roles.map(r=>'<option value="'+esc(r.id)+'"'+(ui.role===r.id?" selected":"")+'>'+esc(r.name)+'</option>').join("")+'</select></header>'+
 '<main class="screen">'+pages[ui.view]()+'</main>'+
 '<nav class="bottom" aria-label="Application tabs">'+nav.map(([id,label,ico])=>
 '<button data-nav="'+id+'" class="'+(ui.view===id?"active":"")+'"><span>'+ico+'</span><small>'+label+'</small></button>').join("")+'</nav>'+
 '<div class="home-line"><span></span></div></div>'+
 '<div class="side"><a href="/demos/'+esc(def.slug)+'">About this demo</a><button data-reset="true">↻ Reset data</button><small>'+esc(def.disclaimer)+'</small></div></div>'+
 modal()+(ui.message?'<div class="toast" role="status">'+esc(ui.message)+'<button data-dismiss="true" aria-label="Dismiss">×</button></div>':'');
}
document.addEventListener("change",e=>{
 if(!root.contains(e.target))return;
 if(e.target.id==="role-select"&&roleNames[e.target.value]){
  ui.role=e.target.value;ui.view="work";ui.modal=null;ui.message="Switched to "+roleNames[ui.role]+".";render();
 }
});
document.addEventListener("click",e=>{
 const el=e.target.closest("[data-nav],[data-action],[data-role],[data-close],[data-dismiss],[data-reset]");
 if(!el||!root.contains(el))return;
 if(el.dataset.nav){ui.view=el.dataset.nav==="workflow"?"work":el.dataset.nav;ui.modal=null;ui.message="";render();return;}
 if(el.dataset.role&&roleNames[el.dataset.role]){ui.role=el.dataset.role;ui.view="work";ui.modal=null;render();return;}
 if(el.dataset.action){const s=def.steps.find(s=>s.id===el.dataset.action);if(s&&s.role===ui.role&&s.ready(state)){ui.modal=s.id;ui.message="";render();}return;}
 if(el.dataset.close){ui.modal=null;ui.message="";render();return;}
 if(el.dataset.dismiss){ui.message="";render();return;}
 if(el.dataset.reset){if(!window.confirm("Reset this fictional business demo?"))return;state=def.seed();ui.modal=null;ui.view="home";save();ui.message="Sample data restored.";render();}
});
document.addEventListener("submit",e=>{
 const form=e.target,id=form.dataset?.step;if(!id||!root.contains(form))return;e.preventDefault();
 const s=def.steps.find(s=>s.id===id);
 if(!s||s.role!==ui.role||!s.ready(state)){ui.message="This action is unavailable in the current state.";render();return;}
 try{
  const fields=Object.fromEntries(new FormData(form).entries());
  const result=s.run(state,fields);
  state.activity.unshift({title:s.title,detail:result||"Action recorded."});save();
  ui.modal=null;ui.message=result||"Saved.";
 }catch(err){ui.message=err?.message||"Could not save the action.";}
 render();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&ui.modal){ui.modal=null;render();}});
render();
};
