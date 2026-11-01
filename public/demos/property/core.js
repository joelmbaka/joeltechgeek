const rentalCore=(function(){
"use strict";
const period="2026-11",now=()=>new Date().toISOString();
const currency=n=>Math.round(Number(n)*100)/100;
const amount=(raw,title,min=0.01,max=3000000)=>{
 if(raw===null||raw===undefined||String(raw).trim()==="")throw new Error(title+" is required.");
 const n=Number(raw);
 if(!Number.isFinite(n)||n<min||n>max||Math.round(n*100)/100!==n)throw new Error(title+" must be between "+min+" and "+max+" with up to two decimals.");
 return n;
};
const required=(v,label,max=120)=>{const s=String(v??"").trim();if(!s||s.length>max)throw new Error(label+" is required (max "+max+" characters).");return s;};
const get=(list,id,label)=>list.find(x=>x.id===id)||(()=>{throw new Error(label+" not found.");})();
const next=(d,prefix)=>prefix+"-"+String(++d.seq).padStart(4,"0");
const balance=i=>Math.max(0,currency(i.total-i.paid));
const status=i=>balance(i)===0?"Paid":i.dueDate<"2026-11-01"?"Overdue":i.paid>0?"Partially paid":"Due";
const seed=()=>{
 const properties=[
  {id:"P-101",name:"Cedar Ridge Apartments",city:"Nairobi",area:"Westlands",owner:"Grace Mwangi",status:"Active"},
  {id:"P-102",name:"Hillstone Court",city:"Kisii",area:"Milimani",owner:"Eliud Nyamweya",status:"Active"}
 ];
 const units=[
  {id:"U-101",propertyId:"P-101",code:"A-101",rent:32000,serviceCharge:2000,active:true},
  {id:"U-102",propertyId:"P-101",code:"A-102",rent:27500,serviceCharge:1500,active:true},
  {id:"U-103",propertyId:"P-101",code:"A-103",rent:30000,serviceCharge:2000,active:true},
  {id:"U-201",propertyId:"P-102",code:"B-201",rent:40000,serviceCharge:1500,active:true},
  {id:"U-202",propertyId:"P-102",code:"B-202",rent:26000,serviceCharge:1000,active:true},
  {id:"U-301",propertyId:null,code:"Studio S-1",rent:19000,serviceCharge:0,active:true}
 ];
 const tenants=[
  {id:"T-101",name:"Alex Wanjiru",phone:"0722000011"},
  {id:"T-102",name:"Daniel Kariuki",phone:"0722000022"},
  {id:"T-201",name:"Christine Akinyi",phone:"0722000033"},
  {id:"T-202",name:"Joseph Ombasa",phone:"0722000044"},
  {id:"T-301",name:"Faith Nyambura",phone:"0722000055"}
 ];
 const leases=[
  {id:"L-101",unitId:"U-101",tenantId:"T-101",status:"Active",start:"2026-01-01",rent:32000,serviceCharge:2000,cycle:1},
  {id:"L-102",unitId:"U-102",tenantId:"T-102",status:"Active",start:"2026-03-01",rent:27500,serviceCharge:1500,cycle:1},
  {id:"L-201",unitId:"U-201",tenantId:"T-201",status:"Active",start:"2026-02-01",rent:40000,serviceCharge:1500,cycle:1},
  {id:"L-202",unitId:"U-202",tenantId:"T-202",status:"Active",start:"2026-06-01",rent:26000,serviceCharge:1000,cycle:1},
  {id:"L-301",unitId:"U-301",tenantId:"T-301",status:"Active",start:"2026-07-01",rent:19000,serviceCharge:0,cycle:1}
 ];
 const makeInvoice=(id,leaseId,month,paid,dueDate)=>{
  const lease=get(leases,leaseId,"Lease"),unit=get(units,lease.unitId,"Unit");
  const total=lease.rent+lease.serviceCharge;
  return {id,reference:id,leaseId,tenantId:lease.tenantId,unitId:unit.id,
   propertyId:unit.propertyId,month,issuedAt:month+"-01",dueDate,
   baseRent:lease.rent,serviceCharge:lease.serviceCharge,deposit:0,total,paid,creditApplied:0};
 };
 const invoices=[
  makeInvoice("INV-2026-1101","L-101","2026-11",8000,"2026-11-05"),
  makeInvoice("INV-2026-1102","L-102","2026-11",0,"2026-11-05"),
  makeInvoice("INV-2026-1103","L-201","2026-11",41500,"2026-11-05"),
  makeInvoice("INV-2026-1104","L-202","2026-11",0,"2026-11-05"),
  makeInvoice("INV-2026-1105","L-301","2026-11",0,"2026-11-05"),
  makeInvoice("INV-2026-1001","L-101","2026-10",34000,"2026-10-05"),
  makeInvoice("INV-2026-1002","L-102","2026-10",19000,"2026-10-05"),
  makeInvoice("INV-2026-1003","L-201","2026-10",41500,"2026-10-05"),
  makeInvoice("INV-2026-1004","L-202","2026-10",27000,"2026-10-05"),
  makeInvoice("INV-2026-1005","L-301","2026-10",19000,"2026-10-05")
 ];
 const payments=[
  ["PAY-1001","INV-2026-1101",8000,"Bank transfer","BANK-204-1","2026-11-01"],
  ["PAY-1002","INV-2026-1103",41500,"M-Pesa received externally","MPESA-204-2","2026-11-01"],
  ["PAY-1003","INV-2026-1001",34000,"M-Pesa received externally","MPESA-103-1","2026-10-08"],
  ["PAY-1004","INV-2026-1002",19000,"Bank transfer","BANK-103-2","2026-10-12"],
  ["PAY-1005","INV-2026-1003",41500,"M-Pesa received externally","MPESA-103-3","2026-10-07"],
  ["PAY-1006","INV-2026-1004",27000,"Cash","CASH-103-4","2026-10-10"],
  ["PAY-1007","INV-2026-1005",19000,"Bank transfer","BANK-103-5","2026-10-11"]
 ].map(([id,invoiceId,received,method,reference,date])=>{
  const inv=get(invoices,invoiceId,"Invoice");
  return {id,invoiceId,tenantId:inv.tenantId,unitId:inv.unitId,propertyId:inv.propertyId,
   received,applied:received,credit:0,method,reference,date,receipt:"RCT-"+id.slice(4),destination:"Demo rent collection account",status:"Allocated"};
 });
 const expenses=[
  {id:"EXP-101",propertyId:"P-101",title:"Common-area lighting",amount:4800,category:"Utilities",date:"2026-11-01"},
  {id:"EXP-102",propertyId:"P-102",title:"Water pump service",amount:2200,category:"Maintenance",date:"2026-11-01"}
 ];
 return {version:2,seq:3000,workspace:{name:"Greenway Property Management",manager:"Anne (Property Manager)",period},
  properties,units,tenants,leases,invoices,payments,expenses,credits:[],activity:[],settlementAccounts:[
   {id:"ACC-1",name:"Demo rent collection account",kind:"Bank / Paybill (fictional)"}
  ]};
};
const valid=d=>Boolean(d&&d.version===2&&d.workspace&&Array.isArray(d.units)&&Array.isArray(d.properties)&&Array.isArray(d.invoices)&&Array.isArray(d.payments)&&Array.isArray(d.leases)&&Array.isArray(d.tenants)&&Array.isArray(d.expenses)&&Array.isArray(d.credits)&&Number.isSafeInteger(d.seq));
const activeLease=(d,unitId)=>d.leases.find(l=>l.unitId===unitId&&l.status==="Active");
const occupied=d=>d.units.filter(u=>u.active&&activeLease(d,u.id)).length;
const currentInvoices=d=>d.invoices.filter(i=>i.month===period);
const pendingInvoices=d=>d.invoices.filter(i=>balance(i)>0);
const settle=(d,invoiceId,raw)=>{
 const i=get(d.invoices,invoiceId,"Invoice");
 const payment=amount(raw.amount,"Amount received");
 if(balance(i)<=0)throw new Error("Invoice is already settled.");
 const method=required(raw.method,"Payment method",40);
 if(!["M-Pesa received externally","Bank transfer","Cash"].includes(method))throw new Error("Choose a valid collection method.");
 const account=required(raw.destination,"Receiving account",110);
 if(!d.settlementAccounts.some(x=>x.name===account))throw new Error("Choose an existing demo receiving account.");
 const reference=required(raw.reference,"Payment reference",70);
 if(d.payments.some(p=>p.reference.toLowerCase()===reference.toLowerCase()))throw new Error("This payment reference has already been recorded.");
 const date=required(raw.date,"Transaction date",10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+"T00:00:00Z")))throw new Error("Enter a valid transaction date.");
 const applied=Math.min(payment,balance(i)),credit=currency(payment-applied);
 const id=next(d,"PAY"),receipt="RCT-"+id.slice(4);
 const p={id,invoiceId:i.id,tenantId:i.tenantId,unitId:i.unitId,propertyId:i.propertyId,received:payment,applied,credit,
  method,reference,date,receipt,destination:account,status:"Allocated"};
 i.paid=currency(i.paid+applied);
 d.payments.unshift(p);
 if(credit)d.credits.unshift({id:next(d,"CR"),tenantId:i.tenantId,leaseId:i.leaseId,amount:credit,remaining:credit,sourcePaymentId:p.id});
 d.activity.unshift({id:next(d,"EV"),type:"Payment",text:receipt+" · "+reference,date});
 return p;
};

