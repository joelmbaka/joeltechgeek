initMinimalDemo((function macsimDemo(){
  const money=n=>"KES "+new Intl.NumberFormat("en-KE").format(n);
  const string=(v,label,min=3,max=100)=>{const s=String(v??"").trim();if(s.length<min||s.length>max)throw new Error(label+" must have "+min+"–"+max+" characters.");return s};
  const number=(v,label,min=0)=>{if(v==null||String(v).trim()==="")throw new Error(label+" is required.");const n=Number(v);if(!Number.isFinite(n)||n<min)throw new Error(label+" must be at least "+min+".");return n};
  const steps=[
    {id:"post",role:"dispatcher",category:"Load board",title:"Post an available cargo load",description:"Create a fictional movement from a port to an inland delivery point.",button:"Publish load",fields:[
      {name:"origin",label:"Pickup location",value:"Mombasa Port",maxlength:90},
      {name:"destination",label:"Delivery location",value:"Nairobi ICD",maxlength:90},
      {name:"cargo",label:"Cargo description",value:"Containerized household cargo",maxlength:100},
      {name:"weight",label:"Cargo weight (tonnes)",type:"number",min:1,max:28,step:"0.1",value:"12"}
    ],ready:d=>!d.load,done:d=>!!d.load,run(d,v){
      const origin=string(v.origin,"Pickup location"),destination=string(v.destination,"Delivery location"),
        cargo=string(v.cargo,"Cargo description");
      const weight=number(v.weight,"Weight",1);
      if(weight>28)throw new Error("Demo cargo weight cannot exceed 28 tonnes.");
      if(origin.toLowerCase()===destination.toLowerCase())throw new Error("Pickup and delivery points must differ.");
      d.load={id:"LOAD-001",origin,destination,cargo,weight,status:"Open",driverId:null,truckId:null,bookingId:null,documents:[]};
      return "LOAD-001 posted to the fictional dispatch board.";
    }},
    {id:"book",role:"driver",category:"Driver app",title:"Request an available load",description:"A driver requests the load with an available truck. Vehicle carrying capacity is checked.",button:"Request load",fields:[
      {name:"driverId",label:"Driver & vehicle",type:"select",options:d=>d.drivers.map(x=>({value:x.id,label:x.name+" · "+x.truck+" · "+x.capacity+" t capacity"}))}
    ],ready:d=>d.load?.status==="Open",done:d=>!!d.load?.bookingId,run(d,v){
      const driver=d.drivers.find(x=>x.id===v.driverId);
      if(!driver)throw new Error("Choose a valid driver.");
      if(d.load.weight>driver.capacity)throw new Error("The selected vehicle is rated for "+driver.capacity+" tonnes; this load weighs "+d.load.weight+" tonnes.");
      d.load.driverId=driver.id;d.load.truckId=driver.truck;d.load.bookingId="BOOK-001";d.load.status="Requested";
      return driver.name+" requested "+d.load.id+".";
    }},
    {id:"approve",role:"dispatcher",category:"Dispatch approval",title:"Confirm the driver booking",description:"Operations approves the booking before assigning the load to the driver.",button:"Approve reservation",fields:[],
      ready:d=>d.load?.status==="Requested",done:d=>["Assigned","In transit","Proof submitted","Delivered"].includes(d.load?.status),run(d){
      const driver=d.drivers.find(x=>x.id===d.load.driverId);
      if(!driver||driver.capacity<d.load.weight)throw new Error("A valid vehicle is required.");
      d.load.status="Assigned";return d.load.id+" assigned to "+driver.name+".";
    }},
    {id:"depart",role:"driver",category:"Driver app",title:"Start the delivery trip",description:"The driver confirms cargo collection and departure. No GPS is collected or simulated.",button:"Start trip",fields:[],
      ready:d=>d.load?.status==="Assigned",done:d=>["In transit","Proof submitted","Delivered"].includes(d.load?.status),run(d){
      d.load.status="In transit";return "Trip marked In transit.";
    }},
    {id:"proof",role:"driver",category:"Delivery documents",title:"Record proof of delivery",description:"Enter a fictional delivery-note reference; this demo records document metadata, not an uploaded file.",button:"Submit delivery record",fields:[
      {name:"container",label:"Container reference",value:"DEMO-CONT-001",maxlength:60},
      {name:"deliveryNote",label:"Delivery note reference",value:"DEMO-DN-001",maxlength:60}
    ],ready:d=>d.load?.status==="In transit",done:d=>["Proof submitted","Delivered"].includes(d.load?.status),run(d,v){
      const container=string(v.container,"Container reference"),deliveryNote=string(v.deliveryNote,"Delivery-note reference");
      d.load.documents.push({type:"Delivery note",reference:deliveryNote,container});
      d.load.status="Proof submitted";return "Fictional delivery references recorded for dispatch review.";
    }},
    {id:"close",role:"dispatcher",category:"Delivery verification",title:"Verify delivery and close the load",description:"Dispatch marks the delivery complete after reviewing the recorded reference.",button:"Close delivered load",fields:[],
      ready:d=>d.load?.status==="Proof submitted"&&d.load.documents.length>0,done:d=>d.load?.status==="Delivered",run(d){
      d.load.status="Delivered";return "LOAD-001 marked Delivered and closed.";
    }}
  ];
  return {
    slug:"logistics",category:"Logistics & transport",product:"Macsim Cargo",mark:"↗",
    headline:"Cargo, drivers & deliveries",intro:"Explore a simplified cargo dispatch cycle inspired by the existing Macsim Cargo mobile and operations workflows.",
    hero:"Track a shipment from an open load to proof of delivery.",
    heroDescription:"The dispatcher and driver act on one fictional cargo movement, with booking and delivery status kept in sync.",
    instructions:"Start as Dispatcher to post a load. Switch to Driver to request it, then back to Dispatcher for approval. The driver can start and submit delivery references; dispatch closes the job.",
    disclaimer:"The demo includes no real cargo, GPS tracking, route distances, bookings with carriers, file uploads, or delivery documentation.",
    roles:[{id:"dispatcher",name:"Grace · Dispatcher"},{id:"driver",name:"Kevin · Driver"}],
    seed:()=>({version:1,load:null,drivers:[{id:"DRV-001",name:"Kevin Mwangi (fictional)",truck:"KDA-DEMO",capacity:18}],activity:[]}),
    valid:d=>Array.isArray(d.drivers)&&"load"in d,
    metrics:d=>[
      {label:"Loads listed",value:d.load?1:0,detail:"Fictional cargo jobs"},
      {label:"Driver bookings",value:d.load?.bookingId?1:0,detail:"Capacity checked"},
      {label:"Trip status",value:d.load?.status||"Not posted",detail:"Updates through each stage"},
      {label:"Delivery documents",value:d.load?.documents.length||0,detail:"Sample references only"}
    ],steps,
    sections:[
      {title:"Load board",description:"The same load moves through reservation, assignment, trip and delivery.",columns:[{key:"id",title:"Load"},{key:"route",title:"Route"},{key:"cargo",title:"Cargo"},{key:"truck",title:"Truck"},{key:"status",title:"Status"}],rows:d=>d.load?[{...d.load,route:d.load.origin+" → "+d.load.destination,truck:d.load.truckId||"Not assigned"}]:[]},
      {title:"Driver assignment",description:"A booking is not an assignment until dispatch approves it.",columns:[{key:"driver",title:"Driver"},{key:"truck",title:"Vehicle"},{key:"capacity",title:"Vehicle capacity"},{key:"load",title:"Load weight"}],
        rows:d=>d.load?.bookingId?[{driver:d.drivers.find(x=>x.id===d.load.driverId)?.name||"—",truck:d.load.truckId,capacity:d.drivers.find(x=>x.id===d.load.driverId)?.capacity+" t",load:d.load.weight+" t"}]:[]},
      {title:"Delivery document log",description:"References only — no photos or files uploaded.",columns:[{key:"type",title:"Document"},{key:"reference",title:"Reference"},{key:"container",title:"Container"}],rows:d=>d.load?.documents||[]}
    ]
  };
})());
