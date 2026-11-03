/* Fictional, browser-local restaurant ordering demo. No network calls, geocoding or payments. */
var restaurantCore=(function(){
"use strict";
const BRANCHES=[
{id:"westlands",name:"Westlands",lat:-1.2643,lng:36.8061},
{id:"kilimani",name:"Kilimani",lat:-1.2921,lng:36.7841},
{id:"south-c",name:"South C",lat:-1.3161,lng:36.8301}
];
const MENU=[
{id:"classic",name:"Classic Margherita",category:"Pizza",desc:"Mozzarella, basil and tomato sauce",price:950,icon:"🍕"},
{id:"bbq",name:"BBQ Chicken Pizza",category:"Pizza",desc:"Roast chicken, smoky BBQ and red onion",price:1250,icon:"🍕"},
{id:"peri",name:"Peri Peri Pizza",category:"Pizza",desc:"Spicy chicken, sweet peppers and mozzarella",price:1350,icon:"🌶️"},
{id:"combo",name:"Chicken & Fries Combo",category:"Chicken",desc:"Crispy chicken portions with golden fries",price:890,icon:"🍗"},
{id:"wings",name:"Honey Glazed Wings",category:"Chicken",desc:"Six wings with a sticky honey glaze",price:740,icon:"🍗"},
{id:"fries",name:"Seasoned Fries",category:"Sides",desc:"Fresh fries with house seasoning",price:290,icon:"🍟"},
{id:"soda",name:"Chilled Soda",category:"Drinks",desc:"500 ml bottled soft drink",price:180,icon:"🥤"}
];
const STEPS=["Received","Preparing","Ready for dispatch","Out for delivery","Delivered"];
const BOUNDS={north:-1.237,south:-1.338,west:36.746,east:36.867};
const DELIVERY={base:120,perKm:45,maxKm:12};
const copy=o=>JSON.parse(JSON.stringify(o));
const money=n=>"KES "+n.toLocaleString("en-KE");
const item=id=>MENU.find(x=>x.id===id);
const branch=id=>BRANCHES.find(x=>x.id===id);
const precise=(v,name,min,max)=>{let n=Number(v);if(v==null||String(v).trim()===""||!Number.isFinite(n)||n<min||n>max)throw Error("Select a valid "+name+".");return n;};
const amount=(v,name,min,max)=>{let n=Number(v);if(v==null||String(v).trim()===""||!Number.isSafeInteger(n)||n<min||n>max)throw Error(name+" must be a whole number between "+min+" and "+max+".");return n;};
function distance(a,b){
 const rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLng=(b.lng-a.lng)*rad;
 const p=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(p),Math.sqrt(1-p));
}
function mapPoint(x,y){
 x=precise(x,"map position",0,1);y=precise(y,"map position",0,1);
 return {lat:+(BOUNDS.north+(BOUNDS.south-BOUNDS.north)*y).toFixed(6),lng:+(BOUNDS.west+(BOUNDS.east-BOUNDS.west)*x).toFixed(6)};
}
function coordsOnMap(point){
 return {x:(point.lng-BOUNDS.west)/(BOUNDS.east-BOUNDS.west)*100,y:(point.lat-BOUNDS.north)/(BOUNDS.south-BOUNDS.north)*100};
}
function quote(branchId,pin){
 const b=branch(branchId);if(!b)throw Error("Choose an available restaurant branch.");
 if(!pin)throw Error("Pin a delivery location on the sample map first.");
 const lat=precise(pin.lat,"latitude",-90,90),lng=precise(pin.lng,"longitude",-180,180);
 if(lat<BOUNDS.south||lat>BOUNDS.north||lng<BOUNDS.west||lng>BOUNDS.east)throw Error("Pin a location inside the illustrated Nairobi area.");
 const km=distance(b,{lat,lng});
 if(km>DELIVERY.maxKm)return {eligible:false,branch:b,distanceKm:+km.toFixed(1),fee:null,reason:"Outside this branch's sample 12 km delivery zone. Choose another branch or pin a closer point."};
 // Illustrative straight-line distance, NOT routing distance or a live delivery quote.
 return {eligible:true,branch:b,distanceKm:+km.toFixed(1),fee:Math.ceil((DELIVERY.base+km*DELIVERY.perKm)/10)*10,reason:null};
}
function nearest(pin){
 return BRANCHES.map(b=>({b,km:distance(b,pin)})).sort((a,b)=>a.km-b.km)[0].b;
}
function seed(){
 return {version:1,nextOrder:1043,availability:Object.fromEntries(MENU.map(x=>[x.id,true])),
 orders:[{id:"SL-1042",createdAt:"Sample · earlier today",branchId:"kilimani",items:[{id:"bbq",qty:1,price:1250},{id:"fries",qty:1,price:290}],subtotal:1540,deliveryFee:250,total:1790,distanceKm:2.9,status:"Preparing",payment:"Simulated M-Pesa",pin:{lat:-1.299,lng:36.781}}]};
}
function validate(d){
 return !!d&&d.version===1&&Array.isArray(d.orders)&&d.availability&&Number.isSafeInteger(d.nextOrder);
}
function subtotal(cart){
 return cart.reduce((s,x)=>{const p=item(x.id);if(!p)throw Error("Unknown menu item.");return s+p.price*amount(x.qty,"Quantity",1,20);},0);
}
function cartChange(cart,id,delta){
 if(!item(id))throw Error("Unknown menu item.");
 const next=copy(cart),i=next.findIndex(x=>x.id===id);
 if(i<0&&delta>0)next.push({id,qty:Math.min(delta,20)});
 else if(i>=0){const qty=next[i].qty+delta;if(qty>20)throw Error("Maximum 20 of one item.");if(qty<=0)next.splice(i,1);else next[i].qty=qty;}
 return next;
}
function checkout(d,params){
 if(!validate(d))throw Error("Reset the fictional demo data.");
 const cart=params.cart;
 if(!Array.isArray(cart)||cart.length===0)throw Error("Add something to your basket first.");
 if(cart.some(x=>!d.availability[x.id]))throw Error("An item in your basket is unavailable. Remove it to continue.");
 const ids=cart.map(x=>x.id);
 if(new Set(ids).size!==ids.length)throw Error("Duplicate basket item.");
 const phone=String(params.phone||"").replace(/[\s-]/g,"");
 if(!/^(?:07|01)\d{8}$/.test(phone))throw Error("Use a valid Kenyan mobile number (for example 0722000011).");
 const q=quote(params.branchId,params.pin);
 if(!q.eligible)throw Error(q.reason);
 const sub=subtotal(cart),id="SL-"+d.nextOrder;
 const record={id,createdAt:"Just now",branchId:params.branchId,items:cart.map(x=>({id:x.id,qty:x.qty,price:item(x.id).price})),subtotal:sub,deliveryFee:q.fee,total:sub+q.fee,distanceKm:q.distanceKm,status:"Received",payment:"Simulated M-Pesa",pin:{lat:+params.pin.lat,lng:+params.pin.lng}};
 // Store no customer name or number. This never invokes a real STK prompt.
 d.orders.unshift(record);d.nextOrder+=1;return record;
}
function advance(d,id){
 const o=d.orders.find(x=>x.id===id);if(!o)throw Error("Order not found.");
 const idx=STEPS.indexOf(o.status);if(idx<0||idx===STEPS.length-1)throw Error("This order is already complete.");
 o.status=STEPS[idx+1];return o;
}
function toggle(d,id){
 if(!item(id))throw Error("Unknown menu item.");
 d.availability[id]=!d.availability[id];return d.availability[id];
}
function overview(d){
 return {open:d.orders.filter(x=>x.status!=="Delivered").length,delivered:d.orders.filter(x=>x.status==="Delivered").length,revenue:d.orders.filter(x=>x.status==="Delivered").reduce((s,x)=>s+x.total,0)};
}
return {BRANCHES,MENU,STEPS,BOUNDS,DELIVERY,money,item,branch,mapPoint,coordsOnMap,quote,nearest,seed,validate,subtotal,cartChange,checkout,advance,toggle,overview};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=restaurantCore;
