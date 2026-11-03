(function schoolDemoApp(core){
"use strict";
const root=document.getElementById("app"),STORAGE_KEY="jtech-schoolfinance-v2";
const e=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kes=n=>"KES "+Number(n||0).toLocaleString("en-KE",{maximumFractionDigits:2});
const fmtDate=t=>{if(!t)return"—";const d=new Date(t);return Number.isNaN(d.getTime())?String(t):d.toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})};
const cap=s=>String(s||"").replace(/^./,x=>x.toUpperCase());
let data;try{data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch(error){}
if(!core.valid(data))data=core.seed();
const state={role:"parent",tab:"fees",screen:null,invoiceFilter:"open",financeFilter:"all",query:"",studentId:null,invoiceId:null,paymentId:null,
 checkoutId:null,notice:"",amount:"",phone:"",parentChildTab:"fees"};
const validParentStudent=id=>core.parentStudents(data).some(x=>x.id===id);
const students=()=>state.role==="parent"?core.parentStudents(data):data.students;
const student=id=>data.students.find(x=>x.id===id);
const invoice=id=>data.invoices.find(x=>x.id===id);
const payment=id=>data.payments.find(x=>x.id===id);
const invoices=()=>state.role==="parent"?core.familyInvoices(data):data.invoices;
const payments=()=>state.role==="parent"?core.familyPayments(data):data.payments;
const remaining=i=>core.amountDue(i);
const status=i=>core.status(i);
const save=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}catch(error){state.notice="Your browser could not save this demo session."}};
const setScreen=(screen,params={})=>{state.screen=screen;Object.assign(state,params);state.notice="";render()};
const btn=(label,act,id="",style="")=>'<button type="button" class="btn '+style+'" data-action="'+act+'" '+(id?'data-id="'+e(id)+'"':"")+'>'+label+'</button>';
const heading=(title,detail="")=>'<div class="screen-heading"><h1>'+e(title)+'</h1>'+(detail?'<p>'+e(detail)+'</p>':"")+'</div>';
const badge=label=>'<span class="status '+e(label.toLowerCase().replace(/\s+/g,"-"))+'">'+e(label)+'</span>';
const field=(title,value)=>'<div class="detail-row"><span>'+e(title)+'</span><strong>'+e(value)+'</strong></div>';
const section=(title,body,right="")=>'<section class="section-card"><div class="section-head"><h2>'+e(title)+'</h2>'+right+'</div>'+body+'</section>';
const empty=(title,message)=>'<div class="empty"><div>▤</div><b>'+e(title)+'</b><p>'+e(message)+'</p></div>';
const familyDue=()=>core.outstanding(core.familyInvoices(data));
const paymentCard=p=>{
 const s=student(p.studentId);
 return '<button class="payment-card" data-open="receipt" data-id="'+e(p.id)+'"><div class="payment-top"><strong>'+kes(p.amount)+'</strong>'+badge("Reconciled")+'</div>'+
 '<b>'+e(s?.name||"Student")+'</b><small>'+e(data.school.name)+' · '+fmtDate(p.at)+'</small>'+
 '<p>'+e(p.method)+' · '+e(p.reference)+'</p><span class="receipt-link">View receipt ›</span></button>';
};
const invoiceCard=i=>{
 const s=student(i.studentId),r=remaining(i);
 return '<button class="invoice-card" data-open="invoice" data-id="'+e(i.id)+'"><div class="invoice-top"><b>'+e(s?.name||"Student")+'</b>'+badge(status(i))+'</div>'+
 '<p>'+e(s?.grade||"")+' · '+e(i.term)+' / '+e(i.year)+'</p>'+
 '<div class="invoice-amount"><strong>'+kes(r)+'</strong><span>'+(r?'Remaining':'Paid in full')+'</span></div>'+
 '<div class="invoice-foot"><span>'+e(i.reference)+'</span><span>'+(r?'Due '+fmtDate(i.dueDate):'Paid')+' ›</span></div></button>';
};
function parentFees(){
 const all=core.familyInvoices(data),open=all.filter(i=>remaining(i)>0),paid=all.filter(i=>remaining(i)===0);
 const show=state.invoiceFilter==="open"?open:state.invoiceFilter==="paid"?paid:all;
 return heading("Fees",open.length+' open '+(open.length===1?'invoice':'invoices'))+
 '<div class="summary-banner"><small>Outstanding school fees</small><strong>'+kes(familyDue())+'</strong><span>'+e(core.parentStudents(data).length)+' children · '+e(data.school.name)+'</span></div>'+
 '<div class="segment">'+[["open","Open",open.length],["paid","Paid",paid.length],["all","All",all.length]].map(([key,label,count])=>
 '<button data-invoice-filter="'+key+'" class="'+(state.invoiceFilter===key?"active":"")+'">'+label+' ('+count+')</button>').join("")+'</div>'+
 (show.length?'<div class="card-stack">'+show.map(invoiceCard).join("")+'</div>':empty("No invoices","There are no invoices in this filter."));
}
function parentPayments(){
 const list=core.familyPayments(data);
 return heading("Payments",list.length+' recorded '+(list.length===1?'payment':'payments'))+
 '<div class="simple-total"><span>Family payment history</span><strong>'+kes(list.reduce((n,p)=>n+p.amount,0))+'</strong></div>'+
 (list.length?'<div class="card-stack">'+list.map(paymentCard).join("")+'</div>':empty("No payments yet","Your school-fee payments and receipts appear here."));
}
function parentChildren(){
 const list=core.parentStudents(data);
 return heading("Children",list.length+' linked to this account')+
 list.map(s=>{
  const outstanding=core.outstanding(core.studentInvoices(data,s.id));
  return '<button class="child-card" data-open="student" data-id="'+e(s.id)+'"><span class="avatar">'+e(s.name.split(" ").map(x=>x[0]).slice(0,2).join(""))+'</span>'+
   '<div><b>'+e(s.name)+'</b><small>'+e(s.grade)+' · Admission '+e(s.admission)+'</small><small>'+e(data.school.name)+'</small>'+
   '<strong>'+kes(outstanding)+' outstanding</strong></div><span class="chevron">›</span></button>';
 }).join("");
}
const financeSummary=()=>core.metrics(data);
function financeOverview(){
 const m=financeSummary(),summary=(name,value,meta)=>'<div class="metric"><span>'+e(name)+'</span><strong>'+value+'</strong><small>'+e(meta)+'</small></div>';
 return heading("Finance overview","School fee position and collections activity")+
 '<div class="school-banner"><small>ACTIVE SCHOOL · '+e(data.school.year)+' / '+e(data.school.term)+'</small><h2>'+e(data.school.name)+'</h2><p>Existing school · sample fee structures and add-ons</p></div>'+
 '<div class="metrics">'+summary("Issued",kes(m.billed),data.invoices.length+" invoices")+
 summary("Received",kes(m.collected),m.payments+" reconciled payments")+
 summary("Outstanding",kes(m.outstanding),m.open+" open invoices")+
 summary("Settled",String(m.settled),m.studentCount+" enrolled students")+'</div>'+
 section("Recent collections",data.payments.slice(0,3).map(p=>'<button class="compact-record" data-open="receipt" data-id="'+e(p.id)+'"><span><b>'+e(student(p.studentId)?.name||"Student")+'</b><small>'+e(p.reference)+'</small></span><strong>'+kes(p.amount)+'</strong></button>').join(""))+
 section("Fee structures & add-ons",'<p class="note">Published grade fee plans and optional charges are already configured. No setup is required.</p>'+
 data.feeStructures.map(f=>{
  const addons=data.addOnCatalog.filter(x=>x.grade===f.grade);
  return '<div class="plan"><div><b>'+e(f.grade)+'</b><small>'+e(f.name)+'</small></div>'+
   '<strong>'+kes(f.base.reduce((n,x)=>n+x.amount,0))+' base</strong><small>'+e(addons.map(x=>x.label).join(" · "))+'</small></div>';
 }).join(""));
}
function financeInvoices(){
 const all=data.invoices,selected=state.financeFilter==="open"?all.filter(i=>remaining(i)>0):state.financeFilter==="paid"?all.filter(i=>remaining(i)===0):all;
 const q=state.query.trim().toLowerCase();
 const visible=selected.filter(i=>[i.reference,student(i.studentId)?.name||"",student(i.studentId)?.admission||"",student(i.studentId)?.grade||""].join(" ").toLowerCase().includes(q));
 return heading("Invoices","Issued and settled student invoices for "+data.school.name)+
 '<div class="search"><span>⌕</span><input id="finance-search" value="'+e(state.query)+'" placeholder="Search student, admission, invoice" aria-label="Search invoices"/></div>'+
 '<div class="segment">'+[["open","Open"],["paid","Paid"],["all","All"]].map(([k,n])=>'<button data-finance-filter="'+k+'" class="'+(state.financeFilter===k?"active":"")+'">'+n+'</button>').join("")+'</div>'+
 '<p class="result-count">'+visible.length+' invoices · '+kes(core.outstanding(visible))+' outstanding</p>'+
 (visible.length?visible.map(invoiceCard).join(""):empty("No invoices found","Change the filter or search."));
}
function financePayments(){
 return heading("Payments","Canonical sample payment ledger for "+data.school.name)+
 '<div class="simple-total"><span>Total received</span><strong>'+kes(financeSummary().collected)+'</strong></div>'+
 data.payments.map(paymentCard).join("");
}
function financeStudents(){
 return heading("Students",data.students.length+' students · finance-only lookup')+
 data.students.map(s=>'<button class="student-record" data-open="student" data-id="'+e(s.id)+'"><div><b>'+e(s.name)+'</b>'+
 '<small>'+e(s.grade)+' · '+e(s.admission)+'</small></div><div><strong>'+kes(core.outstanding(core.studentInvoices(data,s.id)))+'</strong><small>Outstanding ›</small></div></button>').join("");
}
function detailInvoice(){
 const i=invoice(state.invoiceId);
 if(!i||(state.role==="parent"&&!validParentStudent(i.studentId)))return empty("Invoice unavailable","You cannot view this invoice.");
 const s=student(i.studentId),due=remaining(i),related=data.payments.filter(p=>p.invoiceId===i.id);
 const lines=i.lines.map(x=>'<div class="fee-line"><div><b>'+e(x.description)+'</b><small>'+e(x.kind==="Add-on"?"Add-on charge":"Base fee structure")+'</small></div><strong>'+kes(x.amount)+'</strong></div>').join("");
 return heading(s.name,data.school.name+' · '+i.reference)+
 '<div class="invoice-hero">'+badge(status(i))+'<p>'+(due>0?"Remaining":"Balance")+'</p><strong>'+kes(due)+'</strong>'+
 '<small>'+kes(i.paid)+' paid of '+kes(i.total)+'</small></div>'+
 section("Invoice details",field("Student",s.name)+field("Grade",s.grade)+field("Period",i.term+' / '+i.year)+field("Issued",fmtDate(i.issuedOn))+field("Due",fmtDate(i.dueDate))+field("Reference",i.reference))+
 section("Fee breakdown",lines+'<div class="fee-total">'+field("Total invoiced",kes(i.total))+'</div>')+
 section("Payment summary",field("Paid",kes(i.paid))+field("Outstanding",kes(due)))+
 (related.length?section("Payments",related.map(p=>'<button class="payment-row" data-open="receipt" data-id="'+e(p.id)+'"><span>'+fmtDate(p.at)+' · '+e(p.receiptNumber)+'</span><strong>'+kes(p.amount)+' ›</strong></button>').join("")):"")+
 (state.role==="parent"&&due>0?btn("Pay with M-Pesa","checkout",i.id,"primary full"):
  due===0?'<div class="paid-note">✓ Invoice fully settled. '+(state.role==="parent"?"View receipts above.":"Payments recorded in the finance ledger.")+'</div>':"")+
 '<div class="demo-disclaimer">All invoices are fictional. No real M-Pesa request or payment will be made.</div>';
}
function studentDetail(){
 const s=student(state.studentId);
 if(!s||(state.role==="parent"&&!validParentStudent(s.id)))return empty("Student unavailable","This student is not linked to your account.");
 const invs=core.studentInvoices(data,s.id),pays=core.studentPayments(data,s.id);
 return heading(s.name,data.school.name+' · Admission '+s.admission)+
 '<div class="child-summary"><div class="avatar large">'+e(s.name.split(" ").map(x=>x[0]).slice(0,2).join(""))+'</div><div><b>'+e(s.grade)+'</b><small>2026 · Active enrollment</small><strong>'+kes(core.outstanding(invs))+' outstanding</strong></div></div>'+
 '<div class="segment">'+[["fees","Fees",invs.length],["payments","Payments",pays.length]].map(([id,label,num])=>
 '<button data-child-tab="'+id+'" class="'+(state.parentChildTab===id?"active":"")+'">'+label+' ('+num+')</button>').join("")+'</div>'+
 (state.parentChildTab==="fees"?invs.map(invoiceCard).join("")||empty("No fees","No invoices yet"):
 pays.map(paymentCard).join("")||empty("No payments","No payments recorded"));
}
function checkout(){
 const i=invoice(state.invoiceId);
 if(state.role!=="parent"||!i||!validParentStudent(i.studentId))return empty("Checkout unavailable","Only the linked parent can pay.");
 const due=remaining(i);
 if(due<=0)return heading("Payment complete")+empty("Already paid","This invoice has been settled.")+
 btn("Back to invoice","invoice-from-checkout",i.id,"soft full");
 return heading("Pay school fees",student(i.studentId)?.name+' · '+data.school.name)+
 '<div class="checkout-summary"><small>Invoice balance</small><strong>'+kes(due)+'</strong><span>'+e(i.reference)+'</span></div>'+
 '<form id="school-checkout" data-id="'+e(i.id)+'" class="checkout-form"><label>Safaricom number'+
 '<input required type="tel" name="phone" placeholder="0722000011" value="'+e(state.phone)+'" inputmode="tel" maxlength="16" autocomplete="off"/></label>'+
 '<label>Amount (KES)<input required type="number" name="amount" min="1" step="1" max="'+due+'" value="'+e(state.amount)+'"/></label>'+
 '<p class="checkout-help">The outstanding amount is prefilled. You can pay a smaller whole-shilling amount; the remaining balance will stay open.</p>'+
 '<button class="btn primary full" type="submit">Confirm sample payment</button></form>'+
 '<div class="demo-disclaimer">Simulated M-Pesa checkout. No STK prompt will be sent, and no money will move. A sample receipt and allocation appear immediately.</div>';
}
function receipt(){
 const p=payment(state.paymentId);
 if(!p||(state.role==="parent"&&!validParentStudent(p.studentId)))return empty("Receipt unavailable","Payment not found.");
 const i=invoice(p.invoiceId),s=student(p.studentId);
 return heading("Payment receipt",data.school.name)+
 '<div class="receipt-hero"><div class="receipt-check">✓</div><b>Payment received</b><strong>'+kes(p.amount)+'</strong>'+
 '<small>Reconciled · '+(p.source==="Simulated checkout"?"Demo transaction":"Seeded sample")+'</small></div>'+
 section("Payment details",field("Receipt number",p.receiptNumber)+field("M-Pesa reference",p.reference)+
 field("Student",s?.name||"Student")+field("Invoice",i?.reference||"Invoice")+
 field("Phone",p.phone)+field("Method",p.method)+field("Date",fmtDate(p.at)))+
 section("Invoice allocation",field("Allocated to fees",kes(p.amount))+field("Invoice remaining",kes(remaining(i)))+
 field("Invoice status",status(i)))+
 (state.role==="parent"?btn(remaining(i)>0?"Pay remaining balance":"View invoice","receipt-to-invoice",i.id,"primary full"):"")+
 '<p class="demo-disclaimer">This is a fictional receipt. No provider verification occurred.</p>';
}
function header(){
 const nested=Boolean(state.screen);
 const caption=state.role==="parent"?"Mary (Parent)":"David (Finance)";
 return '<header class="app-header">'+
 (nested?'<button type="button" class="header-back" data-action="back" aria-label="Go back">‹</button>':
 '<span class="brand-symbol">✦</span>')+
 '<div class="header-copy"><b>'+(nested?(state.screen==="invoice"?"Invoice":state.screen==="student"?"Student account":state.screen==="checkout"?"Checkout": "Receipt"):
 state.role==="parent"?"Family fees":"Finance dashboard")+'</b>'+
 '<small>'+e(data.school.name)+'</small></div>'+
 (nested?'<span class="header-spacer"></span>':'<select id="demo-role" aria-label="Demo account"><option value="parent" '+(state.role==="parent"?"selected":"")+'>Mary (Parent)</option><option value="finance" '+(state.role==="finance"?"selected":"")+'>David (Finance)</option></select>')+
 '</header>';
}
function bottom(){
 if(state.screen)return"";
 const items=state.role==="parent"?[["fees","Fees","▤"],["payments","Payments","◇"],["children","Children","♧"]]:
 [["overview","Overview","▦"],["invoices","Invoices","▤"],["payments","Payments","◇"],["students","Students","♧"]];
 return '<nav class="bottom-tabs" aria-label="School fee navigation">'+items.map(([id,label,icon])=>
 '<button data-tab="'+id+'" class="'+(state.tab===id?"selected":"")+'"><span>'+icon+'</span><small>'+label+'</small></button>').join("")+'</nav>';
}
function page(){
 if(state.screen==="invoice")return detailInvoice();
 if(state.screen==="student")return studentDetail();
 if(state.screen==="checkout")return checkout();
 if(state.screen==="receipt")return receipt();
 if(state.role==="parent")return ({fees:parentFees,payments:parentPayments,children:parentChildren}[state.tab]||parentFees)();
 return ({overview:financeOverview,invoices:financeInvoices,payments:financePayments,students:financeStudents}[state.tab]||financeOverview)();
}
let lastViewScrollKey=null;
function render(){
 const scrollKey=[state.role,state.tab,state.screen,state.invoiceId,state.studentId,state.paymentId].join(":");
 const previousScroll=root.querySelector?.(".phone-main")?.scrollTop||0;
 const keepScroll=lastViewScrollKey===scrollKey;
 root.innerHTML='<div class="demo-stage"><aside class="demo-intro"><span>SCHOOL FINANCE · INTERACTIVE DEMO</span><h2>School Fee Management</h2>'+
 '<p>One fictional school, preconfigured fees and add-ons, three children linked to one parent, and a shared payment ledger.</p>'+
 '<a href="/demos/education">← Demo overview</a></aside>'+
 '<div class="phone"><div class="status-bar"><span>9:41</span><span>▰ ▱ ▰</span></div>'+header()+
 '<main class="phone-main"><div class="screen">'+page()+'</div></main>'+bottom()+'<div class="home-indicator"><span></span></div></div>'+
 '<aside class="demo-help"><b>Two connected views</b><p>Switch between Mary (Parent) and David (Finance). Payments update both immediately.</p>'+
 btn("Reset sample data","reset","","soft")+'<small>Fictional invoices · No real STK or bank transfer.</small></aside></div>'+
 (state.notice?'<div class="toast" role="status">'+e(state.notice)+btn("×","dismiss","","text")+'</div>':"");
 if(keepScroll){const host=root.querySelector?.(".phone-main");if(host)host.scrollTop=previousScroll;}
 lastViewScrollKey=scrollKey;
}
function back(){
 if(state.screen==="checkout"){state.screen="invoice";}
 else if(state.screen==="receipt"){state.screen=null;}
 else if(state.screen==="invoice"&&state.studentId){state.screen="student";}
 else{state.screen=null;state.studentId=null;}
 state.notice="";render();
}
document.addEventListener("change",ev=>{
 if(ev.target.id==="demo-role"){
  state.role=ev.target.value==="finance"?"finance":"parent";state.tab=state.role==="parent"?"fees":"overview";
  state.screen=null;state.invoiceId=null;state.studentId=null;state.paymentId=null;state.notice="";state.query="";render();
 }
});
document.addEventListener("input",ev=>{
 if(ev.target.id==="finance-search"){
  const start=ev.target.selectionStart,end=ev.target.selectionEnd;state.query=ev.target.value;render();
  const el=document.getElementById("finance-search");
  if(el&&typeof el.focus==="function"){el.focus();if(typeof el.setSelectionRange==="function")el.setSelectionRange(start,end);}
 }
});
document.addEventListener("click",ev=>{
 const button=ev.target.closest("[data-action],[data-tab],[data-open],[data-invoice-filter],[data-finance-filter],[data-child-tab]");
 if(!button||!root.contains(button))return;
 const d=button.dataset,act=d.action,id=d.id;
 if(d.tab){state.tab=d.tab;state.screen=null;state.studentId=null;state.notice="";render();return;}
 if(d.invoiceFilter){state.invoiceFilter=d.invoiceFilter;render();return;}
 if(d.financeFilter){state.financeFilter=d.financeFilter;render();return;}
 if(d.childTab){state.parentChildTab=d.childTab;render();return;}
 if(d.open==="invoice"){
  const i=invoice(id);
  if(i&&(state.role==="finance"||validParentStudent(i.studentId))){state.invoiceId=id;state.screen="invoice";state.notice="";render();}
  return;
 }
 if(d.open==="student"){
  if(state.role==="finance"||validParentStudent(id)){state.studentId=id;state.screen="student";state.parentChildTab="fees";state.notice="";render();}
  return;
 }
 if(d.open==="receipt"){
  const p=payment(id);
  if(p&&(state.role==="finance"||validParentStudent(p.studentId))){state.paymentId=id;state.screen="receipt";state.notice="";render();}
  return;
 }
 if(act==="back"){back();return;}
 if(act==="dismiss"){state.notice="";render();return;}
 if(act==="checkout"&&state.role==="parent"){
  const i=invoice(id);
  if(!i||!validParentStudent(i.studentId)||remaining(i)<=0)return;
  state.invoiceId=id;state.amount=String(remaining(i));state.phone=data.parent.phone;
  state.checkoutId="demo-checkout-"+data.sequence+"-"+id;state.screen="checkout";render();return;
 }
 if(act==="invoice-from-checkout"||act==="receipt-to-invoice"){
  state.invoiceId=id;state.screen="invoice";state.notice="";render();return;
 }
 if(act==="reset"){
  if(!window.confirm("Reset all fictional school fee payments and balances?"))return;
  data=core.seed();save();state.tab=state.role==="parent"?"fees":"overview";state.screen=null;state.invoiceId=null;
  state.studentId=null;state.paymentId=null;state.notice="Example student invoices and payments restored.";render();return;
 }
});
document.addEventListener("submit",ev=>{
 if(ev.target.id!=="school-checkout"||!root.contains(ev.target))return;
 ev.preventDefault();
 if(state.role!=="parent"||state.screen!=="checkout")return;
 const id=ev.target.dataset.id,values=Object.fromEntries(new FormData(ev.target).entries());
 try{
  const p=core.pay(data,state.role,id,values.amount,values.phone,state.checkoutId);
  save();state.paymentId=p.id;state.screen="receipt";state.notice="";
 }catch(error){
  state.phone=values.phone;state.amount=values.amount;state.notice=error?.message||"Unable to complete demo payment.";
 }
 render();
});
document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&state.screen)back();});
render();
})(schoolFinanceCore);