function payNow(d,tenantId,invoiceId,raw){
 // The only interactive tenant account in this fictional mobile demo is Alex.
 if(tenantId!=="T-101")throw new Error("Only Alex's demo tenant account can check out.");
 const i=get(d.invoices,invoiceId,"Invoice");
 if(i.tenantId!==tenantId)throw new Error("This invoice does not belong to the current tenant.");
 const phone=required(raw.phone,"Safaricom number",25).replace(/[\s-]/g,"");
 if(!/^(?:07|01)\d{8}$/.test(phone))throw new Error("Enter a valid Kenyan mobile number.");
 const rawAmount=amount(raw.amount,"Payment amount",1,3000000);
 if(!Number.isSafeInteger(rawAmount))throw new Error("Use whole Kenyan shillings for checkout.");
 const requestId=required(raw.requestId,"Checkout reference",100);
 if(!/^demo-checkout-[A-Za-z0-9-]{5,80}$/.test(requestId))throw new Error("Invalid checkout reference.");
 const existing=d.payments.find(p=>p.requestId===requestId);
 if(existing){
  if(existing.invoiceId!==i.id||existing.received!==rawAmount||existing.phone!==phone)
   throw new Error("This checkout reference was used for a different payment.");
  return existing;
 }
 if(balance(i)<=0)throw new Error("This invoice is already settled.");
 if(rawAmount>balance(i))throw new Error("Payment exceeds the outstanding invoice balance.");
 const id=next(d,"PAY"),receipt="RCT-"+id.slice(4);
 const ref="SIM-MPESA-"+id.slice(4);
 const date=now().slice(0,10);
 const p={id,invoiceId:i.id,tenantId:i.tenantId,unitId:i.unitId,propertyId:i.propertyId,
  received:rawAmount,applied:rawAmount,credit:0,method:"M-Pesa (simulated)",phone,
  reference:ref,date,receipt,destination:"Demo rent collection account",
  status:"Allocated",source:"Tenant sample checkout",requestId};
 i.paid=currency(i.paid+rawAmount);
 d.payments.unshift(p);
 d.activity.unshift({id:next(d,"EV"),type:"Payment",text:receipt+" · "+ref,date});
 return p;
}

