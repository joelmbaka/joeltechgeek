const schoolFinanceCore=(function(){
 "use strict";
 const now=()=>new Date().toISOString();
 const money=x=>Math.round(x*100)/100;
 const fail=s=>{throw new Error(s)};
 const int=(v,label,min=1)=>{
  if(v===null||v===undefined||String(v).trim()==="")return fail(label+" is required.");
  const n=Number(v);
  if(!Number.isSafeInteger(n)||n<min||n>1000000)return fail(label+" must be a whole KES amount between "+min+" and 1,000,000.");
  return n;
 };
 const get=(list,id,label)=>list.find(x=>x.id===id)||fail(label+" not found.");
 const sum=xs=>xs.reduce((n,x)=>n+x,0);
 const amountDue=i=>Math.max(0,i.total-i.paid);
 const status=i=>amountDue(i)===0?"Paid":i.paid>0?"Partially paid":i.dueDate<"2026-11-01"?"Overdue":"Open";
 const line=(description,amount,kind)=>({description,amount,kind});
 const setup={
  "Grade 2":{id:"FS-02",name:"Lower Primary Fee Plan",grade:"Grade 2",base:[
   line("Tuition",16500,"Base"),line("Activities",2200,"Base")]},
  "Grade 5":{id:"FS-05",name:"Upper Primary Fee Plan",grade:"Grade 5",base:[
   line("Tuition",24500,"Base"),line("Activities",3000,"Base")]},
  "Grade 8":{id:"FS-08",name:"Junior School Fee Plan",grade:"Grade 8",base:[
   line("Tuition",32500,"Base"),line("Activities",4500,"Base")]}
 };
 const addOnCatalog=[
  {id:"ADD-LUNCH-02",label:"Lunch programme",grade:"Grade 2",amount:3000},
  {id:"ADD-TRANSPORT-02",label:"School transport",grade:"Grade 2",amount:4500},
  {id:"ADD-LUNCH-05",label:"Lunch programme",grade:"Grade 5",amount:3500},
  {id:"ADD-TRANSPORT-05",label:"School transport",grade:"Grade 5",amount:5000},
  {id:"ADD-EXAM-08",label:"Examination support",grade:"Grade 8",amount:2500},
  {id:"ADD-TRANSPORT-08",label:"School transport",grade:"Grade 8",amount:5500}
 ];
 const seed=()=>{
  const students=[
   {id:"STU-101",name:"Amani Otieno",grade:"Grade 2",admission:"CGA-2026-021",guardianId:"G-101",addons:["ADD-LUNCH-02","ADD-TRANSPORT-02"]},
   {id:"STU-102",name:"Brian Otieno",grade:"Grade 5",admission:"CGA-2026-043",guardianId:"G-101",addons:["ADD-LUNCH-05"]},
   {id:"STU-103",name:"Zuri Otieno",grade:"Grade 8",admission:"CGA-2026-065",guardianId:"G-101",addons:["ADD-EXAM-08","ADD-TRANSPORT-08"]},
   {id:"STU-104",name:"Neema Wanjiku",grade:"Grade 2",admission:"CGA-2026-022",guardianId:"G-102",addons:["ADD-LUNCH-02"]},
   {id:"STU-105",name:"Jayden Mwangi",grade:"Grade 5",admission:"CGA-2026-044",guardianId:"G-103",addons:["ADD-TRANSPORT-05"]},
   {id:"STU-106",name:"Ivy Kamau",grade:"Grade 8",admission:"CGA-2026-066",guardianId:"G-104",addons:["ADD-EXAM-08"]}
  ];
  const invoice=(id,studentId,term,entries,paid,dueDate)=>{
   const lines=entries.map(x=>({...x})),total=sum(lines.map(x=>x.amount));
   return {id,reference:id,studentId,term,year:"2026",dueDate,issuedOn:term==="Term 3"?"2026-10-10":"2026-05-12",
    lines,total,paid,status:paid===total?"paid":"issued"};
  };
  const current=student=>{
   const base=setup[student.grade].base;
   const addons=student.addons.map(id=>{
    const x=get(addOnCatalog,id,"Add-on");
    return line(x.label,x.amount,"Add-on");
   });
   return [...base,...addons];
  };
  const invoices=[
   invoice("INV-2026-3001","STU-101","Term 3",current(students[0]),0,"2026-12-10"),
   invoice("INV-2026-3002","STU-102","Term 3",current(students[1]),6000,"2026-12-10"),
   invoice("INV-2026-3003","STU-103","Term 3",current(students[2]),0,"2026-12-10"),
   invoice("INV-2026-2001","STU-101","Term 2",[line("Tuition",16000,"Base"),line("Activities",2000,"Base"),line("Lunch programme",3000,"Add-on"),line("School transport",4500,"Add-on")],25500,"2026-07-30"),
   invoice("INV-2026-2002","STU-102","Term 2",[line("Tuition",23000,"Base"),line("Activities",2500,"Base")],21500,"2026-07-30"),
   invoice("INV-2026-2003","STU-103","Term 2",[line("Tuition",30500,"Base"),line("Activities",4000,"Base"),line("Examination support",2500,"Add-on"),line("School transport",5000,"Add-on")],42000,"2026-07-30"),
   invoice("INV-2026-3004","STU-104","Term 3",current(students[3]),0,"2026-12-10"),
   invoice("INV-2026-3005","STU-105","Term 3",current(students[4]),10000,"2026-12-10"),
   invoice("INV-2026-3006","STU-106","Term 3",current(students[5]),0,"2026-12-10")
  ];
  const payment=(id,invoiceId,amount,phone,date)=>{
   const studentId=get(invoices,invoiceId,"Invoice").studentId;
   return {id,invoiceId,studentId,amount,phone,method:"M-Pesa",status:"Reconciled",
    receiptNumber:id.replace("PAY","RCT"),reference:"SIM-"+id.replace("PAY-",""),at:date,source:"Seeded sample"};
  };
  const payments=[
   payment("PAY-2001","INV-2026-2001",25500,"0722000011","2026-07-12T09:15:00Z"),
   payment("PAY-2002","INV-2026-2002",21500,"0722000011","2026-07-18T11:45:00Z"),
   payment("PAY-2003","INV-2026-2003",42000,"0722000011","2026-07-19T13:20:00Z"),
   payment("PAY-3002","INV-2026-3002",6000,"0722000011","2026-10-16T13:10:00Z"),
   payment("PAY-3005","INV-2026-3005",10000,"0722000044","2026-10-20T12:05:00Z")
  ];
  return {version:2,sequence:4000,school:{id:"SCHOOL-1",name:"Cedar Grove Academy",year:"2026",term:"Term 3",currency:"KES",type:"Fictional school"},
   parent:{id:"G-101",name:"Mary Otieno",phone:"0722000011"},
   feeStructures:Object.values(setup).map(x=>({...x,base:x.base.map(z=>({...z}))})),addOnCatalog:addOnCatalog.map(x=>({...x})),
   students,invoices,payments,activity:[]};
 };
 const valid=d=>Boolean(d&&d.version===2&&d.parent&&d.school&&Array.isArray(d.students)&&
  Array.isArray(d.invoices)&&Array.isArray(d.payments)&&Array.isArray(d.feeStructures)&&
  Array.isArray(d.addOnCatalog)&&Number.isSafeInteger(d.sequence));
 const parentStudents=d=>d.students.filter(x=>x.guardianId===d.parent.id);
 const familyInvoices=d=>d.invoices.filter(i=>parentStudents(d).some(s=>s.id===i.studentId));
 const familyPayments=d=>d.payments.filter(p=>parentStudents(d).some(s=>s.id===p.studentId));
 const studentInvoices=(d,id)=>d.invoices.filter(i=>i.studentId===id);
 const studentPayments=(d,id)=>d.payments.filter(p=>p.studentId===id);
 const outstanding=invoices=>sum(invoices.map(amountDue));
 const metrics=d=>{
  const total=sum(d.invoices.map(i=>i.total)),paid=sum(d.invoices.map(i=>i.paid));
  return {billed:total,collected:paid,outstanding:total-paid,
   open:d.invoices.filter(i=>amountDue(i)>0).length,settled:d.invoices.filter(i=>amountDue(i)===0).length,
   studentCount:d.students.length,payments:d.payments.length,
   familyOutstanding:outstanding(familyInvoices(d))};
 };
 const normalizePhone=value=>{
  const raw=String(value??"").trim().replace(/[\s-]/g,"");
  if(!/^(?:07|01)\d{8}$/.test(raw))fail("Enter a valid 10-digit Kenyan mobile number (e.g. 0722000011).");
  return raw;
 };
 function pay(d,role,invoiceId,rawAmount,rawPhone,requestId){
  if(role!=="parent")fail("Only a parent can start the demo M-Pesa checkout.");
  const i=get(d.invoices,invoiceId,"Invoice");
  const student=get(d.students,i.studentId,"Student");
  if(student.guardianId!==d.parent.id)fail("This invoice is not linked to the demo parent.");
  const reference=String(requestId||"").trim();
  if(!/^demo-[A-Za-z0-9-]{5,90}$/.test(reference))fail("Missing valid checkout request reference.");
  const previous=d.payments.find(p=>p.requestId===reference);
  if(previous){
   if(previous.invoiceId!==invoiceId||previous.amount!==Number(rawAmount))fail("This checkout reference was already used for a different payment.");
   return previous;
  }
  const phone=normalizePhone(rawPhone),amount=int(rawAmount,"Payment amount");
  const balance=amountDue(i);
  if(balance<=0)fail("This invoice has already been fully settled.");
  if(amount>balance)fail("Amount exceeds the outstanding invoice balance of KES "+balance+".");
  // Fictional equivalent of verified provider evidence + canonical payment allocation + receipt in one atomic local update.
  const nextId=d.sequence+1;
  const id="PAY-DEMO-"+nextId,entry={id,invoiceId:i.id,studentId:i.studentId,amount,phone,
   method:"M-Pesa (simulated)",status:"Reconciled",source:"Simulated checkout",
   requestId:reference,receiptNumber:"RCT-DEMO-"+nextId,reference:"SIM-MPESA-"+nextId,at:now()};
  i.paid+=amount;i.status=amountDue(i)===0?"paid":"issued";
  d.sequence=nextId;d.payments.unshift(entry);
  d.activity.unshift({id:"EVT-"+nextId,title:"Sample M-Pesa payment reconciled",invoiceId:i.id,studentId:i.studentId,
   amount,at:entry.at,reference:entry.reference});
  return entry;
 }
 return {seed,valid,setup,addOnCatalog,amountDue,status,parentStudents,familyInvoices,familyPayments,studentInvoices,studentPayments,
  outstanding,metrics,normalizePhone,pay};
})();
