initMinimalDemo((function healthcareDemo(){
  const money=n=>"KES "+new Intl.NumberFormat("en-KE").format(n);
  const safe=(v,name,min=3,max=100)=>{const s=String(v??"").trim();if(s.length<min||s.length>max)throw new Error(name+" must contain "+min+"–"+max+" characters.");return s};
  const options=[{id:"consult",label:"OPD consultation",amount:1500},{id:"consultlab",label:"OPD consultation + lab request",amount:2600}];
  const actions=[
    {id:"register",role:"reception",category:"Patient registry",title:"Register a fictional patient",description:"Start a demonstration patient record. Do not enter real personal or medical information.",button:"Register sample patient",
      fields:[{name:"name",label:"Fictional patient display name",value:"Jamie Sample (fictional)",maxlength:100}],
      ready:d=>!d.patient,done:d=>!!d.patient,run(d,v){
        const name=safe(v.name,"Display name");
        d.patient={id:"PAT-DEMO-001",name};
        return "Demo patient PAT-DEMO-001 registered.";
      }},
    {id:"visit",role:"reception",category:"Outpatient",title:"Open an OPD encounter",description:"Reception creates an outpatient visit against the registered patient.",button:"Open outpatient encounter",fields:[],
      ready:d=>!!d.patient&&!d.encounter,done:d=>!!d.encounter,run(d){
        d.encounter={id:"OPD-DEMO-001",patientId:d.patient.id,status:"Awaiting triage",priority:null,service:null};
        return "Outpatient encounter opened and queued for triage.";
      }},
    {id:"triage",role:"nurse",category:"Triage handoff",title:"Complete the simulated triage handoff",description:"Record a non-clinical priority label for demonstration. No vital signs or care guidance are collected.",button:"Mark triage handoff complete",
      fields:[{name:"priority",label:"Fictional queue priority",type:"select",options:[{value:"Routine",label:"Routine"},{value:"Urgent",label:"Urgent"}]}],
      ready:d=>d.encounter?.status==="Awaiting triage",done:d=>!!d.encounter?.priority,run(d,v){
        if(!["Routine","Urgent"].includes(v.priority))throw new Error("Choose a valid queue priority.");
        d.encounter.priority=v.priority;d.encounter.status="Awaiting clinician";
        return "Triage handoff recorded for the demo encounter.";
      }},
    {id:"consult",role:"clinician",category:"Consultation & orders",title:"Complete a fictional consultation",description:"Select a demo service for billing; no diagnosis, prescription or medical assessment is made.",button:"Record completed demo service",fields:[
      {name:"serviceId",label:"Sample service order",type:"select",options:options.map(o=>({value:o.id,label:o.label+" · "+money(o.amount)}))}
    ],ready:d=>d.encounter?.status==="Awaiting clinician",done:d=>!!d.encounter?.service,run(d,v){
      const service=options.find(x=>x.id===v.serviceId);
      if(!service)throw new Error("Select a valid sample service.");
      d.encounter.service={...service};d.encounter.status="Consultation completed";
      return "Fictional service recorded; ready for billing.";
    }},
    {id:"bill",role:"cashier",category:"Billing",title:"Generate an OPD service bill",description:"Create an illustrative line-item invoice from the documented demo service.",button:"Generate sample bill",fields:[],
      ready:d=>d.encounter?.status==="Consultation completed"&&!d.invoice,done:d=>!!d.invoice,run(d){
        const service=d.encounter.service;
        if(!service)throw new Error("Complete a service first.");
        d.invoice={id:"BILL-DEMO-001",patientId:d.patient.id,encounterId:d.encounter.id,lines:[{name:service.label,amount:service.amount}],total:service.amount,status:"Unpaid"};
        d.encounter.status="Billed";
        return "Sample OPD bill created for "+money(d.invoice.total)+".";
      }},
    {id:"payment",role:"cashier",category:"Payment",title:"Mark the sample bill paid",description:"Record a fictitious payment and complete the administrative workflow; no transaction occurs.",button:"Record simulated payment",fields:[
      {name:"method",label:"Simulated payment method",type:"select",options:[{value:"Cash (demo)",label:"Cash (simulated)"},{value:"Mobile money (demo)",label:"Mobile money (simulated)"}]}
    ],ready:d=>d.invoice?.status==="Unpaid"&&d.encounter?.status==="Billed",done:d=>d.invoice?.status==="Paid",run(d,v){
      if(!["Cash (demo)","Mobile money (demo)"].includes(v.method))throw new Error("Select a valid sample payment method.");
      d.invoice.status="Paid";d.invoice.method=v.method;d.invoice.reference="SIM-CLV-001";d.encounter.status="Administratively completed";
      return "Sample bill marked paid and encounter workflow completed.";
    }}
  ];
  return {
    slug:"healthcare",category:"Hospital & clinic operations",product:"Clinic Operations",mark:"✚",
    headline:"Patient journeys & OPD operations",intro:"Explore a fictional outpatient handoff: patient registration, encounter, triage, consultation service, and sample billing.",
    hero:"Follow one fictional outpatient encounter, end to end.",
    heroDescription:"Reception, nursing, clinical and billing views share an administrative record while keeping all medical content out of this demo.",
    instructions:"Begin at Reception to register a sample patient and open an OPD visit. Switch to Nurse for the triage handoff, Clinician for a demo service, then Billing to issue and mark the sample bill paid.",
    disclaimer:"This is not a clinical system, medical record, medical advice, care assessment, billing statement or proof of treatment. No real patient information should be entered.",
    roles:[{id:"reception",name:"Grace · Reception"},{id:"nurse",name:"Mary · Nurse"},{id:"clinician",name:"Dr. Kim · Clinician"},{id:"cashier",name:"Sam · Billing"}],
    seed:()=>({version:1,patient:null,encounter:null,invoice:null,activity:[]}),
    valid:d=>"patient"in d&&"encounter"in d&&"invoice"in d,
    metrics:d=>[
      {label:"Patient records",value:d.patient?1:0,detail:"Fictional patient only"},
      {label:"Outpatient encounters",value:d.encounter?1:0,detail:"Administrative workflow"},
      {label:"Visit stage",value:d.encounter?.status||"Not started",detail:"Cross-team handoffs"},
      {label:"Service billed",value:money(d.invoice?.total||0),detail:"Simulated billing only"}
    ],actions,
    sections:[
      {title:"Patient and encounter",description:"No real identifiers, diagnoses or observations are captured.",columns:[{key:"patient",title:"Sample patient"},{key:"id",title:"Encounter"},{key:"priority",title:"Queue priority"},{key:"status",title:"Stage"}],
        rows:d=>d.encounter?[{patient:d.patient?.name||"—",id:d.encounter.id,priority:d.encounter.priority||"Not triaged",status:d.encounter.status}]:[]},
      {title:"Consultation service orders",description:"Only illustrative service labels and prices.",columns:[{key:"id",title:"Encounter"},{key:"service",title:"Sample service"},{key:"amount",title:"Demo price"}],
        rows:d=>d.encounter?.service?[{id:d.encounter.id,service:d.encounter.service.label,amount:money(d.encounter.service.amount)}]:[]},
      {title:"Billing register",description:"No actual medical charges or payment processing.",columns:[{key:"id",title:"Bill"},{key:"patientId",title:"Patient ref"},{key:"total",title:"Total"},{key:"status",title:"Status"},{key:"method",title:"Demo method"}],
        rows:d=>d.invoice?[{...d.invoice,total:money(d.invoice.total),method:d.invoice.method||"—"}]:[]}
    ]
  };
})());