function createLease(d,fields){
 const unit=get(d.units,fields.unitId,"Unit");
 if(!unit.active||activeLease(d,unit.id))throw new Error("Choose an available vacant unit.");
 // This demo deliberately assigns every new lease to its single sample tenant.
 // Reuse the existing Alex record so his Tenant dashboard can see the new lease and invoice.
 if(fields.tenantId&&fields.tenantId!=="T-101")throw new Error("Only Alex Wanjiru can be assigned in this demo.");
 const tenant=get(d.tenants,"T-101","Sample tenant");
 const start=required(fields.start,"Lease start",10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(Date.parse(start+"T00:00:00Z")))throw new Error("Enter a valid start date.");
 const rent=amount(fields.rent,"Monthly rent"),service=amount(fields.serviceCharge??0,"Service charge",0);
 const lease={id:next(d,"L"),unitId:unit.id,tenantId:tenant.id,status:"Active",start,rent,serviceCharge:service,cycle:1};
 const makeInvoice=fields.createInvoice==="yes";
 const exists=d.invoices.some(i=>i.leaseId===lease.id&&i.month===period);
 if(exists)throw new Error("This lease already has a current invoice.");
 d.leases.unshift(lease);unit.rent=rent;unit.serviceCharge=service;
 let invoice=null;
 if(makeInvoice){
  invoice={id:next(d,"INV"),reference:"INV-2026-"+d.seq,leaseId:lease.id,tenantId:tenant.id,unitId:unit.id,propertyId:unit.propertyId,
   month:period,issuedAt:"2026-11-01",dueDate:"2026-11-05",baseRent:rent,serviceCharge:service,deposit:0,
   total:currency(rent+service),paid:0,creditApplied:0};
  d.invoices.unshift(invoice);
 }
 d.activity.unshift({id:next(d,"EV"),type:"Lease",text:lease.id+" · "+unit.code+" created",date:"2026-11-01"});
 return {tenant,lease,invoice};
}
function addExpense(d,fields){
 const property=get(d.properties,fields.propertyId,"Property");
 const title=required(fields.title,"Expense title",90),category=required(fields.category,"Expense category",40);
 if(!["Maintenance","Utilities","Repairs","Other"].includes(category))throw new Error("Choose a valid category.");
 const cost=amount(fields.amount,"Expense amount");
 const date=required(fields.date,"Expense date",10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+"T00:00:00Z")))throw new Error("Enter a valid expense date.");
 const x={id:next(d,"EXP"),propertyId:property.id,title,category,amount:cost,date};
 d.expenses.unshift(x);d.activity.unshift({id:next(d,"EV"),type:"Expense",text:x.title+" · "+x.id,date});
 return x;
}
function metrics(d,month=period){
 const monthly=d.invoices.filter(i=>i.month===month);
 const billed=currency(monthly.reduce((a,x)=>a+x.total,0));
 const paid=currency(monthly.reduce((a,x)=>a+x.paid,0));
 const expenses=currency(d.expenses.filter(x=>x.date.startsWith(month)).reduce((n,x)=>n+x.amount,0));
 const outstanding=currency(d.invoices.reduce((a,x)=>a+balance(x),0));
 return {billed,collected:paid,outstanding,occupied:occupied(d),rentable:d.units.filter(x=>x.active).length,expenses,
  net:currency(paid-expenses),credit:currency(d.credits.reduce((n,x)=>n+x.remaining,0))};
}
const statement=(d,propertyId,month=period)=>{
 const property=get(d.properties,propertyId,"Property");
 const invoices=d.invoices.filter(i=>i.propertyId===propertyId&&i.month===month);
 const payments=d.payments.filter(p=>p.propertyId===propertyId&&get(d.invoices,p.invoiceId,"Invoice").month===month);
 const expenses=d.expenses.filter(e=>e.propertyId===propertyId&&e.date.startsWith(month));
 const billed=currency(invoices.reduce((n,i)=>n+i.total,0)),
  received=currency(invoices.reduce((n,i)=>n+i.paid,0)),
  spent=currency(expenses.reduce((n,x)=>n+x.amount,0));
 return {property,month,billed,received,outstanding:currency(billed-received),expenses:spent,net:currency(received-spent),
  invoices,payments,expenseItems:expenses};
};
return {seed,valid,balance,status,amount,period,activeLease,occupied,currentInvoices,pendingInvoices,settle,payNow,createLease,addExpense,metrics,statement};
})();
