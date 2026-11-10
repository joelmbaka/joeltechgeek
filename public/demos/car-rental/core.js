/* Fictional owner-only rental fleet. No live GPS or payments. */
const rentalCore=(function(){
"use strict";
const DAY=86400000;
const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
const num=(n,label,zero=false)=>{const v=Number(n);if(!Number.isFinite(v)||(zero?v<0:v<=0))throw Error(label+" must be "+(zero?"zero or greater.":"greater than zero."));return round(v)};
const integer=(n,label,zero=false)=>{const v=Number(n);if(!Number.isInteger(v)||(zero?v<0:v<=0))throw Error(label+" must be a valid whole number.");return v};
const id=p=>p+"-"+(typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID().slice(0,8):Math.random().toString(36).slice(2,10)).toUpperCase();
const ts=()=>new Date().toISOString();
const shift=(base,days)=>new Date(new Date(base).getTime()+days*DAY).toISOString();
const vehiclesSeed=[
["KDA 412X","Toyota","Axio",2017,1500,5,"Automatic","Hybrid",35,126400],
["KDB 217M","Toyota","Prado",2018,2800,7,"Automatic","Diesel",95,104200],
["KDC 519A","Mazda","Demio",2019,1300,5,"Automatic","Petrol",30,78600],
["KDD 403T","Toyota","Fielder",2018,1500,5,"Automatic","Hybrid",42,96300],
["KDE 903N","Honda","Fit",2019,1300,5,"Automatic","Petrol",33,78550],
["KDF 114B","Toyota","Vitz",2018,1000,5,"Automatic","Petrol",27,109240],
["KDG 602R","Nissan","X-Trail",2018,2000,5,"Automatic","Petrol",65,91470],
["KDH 220S","Toyota","Harrier",2019,2000,5,"Automatic","Petrol",78,87400],
["KDJ 482P","Subaru","Forester",2018,2000,5,"Automatic","Petrol",68,112200],
["KDK 301Q","Toyota","Premio",2017,1800,5,"Automatic","Petrol",48,132000],
["KDL 114F","Suzuki","Swift",2020,1200,5,"Automatic","Petrol",29,68400],
["KDM 980J","Toyota","Hiace",2018,2700,14,"Manual","Diesel",110,147500]
];
const customersSeed=[
["Daniel Mwangi","0700 000 123","ID-100101"],["Peter Otieno","0700 000 224","ID-100102"],
["Grace Wanjiku","0700 000 325","ID-100103"],["Amina Hassan","0700 000 426","ID-100104"],
["Samuel Kariuki","0700 000 527","ID-100105"],["Lucy Njeri","0700 000 628","ID-100106"],
["Brian Odhiambo","0700 000 729","ID-100107"],["Sarah Muthoni","0700 000 830","ID-100108"]
];
const sampleRoute=(base,seedNo)=>{const origin=[-1.2921+seedNo*.005,36.8219+seedNo*.003];return Array.from({length:11},(_,i)=>({
  at:new Date(new Date(base).getTime()+(i*13+3)*60000).toISOString(),
  lat:+(origin[0]+Math.sin(i/3)*.012+i*.0015).toFixed(6),
  lng:+(origin[1]+Math.cos(i/3)*.014+i*.0018).toFixed(6),
  speed:i===0||i===10?0:Math.round(24+26*Math.abs(Math.sin(i))),
  ignition:i!==10,event:i===0?"Ignition on":i===10?"Ignition off":i===5?"Stopped":"Moving"
}))};
function seed(now=ts()){
 const vehicles=vehiclesSeed.map((a,i)=>({id:"V-"+(i+1),plate:a[0],make:a[1],model:a[2],year:a[3],cc:a[4],seats:a[5],transmission:a[6],fuel:a[7],rate:a[8],odometer:a[9],maintenance:i===5||i===9,serviceKm:a[9]+(i%3+1)*350,trackerId:"SIM-"+(i+100),trackerOnline:i!==3&&i!==8,route:sampleRoute(shift(now,-(i+1)*.17),i),lastService:shift(now,-45-i*3)}));
 const customers=customersSeed.map((a,i)=>({id:"C-"+(i+1),name:a[0],phone:a[1],documentNo:a[2],email:""}));
 const d={version:1,seededAt:now,vehicles,customers,rentals:[],payments:[],expenses:[],maintenance:[],gpsSessions:{},nextRental:1060};
 const specs=[
 [0,0,-1,3,70,false],[1,1,-8,7,665,false],[3,2,-5,14,250,false],
 [6,3,-2,2,0,false],[7,4,-4,7,546,false],[8,5,-11,14,300,false],
 [10,6,-1,3,87,false],[2,2,-13,2,60,true],[4,7,-9,5,165,true],
 [0,1,-35,3,105,true],[1,3,-44,7,665,true],[11,4,-19,2,120,true]
 ];
 specs.forEach(([vi,ci,startDays,days,paid,completed],i)=>{
  const v=vehicles[vi],start=shift(now,startDays),due=shift(start,days);
  const actualReturn=completed?shift(due,.08):null;
  const rental={id:"R-"+(1040+i),vehicleId:v.id,customerId:customers[ci].id,start,due,days,rate:v.rate,base:round(v.rate*days),extra:0,returnedAt:actualReturn,endOdometer:completed?v.odometer-600+i*19:null,startOdometer:v.odometer-800-i*7,events:[]};
  d.rentals.push(rental);
  d.gpsSessions[rental.id]=sampleRoute(shift(start,.15),vi);
  if(paid)d.payments.push({id:"PAY-"+i,rentalId:rental.id,amount:Math.min(paid,rental.base),method:i%2?"Bank transfer":"Cash",reference:"",date:shift(start,.1)});
 });
 d.expenses.push({id:"EXP-1",vehicleId:null,category:"Office rent",amount:420,date:shift(now,-9),description:"Monthly office rent"});
 d.expenses.push({id:"EXP-2",vehicleId:null,category:"Internet",amount:40,date:shift(now,-7),description:"Office connection"});
 d.expenses.push({id:"EXP-3",vehicleId:"V-2",category:"Insurance",amount:95,date:shift(now,-6),description:"Vehicle premium"});
 d.maintenance.push({id:"M-1",vehicleId:"V-6",date:shift(now,-2),type:"Scheduled service",cost:130,odometer:vehicles[5].odometer,notes:"Engine oil and filters"});
 d.maintenance.push({id:"M-2",vehicleId:"V-10",date:shift(now,-1),type:"Brake inspection",cost:90,odometer:vehicles[9].odometer,notes:"Pads replaced"});
 return d;
}
const validate=d=>!!d&&d.version===1&&["vehicles","customers","rentals","payments","expenses","maintenance"].every(k=>Array.isArray(d[k]))&&!!d.gpsSessions;
const vehicle=(d,id)=>d.vehicles.find(v=>v.id===id);
const customer=(d,id)=>d.customers.find(c=>c.id===id);
const active=(d,vid)=>d.rentals.find(r=>r.vehicleId===vid&&!r.returnedAt);
const status=(d,v)=>v.maintenance?"Maintenance":active(d,v.id)?"Rented":"Available";
const payments=(d,rid)=>round(d.payments.filter(p=>p.rentalId===rid).reduce((a,p)=>a+p.amount,0));
const total=r=>round(r.base+r.extra);
const due=(d,r)=>round(total(r)-payments(d,r.id));
const payStatus=(d,r)=>due(d,r)<=0?"Paid":payments(d,r.id)?"Partially paid":"Unpaid";
const overdue=(r,now=ts())=>!r.returnedAt&&new Date(r.due).getTime()<new Date(now).getTime();
const routeFor=(d,vid,rid)=>rid&&d.gpsSessions[rid]?d.gpsSessions[rid]:(vehicle(d,vid)?.route||[]);
const requireVehicle=(d,id)=>{const v=vehicle(d,id);if(!v)throw Error("Vehicle not found.");return v};
const requireRental=(d,id)=>{const r=d.rentals.find(x=>x.id===id);if(!r)throw Error("Rental not found.");return r};
const copyTransaction=(d,fn)=>{const draft=JSON.parse(JSON.stringify(d));const result=fn(draft);Object.keys(d).forEach(k=>delete d[k]);Object.assign(d,draft);return result};
function addCustomer(d,f){return copyTransaction(d,x=>{
 const name=String(f.name||"").trim(),phone=String(f.phone||"").trim(),documentNo=String(f.documentNo||"").trim();
 if(!name||!phone||!documentNo)throw Error("Name, phone and ID number are required.");
 const c={id:id("C"),name,phone,documentNo,email:String(f.email||"").trim()};x.customers.unshift(c);return c;
});}
function addVehicle(d,f){return copyTransaction(d,x=>{
 const plate=String(f.plate||"").trim().toUpperCase();
 if(!plate||!f.make||!f.model)throw Error("Registration, make and model are required.");
 if(x.vehicles.some(v=>v.plate===plate))throw Error("Registration already exists.");
 const v={id:id("V"),plate,make:String(f.make).trim(),model:String(f.model).trim(),year:integer(f.year,"Year"),cc:integer(f.cc,"Engine capacity"),seats:integer(f.seats,"Seats"),transmission:String(f.transmission||"Automatic"),fuel:String(f.fuel||"Petrol"),rate:num(f.rate,"Daily rate"),odometer:integer(f.odometer||0,"Odometer",true),maintenance:false,serviceKm:integer(f.serviceKm||0,"Next service",true),trackerId:"",trackerOnline:false,route:[],lastService:null};
 x.vehicles.unshift(v);return v;
});}
function startRental(d,f){
 return copyTransaction(d,x=>{
  const v=requireVehicle(x,f.vehicleId),c=customer(x,f.customerId);
  if(!c)throw Error("Select a customer.");
  if(status(x,v)!=="Available")throw Error("Vehicle must be available to rent.");
  const start=new Date(f.start),days=integer(f.days,"Rental days"),rate=num(f.rate??v.rate,"Daily rate");
  if(Number.isNaN(start.getTime()))throw Error("Valid start date and time required.");
  const dueAt=new Date(start.getTime()+days*DAY);
  const rental={id:"R-"+x.nextRental++,vehicleId:v.id,customerId:c.id,start:start.toISOString(),due:dueAt.toISOString(),days,rate,base:round(days*rate),extra:0,returnedAt:null,endOdometer:null,startOdometer:v.odometer,events:[]};
  x.rentals.unshift(rental);
  x.gpsSessions[rental.id]=sampleRoute(shift(rental.start,.08),x.vehicles.indexOf(v));
  if(Number(f.initialPayment||0)>0)paymentUnsafe(x,{rentalId:rental.id,amount:f.initialPayment,method:f.method||"Cash",reference:f.reference||""},rental.start);
  return rental;
 });
}
function paymentUnsafe(d,f,date=ts()){
 const r=requireRental(d,f.rentalId),amount=num(f.amount,"Payment");
 const balance=due(d,r);
 if(amount>balance+0.001)throw Error("Payment exceeds outstanding balance.");
 const method=String(f.method||"Cash");
 if(!["Cash","Mobile Money","Card","Bank transfer","Other"].includes(method))throw Error("Select a valid payment method.");
 const p={id:id("PAY"),rentalId:r.id,amount,method,reference:String(f.reference||"").trim(),date};
 d.payments.unshift(p);return p;
}
function recordPayment(d,f){return copyTransaction(d,x=>paymentUnsafe(x,f));}
function extendRental(d,rid,additional,now=ts()){
 return copyTransaction(d,x=>{
  const r=requireRental(x,rid);
  if(r.returnedAt)throw Error("Cannot extend a returned rental.");
  const days=integer(additional,"Additional days");
  const newDue=shift(r.due,days);
  if(new Date(newDue).getTime()<=new Date(now).getTime())throw Error("Extend enough days to move the due date into the future.");
  r.days+=days;r.due=newDue;r.base=round(r.base+days*r.rate);
  r.events.push({at:now,description:"Extended by "+days+" day(s)"});
  return r;
 });
}
function returnVehicle(d,f){
 return copyTransaction(d,x=>{
  const r=requireRental(x,f.rentalId),v=requireVehicle(x,r.vehicleId);
  if(r.returnedAt)throw Error("Rental already returned.");
  const returned=new Date(f.returnedAt||ts());
  if(Number.isNaN(returned.getTime())||returned.getTime()<new Date(r.start).getTime())throw Error("Return must be after rental start.");
  const odometer=integer(f.odometer,"Odometer",true);
  if(odometer<r.startOdometer)throw Error("End odometer cannot be less than start odometer.");
  const extra=num(f.extra||0,"Additional charges",true);
  r.extra=round(r.extra+extra);r.returnedAt=returned.toISOString();r.endOdometer=odometer;v.odometer=odometer;
  if(Number(f.payment||0)>0)paymentUnsafe(x,{rentalId:r.id,amount:f.payment,method:f.method||"Cash",reference:f.reference||""},returned.toISOString());
  v.maintenance=Boolean(f.maintenance);r.events.push({at:returned.toISOString(),description:"Vehicle returned"});
  return r;
 });
}
function maintenance(d,f){
 return copyTransaction(d,x=>{
  const v=requireVehicle(x,f.vehicleId),date=new Date(f.date||ts());
  if(Number.isNaN(date.getTime()))throw Error("Valid date required.");
  const record={id:id("M"),vehicleId:v.id,date:date.toISOString(),type:String(f.type||"Service"),cost:num(f.cost,"Maintenance cost",true),odometer:integer(f.odometer||v.odometer,"Odometer",true),notes:String(f.notes||"").trim()};
  x.maintenance.unshift(record);v.lastService=record.date;return record;
 });
}
function expense(d,f){
 return copyTransaction(d,x=>{
  if(f.vehicleId)requireVehicle(x,f.vehicleId);
  const date=new Date(f.date||ts());if(Number.isNaN(date.getTime()))throw Error("Valid expense date required.");
  const e={id:id("EXP"),vehicleId:f.vehicleId||null,category:String(f.category||"Other").trim(),amount:num(f.amount,"Expense"),date:date.toISOString(),description:String(f.description||"").trim()};
  x.expenses.unshift(e);return e;
 });
}
function setMaintenance(d,vid,on){return copyTransaction(d,x=>{const v=requireVehicle(x,vid);if(active(x,v.id)&&on)throw Error("Return the vehicle before marking maintenance.");v.maintenance=!!on;return v});}
function finance(d,month,vid=null){
 const within=date=>String(date).slice(0,7)===month;
 const ids=new Set((vid?[vid]:d.vehicles.map(v=>v.id)));
 const rentalRecords=d.rentals.filter(r=>ids.has(r.vehicleId));
 // Demo: revenue recognized when the vehicle has been returned; open rentals are contracted, not yet earned.
 const completed=rentalRecords.filter(r=>r.returnedAt&&within(r.returnedAt));
 const revenue=round(completed.reduce((s,r)=>s+total(r),0));
 const collected=round(d.payments.filter(p=>within(p.date)&&rentalRecords.some(r=>r.id===p.rentalId)).reduce((s,p)=>s+p.amount,0));
 const outstanding=round(rentalRecords.reduce((s,r)=>s+Math.max(0,due(d,r)),0));
 const vehicleExpenses=d.expenses.filter(e=>e.vehicleId&&ids.has(e.vehicleId)&&within(e.date));
 const generalExpenses=vid?[]:d.expenses.filter(e=>!e.vehicleId&&within(e.date));
 const services=d.maintenance.filter(m=>ids.has(m.vehicleId)&&within(m.date));
 const spend=round(vehicleExpenses.reduce((s,e)=>s+e.amount,0)+generalExpenses.reduce((s,e)=>s+e.amount,0)+services.reduce((s,e)=>s+e.cost,0));
 return {month,revenue,collected,outstanding,expenses:spend,net:round(revenue-spend),rentalCount:completed.length};
}
function alerts(d,now=ts()){
 const out=[];
 for(const v of d.vehicles){
  const r=active(d,v.id);
  if(r&&overdue(r,now))out.push({id:"OVER-"+r.id,vehicleId:v.id,type:"Overdue rental",detail:v.plate+" · "+customer(d,r.customerId)?.name,severity:"urgent",at:r.due});
  if(v.trackerId&&!v.trackerOnline)out.push({id:"GPS-"+v.id,vehicleId:v.id,type:"Tracker offline",detail:v.plate+" · last-known tracking only",severity:"warning",at:now});
  if(v.serviceKm&&v.serviceKm-v.odometer<=300)out.push({id:"SERV-"+v.id,vehicleId:v.id,type:"Service due",detail:v.plate+" · "+Math.max(0,v.serviceKm-v.odometer)+" km remaining",severity:"warning",at:now});
 }
 return out.sort((a,b)=>(a.severity==="urgent"?-1:1)-(b.severity==="urgent"?-1:1));
}
return {DAY,seed,validate,vehicle,customer,active,routeFor,status,payments,total,due,payStatus,overdue,addCustomer,addVehicle,startRental,recordPayment,extendRental,returnVehicle,maintenance,expense,setMaintenance,finance,alerts,shift,round};
})();