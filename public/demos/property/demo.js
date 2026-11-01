initMinimalDemo((function rentDemo(){
  const money=n=>"KES "+new Intl.NumberFormat("en-KE").format(n);
  const nSh=(v,label)=>{if(v==null||String(v).trim()==="")throw new Error(label+" is required.");const n=Number(v);if(!Number.isSafeInteger(n)||n<1||n>2000000)throw new Error(label+" must be a whole shilling amount between 1 and 2,000,000.");return n;};
  const text=(v,label)=>{const s=String(v??"").trim();if(s.length<3||s.length>80)throw new Error(label+" must have 3–80 characters.");return s;};
  const due=d=>d.invoice?Math.max(0,d.invoice.total-d.invoice.allocated):0;
  const pending=d=>d.payments.find(p=>p.status==="Unallocated");
  const actions=[
    {id:"invoice",role:"manager",category:"Rent invoicing",title:"Generate a monthly rent invoice",description:"Issue a fictional monthly invoice from the lease and current unit rent.",button:"Generate November rent invoice",fields:[],
      ready:d=>!d.invoice,done:d=>!!d.invoice,run(d){
        d.invoice={id:"INV-RENT-001",period:"November 2026",leaseId:"LEASE-101",total:d.lease.rent,allocated:0,status:"Unpaid"};
        return "Rent invoice created for "+money(d.invoice.total)+".";
      }},
    {id:"receipt",role:"manager",category:"Payments",title:"Record rent received externally",description:"Log money received by bank, mobile money or cash outside this demo. This is not an M-Pesa STK transaction.",button:"Record received rent",fields:[
      {name:"amount",label:"Amount received (KES)",type:"number",min:1,max:2000000,step:1,value:"12000"},
      {name:"method",label:"Collection method",type:"select",options:[{value:"Bank transfer",label:"Bank transfer (fictional)"},{value:"M-Pesa (external)",label:"M-Pesa received externally (fictional)"},{value:"Cash",label:"Cash received (fictional)"}]},
      {name:"reference",label:"Payment reference",value:"DEMO-PAY-001",maxlength:80}
    ],ready:d=>!!d.invoice&&due(d)>0&&!pending(d),done:d=>d.payments.length>0,run(d,v){
      const amount=nSh(v.amount,"Amount"),reference=text(v.reference,"Payment reference");
      if(!["Bank transfer","M-Pesa (external)","Cash"].includes(v.method))throw new Error("Choose a payment method.");
      if(d.payments.some(p=>p.reference.toLowerCase()===reference.toLowerCase()))throw new Error("This payment reference has already been recorded.");
      d.payments.push({id:"PAY-RENT-"+String(d.payments.length+1).padStart(3,"0"),amount,method:v.method,reference,status:"Unallocated",allocated:0,credit:0});
      return money(amount)+" recorded, awaiting allocation to rent.";
    }},
    {id:"allocate",role:"finance",category:"Reconciliation",title:"Allocate the payment to rent",description:"Allocate as much as possible to the invoice. Overpayment is preserved as unallocated tenant credit.",button:"Allocate payment",fields:[],
      ready:d=>!!pending(d),done:d=>d.allocations.length>0,run(d){
        const pay=pending(d),alloc=Math.min(pay.amount,due(d)),credit=pay.amount-alloc;
        d.invoice.allocated+=alloc;d.credit+=credit;
        pay.allocated=alloc;pay.credit=credit;pay.status="Allocated";
        d.invoice.status=due(d)===0?"Paid":"Partially paid";
        d.allocations.push({id:"ALLOC-"+String(d.allocations.length+1).padStart(3,"0"),paymentId:pay.id,amount:alloc});
        d.receipts.push({id:"RCT-RENT-"+String(d.receipts.length+1).padStart(3,"0"),paymentId:pay.id,received:pay.amount,allocated:alloc,credit});
        return money(alloc)+" allocated to rent; "+money(credit)+" retained as credit.";
      }},
    {id:"statement",role:"manager",category:"Owner reporting",title:"Generate an illustrative owner statement",description:"Summarize invoiced rent, allocated receipts, remaining balance and credit from the same ledger.",button:"Generate sample statement",fields:[],
      ready:d=>d.allocations.length>0,done:d=>!!d.statement,run(d){
        d.statement={id:"STMT-RENT-001",period:d.invoice.period,invoiced:d.invoice.total,received:d.invoice.allocated,remaining:due(d),credit:d.credit};
        return "Owner statement generated using the currently reconciled balances.";
      }}
  ];
  return {
    slug:"property",category:"Property & rent management",product:"Rental Management",mark:"⌂",
    headline:"Rent invoicing & reconciliation",intro:"Explore a connected rental workflow: unit leases, monthly invoices, recorded payments, allocations, and owner statements.",
    hero:"Know what's billed, paid and outstanding.",
    heroDescription:"Realistic fictional rent transactions flow into a tenant ledger and an owner statement without any real payment collection.",
    instructions:"Start as Property Manager to issue rent, then record a sample payment. Switch to Finance to allocate it, and back to Property Manager to generate an owner statement.",
    disclaimer:"All properties, leases, people, payments and statements are fictional. No rent is collected, no payment gateway is called, and nothing is sent to tenants.",
    roles:[{id:"manager",name:"Anne · Property Manager"},{id:"finance",name:"Brian · Finance"}],
    seed:()=>({version:1,property:{id:"PROP-101",name:"Maple Court (fictional)",unit:"B-204"},lease:{id:"LEASE-101",occupant:"Alex M. (fictional)",rent:32000},invoice:null,payments:[],allocations:[],receipts:[],credit:0,statement:null,activity:[]}),
    valid:d=>!!d.property&&!!d.lease&&Array.isArray(d.payments)&&Array.isArray(d.allocations)&&Array.isArray(d.receipts),
    metrics:d=>[
      {label:"Rent billed",value:money(d.invoice?.total||0),detail:"November 2026"},
      {label:"Allocated receipts",value:money(d.invoice?.allocated||0),detail:"Reconciled payments"},
      {label:"Outstanding rent",value:money(due(d)),detail:"Partial payment supported"},
      {label:"Tenant credit",value:money(d.credit),detail:"Unallocated excess"}
    ],actions,
    sections:[
      {title:"Lease and rent invoice",description:"Unit-level billing remains tied to the correct lease.",columns:[{key:"property",title:"Property / unit"},{key:"occupant",title:"Occupant"},{key:"period",title:"Period"},{key:"invoiced",title:"Billed"},{key:"outstanding",title:"Outstanding"},{key:"status",title:"Status"}],
        rows:d=>d.invoice?[{property:d.property.name+" · "+d.property.unit,occupant:d.lease.occupant,period:d.invoice.period,invoiced:money(d.invoice.total),outstanding:money(due(d)),status:d.invoice.status}]:[]},
      {title:"Collection and allocation history",description:"Receipts reflect recorded money only after ledger allocation.",columns:[{key:"id",title:"Payment"},{key:"amount",title:"Received"},{key:"method",title:"Method"},{key:"reference",title:"Reference"},{key:"allocated",title:"To rent"},{key:"status",title:"Status"}],
        rows:d=>d.payments.map(p=>({...p,amount:money(p.amount),allocated:money(p.allocated)}))},
      {title:"Owner statement",description:"This simplified report reflects the latest generated snapshot.",columns:[{key:"id",title:"Statement"},{key:"period",title:"Period"},{key:"invoiced",title:"Billed"},{key:"received",title:"Allocated"},{key:"remaining",title:"Balance"}],
        rows:d=>d.statement?[{...d.statement,invoiced:money(d.statement.invoiced),received:money(d.statement.received),remaining:money(d.statement.remaining)}]:[]}
    ]
  };
})());
