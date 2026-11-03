/* SliceLane: browser-only fictional restaurant demo. No payment, delivery, GPS or remote API. */
(function(){
"use strict";
const C=restaurantCore,KEY="jtg_restaurant_demo_v1",root=document.getElementById("app");
if(!root)return;
let data,role="customer",tab="menu",cart=[],branchId="westlands",pin=null,notice="",lastOrder=null;
try{data=JSON.parse(localStorage.getItem(KEY)||"null");if(!C.validate(data))data=C.seed();}
catch(_){data=C.seed();}
const e=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=C.money;
const branch=id=>C.branch(id)?.name||"Unknown";
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch(_){}};
const notify=s=>{notice=s;render();};
const count=()=>cart.reduce((n,x)=>n+x.qty,0);
const labels={Received:"Received",Preparing:"Preparing","Ready for dispatch":"Ready","Out for delivery":"On the way",Delivered:"Delivered"};
const pills=o=>'<span class="status status-'+e(o.status.toLowerCase().replaceAll(" ","-"))+'">'+e(labels[o.status]||o.status)+'</span>';
const line=(a,b)=>'<div class="cost-line"><span>'+e(a)+'</span><b>'+e(b)+'</b></div>';
function header(){
 const tabs=role==="customer"?[["menu","Menu","🍕"],["cart","Basket","🛒"],["orders","Orders","🧾"]]:[["orders","Orders","📋"],["menu","Menu","🍽️"]];
 return '<div class="status-bar"><span>9:41</span><span>●●● ◖ ▰</span></div>'+
 '<header class="app-header"><div class="app-brand"><span class="app-logo">S</span><div><b>SliceLane</b><small>FICTIONAL RESTAURANT</small></div></div><label class="switch-label">View <select id="demo-role" aria-label="Switch demo role"><option value="customer" '+(role==="customer"?"selected":"")+'>Customer</option><option value="operations" '+(role==="operations"?"selected":"")+'>Operations</option></select></label></header>'+
 '<nav class="tabs" aria-label="App sections">'+tabs.map(([id,label,emoji])=>'<button type="button" data-action="tab" data-id="'+id+'" class="'+(tab===id?"active":"")+'" aria-current="'+(tab===id?"page":"false")+'"><span aria-hidden="true">'+emoji+'</span><small>'+label+(id==="cart"&&count()?" ("+count()+")":"")+'</small></button>').join("")+'</nav>';
}
function heading(eyebrow,title,desc){
 return '<div class="heading"><small>'+e(eyebrow)+'</small><h1>'+e(title)+'</h1><p>'+e(desc)+'</p></div>';
}
function branches(){
 return '<label class="field">Order from <select id="branch-picker" aria-label="Choose restaurant branch">'+C.BRANCHES.map(b=>'<option value="'+b.id+'" '+(branchId===b.id?"selected":"")+'>'+e(b.name)+'</option>').join("")+'</select></label>';
}
function menuView(){
 return heading("FRESH FROM THE OVEN","What sounds good?","Pick a branch, browse the sample menu, and add your favourites.")+
 branches()+
 '<div class="delivery-hint">📍 Pin a delivery point at checkout to choose the nearest branch and estimate a fee.</div>'+
 '<div class="section-head"><h2>Made for your cravings</h2><span>'+C.MENU.filter(x=>data.availability[x.id]).length+' available</span></div>'+
 C.MENU.map(p=>'<article class="food-card"><div class="food-art" aria-hidden="true">'+p.icon+'</div><div class="food-info"><div class="food-meta">'+e(p.category)+'</div><h3>'+e(p.name)+'</h3><p>'+e(p.desc)+'</p><div class="food-foot"><b>'+money(p.price)+'</b><button type="button" data-action="add" data-id="'+p.id+'" class="button primary small" '+(!data.availability[p.id]?"disabled":"")+'>'+(data.availability[p.id]?"＋ Add":"Sold out")+'</button></div></div></article>').join("")+
 '<button class="button primary full" data-action="tab" data-id="cart">View basket · '+count()+' items</button>';
}
function mapMarkup(){
 const pts=C.BRANCHES.map(b=>{const pt=C.coordsOnMap(b);return '<span class="branch-marker" title="'+e(b.name)+'" style="left:'+pt.x.toFixed(2)+'%;top:'+pt.y.toFixed(2)+'%">●</span>';}).join("");
 const p=pin?C.coordsOnMap(pin):null;
 return '<div class="map-caption"><b>Choose a delivery point</b><span>Tap anywhere on the illustration</span></div>'+
 '<button type="button" id="demo-map" data-action="pin" class="demo-map" aria-label="Pin an example delivery location on the illustrated map of Nairobi">'+
 '<span class="map-road road-one"></span><span class="map-road road-two"></span><span class="map-road road-three"></span>'+
 '<span class="map-green green-one"></span><span class="map-green green-two"></span>'+
 '<span class="map-label label-west">WESTLANDS</span><span class="map-label label-cbd">CBD</span><span class="map-label label-south">SOUTH C</span><span class="map-label label-kili">KILIMANI</span>'+
 pts+(p?'<span class="customer-marker" style="left:'+p.x.toFixed(2)+'%;top:'+p.y.toFixed(2)+'%" aria-hidden="true">📍</span>':'')+
 '<span class="map-watermark">ILLUSTRATIVE MAP · NOT LIVE GPS</span></button>';
}
function cartView(){
 const list=cart.map(x=>{const p=C.item(x.id);return '<div class="basket-item"><div><b>'+e(p.name)+'</b><small>'+money(p.price)+' each</small></div><div class="qty"><button type="button" data-action="decrement" data-id="'+x.id+'" aria-label="Remove one '+e(p.name)+'">−</button><span>'+x.qty+'</span><button type="button" data-action="increment" data-id="'+x.id+'" aria-label="Add one '+e(p.name)+'">+</button></div></div>';}).join("");
 let q=null;if(pin){try{q=C.quote(branchId,pin);}catch(err){q={eligible:false,reason:err.message};}}
 let sub=0;try{sub=C.subtotal(cart);}catch(_){}
 return heading("YOUR ORDER","Basket & delivery","Set your delivery pin to see a sample automatically calculated delivery fee.")+
 (cart.length?'<div class="panel"><div class="panel-head"><h2>Your items</h2><button class="text-button" data-action="clear">Clear</button></div>'+list+'</div>':'<div class="empty"><span>🛒</span><b>Your basket is empty</b><p>Add your favourite pizza or a meal to get started.</p><button class="button primary" data-action="tab" data-id="menu">Browse menu</button></div>')+
 '<div class="panel"><h2>Delivery location</h2><p class="muted">A demo location pin, not an address search or real GPS reading.</p>'+mapMarkup()+'<div class="map-actions"><button class="button secondary" data-action="nearest" '+(!pin?"disabled":"")+'>Use nearest branch</button></div>'+branches()+
 (pin?'<div class="quote '+(q.eligible?"valid":"invalid")+'"><b>'+(q.eligible?"Estimated sample delivery fee: "+money(q.fee):"Outside delivery range")+'</b><small>'+(q.eligible?"Straight-line estimate: "+q.distanceKm.toFixed(1)+" km from "+e(branch(branchId))+". Real road distance and pricing may differ.":e(q.reason))+'</small></div>':'<div class="quote">Tap the map to calculate a sample delivery fee.</div>')+'</div>'+
 (cart.length?'<div class="panel"><h2>Order summary</h2>'+line("Food subtotal",money(sub))+line("Delivery fee",q?.eligible?money(q.fee):"Pin required")+'<div class="total-line"><span>Total</span><strong>'+(q?.eligible?money(sub+q.fee):"—")+'</strong></div>'+
 '<form id="checkout-form"><label class="field">M-Pesa phone (sample only)<input name="phone" inputmode="tel" autocomplete="off" value="0722000011" required pattern="(07|01)[0-9]{8}" maxlength="10" aria-describedby="payment-note"/></label>'+
 '<p id="payment-note" class="safety">Demo checkout only. No STK push, SMS, payment or order is sent to a real restaurant.</p>'+
 '<button type="submit" class="button primary full" '+(!q?.eligible?"disabled":"")+'>Simulate M-Pesa payment & place order</button></form></div>':"");
}
function orderCard(o,operating){
 const items=o.items.map(x=>{const p=C.item(x.id);return x.qty+" × "+(p?p.name:x.id);}).join(" · ");
 const next=C.STEPS[C.STEPS.indexOf(o.status)+1];
 return '<article class="order-card"><div class="order-top"><div><small>'+e(o.id)+' · '+e(o.createdAt)+'</small><h3>'+e(branch(o.branchId))+'</h3></div>'+pills(o)+'</div><p>'+e(items)+'</p>'+
 '<div class="order-facts">'+line("Food",money(o.subtotal))+line("Delivery",money(o.deliveryFee))+line("Paid (simulated)",money(o.total))+'</div>'+
 '<div class="timeline">'+C.STEPS.map((s,i)=>'<span class="'+(i<=C.STEPS.indexOf(o.status)?"done":"")+'" title="'+e(s)+'"></span>').join("")+'</div><p class="muted">Status: '+e(o.status)+' · '+e(o.payment)+'</p>'+
 (operating&&next?'<button class="button primary full" data-action="advance" data-id="'+e(o.id)+'">Mark as '+e(next)+'</button>':"")+'</article>';
}
function ordersView(){
 const ops=role==="operations";
 const orders=ops?data.orders:data.orders.filter(o=>o.createdAt==="Just now");
 return heading(ops?"BRANCH WORKSPACE":"STAY IN THE LOOP",ops?"Incoming orders":"Your orders",ops?"Review fictional orders and update their progress. Every role sees the same browser-local records.":"Follow each simulated order from acceptance to delivery.")+
 (lastOrder&&!ops?'<div class="success-banner">✓ Sample order '+e(lastOrder)+' placed. No real payment or delivery was requested.</div>':"")+
 (ops?'<div class="metrics"><div><span>Active orders</span><strong>'+C.overview(data).open+'</strong></div><div><span>Delivered</span><strong>'+C.overview(data).delivered+'</strong></div></div>':"")+
 (orders.length?orders.map(o=>orderCard(o,ops)).join(""):'<div class="empty"><span>🧾</span><b>No orders yet</b><p>Your sample order will appear here after checkout.</p><button class="button primary" data-action="tab" data-id="menu">Explore menu</button></div>');
}
function operationsMenu(){
 return heading("BRANCH OPERATIONS","Menu availability","Toggle dishes on or off. Customer ordering reflects these changes immediately.")+
 '<div class="panel">'+C.MENU.map(p=>'<div class="availability"><div><b>'+e(p.name)+'</b><small>'+e(p.category)+' · '+money(p.price)+'</small></div><button type="button" class="button '+(data.availability[p.id]?"secondary":"warning")+'" data-action="toggle" data-id="'+e(p.id)+'">'+(data.availability[p.id]?"Available":"Sold out")+'</button></div>').join("")+'</div>';
}
function render(){
 if(role==="customer"&&!["menu","cart","orders"].includes(tab))tab="menu";
 if(role==="operations"&&!["orders","menu"].includes(tab))tab="orders";
 const body=role==="customer"?(tab==="menu"?menuView():tab==="cart"?cartView():ordersView()):(tab==="orders"?ordersView():operationsMenu());
 root.innerHTML='<div class="scene"><aside class="scene-info"><span>JOELTECHGEEK · INTERACTIVE CONCEPT</span><h2>From cravings to doorstep.</h2><p>Explore how a fictional restaurant could manage direct customer ordering, branch routing and delivery updates.</p><a href="/demos/restaurant">← Back to restaurant demo overview</a></aside>'+
 '<div class="device">'+header()+'<main class="screen" id="restaurant-screen">'+(notice?'<div role="status" class="flash">'+e(notice)+'</div>':"")+body+'</main><div class="home-line"><span></span></div></div>'+
 '<aside class="side-note"><b>Explore the workflow</b><p>1. Add pizza in Customer view.</p><p>2. Pin a location and see a calculated fee.</p><p>3. Simulate M-Pesa checkout.</p><p>4. Switch to Operations to update the order.</p><p>All orders, fees and locations are illustrative.</p><button type="button" data-action="reset" class="button secondary">↻ Reset sample data</button><a href="/demos">All demos ↗</a></aside></div>';
}
root.addEventListener("change",event=>{
 if(event.target?.id==="demo-role"){role=event.target.value==="operations"?"operations":"customer";tab=role==="customer"?"menu":"orders";notice="";render();}
 if(event.target?.id==="branch-picker"){branchId=event.target.value;notice="";render();}
});
root.addEventListener("click",event=>{
 const el=event.target.closest?.("[data-action]");if(!el||!root.contains(el))return;
 const action=el.dataset.action,id=el.dataset.id;
 try{
 if(action==="tab"){tab=id;notice="";}
 else if(action==="add"){if(!data.availability[id])throw Error("This item is sold out.");cart=C.cartChange(cart,id,1);notice=C.item(id).name+" added to your basket.";}
 else if(action==="increment"){if(!data.availability[id])throw Error("This item is currently unavailable.");cart=C.cartChange(cart,id,1);notice="";}
 else if(action==="decrement"){cart=C.cartChange(cart,id,-1);notice="";}
 else if(action==="clear"){cart=[];notice="Basket cleared.";}
 else if(action==="pin"){
 const rect=el.getBoundingClientRect();
 let x=Number.isFinite(event.clientX)&&rect.width?(event.clientX-rect.left)/rect.width:0.5;
 let y=Number.isFinite(event.clientY)&&rect.height?(event.clientY-rect.top)/rect.height:0.5;
 pin=C.mapPoint(Math.max(0,Math.min(1,x)),Math.max(0,Math.min(1,y)));
 branchId=C.nearest(pin).id;notice="Nearest example branch selected. Delivery fee recalculated.";
 }
 else if(action==="nearest"){if(!pin)throw Error("Pin a location first.");branchId=C.nearest(pin).id;notice="Nearest example branch selected.";}
 else if(action==="advance"){if(role!=="operations")throw Error("Switch to Operations first.");const o=C.advance(data,id);persist();notice=o.id+" updated to "+o.status+".";}
 else if(action==="toggle"){if(role!=="operations")throw Error("Switch to Operations first.");C.toggle(data,id);persist();notice="Menu availability updated.";}
 else if(action==="reset"){if(window.confirm("Reset all fictional restaurant orders and menu settings?")){data=C.seed();persist();cart=[];pin=null;branchId="westlands";lastOrder=null;notice="Sample data restored.";}}
 else return;
 render();
 }catch(err){notify(err.message||"Action could not be completed.");}
});
root.addEventListener("submit",event=>{
 if(event.target?.id!=="checkout-form")return;
 event.preventDefault();
 try{
 if(role!=="customer")throw Error("Switch to Customer to place an order.");
 const phone=new FormData(event.target).get("phone");
 const o=C.checkout(data,{cart,branchId,pin,phone});
 persist();cart=[];lastOrder=o.id;tab="orders";notice="Demo checkout complete. No real payment occurred.";render();
 }catch(err){notify(err.message||"Could not place sample order.");}
});
render();
})();