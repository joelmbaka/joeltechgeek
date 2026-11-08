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
const STATUSES=["Open","Assigned","Picked up","In transit","Delivered","Complete"];
const CONSIGNEES=["Harbor Freight Co.","Cedar Imports Ltd.","Nairobi Distribution Hub","Valley Logistics Ltd."];
const NEXT={"Assigned":"Picked up","Picked up":"In transit","In transit":"Delivered","Delivered":"Complete"};
const LABELS={pickup:"Pickup photo",delivery:"Delivery note",eir:"Equipment Interchange Receipt (EIR)"};
const now=()=>new Date().toISOString();
const loc=id=>PORTS.find(p=>p.id===id);
const find=(d,id)=>d.loads.find(l=>l.id===id);
const str=(v,name,min=3,max=140)=>{const s=String(v??"").trim();if(s.length<min||s.length>max)throw new Error(name+" must contain "+min+"–"+max+" characters.");return s;};
const int=(v,name,min=0,max=10000000)=>{if(v==null||String(v).trim()==="")throw new Error(name+" is required.");const n=Number(v);if(!Number.isSafeInteger(n)||n<min||n>max)throw new Error(name+" must be a whole number between "+min+" and "+max+".");return n;};
const num=(v,name,min,max)=>{if(v==null||String(v).trim()==="")throw new Error(name+" is required.");const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw new Error(name+" must be between "+min+" and "+max+".");return Math.round(n*10)/10;};
const add=(d,title,detail,loadId)=>d.activity.unshift({id:"ACT-"+(d.activity.length+1),at:now(),title,detail,loadId});
const ROSTER=[
 {id:"DRV-DEMO-001",name:"Kevin Mwangi (fictional)",truckPlate:"KDA 384P · DEMO",capacityTons:28},
 {id:"DRV-PETER",name:"Peter O. (sample)",truckPlate:"KCY 319P",capacityTons:28},
 {id:"DRV-ESTHER",name:"Esther K. (sample)",truckPlate:"KDH 117A",capacityTons:28},
 {id:"DRV-BRIAN",name:"Brian L. (sample)",truckPlate:"KCN 205J",capacityTons:28},
 {id:"DRV-MOSES",name:"Moses T. (sample)",truckPlate:"KDJ 908M",capacityTons:28}
];
const active=(d,driverId=d.driver.id)=>d.loads.find(l=>l.driver?.id===driverId&&["Assigned","Picked up","In transit","Delivered"].includes(l.status));
function assign(d,id,driverId){
 const l=find(d,id),driver=ROSTER.find(x=>x.id===driverId);
 if(!l||l.status!=="Open")throw new Error("Only open loads can be assigned.");
 if(!driver)throw new Error("Choose a driver.");
 if(active(d,driver.id))throw new Error("This driver already has an active load.");
 if(l.weightTons>driver.capacityTons)throw new Error("Load exceeds the driver's truck capacity.");
 l.driver={id:driver.id,name:driver.name,truckPlate:driver.truckPlate};
 l.truck={location:loc(l.originId).name+" · sample",miles:0,updatedAt:now()};
 l.telemetry={location:loc(l.originId).name,speedKph:0,ignition:false,fuelPercent:76,lastSeenMinutes:2,online:true,recordedDistanceKm:0};
 l.status="Assigned";l.updatedAt=now();
 add(d,"Load assigned",l.id+" · "+driver.name+" / "+driver.truckPlate,l.id);return l;
}
function upgrade(d){
 if(!d||d.version!==2||!Array.isArray(d.loads))return d;
 for(const l of d.loads){
  if(l.status==="Booked"){l.status="Assigned";if(l.id==="LD-3087"){l.driver={id:d.driver.id,name:d.driver.name,truckPlate:d.driver.truckPlate};}if(!l.truck)l.truck={location:loc(l.originId)?.name||"Unknown",miles:0,updatedAt:l.updatedAt||now()};}
  if(l.id==="LD-3081"&&l.driver){l.driver={id:d.driver.id,name:d.driver.name,truckPlate:d.driver.truckPlate};}
  if(l.driver&&!l.telemetry){l.telemetry=sampleTelemetry(l);}
 }
 d.version=3;return d;
}
function sampleTelemetry(l){
 const origin=loc(l.originId)?.name||"Pickup location",destination=loc(l.destinationId)?.name||"Delivery location";
 const presets={
  "Assigned":{location:origin,speedKph:0,ignition:false,fuelPercent:76,recordedDistanceKm:0},
  "Picked up":{location:"Mariakani",speedKph:28,ignition:true,fuelPercent:71,recordedDistanceKm:13},
  "In transit":{location:"Voi · A109",speedKph:64,ignition:true,fuelPercent:58,recordedDistanceKm:206},
  "Delivered":{location:destination,speedKph:0,ignition:false,fuelPercent:34,recordedDistanceKm:490},
  "Complete":{location:destination,speedKph:0,ignition:false,fuelPercent:29,recordedDistanceKm:510}
 };
 return {...(presets[l.status]||presets.Assigned),lastSeenMinutes:2,online:true};
}
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
 if(!load||load.status!=="Open")throw new Error("Only open, unbooked loads can be edited.");
 const details=fields(d,v,load);Object.assign(load,details,{updatedAt:now()});
 add(d,"Load updated",load.id+" · KES "+load.driverPay.toLocaleString()+" driver pay.",id);return load;
}
function remove(d,id){
 const load=find(d,id);
 if(!load||load.status!=="Open")throw new Error("Only open, unbooked loads can be deleted.");
 d.loads=d.loads.filter(l=>l.id!==id);add(d,"Load deleted",id+" removed from the board.",id);return id;
}
function progress(d,id,next){
 const load=find(d,id);
 if(!load||load.driver?.id!==d.driver.id)throw new Error("Only the assigned driver can update this trip.");
 if(NEXT[load.status]!==next)throw new Error("Trip status cannot skip or repeat stages.");
 const evidenceType={"Picked up":"pickup","Delivered":"delivery","Complete":"eir"}[next];
 // Driver workflow changes do not manufacture GPS positions, fuel or odometer readings.
 if(evidenceType&&!load.evidence[evidenceType]){
  load.evidence[evidenceType]={type:evidenceType,label:LABELS[evidenceType],
   reference:"SAMPLE-"+evidenceType.toUpperCase()+"-"+load.id,
   placeholder:true,at:now()};
 }
 load.status=next;load.updatedAt=now();
 add(d,"Load "+next.toLowerCase(),id+" · driver status update (not a GPS event)",id);return load;
}
function pay(d,id){
 const load=find(d,id);
 if(!load||load.status!=="Complete")throw new Error("Only completed loads can be marked paid.");
 if(load.payment.status==="Paid")throw new Error("Driver payment has already been marked paid.");
 load.payment={status:"Paid",reference:"SIM-PAY-"+id,paidAt:now()};
 add(d,"Driver paid (simulated)",id+" · KES "+load.driverPay.toLocaleString()+" marked paid.",id);return load;
}
const sample=(id,from,to,status,payAmount,weight,miles,plate,milesDone,where,name,payment="Unpaid")=>{
 const load={id,originId:from,destinationId:to,cargo:"40-ft shipping container · general cargo",containerFeet:40,returnId:"mombasa-port",consignee:"Harbor Freight Co.",weightTons:weight,
  driverPay:payAmount,routeMiles:miles,containerNo:"DEMO-"+id,status,createdAt:"2026-10-30T08:00:00Z",updatedAt:"2026-10-31T12:00:00Z",
  driver:name?{id:name==="Kevin Mwangi (fictional)"?"DRV-DEMO-001":"SAMPLE-"+id,name,truckPlate:plate}:null,
  truck:name?{miles:milesDone,location:where+" · sample",updatedAt:"2026-10-31T12:00:00Z"}:null,
  evidence:{pickup:null,delivery:null,eir:null},
  payment:{status:payment,reference:payment==="Paid"?"SIM-PAY-"+id:null,paidAt:payment==="Paid"?"2026-10-31T12:00:00Z":null}
 };
 if(load.driver)load.telemetry=sampleTelemetry(load);
 if(["Picked up","In transit","Delivered","Complete"].includes(status))load.evidence.pickup={type:"pickup",label:LABELS.pickup,reference:"SAMPLE-PICKUP-"+id,placeholder:true};
 if(["Delivered","Complete"].includes(status))load.evidence.delivery={type:"delivery",label:LABELS.delivery,reference:"SAMPLE-DELIVERY-"+id,placeholder:true};
 if(status==="Complete")load.evidence.eir={type:"eir",label:LABELS.eir,reference:"SAMPLE-EIR-"+id,placeholder:true};
 return load;
};
function seed(){
 return {version:3,nextId:3100,
  driver:{...ROSTER[0]},
  loads:[
   sample("LD-3088","mombasa-port","nairobi-icd","Open",280000,22,305,null,0,"",null),
   sample("LD-3089","mombasa-port","nakuru","Open",310000,21,360,null,0,"",null),
   sample("LD-3090","mombasa-cfs","eldoret","Open",340000,24,430,null,0,"",null),
   sample("LD-3087","mombasa-port","kisumu","Assigned",330000,20,465,"KDA 384P · DEMO",0,"Mombasa Port","Kevin Mwangi (fictional)"),
   sample("LD-3086","mombasa-port","nairobi-icd","Assigned",280000,19,305,"KCY 319P",0,"Mombasa Port","Peter O. (sample)"),
   sample("LD-3085","mombasa-port","athi-river","Picked up",275000,20,291,"KCN 205J",8,"Mariakani","Brian L. (sample)"),
   sample("LD-3084","mombasa-port","nairobi-icd","In transit",295000,22,305,"KDH 117A",128,"Voi · A109","Esther K. (sample)"),
   sample("LD-3083","mombasa-port","nakuru","Delivered",310000,21,360,"KDJ 908M",360,"Nakuru ICD","Moses T. (sample)"),
   sample("LD-3082","mombasa-port","nairobi-icd","Complete",280000,20,305,"KCC 290Q",610,"Mombasa Port","Njeri W. (sample)"),
   sample("LD-3081","mombasa-port","eldoret","Complete",340000,23,430,"KDA 384P · DEMO",860,"Mombasa Port","Kevin Mwangi (fictional)","Paid")
  ],
  activity:[{id:"ACT-1",at:now(),title:"Fleet workspace ready",detail:"Illustrative cargo movements loaded.",loadId:null}]
 };
}
function metrics(d){
 const count=s=>d.loads.filter(l=>l.status===s).length;
 return {total:d.loads.length,open:count("Open"),assigned:count("Assigned"),moving:d.loads.filter(l=>["Picked up","In transit","Delivered"].includes(l.status)).length,
  completed:count("Complete"),unpaid:d.loads.filter(l=>l.status==="Complete"&&l.payment.status==="Unpaid").length,
  owed:d.loads.filter(l=>l.status==="Complete"&&l.payment.status==="Unpaid").reduce((n,l)=>n+l.driverPay,0)};
}
function validate(d){
 return !!d&&d.version===3&&Array.isArray(d.loads)&&Array.isArray(d.activity)&&!!d.driver&&
   typeof d.driver.id==="string"&&Number.isSafeInteger(d.nextId)&&
   d.loads.every(l=>!!l&&typeof l.id==="string"&&STATUSES.includes(l.status)&&!!l.evidence&&!!l.payment);
}
return {PORTS,CONSIGNEES,STATUSES,LABELS,ROSTER,seed,upgrade,metrics,validate,loc,find,active,post,edit,remove,assign,progress,pay};
})();
