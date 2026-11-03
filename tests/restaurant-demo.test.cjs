const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const base=path.join(__dirname,"..");
const dir=path.join(base,"public","demos","restaurant");
const C=require(path.join(dir,"core.js"));
const read=p=>fs.readFileSync(path.join(base,p),"utf8");

test("fictional menu, three branches and sample orders are seeded",()=>{
 const d=C.seed();
 assert.ok(C.validate(d));assert.equal(C.BRANCHES.length,3);
 assert.equal(C.MENU.length,7);assert.ok(d.orders.length);
 assert.ok(d.orders.every(o=>o.payment==="Simulated M-Pesa"));
 assert.ok(d.orders.every(o=>C.STEPS.includes(o.status)));
});
test("map pin translates within illustrated bounds and selects nearest branch",()=>{
 const point=C.mapPoint(0.5,0.5);
 assert.ok(point.lat<C.BOUNDS.north&&point.lat>C.BOUNDS.south);
 assert.ok(point.lng>C.BOUNDS.west&&point.lng<C.BOUNDS.east);
 const pos=C.coordsOnMap(point);
 assert.ok(Math.abs(pos.x-50)<0.01);
 assert.ok(Math.abs(pos.y-50)<0.01);
 assert.equal(C.nearest({lat:C.BRANCHES[0].lat,lng:C.BRANCHES[0].lng}).id,"westlands");
 assert.throws(()=>C.mapPoint(-0.1,0.5),/map position/i);
});
test("sample delivery fee is calculated by straight-line branch distance",()=>{
 const b=C.BRANCHES[0];
 const atBranch=C.quote("westlands",{lat:b.lat,lng:b.lng});
 assert.equal(atBranch.eligible,true);
 assert.equal(atBranch.distanceKm,0);
 assert.equal(atBranch.fee,C.DELIVERY.base);
 const slightlyAway=C.quote("westlands",{lat:b.lat+0.018,lng:b.lng});
 assert.ok(slightlyAway.fee>atBranch.fee);
 assert.equal(slightlyAway.fee%10,0);
 assert.equal(C.quote("south-c",C.mapPoint(0,0)).eligible,false);
 assert.throws(()=>C.quote("fake",{lat:b.lat,lng:b.lng}),/branch/);
 assert.throws(()=>C.quote("westlands",null),/Pin/);
 assert.throws(()=>C.quote("westlands",{lat:0,lng:0}),/illustrated/);
});
test("basket quantity rules, subtotal and invalid menu items",()=>{
 let cart=[];
 cart=C.cartChange(cart,"classic",1);
 cart=C.cartChange(cart,"fries",2);
 assert.equal(cart.length,2);assert.equal(C.subtotal(cart),950+290*2);
 cart=C.cartChange(cart,"fries",-1);assert.equal(C.subtotal(cart),1240);
 cart=C.cartChange(cart,"fries",-1);assert.equal(cart.length,1);
 assert.throws(()=>C.cartChange(cart,"classic",20),/Maximum/);
 assert.throws(()=>C.cartChange(cart,"missing",1),/Unknown/);
 assert.equal(cart[0].qty,1);
});
test("checkout validates payment phone, map zone and menu availability before mutation",()=>{
 const d=C.seed(),b=C.BRANCHES[1],pin={lat:b.lat,lng:b.lng};
 const cart=[{id:"bbq",qty:1},{id:"soda",qty:2}];
 const original=JSON.stringify(d);
 assert.throws(()=>C.checkout(d,{cart,branchId:b.id,pin,phone:"123"}),/mobile/);
 assert.throws(()=>C.checkout(d,{cart:[],branchId:b.id,pin,phone:"0722000011"}),/basket/);
 assert.throws(()=>C.checkout(d,{cart,branchId:b.id,pin:null,phone:"0722000011"}),/Pin/);
 assert.equal(JSON.stringify(d),original,"validation failure must not mutate the order list");
 C.toggle(d,"bbq");
 assert.throws(()=>C.checkout(d,{cart,branchId:b.id,pin,phone:"0722000011"}),/unavailable/);
 C.toggle(d,"bbq");
 const order=C.checkout(d,{cart,branchId:b.id,pin,phone:"0722000011"});
 assert.equal(order.status,"Received");
 assert.equal(order.subtotal,1250+2*180);
 assert.equal(order.total,order.subtotal+order.deliveryFee);
 assert.equal(d.orders[0].id,order.id);
 assert.equal(d.nextOrder,1044);
 assert.equal(order.payment,"Simulated M-Pesa");
 assert.ok(!JSON.stringify(d).includes("0722000011"),"demo must not store customer phone number");
 assert.equal(order.items[0].price,1250,"order keeps price snapshot");
});
test("operational status handoffs enforce the single forward lifecycle",()=>{
 const d=C.seed(),o=d.orders[0];
 assert.equal(o.status,"Preparing");
 for(const step of ["Ready for dispatch","Out for delivery","Delivered"]){
  C.advance(d,o.id);assert.equal(o.status,step);
 }
 assert.throws(()=>C.advance(d,o.id),/complete/);
 assert.throws(()=>C.advance(d,"missing"),/not found/);
 assert.equal(C.overview(d).delivered,1);
});
test("standalone assets, gallery and overview follow the existing demo pattern",()=>{
 const html=read("public/demos/restaurant/demo.html");
 const app=read("public/demos/restaurant/app.js");
 const core=read("public/demos/restaurant/core.js");
 const css=read("public/demos/restaurant/styles.css");
 const overview=read("app/demos/restaurant/page.tsx");
 const gallery=read("app/demos/page.tsx");
 assert.match(html,/noindex,nofollow/);
 for(const file of ["styles.css","core.js","app.js"])assert.ok(html.includes("/demos/restaurant/"+file));
 assert.match(overview,/alternates: \{ canonical: '\/demos\/restaurant' \}/);
 assert.match(gallery,/href="\/demos\/restaurant"/);
 assert.match(app,/localStorage/);
 assert.match(app,/data-action="pin"/);
 assert.match(app,/Simulate M-Pesa payment & place order/);
 assert.match(app,/Switch to Operations/);
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|navigator\.geolocation/);
 assert.doesNotMatch(core,/jajemelo/i);
 for(const [filename,source] of [["core.js",core],["app.js",app]]){
  assert.doesNotThrow(()=>new vm.Script(source,{filename}));
 }
 assert.ok(css.includes("@media(max-width:560px)"));
});
test("customer checkout, sample pin, operations handoff and availability share browser-local data",()=>{
 const events={},storageData={};
 const root={innerHTML:"",contains:()=>true,addEventListener:(type,fn)=>{events[type]=fn;}};
 const document={getElementById:id=>id==="app"?root:null};
 const localStorage={getItem:key=>storageData[key]??null,setItem:(key,value)=>{storageData[key]=value;}};
 const window={confirm:()=>true};
 class FakeFormData{constructor(form){this.form=form;}get(key){return this.form[key];}}
 new Function("document","localStorage","window","FormData",
   read("public/demos/restaurant/core.js")+"\n"+read("public/demos/restaurant/app.js")
 )(document,localStorage,window,FakeFormData);
 const click=(action,id,extra={})=>events.click({
  target:{closest:()=>({dataset:{action,id},getBoundingClientRect:()=>({left:0,top:0,width:300,height:200})})},
  ...extra
 });
 assert.match(root.innerHTML,/Classic Margherita/);
 click("add","bbq");
 click("tab","cart");
 assert.match(root.innerHTML,/BBQ Chicken Pizza/);
 click("pin",undefined,{clientX:150,clientY:100});
 assert.match(root.innerHTML,/Estimated sample delivery fee/);
 events.submit({preventDefault(){},target:{id:"checkout-form",phone:"0722000011"}});
 assert.match(root.innerHTML,/SL-1043/);
 assert.doesNotMatch(storageData.jtg_restaurant_demo_v1,/0722000011/);
 events.change({target:{id:"demo-role",value:"operations"}});
 assert.match(root.innerHTML,/Incoming orders/);
 click("advance","SL-1043");
 assert.equal(JSON.parse(storageData.jtg_restaurant_demo_v1).orders[0].status,"Preparing");
 click("tab","menu");
 click("toggle","bbq");
 assert.equal(JSON.parse(storageData.jtg_restaurant_demo_v1).availability.bbq,false);
 events.change({target:{id:"demo-role",value:"customer"}});
 assert.match(root.innerHTML,/Sold out/);
});