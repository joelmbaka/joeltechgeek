const constructionCore=(function constructionCore(){
  const now=()=>new Date().toISOString();
  const ref=(prefix)=>prefix+"-"+((typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID().replace(/-/g,"").slice(0,8).toUpperCase():Math.random().toString(36).slice(2,10).toUpperCase());
  const int=(value,label,min=0)=>{
    if(value===undefined||value===null||String(value).trim()==="")throw new Error(label+" is required.");
    const n=Number(value);
    if(!Number.isSafeInteger(n)||n<min)throw new Error(label+" must be a whole number of at least "+min+".");
    return n;
  };
  const money=(value,label,min=0)=>{
    if(value===undefined||value===null||String(value).trim()==="")throw new Error(label+" is required.");
    const n=Number(value);
    if(!Number.isFinite(n)||n<min)throw new Error(label+" must be at least "+min+".");
    return Math.round(n*100)/100;
  };
  const label=(value,name,max=140)=>{
    const v=String(value??"").trim();
    if(v.length<3||v.length>max)throw new Error(name+" must contain 3–"+max+" characters.");
    return v;
  };
  const find=(data,key,id)=>data[key].find(item=>item.id===id);
  const audit=(d,title,detail)=>d.activity.unshift({id:ref("LOG"),at:now(),title,detail});
  const seed=()=>{
    const products=[
      {id:"MAT-101",name:"Cement 50 kg",unit:"bags",stock:42,reorder:30,cost:820},
      {id:"MAT-102",name:"Rebar 12 mm",unit:"pieces",stock:24,reorder:20,cost:1250},
      {id:"MAT-103",name:"Fine sand",unit:"m³",stock:8,reorder:6,cost:2600},
      {id:"MAT-104",name:"PVC conduit 25 mm",unit:"pieces",stock:32,reorder:18,cost:270},
      {id:"MAT-105",name:"Ceramic tiles",unit:"boxes",stock:16,reorder:12,cost:1580},
      {id:"MAT-106",name:"Emulsion paint 20L",unit:"buckets",stock:6,reorder:8,cost:4350}
    ];
    const tasks=[
      {id:"TASK-101",name:"Ground floor slab",phase:"Structure",assignee:"Peter · Supervisor",progress:65,planned:100,notes:"Formwork reviewed; concrete pour pending."},
      {id:"TASK-102",name:"Ground floor columns",phase:"Structure",assignee:"Peter · Supervisor",progress:30,planned:70,notes:"Starter bars and shuttering in progress."},
      {id:"TASK-103",name:"First-floor blockwork",phase:"Masonry",assignee:"Peter · Supervisor",progress:10,planned:45,notes:"Materials staging required."},
      {id:"TASK-104",name:"Electrical conduit installation",phase:"MEP",assignee:"Peter · Supervisor",progress:0,planned:35,notes:"Awaiting release by structural team."},
      {id:"TASK-105",name:"Corridor painting",phase:"Finishes",assignee:"Peter · Supervisor",progress:0,planned:20,notes:"Not started."}
    ];
    const yesterday=new Date(Date.now()-86400000).toISOString();
    return {
      version:1,
      project:{id:"SITE-001",name:"Amani Heights · Block A",location:"Fictional demonstration project",budget:12500000,currency:"KES",contractor:"Horizon Buildworks (fictional)"},
      materials:products,tasks,
      requests:[
        {id:"REQ-001",taskId:"TASK-101",materialId:"MAT-101",qty:15,issuedQty:0,status:"Pending",note:"Cement for the slab finishing batch",createdAt:yesterday,decisionAt:null,issues:[]},
        {id:"REQ-002",taskId:"TASK-102",materialId:"MAT-102",qty:8,issuedQty:0,status:"Approved",note:"Additional starter bars for columns",createdAt:yesterday,decisionAt:yesterday,issues:[]}
      ],
      purchases:[],
      expenses:[{id:"EXP-001",category:"Site logistics",description:"Fictional site transport allowance",amount:12500,createdAt:yesterday}],
      movements:[],
      progressHistory:[],
      activity:[
        {id:"LOG-001",at:yesterday,title:"Project workspace created",detail:"Initial fictional activities, tasks and material balances loaded."}
      ]
    };
  };
  function requestMaterial(d,taskId,materialId,rawQty,description){
    if(!find(d,"tasks",taskId))throw new Error("Choose an existing work item.");
    if(!find(d,"materials",materialId))throw new Error("Choose a valid material.");
    const qty=int(rawQty,"Requested quantity",1),note=label(description,"Request reason",220);
    const request={id:ref("REQ"),taskId,materialId,qty,issuedQty:0,status:"Pending",note,createdAt:now(),decisionAt:null,issues:[]};
    d.requests.unshift(request);audit(d,"Material request submitted",request.id+" · "+qty+" units requested");
    return request;
  }
  function decideRequest(d,requestId,decision){
    const r=find(d,"requests",requestId);
    if(!r||r.status!=="Pending")throw new Error("Only pending material requests can be reviewed.");
    if(decision!=="Approved"&&decision!=="Rejected")throw new Error("Decision must be Approve or Reject.");
    r.status=decision;r.decisionAt=now();
    audit(d,"Request "+decision.toLowerCase(),r.id+" · "+r.qty+" "+(find(d,"materials",r.materialId)?.unit||"units"));
    return r;
  }
  function issueMaterial(d,requestId,rawQty){
    const r=find(d,"requests",requestId);
    if(!r||!["Approved","Partially issued"].includes(r.status))throw new Error("Only approved requests with remaining quantities can be issued.");
    const qty=int(rawQty,"Issue quantity",1),remaining=r.qty-r.issuedQty;
    if(qty>remaining)throw new Error("Cannot issue "+qty+"; only "+remaining+" remain approved.");
    const material=find(d,"materials",r.materialId);
    if(!material)throw new Error("The requested material does not exist.");
    if(qty>material.stock)throw new Error("Not enough "+material.name+" in stock. Available: "+material.stock+" "+material.unit+".");
    const at=now(),issueId=ref("ISSUE");
    material.stock-=qty;
    r.issuedQty+=qty;
    r.issues.push({id:issueId,qty,at,unitCost:material.cost});
    r.status=r.issuedQty===r.qty?"Issued":"Partially issued";
    d.movements.unshift({id:ref("MOVE"),kind:"issue",materialId:material.id,qty:-qty,unitCost:material.cost,taskId:r.taskId,reference:r.id,at});
    audit(d,"Material issued",issueId+" · "+qty+" "+material.unit+" for "+r.taskId);
    return r;
  }
  function updateProgress(d,taskId,rawPercent,note){
    const task=find(d,"tasks",taskId);
    if(!task)throw new Error("Work item not found.");
    const progress=int(rawPercent,"Progress percentage",0);
    if(progress>100)throw new Error("Progress cannot exceed 100%.");
    if(progress<task.progress)throw new Error("Progress cannot go below the last recorded percentage.");
    if(progress===task.progress)throw new Error("Enter a new progress percentage.");
    const description=label(note,"Progress update",220);
    const update={id:ref("UPD"),taskId,from:task.progress,to:progress,note:description,at:now()};
    task.progress=progress;task.notes=description;
    d.progressHistory.unshift(update);audit(d,"Site progress updated",taskId+" · "+progress+"% complete");
    return update;
  }
  function createPurchase(d,supplier,lines){
    const vendor=label(supplier,"Supplier",100);
    if(!Array.isArray(lines)||!lines.length)throw new Error("Select at least one material.");
    const seen=new Set();
    const items=lines.map(item=>{
      const material=find(d,"materials",item.materialId);
      if(!material)throw new Error("The purchased material was not found.");
      if(seen.has(material.id))throw new Error("A material cannot appear twice on one purchase order.");
      seen.add(material.id);
      const qty=int(item.qty,"Ordered quantity",1),unitCost=money(item.unitCost,"Unit cost",0.01);
      return {materialId:material.id,qty,receivedQty:0,unitCost};
    });
    const po={id:ref("PO"),supplier:vendor,lines:items,status:"Draft",createdAt:now(),receipts:[],completedAt:null};
    d.purchases.unshift(po);audit(d,"Purchase order drafted",po.id+" · "+vendor);return po;
  }
  function receivePurchase(d,orderId,receivedLines){
    const po=find(d,"purchases",orderId);
    if(!po)throw new Error("Purchase order not found.");
    if(po.status==="Received")throw new Error("This purchase order has been fully received.");
    if(!["Draft","Partially received"].includes(po.status))throw new Error("This purchase order cannot be received.");
    if(!Array.isArray(receivedLines))throw new Error("Enter received quantities for the delivery.");
    const seen=new Set(),valid=[];
    for(const received of receivedLines){
      const line=po.lines.find(l=>l.materialId===received.materialId);
      if(!line)throw new Error("The delivery contains an unordered material.");
      if(seen.has(line.materialId))throw new Error("Duplicate material in the delivery.");
      seen.add(line.materialId);
      const qty=int(received.qty,"Received quantity",0),remaining=line.qty-line.receivedQty;
      if(qty>remaining)throw new Error("Cannot receive "+qty+" units; only "+remaining+" remain ordered.");
      const material=find(d,"materials",line.materialId);
      if(!material)throw new Error("The material no longer exists.");
      if(qty>0)valid.push({line,material,qty});
    }
    if(!valid.length)throw new Error("Enter at least one received quantity above zero.");
    const at=now(),receiptId=ref("GRN");
    for(const {line,material,qty} of valid){
      const previous=material.stock;
      material.cost=Math.round((material.cost*previous+line.unitCost*qty)/(previous+qty)*100)/100;
      material.stock+=qty;line.receivedQty+=qty;
      d.movements.unshift({id:ref("MOVE"),kind:"receive",materialId:material.id,qty,unitCost:line.unitCost,reference:po.id,at});
    }
    po.receipts.push({id:receiptId,at,lines:valid.map(({material,qty})=>({materialId:material.id,qty}))});
    po.status=po.lines.every(line=>line.receivedQty===line.qty)?"Received":"Partially received";
    if(po.status==="Received")po.completedAt=at;
    audit(d,"Material delivery received",receiptId+" · "+valid.reduce((n,item)=>n+item.qty,0)+" units");
    return po;
  }
  function addExpense(d,category,description,rawAmount){
    const types=["Transport","Equipment hire","Site logistics","Labour support","Other"];
    if(!types.includes(category))throw new Error("Choose a valid site-expense category.");
    const note=label(description,"Expense description",180);
    const amount=money(rawAmount,"Expense amount",0.01);
    const expense={id:ref("EXP"),category,description:note,amount,createdAt:now()};
    d.expenses.unshift(expense);audit(d,"Site expense recorded",expense.id+" · KES "+amount);
    return expense;
  }
  function metrics(d){
    const issuedCost=d.movements.filter(m=>m.kind==="issue").reduce((sum,m)=>sum+Math.abs(m.qty)*m.unitCost,0);
    const expenseCost=d.expenses.reduce((sum,e)=>sum+e.amount,0);
    const spent=Math.round((issuedCost+expenseCost)*100)/100;
    const openPO=d.purchases.filter(p=>p.status!=="Received").length;
    const pending=d.requests.filter(r=>r.status==="Pending").length;
    const approved=d.requests.filter(r=>["Approved","Partially issued"].includes(r.status)).length;
    const progress=d.tasks.length?Math.round(d.tasks.reduce((sum,t)=>sum+t.progress,0)/d.tasks.length):0;
    return {issuedCost,expenseCost,spent,budgetRemaining:d.project.budget-spent,
      openPO,pending,approved,progress,materialValue:d.materials.reduce((sum,m)=>sum+m.stock*m.cost,0),
      lowStock:d.materials.filter(m=>m.stock<=m.reorder).length,
      committed:d.purchases.filter(p=>p.status!=="Received").reduce((sum,p)=>sum+p.lines.reduce((n,l)=>n+(l.qty-l.receivedQty)*l.unitCost,0),0)
    };
  }
  return {seed,requestMaterial,decideRequest,issueMaterial,updateProgress,createPurchase,receivePurchase,addExpense,metrics};
})();
