const cargoCore=(function cargoCore(){
"use strict";
const PORTS=[
 {id:"mombasa-port",name:"Mombasa Port",region:"Mombasa"},
 {id:"mombasa-cfs",name:"Mombasa CFS",region:"Mombasa"},
 {id:"nairobi-icd",name:"Nairobi ICD",region:"Nairobi"},
 {id:"athi-river",name:"Athi River",region:"Machakos"},
 {id:"nairobi",name:"Nairobi Industrial Area",region:"Nairobi"},
 {id:"nakuru",name:"Nakuru",region:"Nakuru"},
 {id:"eldoret",name:"Eldoret",region:"Uasin Gishu"},
 {id:"kisumu",name:"Kisumu",region:"Kisumu"},
 {id:"naivasha",name:"Naivasha",region:"Nakuru"},
 {id:"thika",name:"Thika",region:"Kiambu"}
];
const STATUSES=["Open","Assigned","In transit","Delivered","Complete"];
const CONSIGNEES=["Harbor Freight Co.","Cedar Imports Ltd.","Nairobi Distribution Hub","Valley Logistics Ltd."];
const NEXT={"Assigned":"In transit","In transit":"Delivered","Delivered":"Complete"};
const LABELS={pickup:"Loaded truck photo (container visible)",delivery:"Delivery note",eir:"Equipment Interchange Receipt (EIR)"};
const now=()=>new Date().toISOString();
const loc=id=>PORTS.find(p=>p.id===id);
const find=(d,id)=>d.loads.find(l=>l.id===id);
const str=(v,name,min=3,max=140)=>{const s=String(v??"").trim();if(s.length<min||s.length>max)throw new Error(name+" must contain "+min+"–"+max+" characters.");return s;};
const int=(v,name,min=0,max=10000000)=>{if(v==null||String(v).trim()==="")throw new Error(name+" is required.");const n=Number(v);if(!Number.isSafeInteger(n)||n<min||n>max)throw new Error(name+" must be a whole number between "+min+" and "+max+".");return n;};
const num=(v,name,min,max)=>{if(v==null||String(v).trim()==="")throw new Error(name+" is required.");const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw new Error(name+" must be between "+min+" and "+max+".");return Math.round(n*10)/10;};
const add=(d,title,detail,loadId)=>d.activity.unshift({id:"ACT-"+(d.activity.length+1),at:now(),title,detail,loadId});
const unfinishedLoads=(d,driverId)=>d.loads.filter(l=>l.driver?.id===driverId&&["Assigned","In transit","Delivered"].includes(l.status));
const active=(d,driverId=d.driver.id)=>unfinishedLoads(d,driverId)[0];
function assignmentAvailability(d,driverId){
 const unfinished=unfinishedLoads(d,driverId);
 if(unfinished.length>=2)return {allowed:false,reason:"Driver already has two unfinished consignments. Complete one before assigning another."};
 if(unfinished.length===1&&unfinished[0].status!=="Delivered")
  return {allowed:false,reason:"The current consignment must reach Delivered before a second can be assigned."};
 return {allowed:true,reason:null};
}
const pairedTruck=(d,driverId)=>d.fleet.find(t=>t.driverId===driverId)||null;
function fields(d,v,original){
 const from=loc(v.originId),to=loc(v.destinationId);
 if(!from||!to)throw new Error("Select both pickup and delivery locations.");
 if(from.id===to.id)throw new Error("Pickup and delivery locations must differ.");
 const cargo=str(v.cargo,"Cargo description",4,130),
       containerNo=str(v.containerNo,"Container reference",4,50),
       weightTons=num(v.weightTons,"Cargo weight (tonnes)",.5,28),
       driverPay=int(v.driverPay,"Driver pay (KES)",1000,5000000),
       routeMiles=int(v.routeMiles,"Route miles",1,1500),
       containerFeet=int(v.containerFeet??40,"Container feet",20,40),
       returnId=v.returnId||"mombasa-port",
       consignee=v.consignee||"Harbor Freight Co.";
 if(![20,40].includes(containerFeet))throw new Error("Container size must be 20 or 40 feet.");
 if(!loc(returnId))throw new Error("Choose a valid empty return depot.");
 if(!CONSIGNEES.includes(consignee))throw new Error("Choose a valid consignee.");
 if(d.loads.some(l=>l.id!==original?.id&&l.containerNo.toLowerCase()===containerNo.toLowerCase()))
   throw new Error("This container reference is already assigned to another load.");
 return {originId:from.id,destinationId:to.id,cargo,containerNo,weightTons,driverPay,routeMiles,containerFeet,returnId,consignee};
}
function post(d,v){
 const details=fields(d,v);
 const load={id:"LD-"+String(d.nextId).padStart(4,"0"),...details,status:"Open",driver:null,truck:null,
  evidence:{pickup:null,delivery:null,eir:null},payment:{status:"Unpaid",reference:null,paidAt:null},createdAt:now(),updatedAt:now()};
 d.nextId+=1;d.loads.unshift(load);add(d,"Load posted",load.id+" · "+loc(load.originId).name+" to "+loc(load.destinationId).name,load.id);return load;
}
function edit(d,id,v){
 const load=find(d,id);
 if(!load||load.status!=="Open")throw new Error("Only open loads can be edited.");
 const details=fields(d,v,load);Object.assign(load,details,{updatedAt:now()});
 add(d,"Load updated",load.id+" · KES "+load.driverPay.toLocaleString()+" driver pay.",id);return load;
}
function remove(d,id){
 const load=find(d,id);
 if(!load||load.status!=="Open")throw new Error("Only open loads can be deleted.");
 d.loads=d.loads.filter(l=>l.id!==id);add(d,"Load deleted",id+" removed from the board.",id);return id;
}
function assign(d,id,driverId){
 const load=find(d,id);
 if(!load||load.status!=="Open")throw new Error("Only open loads can be assigned.");
 const driver=d.drivers.find(x=>x.id===driverId);
 if(!driver)throw new Error("Choose a driver.");
 const availability=assignmentAvailability(d,driver.id);
 if(!availability.allowed)throw new Error(availability.reason);
 const truck=pairedTruck(d,driver.id);
 if(truck&&load.weightTons>truck.capacityTons)throw new Error("This load exceeds the driver's assigned truck capacity.");
 load.driver={id:driver.id,name:driver.name};load.truck=null;load.status="Assigned";load.updatedAt=now();
 add(d,"Driver assigned",load.id+" assigned to "+driver.name+" · truck allocated in Fleet",id);
 return load;
}
function pair(d,truckId,driverId){
 const truck=d.fleet.find(x=>x.id===truckId);
 if(!truck)throw new Error("Choose a fleet truck.");
 const driver=driverId?d.drivers.find(x=>x.id===driverId):null;
 if(driverId&&!driver)throw new Error("Choose a valid driver.");
 if(truck.driverId===driverId)return truck;
 const affected=new Set([truck.driverId,driverId].filter(Boolean));
 if([...affected].some(id=>active(d,id)))
   throw new Error("Complete the active trip before changing its driver or truck.");
 const former=driver?pairedTruck(d,driver.id):null;
 if(former&&former.id!==truck.id)former.driverId=null;
 truck.driverId=driver?.id||null;
 truck.updatedAt=now();
 add(d,"Fleet assignment updated",truck.truckPlate+" → "+(driver?.name||"Unassigned"),null);
 return truck;
}
function progress(d,id,next,evidence){
 const load=find(d,id);
 if(!load||!load.driver)throw new Error("Assign a truck and driver before progressing a load.");
 if(NEXT[load.status]!==next)throw new Error("Trip status cannot skip or repeat stages.");
 const evidenceType={"In transit":"pickup","Delivered":"delivery","Complete":"eir"}[next];
 if(!evidenceType||!evidence||typeof evidence.filename!=="string"||!evidence.filename.trim()||
    typeof evidence.preview!=="string"||!/^data:image\/jpeg;base64,/.test(evidence.preview)||evidence.preview.length>750000)
   throw new Error("A valid photo of the required evidence must be attached before this status can change.");
 const miles=load.routeMiles;
 let truck=load.truck;
 if(next==="In transit"){
  const allocated=pairedTruck(d,load.driver.id);
  if(!allocated)throw new Error("Assign this driver to a truck in Fleet before starting the trip.");
  if(load.weightTons>allocated.capacityTons)throw new Error("Load exceeds the assigned truck capacity.");
  if(d.loads.some(x=>x.id!==load.id&&["In transit","Delivered"].includes(x.status)&&
    (x.driver?.id===load.driver.id||x.truck?.id===allocated.id)))
    throw new Error("Driver or truck already has an active trip. Finish it before starting another.");
  truck={id:allocated.id,miles:0,location:"Awaiting dispatch",updatedAt:now()};
 }else if(!truck?.id){throw new Error("This trip is missing its fleet truck assignment.");}

 switch(next){
  case "In transit":truck.miles=Math.max(truck.miles,Math.round(miles*.12));truck.location="En route to "+loc(load.destinationId).name+" · sample";break;
  case "Delivered":truck.miles=miles;truck.location=loc(load.destinationId).name+" · delivered (sample)";break;
  case "Complete":truck.miles=miles*2;truck.location=loc(load.returnId||"mombasa-port").name+" · empty container returned (sample)";break;
 }
 load.evidence[evidenceType]={type:evidenceType,label:LABELS[evidenceType],filename:evidence.filename.slice(0,120),
  preview:evidence.preview,placeholder:false,at:now()};
 truck.updatedAt=now();load.truck=truck;load.status=next;load.updatedAt=now();
 add(d,"Load "+next.toLowerCase(),id+" · "+truck.location+" · evidence attached",id);return load;
}
function pay(d,id){
 const load=find(d,id);
 if(!load||load.status!=="Complete")throw new Error("Only completed loads can be marked paid.");
 if(load.payment.status==="Paid")throw new Error("Driver payment has already been marked paid.");
 load.payment={status:"Paid",reference:"SIM-PAY-"+id,paidAt:now()};
 add(d,"Driver paid (simulated)",id+" · KES "+load.driverPay.toLocaleString()+" marked paid.",id);return load;
}
const DRIVERS=[
 {id:"DRV-DEMO-001",name:"Kevin Mwangi (fictional)"},
 {id:"DRV-DEMO-002",name:"Amina Wanjiku (fictional)"},
 {id:"DRV-DEMO-003",name:"Peter Otieno (fictional)"},
 {id:"DRV-DEMO-004",name:"David Kamau (fictional)"}
];
const TRUCKS=[
 {id:"TRK-DEMO-001",truckPlate:"KDA 384P · DEMO",capacityTons:28,driverId:"DRV-DEMO-001"},
 {id:"TRK-DEMO-002",truckPlate:"KDU 537R · DEMO",capacityTons:24,driverId:"DRV-DEMO-002"},
 {id:"TRK-DEMO-003",truckPlate:"KBA 241L · DEMO",capacityTons:26,driverId:"DRV-DEMO-003"},
 {id:"TRK-DEMO-004",truckPlate:"KCA 619M · DEMO",capacityTons:28,driverId:"DRV-DEMO-004"}
];
const sample=(id,from,to,status,payAmount,weight,miles,plate,milesDone,where,name,payment="Unpaid")=>{
 const assignedDriver=DRIVERS.find(x=>x.name===name)||null;
 const assignedTruck=TRUCKS.find(x=>x.driverId===assignedDriver?.id)||null;
 const load={id,originId:from,destinationId:to,cargo:"40-ft shipping container · general cargo",containerFeet:40,returnId:"mombasa-port",consignee:"Harbor Freight Co.",weightTons:weight,
  driverPay:payAmount,routeMiles:miles,containerNo:"DEMO-"+id,status,createdAt:"2026-10-30T08:00:00Z",updatedAt:"2026-10-31T12:00:00Z",
  driver:assignedDriver?{id:assignedDriver.id,name:assignedDriver.name}:null,
  truck:assignedTruck&&["In transit","Delivered","Complete"].includes(status)?{id:assignedTruck.id,miles:milesDone,location:where+" · sample",updatedAt:"2026-10-31T12:00:00Z"}:null,
  evidence:{pickup:null,delivery:null,eir:null},
  payment:{status:payment,reference:payment==="Paid"?"SIM-PAY-"+id:null,paidAt:payment==="Paid"?"2026-10-31T12:00:00Z":null}
 };
 if(["In transit","Delivered","Complete"].includes(status))load.evidence.pickup={type:"pickup",label:LABELS.pickup,reference:"SAMPLE-PICKUP-"+id,placeholder:true};
 if(["Delivered","Complete"].includes(status))load.evidence.delivery={type:"delivery",label:LABELS.delivery,reference:"SAMPLE-DELIVERY-"+id,placeholder:true};
 if(status==="Complete")load.evidence.eir={type:"eir",label:LABELS.eir,reference:"SAMPLE-EIR-"+id,placeholder:true};
 return load;
};
function seed(){
 return {version:6,nextId:3100,
  driver:{...DRIVERS[0]},
  drivers:DRIVERS.map(x=>({...x})),
  fleet:TRUCKS.map(x=>({...x})),
  loads:[
   sample("LD-3088","mombasa-port","nairobi-icd","Open",280000,22,305,null,0,"",null),
   sample("LD-3089","mombasa-port","nakuru","Open",310000,21,360,null,0,"",null),
   sample("LD-3090","mombasa-cfs","eldoret","Open",340000,24,430,null,0,"",null),
   sample("LD-3087","mombasa-port","kisumu","Open",330000,20,465,null,0,"",null),
   sample("LD-3086","mombasa-port","nairobi-icd","Assigned",280000,19,305,"KDA 384P",0,"Mombasa Port","Kevin Mwangi (fictional)"),
   sample("LD-3085","mombasa-port","athi-river","Open",275000,20,291,null,0,"",null),
   sample("LD-3084","mombasa-port","nairobi-icd","In transit",295000,22,305,"KDU 537R",128,"Voi · A109","Amina Wanjiku (fictional)"),
   sample("LD-3083","mombasa-port","nakuru","Delivered",310000,21,360,"KBA 241L",360,"Nakuru ICD","Peter Otieno (fictional)"),
   sample("LD-3082","mombasa-port","nairobi-icd","Complete",280000,20,305,"KDA 384P",610,"Mombasa Port","Kevin Mwangi (fictional)"),
   sample("LD-3081","mombasa-port","eldoret","Complete",340000,23,430,"KDU 537R",860,"Mombasa Port","Amina Wanjiku (fictional)","Paid")
  ],
  activity:[{id:"ACT-1",at:now(),title:"Fleet workspace ready",detail:"Illustrative cargo movements loaded.",loadId:null}]
 };
}
function metrics(d){
 const count=s=>d.loads.filter(l=>l.status===s).length;
 return {total:d.loads.length,open:count("Open"),assigned:count("Assigned"),moving:d.loads.filter(l=>["In transit","Delivered"].includes(l.status)).length,
  completed:count("Complete"),unpaid:d.loads.filter(l=>l.status==="Complete"&&l.payment.status==="Unpaid").length,
  owed:d.loads.filter(l=>l.status==="Complete"&&l.payment.status==="Unpaid").reduce((n,l)=>n+l.driverPay,0)};
}
function validate(d){
 return !!d&&d.version===6&&Array.isArray(d.loads)&&Array.isArray(d.activity)&&Array.isArray(d.fleet)&&Array.isArray(d.drivers)&&!!d.driver&&
   typeof d.driver.id==="string"&&Number.isSafeInteger(d.nextId)&&
   d.loads.every(l=>!!l&&typeof l.id==="string"&&STATUSES.includes(l.status)&&!!l.evidence&&!!l.payment);
}
return {PORTS,CONSIGNEES,STATUSES,LABELS,seed,metrics,validate,loc,find,active,assignmentAvailability,pairedTruck,post,edit,remove,assign,pair,progress,pay};
})();
