const fieldCore=(function fieldCore(){
  const now=()=>new Date().toISOString();
  const uid=p=>p+"-"+((typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID().replace(/-/g,"").slice(0,8).toUpperCase():Math.random().toString(36).slice(2,10).toUpperCase());
  const find=(data,key,id)=>data[key].find(x=>x.id===id);
  const text=(value,name,min=3,max=180)=>{
    const s=String(value??"").trim();
    if(s.length<min||s.length>max)throw new Error(name+" must be "+min+"–"+max+" characters.");
    return s;
  };
  const int=(value,name,min=0)=>{
    if(value===undefined||value===null||String(value).trim()==="")throw new Error(name+" is required.");
    const n=Number(value);
    if(!Number.isSafeInteger(n)||n<min)throw new Error(name+" must be a whole number of at least "+min+".");
    return n;
  };
  const decimal=(value,name,min=0)=>{
    if(value===undefined||value===null||String(value).trim()==="")throw new Error(name+" is required.");
    const n=Number(value);
    if(!Number.isFinite(n)||n<min)throw new Error(name+" must be at least "+min+".");
    return Math.round(n*100)/100;
  };
  const log=(d,title,detail)=>d.activity.unshift({id:uid("LOG"),at:now(),title,detail});
  const CHECKS=[
    {id:"isolation",title:"Isolate equipment before work"},
    {id:"inspection",title:"Inspect equipment and verify fault"},
    {id:"repair",title:"Complete repair or maintenance checks"},
    {id:"testing",title:"Test equipment and confirm operation"}
  ];
  const seed=()=>{
    const customers=[
      {id:"C-101",name:"Harbor Point Offices",contact:"Facilities desk",site:"Westlands, Nairobi · fictional"},
      {id:"C-102",name:"Sunrise Medical Centre",contact:"Operations desk",site:"Upper Hill, Nairobi · fictional"},
      {id:"C-103",name:"Cedar Court Apartments",contact:"Property manager",site:"Kilimani, Nairobi · fictional"}
    ];
    const assets=[
      {id:"A-101",customerId:"C-101",name:"Rooftop HVAC Unit 02",type:"HVAC",serial:"DEMO-HVAC-002",nextDue:"2026-11-16"},
      {id:"A-102",customerId:"C-102",name:"Backup water pump",type:"Mechanical",serial:"DEMO-PUMP-042",nextDue:"2026-11-10"},
      {id:"A-103",customerId:"C-103",name:"Lobby distribution board",type:"Electrical",serial:"DEMO-DB-013",nextDue:"2026-11-21"}
    ];
    const parts=[
      {id:"PART-101",name:"Air filter 20 × 20",unit:"pieces",stock:8,reorder:4,cost:1200,price:1900},
      {id:"PART-102",name:"Pump seal kit",unit:"kits",stock:3,reorder:2,cost:2400,price:3800},
      {id:"PART-103",name:"Contactor 25 A",unit:"pieces",stock:5,reorder:2,cost:1700,price:2600},
      {id:"PART-104",name:"PVC drain hose",unit:"metres",stock:18,reorder:8,cost:150,price:300}
    ];
    return {
      version:1,company:"Northstar Field Services (fictional)",laborRate:2500,
      customers,assets,parts,technicians:[{id:"TECH-101",name:"Daniel · Technician"}],
      tickets:[
        {id:"JOB-1001",customerId:"C-102",assetId:"A-102",title:"Pump leaking at coupling",description:"A facilities technician reported intermittent dripping at the shaft seal.",priority:"Urgent",status:"New",techId:null,scheduledAt:null,createdAt:new Date(Date.now()-86400000).toISOString(),startedAt:null,reports:[],partsUsed:[],laborHours:0,reviewNote:"",approvedAt:null,invoiceId:null},
        {id:"JOB-1002",customerId:"C-101",assetId:"A-101",title:"Airflow reduced on rooftop unit",description:"Air distribution appears reduced; check filters and drainage.",priority:"Standard",status:"Assigned",techId:"TECH-101",scheduledAt:"2026-11-04T09:00:00.000Z",createdAt:new Date(Date.now()-172800000).toISOString(),startedAt:null,reports:[],partsUsed:[],laborHours:0,reviewNote:"",approvedAt:null,invoiceId:null}
      ],
      invoices:[],movements:[],activity:[{id:"LOG-001",at:now(),title:"Demo workspace prepared",detail:"Fictional customers, assets, jobs and parts are ready."}]
    };
  };
  function createTicket(d,fields){
    if(!find(d,"customers",fields.customerId))throw new Error("Choose a customer.");
    const asset=find(d,"assets",fields.assetId);
    if(!asset||asset.customerId!==fields.customerId)throw new Error("Choose an asset belonging to the selected customer.");
    if(!["Standard","Urgent"].includes(fields.priority))throw new Error("Choose a priority.");
    const job={
      id:uid("JOB"),customerId:fields.customerId,assetId:fields.assetId,
      title:text(fields.title,"Request title",5,100),description:text(fields.description,"Fault description",8,320),
      priority:fields.priority,status:"New",techId:null,scheduledAt:null,
      createdAt:now(),startedAt:null,reports:[],partsUsed:[],laborHours:0,reviewNote:"",approvedAt:null,invoiceId:null
    };
    d.tickets.unshift(job);log(d,"Service request opened",job.id+" · "+job.title);return job;
  }
  function assignTicket(d,id,techId,dateTime){
    const job=find(d,"tickets",id);
    if(!job||job.status!=="New")throw new Error("Only new service requests can be assigned.");
    if(!find(d,"technicians",techId))throw new Error("Choose a valid technician.");
    if(!dateTime||!String(dateTime).trim())throw new Error("Choose a scheduled date and time.");
    const dt=new Date(dateTime);
    if(Number.isNaN(dt.getTime()))throw new Error("Enter a valid scheduled date and time.");
    job.techId=techId;job.scheduledAt=dt.toISOString();job.status="Assigned";
    log(d,"Technician assigned",job.id+" · "+find(d,"technicians",techId).name);return job;
  }
  function startJob(d,id,techId){
    const job=find(d,"tickets",id);
    if(!job||!["Assigned","Returned"].includes(job.status))throw new Error("Only assigned or returned jobs can be started.");
    if(job.techId!==techId)throw new Error("This job is not assigned to this technician.");
    job.status="In progress";
    if(!job.startedAt)job.startedAt=now();
    log(d,"Work started",job.id+" · Technician began the visit");return job;
  }
  function usePart(d,id,techId,partId,rawQty){
    const job=find(d,"tickets",id);
    if(!job||job.status!=="In progress"||job.techId!==techId)throw new Error("Start your assigned job before issuing parts.");
    const part=find(d,"parts",partId);
    if(!part)throw new Error("Select a valid spare part.");
    const qty=int(rawQty,"Part quantity",1);
    if(qty>part.stock)throw new Error("Not enough "+part.name+" in stock. Available: "+part.stock+".");
    const used={id:uid("USE"),partId,qty,unitPrice:part.price,unitCost:part.cost,at:now()};
    part.stock-=qty;job.partsUsed.push(used);
    d.movements.unshift({id:uid("MOVE"),partId,qty:-qty,jobId:id,at:used.at,reason:"Used on service job"});
    log(d,"Spare part issued",job.id+" · "+qty+" × "+part.name);return used;
  }
  function submitReport(d,id,techId,fields){
    const job=find(d,"tickets",id);
    if(!job||job.status!=="In progress"||job.techId!==techId)throw new Error("Only an in-progress assigned job can be submitted.");
    const hours=decimal(fields.hours,"Labour hours",0.25);
    if(hours>24)throw new Error("Labour hours cannot exceed 24.");
    const notes=text(fields.notes,"Service notes",8,400);
    if(!Array.isArray(fields.checks)||fields.checks.length!==CHECKS.length)throw new Error("Complete every service checklist item.");
    const unique=new Set(),checks=fields.checks.map(c=>{
      if(unique.has(c.id)||!CHECKS.some(x=>x.id===c.id))throw new Error("Checklist contains an invalid or duplicate item.");
      unique.add(c.id);
      if(!["Pass","Attention"].includes(c.result))throw new Error("Each checklist item needs a Pass or Attention result.");
      return {id:c.id,result:c.result};
    });
    if(unique.size!==CHECKS.length)throw new Error("Complete every service checklist item.");
    const report={id:uid("REPORT"),at:now(),hours,notes,checks};
    job.reports.push(report);job.laborHours=hours;job.status="Awaiting review";job.reviewNote="";
    log(d,"Technician report submitted",job.id+" · Awaiting manager review");return report;
  }
  function reviewJob(d,id,decision,reason){
    const job=find(d,"tickets",id);
    if(!job||job.status!=="Awaiting review")throw new Error("Only submitted jobs can be reviewed.");
    const report=job.reports[job.reports.length-1];
    if(!report)throw new Error("A technician report is required.");
    if(decision==="Approve"){
      if(report.checks.some(c=>c.result!=="Pass"))throw new Error("Checklist items needing attention must be resolved before approval.");
      job.status="Approved";job.approvedAt=now();job.reviewNote="Approved";
    }else if(decision==="Return"){
      job.reviewNote=text(reason,"Return reason",8,220);job.status="Returned";
    }else throw new Error("Choose a valid review decision.");
    log(d,"Job "+(decision==="Approve"?"approved":"returned"),job.id+" · "+job.reviewNote);return job;
  }
  function createInvoice(d,id){
    const job=find(d,"tickets",id);
    if(!job||job.status!=="Approved"||job.invoiceId)throw new Error("Only approved jobs without an invoice can be billed.");
    const latest=job.reports[job.reports.length-1];
    if(!latest||latest.checks.some(c=>c.result!=="Pass"))throw new Error("An approved passing service report is required.");
    const rows=[
      {label:"Service labour · "+job.laborHours+" h",qty:job.laborHours,unitPrice:d.laborRate}
    ];
    for(const usage of job.partsUsed){
      const part=find(d,"parts",usage.partId);
      rows.push({label:part?.name||"Service spare part",qty:usage.qty,unitPrice:usage.unitPrice});
    }
    const total=Math.round(rows.reduce((sum,row)=>sum+row.qty*row.unitPrice,0)*100)/100;
    const invoice={id:uid("INV"),jobId:job.id,customerId:job.customerId,createdAt:now(),rows,total,
      status:"Unpaid",paidAt:null,paymentMethod:null,reference:null};
    d.invoices.unshift(invoice);job.invoiceId=invoice.id;job.status="Invoiced";
    log(d,"Sample invoice created",invoice.id+" · KES "+total);return invoice;
  }
  function recordPayment(d,invoiceId,method){
    const invoice=find(d,"invoices",invoiceId);
    if(!invoice||invoice.status!=="Unpaid")throw new Error("Only unpaid sample invoices can be marked paid.");
    if(!["Cash","M-Pesa (simulated)"].includes(method))throw new Error("Choose a supported simulated method.");
    const job=find(d,"tickets",invoice.jobId);
    if(!job||job.invoiceId!==invoice.id||job.status!=="Invoiced")throw new Error("The linked service job is not ready to close.");
    invoice.status="Paid";invoice.paidAt=now();invoice.paymentMethod=method;invoice.reference=uid("SIM");
    job.status="Paid";log(d,"Sample invoice marked paid",invoice.id+" · "+method);return invoice;
  }
  function metrics(d){
    const all=d.tickets,open=all.filter(x=>!["Approved","Invoiced","Paid"].includes(x.status)).length;
    return {
      jobs:all.length,open,unassigned:all.filter(x=>x.status==="New").length,
      review:all.filter(x=>x.status==="Awaiting review").length,
      completed:all.filter(x=>["Approved","Invoiced","Paid"].includes(x.status)).length,
      billed:d.invoices.reduce((sum,x)=>sum+x.total,0),
      paid:d.invoices.filter(x=>x.status==="Paid").reduce((sum,x)=>sum+x.total,0),
      unpaid:d.invoices.filter(x=>x.status==="Unpaid").reduce((sum,x)=>sum+x.total,0),
      lowParts:d.parts.filter(x=>x.stock<=x.reorder).length
    };
  }
  return {seed,CHECKS,createTicket,assignTicket,startJob,usePart,submitReport,reviewJob,createInvoice,recordPayment,metrics};
})();
