const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'..','public','demos','education');
const csrc=fs.readFileSync(path.join(base,'core.js'),'utf8'),asrc=fs.readFileSync(path.join(base,'app.js'),'utf8');
const css=fs.readFileSync(path.join(base,'styles.css'),'utf8'),html=fs.readFileSync(path.join(base,'demo.html'),'utf8');
const core=()=>new Function(csrc+'\nreturn schoolFinanceCore;')();
const invoice=(d,id)=>d.invoices.find(i=>i.id===id);
function browser(snapshot){
 let stored=snapshot||JSON.stringify(core().seed());const events={},root={innerHTML:'',contains:()=>true};
 const doc={getElementById:id=>id==='app'?root:null,addEventListener:(name,fn)=>events[name]=fn};
 class FD{constructor(form){this.fields=form.fields}entries(){return Object.entries(this.fields)[Symbol.iterator]()}}
 new Function('document','window','localStorage','FormData',csrc+'\n'+asrc)(doc,{confirm:()=>true},
  {getItem:()=>stored,setItem:(k,v)=>stored=v},FD);
 const click=d=>events.click({target:{closest:()=>({dataset:d})}});
 return {root,data:()=>JSON.parse(stored),saved:()=>stored,role:value=>events.change({target:{id:'demo-role',value}}),
  tab:tab=>click({tab}),open:(open,id)=>click({open,id}),action:(action,id)=>click({action,id}),
  filter:invoiceFilter=>click({invoiceFilter}),filterFinance:financeFilter=>click({financeFilter}),
  childTab:childTab=>click({childTab}),
  search:value=>events.input({target:{id:'finance-search',value,selectionStart:value.length,selectionEnd:value.length}}),
  pay:(id,amount,phone='0722000011')=>events.submit({preventDefault:()=>{},target:{id:'school-checkout',dataset:{id},fields:{amount:String(amount),phone}}})
 };
}
test('school and grade fee structures preexist; there are six students and three parent children',()=>{
 const c=core(),d=c.seed();
 a.ok(c.valid(d));a.equal(d.school.name,'Cedar Grove Academy');
 a.equal(d.feeStructures.length,3);a.equal(d.addOnCatalog.length,6);a.equal(d.students.length,6);
 a.deepEqual(c.parentStudents(d).map(s=>s.grade),['Grade 2','Grade 5','Grade 8']);
});
test('parent children each have current and previous invoices; invoice lines are snapshots with add-ons',()=>{
 const c=core(),d=c.seed();a.equal(d.invoices.length,9);
 for(const s of c.parentStudents(d)){
  const history=c.studentInvoices(d,s.id);
  a.equal(history.length,2);a.ok(history.some(i=>i.term==='Term 2'));
  a.ok(history.some(i=>i.term==='Term 3'));
 }
 a.equal(invoice(d,'INV-2026-3003').total,45000);
 a.ok(invoice(d,'INV-2026-3003').lines.some(x=>x.kind==='Add-on'));
 for(const i of d.invoices)a.equal(i.total,i.lines.reduce((n,x)=>n+x.amount,0));
});
test('seeded invoices reconcile exactly to the prior sample ledger',()=>{
 const c=core(),d=c.seed();
 for(const i of d.invoices)a.equal(i.paid,d.payments.filter(p=>p.invoiceId===i.id).reduce((n,p)=>n+p.amount,0));
 const m=c.metrics(d);a.equal(m.billed,m.collected+m.outstanding);
 a.ok(d.invoices.some(i=>c.amountDue(i)===0));
 a.ok(d.invoices.some(i=>c.amountDue(i)>0&&i.paid>0));
});
test('partial parent payment updates only the selected invoice and school-wide ledger',()=>{
 const c=core(),d=c.seed(),before=c.metrics(d),p=c.pay(d,'parent','INV-2026-3001',10000,'0722000011','demo-valid-partial');
 a.equal(p.status,'Reconciled');a.equal(p.receiptNumber,'RCT-DEMO-4001');
 a.equal(invoice(d,'INV-2026-3001').paid,10000);
 a.equal(c.amountDue(invoice(d,'INV-2026-3001')),16200);
 a.equal(c.status(invoice(d,'INV-2026-3001')),'Partially paid');
 a.equal(c.metrics(d).collected,before.collected+10000);
 a.equal(c.metrics(d).outstanding,before.outstanding-10000);
 a.equal(invoice(d,'INV-2026-3003').paid,0);
});
test('second partial payment settles a prior partially paid invoice',()=>{
 const c=core(),d=c.seed(),id='INV-2026-3002';
 a.equal(c.amountDue(invoice(d,id)),25000);
 c.pay(d,'parent',id,10000,'0722000011','demo-brian-first');
 a.equal(c.amountDue(invoice(d,id)),15000);
 c.pay(d,'parent',id,15000,'0722000011','demo-brian-second');
 a.equal(c.amountDue(invoice(d,id)),0);
 a.equal(c.status(invoice(d,id)),'Paid');
 a.throws(()=>c.pay(d,'parent',id,1,'0722000011','demo-brian-third'),/fully settled/);
});
test('one full checkout settles an unpaid invoice',()=>{
 const c=core(),d=c.seed();c.pay(d,'parent','INV-2026-3003',45000,'0722000011','demo-zuri-full');
 a.equal(c.status(invoice(d,'INV-2026-3003')),'Paid');
 a.equal(c.amountDue(invoice(d,'INV-2026-3003')),0);
});
test('role and family scope are enforced before payment creation',()=>{
 const c=core(),d=c.seed(),before=JSON.stringify(d);
 a.throws(()=>c.pay(d,'finance','INV-2026-3001',500,'0722000011','demo-not-finance'),/Only a parent/);
 a.throws(()=>c.pay(d,'parent','INV-2026-3004',500,'0722000011','demo-another-family'),/not linked/);
 a.equal(JSON.stringify(d),before);
});
test('invalid amount and phone validations leave ledger unchanged',()=>{
 const c=core(),d=c.seed(),before=JSON.stringify(d);
 for(const n of [0,-1,0.5,26201,''])a.throws(()=>c.pay(d,'parent','INV-2026-3001',n,'0722000011','demo-invalid-amount-123456'),/Payment amount|Amount exceeds/);
 for(const phone of ['','072200001','07123abcd'])a.throws(()=>c.pay(d,'parent','INV-2026-3001',1000,phone,'demo-invalid-phone-123456'),/valid 10-digit/);
 a.equal(JSON.stringify(d),before);
});
test('idempotency prevents duplicate allocations and inconsistent reuse',()=>{
 const c=core(),d=c.seed(),key='demo-same-request-123';
 const p=c.pay(d,'parent','INV-2026-3001',5000,'0722000011',key),after=JSON.stringify(d);
 a.equal(c.pay(d,'parent','INV-2026-3001',5000,'0722000011',key).id,p.id);
 a.equal(JSON.stringify(d),after);
 a.throws(()=>c.pay(d,'parent','INV-2026-3001',6000,'0722000011',key),/already used/);
});
test('Parent app displays only Fees, Payments and Children tabs',()=>{
 const h=browser();
 for(const t of ['data-tab="fees"','data-tab="payments"','data-tab="children"','Mary (Parent)','David (Finance)'])a.ok(h.root.innerHTML.includes(t),t);
 a.doesNotMatch(h.root.innerHTML,/School Admin|Create school|Generate fee invoice|Create organization/);
 h.tab('children');for(const n of ['Amani Otieno','Brian Otieno','Zuri Otieno'])a.ok(h.root.innerHTML.includes(n));
 a.doesNotMatch(h.root.innerHTML,/Neema Wanjiku/);
});
test('Parent Fees shows current and past open plus paid invoice filters',()=>{
 const h=browser();a.match(h.root.innerHTML,/INV-2026-3001/);a.match(h.root.innerHTML,/INV-2026-2002/);
 a.doesNotMatch(h.root.innerHTML,/INV-2026-2001/);
 h.filter('paid');a.match(h.root.innerHTML,/INV-2026-2001/);
 h.filter('all');a.match(h.root.innerHTML,/INV-2026-3001/);
});
test('invoice details display base and add-on lines, historical partial allocation',()=>{
 const h=browser();h.open('invoice','INV-2026-3002');
 for(const t of ['Brian Otieno','Fee breakdown','Lunch programme','Add-on charge','KES 6,000','KES 25,000','Pay with M-Pesa'])a.ok(h.root.innerHTML.includes(t),t);
});
test('checkout prepopulates whole balance and Safaricom 0722000011',()=>{
 const h=browser();h.open('invoice','INV-2026-3001');h.action('checkout','INV-2026-3001');
 a.match(h.root.innerHTML,/Pay school fees/);a.match(h.root.innerHTML,/Safaricom number/);
 a.match(h.root.innerHTML,/value="0722000011"/);
 a.match(h.root.innerHTML,/name="amount"[^>]*value="26200"/);
 a.match(h.root.innerHTML,/No STK prompt/);
});
test('partial checkout generates receipt and immediately syncs Finance invoice and payment ledger',()=>{
 const h=browser(),total=core().metrics(h.data()).outstanding;
 h.open('invoice','INV-2026-3001');h.action('checkout','INV-2026-3001');h.pay('INV-2026-3001',10000);
 a.match(h.root.innerHTML,/Payment received/);a.match(h.root.innerHTML,/KES 16,200/);a.match(h.root.innerHTML,/RCT-DEMO-4001/);
 h.role('finance');a.match(h.root.innerHTML,/Finance overview/);
 a.equal(core().metrics(h.data()).outstanding,total-10000);
 h.tab('invoices');h.open('invoice','INV-2026-3001');a.match(h.root.innerHTML,/KES 16,200/);
 h.action('back');h.tab('payments');a.match(h.root.innerHTML,/SIM-MPESA-4001/);
});
test('full checkout appears as paid for both Parent and Finance',()=>{
 const h=browser();h.open('invoice','INV-2026-3003');h.action('checkout','INV-2026-3003');h.pay('INV-2026-3003',45000);
 a.equal(core().status(invoice(h.data(),'INV-2026-3003')),'Paid');
 h.action('receipt-to-invoice','INV-2026-3003');a.match(h.root.innerHTML,/Invoice fully settled/);
 a.doesNotMatch(h.root.innerHTML,/data-action="checkout"/);
 h.action('back');h.filter('paid');a.match(h.root.innerHTML,/INV-2026-3003/);
 h.role('finance');h.tab('invoices');h.filterFinance('paid');a.match(h.root.innerHTML,/INV-2026-3003/);
});
test('Finance tabs show school overview invoices payments and six students',()=>{
 const h=browser();h.role('finance');
 for(const t of ['overview','invoices','payments','students'])a.ok(h.root.innerHTML.includes('data-tab="'+t+'"'));
 h.tab('students');
 for(const n of ['Neema Wanjiku','Jayden Mwangi','Ivy Kamau'])a.ok(h.root.innerHTML.includes(n));
 h.open('student','STU-105');a.match(h.root.innerHTML,/Grade 5/);
});
test('Finance overview displays read-only grade fee structures and addons',()=>{
 const h=browser();h.role('finance');
 for(const s of ['Grade 2','Grade 5','Grade 8','Lunch programme','Examination support'])a.ok(h.root.innerHTML.includes(s));
 a.match(h.root.innerHTML,/Fee structures &amp; add-ons/);
 a.doesNotMatch(h.root.innerHTML,/Create fee structure|Create school|Add invoice/);
});
test('Finance invoice search and statuses operate across multiple grades',()=>{
 const h=browser();h.role('finance');h.tab('invoices');
 h.search('CGA-2026-066');a.match(h.root.innerHTML,/Ivy Kamau/);a.doesNotMatch(h.root.innerHTML,/Amani Otieno/);
 h.search('');h.filterFinance('paid');a.match(h.root.innerHTML,/INV-2026-2003/);
 a.doesNotMatch(h.root.innerHTML,/INV-2026-3001/);
});
test('Parent cannot browse another family financial account or receipt',()=>{
 const h=browser();h.open('invoice','INV-2026-3004');
 a.doesNotMatch(h.root.innerHTML,/Neema Wanjiku/);
 h.tab('payments');a.match(h.root.innerHTML,/SIM-3002/);a.doesNotMatch(h.root.innerHTML,/SIM-3005/);
 h.tab('children');h.open('student','STU-103');h.childTab('payments');a.match(h.root.innerHTML,/SIM-2003/);
});
test('sample payment receipt opens for both Parent and Finance',()=>{
 const h=browser();h.tab('payments');h.open('receipt','PAY-3002');
 a.match(h.root.innerHTML,/Payment receipt/);a.match(h.root.innerHTML,/KES 6,000/);
 h.role('finance');h.tab('payments');h.open('receipt','PAY-3005');a.match(h.root.innerHTML,/Jayden Mwangi/);
});
test('invalid checkout shows error and does not mutate persisted invoices',()=>{
 const h=browser(),before=h.saved();
 h.open('invoice','INV-2026-3001');h.action('checkout','INV-2026-3001');h.pay('INV-2026-3001',30000);
 a.equal(h.saved(),before);a.match(h.root.innerHTML,/exceeds the outstanding/);a.match(h.root.innerHTML,/Pay school fees/);
});
test('payment persists across reload and cannot multiply receipts',()=>{
 const h=browser();h.open('invoice','INV-2026-3001');h.action('checkout','INV-2026-3001');h.pay('INV-2026-3001',26200);
 const r=browser(h.saved());a.equal(invoice(r.data(),'INV-2026-3001').paid,26200);
 a.equal(r.data().payments.filter(p=>p.invoiceId==='INV-2026-3001').length,1);
 r.role('finance');r.tab('payments');a.match(r.root.innerHTML,/SIM-MPESA-4001/);
});
test('reset restores original balances invoices and sample payments',()=>{
 const h=browser();h.open('invoice','INV-2026-3001');h.action('checkout','INV-2026-3001');h.pay('INV-2026-3001',10000);
 a.equal(h.data().payments.length,6);h.action('reset');a.equal(h.data().payments.length,5);
 a.equal(invoice(h.data(),'INV-2026-3001').paid,0);
});
test('standalone demo loads scoped scripts and contains no branded SchoolPey assets or admin',()=>{
 a.match(html,/\/demos\/education\/core\.js/);a.match(html,/\/demos\/education\/app\.js/);a.match(html,/\/demos\/education\/styles\.css/);
 a.doesNotMatch(html,/minimal-engine|\/education\/demo\.js/);
 a.doesNotMatch(asrc,/SchoolPey|School Admin|Create organization/);
 a.match(css,/@media\(max-width:540px\)/);
});

test('School demo UI uses JoelTechGeek Beach Sunset color tokens instead of reference app indigo',()=>{
 for(const line of [
  '--ocean-blue:#0ea5e9','--ocean-blue-dark:#0284c7',
  '--palm-green:#059669','--palm-green-dark:#047857',
  '--sunset-yellow:#f59e0b','--sandy-beach:#fef3c7'
 ])a.ok(css.includes(line),'Missing brand token '+line);
 a.doesNotMatch(css,/#3730a3|#3832a3|#29257d|#4849aa|#5253b2/i);
 a.match(css,/\.btn\.primary\{background:var\(--palm-green\)/);
 a.match(css,/\.bottom-tabs button\.selected\{background:#e8f7ee;border-color:var\(--palm-green\)/);
 a.match(css,/\.summary-banner[\s\S]*?background:linear-gradient\(110deg,var\(--palm-green-dark\),var\(--palm-green\)\)/);
 a.match(css,/\.status\.partially-paid\{background:var\(--sandy-beach\)/);
});
