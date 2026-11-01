const test=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"..","public","demos","property");
const code=Object.fromEntries(["core.js","views.js","app.js","styles.css","demo.html"].map(p=>[p,fs.readFileSync(path.join(base,p),"utf8")]));
const core=()=>new Function(code["core.js"]+"\nreturn rentalCore;")();
const item=(xs,id)=>xs.find(x=>x.id===id);
const pay=(sum=12000,ref="DEMO-RECEIPT")=>({amount:String(sum),method:"Bank transfer",reference:ref,date:"2026-11-01",destination:"Demo rent collection account"});
function browser(stored){
 let saved=stored===undefined?JSON.stringify(core().seed()):stored;
 const root={innerHTML:"",contains:()=>true},listeners={};
 const document={getElementById:id=>id==="app"?root:null,addEventListener:(name,fn)=>listeners[name]=fn};
 class FormDataMock{constructor(form){this.fields=form.fields}entries(){return Object.entries(this.fields)[Symbol.iterator]()}}
 new Function("document","window","localStorage","FormData",code["core.js"]+"\n"+code["views.js"]+"\n"+code["app.js"])(
  document,{confirm:()=>true},{getItem:()=>saved,setItem:(k,v)=>saved=v},FormDataMock);
 const click=d=>listeners.click({target:{closest:()=>({dataset:d})}});
 return {root,data:()=>JSON.parse(saved),saved:()=>saved,tab:tab=>click({tab}),open:(open,id)=>click({open,id}),
  drawer:drawer=>click({drawer}),action:(action,id)=>click({action,id}),
  change:(id,value)=>listeners.change({target:{id,value}}),
  search:value=>listeners.input({target:{id:"rent-search",value,selectionStart:value.length,selectionEnd:value.length}}),
  submit:(type,id,fields)=>listeners.submit({preventDefault:()=>{},target:{id:"property-form",dataset:{type,id:id||""},fields}})
 };
}
test("two properties, six units, one vacant, five tenants and active leases are preloaded",()=>{
 const c=core(),d=c.seed();a.ok(c.valid(d));
 a.equal(d.properties.length,2);a.equal(d.units.length,6);
 a.equal(c.occupied(d),5);a.equal(d.tenants.length,5);
 a.equal(d.leases.length,5);a.equal(d.units.filter(u=>!c.activeLease(d,u.id)).length,1);
 a.ok(d.units.some(x=>x.propertyId===null));
});
test("November and October rent invoices have due, overdue, partial and paid states",()=>{
 const c=core(),d=c.seed();
 a.equal(d.invoices.length,10);a.equal(c.currentInvoices(d).length,5);
 a.equal(c.status(item(d.invoices,"INV-2026-1101")),"Partially paid");
 a.equal(c.status(item(d.invoices,"INV-2026-1103")),"Paid");
 a.equal(c.status(item(d.invoices,"INV-2026-1002")),"Overdue");
 a.equal(c.status(item(d.invoices,"INV-2026-1102")),"Due");
});
test("seed paid amounts equal applied receipts and November totals reconcile",()=>{
 const c=core(),d=c.seed();
 for(const i of d.invoices)a.equal(i.paid,d.payments.filter(x=>x.invoiceId===i.id).reduce((n,p)=>n+p.applied,0));
 const m=c.metrics(d);a.equal(m.billed,150500);a.equal(m.collected,49500);a.equal(m.outstanding,111000);
});
test("manual payment is applied immediately and creates a fictional receipt",()=>{
 const c=core(),d=c.seed(),m=c.metrics(d);
 const p=c.settle(d,"INV-2026-1101",pay());
 a.equal(p.received,12000);a.equal(p.applied,12000);a.equal(p.receipt,"RCT-3001");
 a.equal(c.balance(item(d.invoices,"INV-2026-1101")),14000);
 a.equal(c.metrics(d).outstanding,m.outstanding-12000);
});
test("full payment closes invoice, preventing repeat payment",()=>{
 const c=core(),d=c.seed();
 c.settle(d,"INV-2026-1101",pay(26000,"PAY-ALL"));
 a.equal(c.status(item(d.invoices,"INV-2026-1101")),"Paid");
 a.throws(()=>c.settle(d,"INV-2026-1101",pay(100,"PAY-AGAIN")),/already settled/);
});
test("overpayment carries excess as tenant credit instead of overallocating invoice",()=>{
 const c=core(),d=c.seed(),p=c.settle(d,"INV-2026-1101",pay(30000,"OVERPAY"));
 a.equal(p.applied,26000);a.equal(p.credit,4000);
 a.equal(c.balance(item(d.invoices,"INV-2026-1101")),0);
 a.equal(c.metrics(d).credit,4000);a.equal(d.credits.length,1);
});
test("duplicate reference and invalid payment amount are rejected atomically",()=>{
 const c=core(),d=c.seed();c.settle(d,"INV-2026-1101",pay(1000,"USED"));
 const previous=JSON.stringify(d);
 a.throws(()=>c.settle(d,"INV-2026-1101",pay(1000,"USED")),/already been recorded/);
 for(const x of ["",0,-1,3000001,NaN])a.throws(()=>c.settle(d,"INV-2026-1101",pay(x,"BAD")),/Amount received/);
 a.equal(JSON.stringify(d),previous);
});
test("invalid collection method and destination cannot alter rent balances",()=>{
 const c=core(),d=c.seed(),previous=JSON.stringify(d);
 a.throws(()=>c.settle(d,"INV-2026-1101",{...pay(),method:"Unverified"}),/valid collection method/);
 a.throws(()=>c.settle(d,"INV-2026-1101",{...pay(),destination:"Unknown"}),/existing demo receiving account/);
 a.equal(JSON.stringify(d),previous);
});
test("vacant unit lease creates tenant and optional first rent invoice",()=>{
 const c=core(),d=c.seed();
 const l=c.createLease(d,{unitId:"U-103",name:"Linda Wanjiku",phone:"0722000066",start:"2026-11-01",rent:30000,serviceCharge:2000,createInvoice:"yes"});
 a.equal(l.invoice.total,32000);a.equal(c.occupied(d),6);
 a.throws(()=>c.createLease(d,{unitId:"U-103"}),/vacant unit/);
});
test("lease may skip invoice and may use zero service charge",()=>{
 const c=core(),d=c.seed();
 const l=c.createLease(d,{unitId:"U-103",name:"Linda",phone:"0722000066",start:"2026-11-01",rent:30000,serviceCharge:0,createInvoice:"no"});
 a.equal(l.invoice,null);a.equal(d.invoices.length,10);
});
test("invalid lease phone cannot create partial records",()=>{
 const c=core(),d=c.seed(),snapshot=JSON.stringify(d);
 a.throws(()=>c.createLease(d,{unitId:"U-103",name:"Linda",phone:"123",start:"2026-11-01",rent:30000,serviceCharge:0}),/10-digit/);
 a.equal(JSON.stringify(d),snapshot);
});
test("new expense changes owner net but not rent issued or collected",()=>{
 const c=core(),d=c.seed(),previous=c.metrics(d),position=c.statement(d,"P-101");
 c.addExpense(d,{propertyId:"P-101",title:"Tank cleaning",category:"Maintenance",amount:3500,date:"2026-11-01"});
 a.equal(c.metrics(d).billed,previous.billed);a.equal(c.metrics(d).collected,previous.collected);
 a.equal(c.statement(d,"P-101").net,position.net-3500);
});
test("owner position returns coherent property income and expenses",()=>{
 const c=core(),s=c.statement(c.seed(),"P-101");
 a.equal(s.billed,63000);a.equal(s.received,8000);a.equal(s.expenses,4800);a.equal(s.net,3200);
});
test("primary navigation uses Rent, Leases, Tenants and Portfolio, not guided tour",()=>{
 const h=browser();
 for(const tab of ["rent","leases","tenants","portfolio"])a.match(h.root.innerHTML,new RegExp('data-tab="'+tab+'"'));
 for(const label of ["Rent overview","Outstanding now","Occupancy now"])a.match(h.root.innerHTML,new RegExp(label));
 a.doesNotMatch(h.root.innerHTML,/Try the workflow|Step 1|Finance Officer/);
});
test("invoice filters and search update available records",()=>{
 const h=browser();
 a.ok(h.root.innerHTML.indexOf("INV-2026-1002")<h.root.innerHTML.indexOf("INV-2026-1101"));
 h.change("status-filter","overdue");a.match(h.root.innerHTML,/INV-2026-1002/);
 a.doesNotMatch(h.root.innerHTML,/INV-2026-1101/);
 h.change("status-filter","all");h.change("month-filter","2026-11");a.doesNotMatch(h.root.innerHTML,/INV-2026-1002/);
 h.change("property-filter","P-102");a.match(h.root.innerHTML,/Joseph Ombasa/);
 h.change("property-filter","all");h.search("Daniel Kariuki");a.match(h.root.innerHTML,/INV-2026-1102/);
});
test("landlord navigates independently among lease, tenant, property and vacant unit",()=>{
 const h=browser();h.tab("leases");a.match(h.root.innerHTML,/Alex Wanjiru/);
 h.open("lease","L-101");a.match(h.root.innerHTML,/Lease details/);
 h.action("back");h.tab("tenants");h.open("tenant","T-102");a.match(h.root.innerHTML,/Tenant details/);
 h.action("back");h.tab("portfolio");h.open("property","P-101");a.match(h.root.innerHTML,/A-103/);
 h.open("unit","U-103");a.match(h.root.innerHTML,/Vacant unit/);
});
test("drawer is in-phone and exposes Finance and Operations pages",()=>{
 const h=browser();h.action("drawer");
 for(const name of ["payments","expenses","accounting","history"])a.match(h.root.innerHTML,new RegExp('data-drawer="'+name+'"'));
 a.match(h.root.innerHTML,/<div class="gesture"><span><\/span><\/div><div class="drawer-wrap">/);
 h.drawer("payments");a.match(h.root.innerHTML,/Total received/);
});
test("invoice detail includes balance, service charge and manual payment form",()=>{
 const h=browser();h.open("invoice","INV-2026-1101");
 for(const text of ["Service charge","Amount paid","Outstanding","Alex Wanjiru","Record manual payment"])a.match(h.root.innerHTML,new RegExp(text));
 h.action("new-payment","INV-2026-1101");a.match(h.root.innerHTML,/value="26000"/);
 a.match(h.root.innerHTML,/M-Pesa received externally/);
});
test("manual payment opens receipt then invoice balance and ledger update together",()=>{
 const h=browser(),before=core().metrics(h.data()).outstanding;
 h.open("invoice","INV-2026-1101");h.action("new-payment","INV-2026-1101");
 h.submit("payment","INV-2026-1101",pay(12000,"NEW-PAY-12000"));
 a.match(h.root.innerHTML,/Payment received/);a.match(h.root.innerHTML,/RCT-3001/);
 a.equal(core().metrics(h.data()).outstanding,before-12000);
 h.action("go-invoice","INV-2026-1101");a.match(h.root.innerHTML,/KES 14,000/);
 h.action("back");h.action("back");h.action("back");h.action("drawer");h.drawer("payments");
 a.match(h.root.innerHTML,/NEW-PAY-12000/);
});
test("payment reference is safely escaped",()=>{
 const h=browser();h.open("invoice","INV-2026-1101");h.action("new-payment","INV-2026-1101");
 h.submit("payment","INV-2026-1101",pay(1000,"<svg onload=alert(1)>"));
 a.doesNotMatch(h.root.innerHTML,/<svg onload=/);a.match(h.root.innerHTML,/&lt;svg onload=/);
});
test("vacant unit create lease form links new tenant and generates first invoice",()=>{
 const h=browser();h.tab("portfolio");h.open("property","P-101");h.open("unit","U-103");
 h.action("new-lease","U-103");a.match(h.root.innerHTML,/Create lease/);
 h.submit("lease","U-103",{unitId:"U-103",name:"Linda Wanjiku",phone:"0722000066",start:"2026-11-01",rent:30000,serviceCharge:2000,createInvoice:"yes"});
 a.match(h.root.innerHTML,/Lease details/);a.equal(h.data().tenants.length,6);a.equal(h.data().invoices.length,11);
});
test("expense records appear in owner accounting after modification",()=>{
 const h=browser();h.action("drawer");h.drawer("expenses");h.action("new-expense");
 h.submit("expense","",{propertyId:"P-101",title:"Generator service",category:"Maintenance",amount:3500,date:"2026-11-01"});
 a.match(h.root.innerHTML,/Generator service/);
 h.action("back");h.action("drawer");h.drawer("accounting");
 a.equal(core().statement(h.data(),"P-101").expenses,8300);
});
test("overpayment credit persists on reload and appears in payment ledger",()=>{
 const h=browser();h.open("invoice","INV-2026-1101");h.action("new-payment","INV-2026-1101");
 h.submit("payment","INV-2026-1101",pay(30000,"CREDIT-PAY"));
 const r=browser(h.saved());a.equal(r.data().credits[0].remaining,4000);
 r.action("drawer");r.drawer("payments");a.match(r.root.innerHTML,/CREDIT-PAY/);
});
test("reset restores five leases and original invoice balances",()=>{
 const h=browser();h.open("invoice","INV-2026-1101");h.action("new-payment","INV-2026-1101");
 h.submit("payment","INV-2026-1101",pay(12000,"RESET-RECEIPT"));
 a.equal(h.data().payments.length,8);h.action("reset");a.equal(h.data().payments.length,7);
 a.equal(core().occupied(h.data()),5);
});
test("demo files use JoelTechGeek brand colors and not RentPayor branding or legacy engine",()=>{
 for(const content of [code["app.js"],code["views.js"],code["demo.html"]])
  for(const name of ["RentPayor","SchoolPey","guided tour"])a.doesNotMatch(content,new RegExp(name));
 for(const part of ["core.js","views.js","app.js","styles.css"])a.match(code["demo.html"],new RegExp("/demos/property/"+part.replace(".","\\.")));
 a.doesNotMatch(code["demo.html"],/minimal-engine|\/property\/demo\.js/);
 for(const x of ["#059669","#047857","#0ea5e9","#f59e0b","#fef3c7"])a.match(code["styles.css"],new RegExp(x));
 a.match(code["styles.css"],/\.drawer-wrap\{position:absolute/);
 a.match(code["styles.css"],/\.modal-overlay\{position:fixed/);
});
