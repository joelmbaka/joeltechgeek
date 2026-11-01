initMinimalDemo((function schoolDemo(){
  const money=n=>"KES "+new Intl.NumberFormat("en-KE").format(n);
  const amount=(v,label)=>{if(v==null||String(v).trim()==="")throw new Error(label+" is required.");const n=Number(v);if(!Number.isSafeInteger(n)||n<1||n>300000)throw new Error(label+" must be a whole shilling amount between 1 and 300,000.");return n};
  const due=d=>d.invoice?Math.max(0,d.invoice.total-d.invoice.allocated):0;
  const pending=d=>d.payments.find(p=>p.status==="Pending");
  const actions=[
    {id:"invoice",role:"admin",category:"Fee structures",title:"Generate a term-fee invoice",description:"The school creates an invoice from tuition, activities and transport charges for a fictional learner.",button:"Generate fee invoice",
      fields:[{name:"tuition",label:"Tuition fee (KES)",type:"number",min:1,step:1,value:"18000"},
        {name:"activity",label:"Activity fee (KES)",type:"number",min:0,step:1,value:"3000"},
        {name:"transport",label:"Transport fee (KES)",type:"number",min:0,step:1,value:"4000"}],
      ready:d=>!d.invoice,done:d=>!!d.invoice,run(d,v){
        const tuition=amount(v.tuition,"Tuition");const activity=Number(v.activity),transport=Number(v.transport);
        if(!Number.isSafeInteger(activity)||activity<0||!Number.isSafeInteger(transport)||transport<0)throw new Error("Fee lines must be nonnegative whole shilling amounts.");
        if(tuition+activity+transport>300000)throw new Error("The demo invoice total cannot exceed KES 300,000.");
        d.invoice={id:"INV-SCH-001",studentId:"STU-101",term:"Term 3 · 2026",lines:[{name:"Tuition",amount:tuition},{name:"Activity fee",amount:activity},{name:"Transport",amount:transport}],total:tuition+activity+transport,allocated:0};
        return "Term fee invoice created for "+money(d.invoice.total)+".";
      }},
    {id:"payment",role:"guardian",category:"Parent app",title:"Make a simulated fee payment",description:"Record a fictional parent payment. Nothing is reconciled until the school finance team reviews it.",button:"Submit sample payment",
      fields:[{name:"amount",label:"Amount (KES)",type:"number",min:1,max:300000,step:1,value:"8000"},{name:"method",label:"Payment channel",type:"select",options:[{value:"M-Pesa (simulated)",label:"M-Pesa (simulated)"},{value:"Bank (simulated)",label:"Bank (simulated)"}]}],
      ready:d=>!!d.invoice&&!pending(d)&&due(d)>0,done:d=>d.payments.length>0,run(d,v){
        const n=amount(v.amount,"Payment amount");
        if(!["M-Pesa (simulated)","Bank (simulated)"].includes(v.method))throw new Error("Select a sample payment channel.");
        const id="PAY-SCH-"+String(d.payments.length+1).padStart(3,"0");
        d.payments.push({id,amount:n,method:v.method,status:"Pending",allocated:0,credit:0});
        return money(n)+" recorded as pending for finance reconciliation.";
      }},
    {id:"reconcile",role:"finance",category:"Reconciliation",title:"Reconcile the pending payment",description:"Allocate to the outstanding fee invoice and preserve any overpayment as student credit.",button:"Reconcile payment",fields:[],
      ready:d=>!!pending(d),done:d=>d.receipts.length>0,run(d){
        const p=pending(d),alloc=Math.min(p.amount,due(d)),credit=p.amount-alloc;
        d.invoice.allocated+=alloc;d.credit+=credit;p.allocated=alloc;p.credit=credit;p.status="Reconciled";
        d.receipts.push({id:"RCT-SCH-"+String(d.receipts.length+1).padStart(3,"0"),paymentId:p.id,allocated:alloc,credit,paid:p.amount});
        return "Reconciled "+money(p.amount)+": "+money(alloc)+" to fees, "+money(credit)+" student credit.";
      }}
  ];
  return {
    slug:"education",category:"School fee management",product:"School Fee Management",mark:"✦",
    headline:"Fees, payments & parent balances",intro:"Explore term-fee billing, parent payments, reconciliation and student balances through an interactive school-finance workflow.",
    hero:"One reliable financial history for each student.",
    heroDescription:"A school issues term fees, a guardian pays, and finance allocates funds without losing partial payments or overpayment credit.",
    instructions:"Start as School Admin to issue fees, then Parent to simulate a payment, then Finance Officer to reconcile it. Switch back to Parent and repeat for a second payment or overpayment.",
    disclaimer:"This demo focuses on fee finance, not attendance or grading. This demo does not send M-Pesa requests, collect real payments, or access a school.",
    roles:[{id:"admin",name:"Lydia · School Admin"},{id:"guardian",name:"Mary · Parent"},{id:"finance",name:"David · Finance"}],
    seed:()=>({version:1,school:"Cedar Grove Academy (fictional)",students:[{id:"STU-101",name:"Brian Otieno (fictional)",grade:"Grade 6",guardian:"Mary (fictional)"}],invoice:null,payments:[],receipts:[],credit:0,activity:[]}),
    valid:d=>Array.isArray(d.students)&&Array.isArray(d.payments)&&Array.isArray(d.receipts)&&"credit"in d,
    metrics:d=>[
      {label:"Term invoiced",value:money(d.invoice?.total||0),detail:"Fee structure total"},
      {label:"Allocated to fees",value:money(d.invoice?.allocated||0),detail:"Only reconciled amounts"},
      {label:"Outstanding balance",value:money(due(d)),detail:"Supports partial payments"},
      {label:"Student credit",value:money(d.credit),detail:"Preserved overpayments"}
    ],actions,
    sections:[
      {title:"Student billing",description:"Illustrative school/grade/term context.",columns:[{key:"student",title:"Student"},{key:"grade",title:"Grade"},{key:"term",title:"Term"},{key:"invoiced",title:"Invoiced"},{key:"balance",title:"Outstanding"}],
        rows:d=>d.invoice?[{student:d.students[0].name,grade:d.students[0].grade,term:d.invoice.term,invoiced:money(d.invoice.total),balance:money(due(d))}]:[]},
      {title:"Payment ledger",description:"Both partial and overpayments enter the same financial history.",columns:[{key:"id",title:"Payment"},{key:"amount",title:"Amount"},{key:"channel",title:"Channel"},{key:"allocated",title:"Allocated"},{key:"status",title:"Status"}],
        rows:d=>d.payments.map(p=>({id:p.id,amount:money(p.amount),channel:p.method,allocated:money(p.allocated),status:p.status}))},
      {title:"Fee receipts",description:"Receipts appear after simulated finance reconciliation.",columns:[{key:"id",title:"Receipt"},{key:"paymentId",title:"Payment"},{key:"paid",title:"Paid"},{key:"allocated",title:"To fees"},{key:"credit",title:"Credit"}],
        rows:d=>d.receipts.map(r=>({...r,paid:money(r.paid),allocated:money(r.allocated),credit:money(r.credit)}))}
    ]
  };
})());
