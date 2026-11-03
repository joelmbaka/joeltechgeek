(function retailDemo(core){
  "use strict";
  const KEY="joeltechgeek-retail-demo-v1";
  const root=document.getElementById("app");
  const nav=[
    ["dashboard","Overview","▦"],
    ["pos","Point of sale","▣"],
    ["inventory","Inventory","◫"],
    ["purchasing","Purchasing","⇩"],
    ["sales","Sales & receipts","▤"],
    ["reports","Reports","▥"],
    ["settings","Demo settings","⚙"]
  ];
  const roles={
    owner:{label:"Alex · Owner",items:["dashboard","pos","inventory","purchasing","sales","reports","settings"],start:"dashboard"},
    cashier:{label:"Miriam · Cashier",items:["pos","sales","dashboard","settings"],start:"pos"},
    stockkeeper:{label:"Daniel · Stockkeeper",items:["inventory","purchasing","dashboard","settings"],start:"inventory"}
  };
  const escapeHtml=(s)=>String(s===undefined||s===null?"":s).replace(/[&<>"']/g,(ch)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const fmt=(n)=>"KES "+new Intl.NumberFormat("en-KE",{maximumFractionDigits:2}).format(Number(n)||0);
  const dateFmt=(d)=>{const v=new Date(d);return Number.isNaN(v.getTime())?"—":new Intl.DateTimeFormat("en-KE",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(v)};
  function load(){
    try{
      const d=JSON.parse(localStorage.getItem(KEY)||"null");
      if(d&&d.version===1&&["products","suppliers","sales","purchaseOrders","movements"].every(k=>Array.isArray(d[k])))return core.normalizePurchases(d);
    }catch(error){/* private browsing or old data */ }
    return core.seed();
  }
  let data=load();
  const ui={view:"dashboard",role:"owner",cart:[],posCategory:"All",posQuery:"",invQuery:"",invFilter:"All",modal:null,poLines:[],receiveQuantities:{},poSupplier:data.suppliers[0]?.id||"",paymentMethod:"Cash",tender:"",toast:""};
  const byId=(id)=>data.products.find(p=>p.id===id);
  const supplier=(id)=>data.suppliers.find(s=>s.id===id)?.name||"Unknown supplier";
  const low=(p)=>p.stock<=p.reorder;
  const currency=(n)=>fmt(n);
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(error){ui.toast="Browser storage unavailable. Changes are temporary.";}}
  function toast(s){ui.toast=String(s);render();}
  function cartTotal(){return ui.cart.reduce((sum,l)=>sum+(byId(l.id)?.price||0)*l.qty,0)}
  function pill(status){return '<span class="pill '+(status==="Received"?"good":status==="Partially received"||status==="Draft"?"warn":"")+'">'+escapeHtml(status)+'</span>'}
  function receivedUnits(po){return po.lines.reduce((sum,line)=>sum+line.receivedQty,0)}
  function orderedUnits(po){return po.lines.reduce((sum,line)=>sum+line.qty,0)}
  function status(p){return p.stock===0?'<span class="pill bad">Out of stock</span>':low(p)?'<span class="pill warn">Low stock</span>':'<span class="pill good">In stock</span>'}
  function stat(label,value,detail,symbol){return '<div class="stat"><div class="stat-top"><span>'+escapeHtml(label)+'</span><span class="stat-icon">'+symbol+'</span></div><div class="stat-value">'+value+'</div><div class="stat-detail">'+detail+'</div></div>'}
  function button(label,act,additional=""){return '<button type="button" class="btn" data-act="'+act+'" '+additional+'>'+label+'</button>'}
  function tableHead(labels){return '<thead><tr>'+labels.map(x=>'<th>'+escapeHtml(x)+'</th>').join("")+'</tr></thead>'}
  function empty(t){return '<div class="empty">'+escapeHtml(t)+'</div>'}
  function dashboard(){
    const m=core.metrics(data), restock=data.products.filter(low).sort((a,b)=>a.stock-b.stock);
    return '<div class="page-header"><div><div class="eyebrow">STORE OPERATIONS / INTERACTIVE CONCEPT</div><h1>Store overview</h1><p>Understand sales, inventory, and pending purchasing at a glance.</p></div>'+
      (roles[ui.role].items.includes("pos")?'<button class="btn primary" data-nav="pos">Open point of sale →</button>':'')+'</div>'+
      '<div class="stats">'+stat("Demo sales",currency(m.revenue),"Across "+m.transactions+" sample transactions","↗")+
      stat("Units available",m.units.toLocaleString(),"Across "+data.products.length+" products","▣")+
      stat("Low-stock products",m.low,"At or below reorder levels","!")+
      stat("Stock at cost",currency(m.stockValue),"Illustrative carrying value","◫")+'</div>'+
      '<div class="two-col"><section class="card"><div class="card-title"><div><h2>Recent transactions</h2><p>Sales update automatically after checkout.</p></div>'+(roles[ui.role].items.includes("sales")?'<button class="text-link" data-nav="sales">All sales →</button>':'')+'</div>'+
      (data.sales.length?'<div class="table-scroll"><table>'+tableHead(["Receipt","Payment","Amount","Time"])+
      '<tbody>'+data.sales.slice(0,5).map(s=>'<tr class="clickable" data-act="receipt" data-id="'+escapeHtml(s.id)+'"><td><b>'+escapeHtml(s.id)+'</b></td><td>'+escapeHtml(s.method)+(s.method==="M-Pesa"?' · simulated':'')+'</td><td><b>'+currency(s.total)+'</b></td><td>'+dateFmt(s.createdAt)+'</td></tr>').join("")+'</tbody></table></div>':empty("No sales yet. Open the POS to record a sample transaction."))+'</section>'+
      '<section class="card"><div class="card-title"><div><h2>Reorder watchlist</h2><p>Receive a purchase order to replenish stock.</p></div>'+(roles[ui.role].items.includes("purchasing")?'<button class="text-link" data-nav="purchasing">Purchase stock →</button>':'')+'</div>'+
      (restock.length?'<div class="watchlist">'+restock.slice(0,6).map(p=>'<div class="watch-row"><div><b>'+escapeHtml(p.name)+'</b><span class="muted small">'+escapeHtml(p.sku)+'</span></div><div class="right"><b>'+p.stock+' left</b><span class="muted small">Reorder at '+p.reorder+'</span></div></div>').join("")+'</div>':empty("All products are above their reorder levels."))+'</section></div>'+
      '<section class="card highlights"><div class="card-title"><div><h2>What to try next</h2><p>One connected workflow that changes the numbers above.</p></div></div>'+
      '<div class="steps"><div><span class="step-num">01</span><b>Create purchase order</b><p>Order 20 units of cooking oil from a supplier.</p></div><div><span class="step-num">02</span><b>Receive delivery</b><p>Watch inventory increase immediately.</p></div><div><span class="step-num">03</span><b>Process a sale</b><p>Sell items, simulate payment, and print a receipt.</p></div><div><span class="step-num">04</span><b>View reports</b><p>Inspect updated revenue, margin, and stock.</p></div></div></section>';
  }
  function pos(){
    const cats=["All",...new Set(data.products.map(p=>p.category))];
    const list=data.products.filter(p=>(ui.posCategory==="All"||p.category===ui.posCategory)&&(p.name+" "+p.sku).toLowerCase().includes(ui.posQuery.toLowerCase()));
    const total=cartTotal(),paid=Number(ui.tender)||0;
    return '<div class="page-header"><div><div class="eyebrow">CASHIER / SAMPLE TRANSACTIONS</div><h1>Point of sale</h1><p>Add products, take a simulated payment, and generate a sample receipt.</p></div>'+
      '<span class="page-chip">No real money moves</span></div>'+
      '<div class="pos-layout"><section class="pos-catalog"><div class="filters"><label class="sr-only" for="pos-search">Search products</label><input id="pos-search" class="field" data-search="pos" placeholder="Search by name or SKU" value="'+escapeHtml(ui.posQuery)+'"/>'+
      '<div class="tabs">'+cats.map(cat=>'<button class="tab '+(ui.posCategory===cat?"active":"")+'" data-cat="'+escapeHtml(cat)+'">'+escapeHtml(cat)+'</button>').join("")+'</div></div>'+
      (list.length?'<div class="product-grid">'+list.map(p=>'<article class="product-card"><div class="product-icon">'+escapeHtml(p.name.slice(0,2).toUpperCase())+'</div><div class="product-kind">'+escapeHtml(p.category)+' · '+escapeHtml(p.sku)+'</div><h3>'+escapeHtml(p.name)+'</h3><div class="product-price">'+currency(p.price)+'</div><div class="product-bottom"><span class="'+(low(p)?"stock-low":"muted")+'">'+p.stock+' in stock</span><button data-act="cart-add" data-id="'+escapeHtml(p.id)+'" class="add-btn" '+(p.stock===0?"disabled":"")+' aria-label="Add '+escapeHtml(p.name)+' to cart">+ Add</button></div></article>').join("")+'</div>':empty("No products match this search."))+'</section>'+
      '<aside class="card cart"><div class="card-title"><div><h2>Current sale</h2><p>'+ui.cart.reduce((n,l)=>n+l.qty,0)+' units in the cart</p></div>'+button("Clear","cart-clear")+'</div>'+
      '<div class="cart-list">'+(ui.cart.length?ui.cart.map(l=>{const p=byId(l.id);if(!p)return '';return '<div class="cart-row"><div class="cart-name"><b>'+escapeHtml(p.name)+'</b><span class="muted">'+currency(p.price)+' each</span></div><div class="qty-controls"><button data-act="cart-less" data-id="'+escapeHtml(p.id)+'" aria-label="Decrease '+escapeHtml(p.name)+'">−</button><strong>'+l.qty+'</strong><button data-act="cart-add" data-id="'+escapeHtml(p.id)+'" aria-label="Increase '+escapeHtml(p.name)+'">+</button></div><b>'+currency(l.qty*p.price)+'</b></div>'}).join(""):empty("Your cart is empty. Choose a product to start."))+'</div>'+
      '<div class="cart-pay"><div class="total-line"><span>Total due</span><strong>'+currency(total)+'</strong></div>'+
      '<label class="field-label" for="pay-method">Payment method</label><select class="field" id="pay-method"><option value="Cash" '+(ui.paymentMethod==="Cash"?"selected":"")+'>Cash (simulated)</option><option value="M-Pesa" '+(ui.paymentMethod==="M-Pesa"?"selected":"")+'>M-Pesa (simulated)</option></select>'+
      (ui.paymentMethod==="Cash"?'<label class="field-label" for="tender">Cash received (KES)</label><input class="field" id="tender" type="number" min="0" step="0.01" placeholder="Enter cash tendered" value="'+escapeHtml(ui.tender)+'"/><div class="change-line"><span>Estimated change</span><b>'+currency(Math.max(0,paid-total))+'</b></div>':
        '<div class="notice muted">This is a simulated M-Pesa approval. No STK push, transaction, or message will be sent.</div>')+
      '<button class="btn primary full" data-act="checkout" '+(ui.cart.length===0?"disabled":"")+'>Complete simulated sale →</button>'+
      '<p class="small muted center">Checkout reduces stock, records a sample transaction, and creates a printable receipt.</p></div></aside></div>';
  }
  function inventory(){
    const list=data.products.filter(p=>(ui.invFilter==="All"||ui.invFilter==="Low"&&low(p)||ui.invFilter==="Healthy"&&!low(p))&&(p.name+" "+p.sku+" "+p.category).toLowerCase().includes(ui.invQuery.toLowerCase()));
    return '<div class="page-header"><div><div class="eyebrow">STOCK CONTROL / SAMPLE INVENTORY</div><h1>Inventory</h1><p>Track product availability, reorder levels, and stock movements.</p></div><button class="btn primary" data-act="new-product">+ Add product</button></div>'+
      '<div class="card"><div class="table-filters"><label class="sr-only" for="inv-search">Search inventory</label><input id="inv-search" data-search="inventory" class="field" placeholder="Search SKU, product or category" value="'+escapeHtml(ui.invQuery)+'"/><div class="tabs">'+["All","Low","Healthy"].map(t=>'<button class="tab '+(ui.invFilter===t?"active":"")+'" data-filter="'+t+'">'+(t==="Low"?"Low / out":t)+'</button>').join("")+'</div></div>'+
      (list.length?'<div class="table-scroll"><table>'+tableHead(["Product / SKU","Category","On hand","Reorder","Cost","Price","Status","Action"])+
      '<tbody>'+list.map(p=>'<tr><td><b>'+escapeHtml(p.name)+'</b><span class="subtext">'+escapeHtml(p.sku)+'</span></td><td>'+escapeHtml(p.category)+'</td><td class="number"><b>'+p.stock+'</b></td><td class="number">'+p.reorder+'</td><td>'+currency(p.cost)+'</td><td>'+currency(p.price)+'</td><td>'+status(p)+'</td><td><button class="text-link" data-act="adjust" data-id="'+escapeHtml(p.id)+'">Adjust</button></td></tr>').join("")+'</tbody></table></div>':empty("No products match this filter."))+'</div>'+
      '<section class="card section"><div class="card-title"><div><h2>Recent stock movements</h2><p>Purchases, sales, and explained manual stock adjustments.</p></div></div>'+
      (data.movements.length?'<div class="table-scroll"><table>'+tableHead(["Product","Movement","Reason","When"])+
      '<tbody>'+data.movements.slice(0,12).map(m=>{const p=byId(m.productId);return '<tr><td>'+escapeHtml(p?.name||"Unknown product")+'</td><td><b class="'+(m.delta>0?"positive":"negative")+'">'+(m.delta>0?"+":"")+m.delta+'</b></td><td>'+escapeHtml(m.reason)+'</td><td>'+dateFmt(m.createdAt)+'</td></tr>'}).join("")+'</tbody></table></div>':empty("Stock movements will appear here."))+'</section>';
  }
  function purchasing(){
    const purchases=[...data.purchaseOrders];
    return '<div class="page-header"><div><div class="eyebrow">PROCUREMENT / STOCK RECEIVING</div><h1>Purchasing</h1><p>Create a draft order, then confirm receipt to update product quantities and carrying costs.</p></div><button class="btn primary" data-act="new-po">+ Create purchase order</button></div>'+
      '<div class="stats mini">'+stat("Open purchase orders",data.purchaseOrders.filter(x=>x.status!=="Received").length,"Draft and partially received","⇩")+
      stat("Received orders",data.purchaseOrders.filter(x=>x.status==="Received").length,"Recorded in this browser","✓")+
      stat("Suppliers",data.suppliers.length,"Fictional trade partners","◫")+'</div>'+
      '<section class="card"><div class="card-title"><div><h2>Purchase orders</h2><p>Order totals use entered purchase costs, not retail prices.</p></div></div>'+
      (purchases.length?'<div class="table-scroll"><table>'+tableHead(["Order","Supplier","Received / ordered","Cost total","Status","Created","Action"])+
      '<tbody>'+purchases.map(po=>'<tr><td><button class="text-link" data-act="view-po" data-id="'+escapeHtml(po.id)+'">'+escapeHtml(po.id)+'</button></td><td>'+escapeHtml(supplier(po.supplierId))+'</td><td>'+receivedUnits(po)+' / '+orderedUnits(po)+' units</td><td><b>'+currency(po.lines.reduce((n,l)=>n+l.qty*l.cost,0))+'</b></td><td>'+pill(po.status)+'</td><td>'+dateFmt(po.createdAt)+'</td><td>'+(po.status!=="Received"?'<button class="btn small-btn primary" data-act="receive" data-id="'+escapeHtml(po.id)+'">Receive stock</button>':'<button class="text-link" data-act="view-po" data-id="'+escapeHtml(po.id)+'">Details</button>')+'</td></tr>').join("")+'</tbody></table></div>':empty("No purchase orders yet."))+'</section>'+
      '<div class="notice section"><b>How stock receiving works:</b> A draft order does not change stock. Enter the <b>actual quantity received</b> for each product. Partial deliveries stay open, and you can never receive more than was ordered. Only confirmed units increase inventory.</div>';
  }
  function sales(){
    return '<div class="page-header"><div><div class="eyebrow">TRANSACTION HISTORY / DEMO DATA</div><h1>Sales & receipts</h1><p>Every sample checkout becomes a transaction with a printable receipt.</p></div><button class="btn primary" data-nav="pos">+ New sale</button></div>'+
      '<section class="card"><div class="card-title"><div><h2>Completed sales</h2><p>Cash and M-Pesa entries here are simulated; none are real payments.</p></div></div>'+
      (data.sales.length?'<div class="table-scroll"><table>'+tableHead(["Reference","Time","Cashier","Items","Payment method","Total","Receipt"])+
      '<tbody>'+data.sales.map(s=>'<tr><td><b>'+escapeHtml(s.id)+'</b></td><td>'+dateFmt(s.createdAt)+'</td><td>'+escapeHtml(s.cashier)+'</td><td>'+s.lines.reduce((n,l)=>n+l.qty,0)+' units</td><td>'+escapeHtml(s.method)+(s.method==="M-Pesa"?' <span class="pill warn">Simulated</span>':'')+'</td><td><b>'+currency(s.total)+'</b></td><td><button class="text-link" data-act="receipt" data-id="'+escapeHtml(s.id)+'">View receipt →</button></td></tr>').join("")+'</tbody></table></div>':empty("No sales recorded yet."))+'</section>';
  }
  function reports(){
    const m=core.metrics(data),ranked=core.reportProducts(data);
    const max=Math.max(1,...ranked.map(x=>x.revenue));
    const cash=data.sales.filter(x=>x.method==="Cash").reduce((n,x)=>n+x.total,0);
    const mpesa=data.sales.filter(x=>x.method==="M-Pesa").reduce((n,x)=>n+x.total,0);
    return '<div class="page-header"><div><div class="eyebrow">STORE ANALYTICS / SAMPLE ESTIMATES</div><h1>Reports</h1><p>See how simulated purchases and sales affect your store operations.</p></div><button class="btn primary" data-nav="pos">Record another sale →</button></div>'+
      '<div class="stats">'+stat("Total demo revenue",currency(m.revenue),"Includes seeded sample sales","↗")+
      stat("Estimated gross profit",currency(m.margin),"Before expenses and tax","∑")+
      stat("Sales transactions",m.transactions,"Completed demo checkouts","▤")+
      stat("Stock at cost",currency(m.stockValue),"Quantity × weighted-average unit cost","◫")+'</div>'+
      '<div class="two-col"><section class="card"><div class="card-title"><div><h2>Top-selling products</h2><p>Ranked by revenue across recorded sample transactions.</p></div></div>'+
      (ranked.length?'<div class="bar-report">'+ranked.slice(0,7).map(p=>'<div class="bar-row"><div class="bar-heading"><b>'+escapeHtml(p.name)+'</b><span>'+currency(p.revenue)+' · '+p.qty+' sold</span></div><div class="bar-bg"><div class="bar-fill" style="width:'+Math.max(2,Math.round(p.revenue/max*100))+'%"></div></div></div>').join("")+'</div>':empty("No sales to report yet."))+'</section>'+
      '<section class="card"><div class="card-title"><div><h2>Payment breakdown</h2><p>All payment amounts are fictional.</p></div></div>'+
      '<div class="payment-report"><div class="pay-row"><span>Cash</span><b>'+currency(cash)+'</b></div><div class="bar-bg"><div class="bar-fill" style="width:'+(m.revenue?Math.round(cash/m.revenue*100):0)+'%"></div></div><div class="pay-row"><span>M-Pesa (simulated)</span><b>'+currency(mpesa)+'</b></div><div class="bar-bg"><div class="bar-fill gold" style="width:'+(m.revenue?Math.round(mpesa/m.revenue*100):0)+'%"></div></div>'+
      '<div class="report-note">The estimated gross profit uses selling price less the stored unit cost at checkout. It is not net income, a tax report, or audited financial information.</div></div></section></div>';
  }
  function settings(){
    return '<div class="page-header"><div><div class="eyebrow">PRESENTATION CONTROLS</div><h1>Demo settings</h1><p>Manage your local example and switch between simulated store team members.</p></div></div>'+
      '<div class="two-col"><section class="card padded"><h2>Simulated roles</h2><p class="muted small">These are only different demo views, not real authentication or access controls.</p>'+
      Object.entries(roles).map(([id,r])=>'<button class="role-option '+(ui.role===id?'chosen':'')+'" data-act="switch-role" data-role="'+id+'"><b>'+escapeHtml(r.label)+'</b><span>'+(ui.role===id?'Current role →':'Switch to view →')+'</span></button>').join("")+'</section>'+
      '<section class="card padded"><h2>Browser-local demo data</h2><p class="muted small">Your changes are saved to localStorage in this browser only. They are not synchronized or sent to a server.</p>'+
      '<div class="setting-row"><span>Products</span><b>'+data.products.length+'</b></div><div class="setting-row"><span>Purchase orders</span><b>'+data.purchaseOrders.length+'</b></div><div class="setting-row"><span>Sales</span><b>'+data.sales.length+'</b></div><div class="setting-row"><span>Stock movements</span><b>'+data.movements.length+'</b></div>'+
      '<button class="btn danger full" data-act="reset">Reset all sample data</button><p class="small muted">Reset removes changes in this browser and restores the original fictional store.</p></section></div>'+
      '<section class="notice section"><b>Independent software concept.</b> The fictional GreenBasket store, people, products, suppliers, receipts and transactions are for demonstration only. No real stock, cash, M-Pesa payments, messages, or customer accounts are connected.</section>';
  }
  function receiptHtml(s){
    return '<div class="receipt-content"><div class="receipt-brand">GREENBASKET</div><div class="receipt-sub">GENERAL STORE · SAMPLE RECEIPT</div>'+
      '<div class="receipt-warning">DEMO ONLY — NOT PROOF OF PAYMENT</div>'+
      '<div class="receipt-info"><div>Receipt: '+escapeHtml(s.id)+'</div><div>Date: '+dateFmt(s.createdAt)+'</div><div>Cashier: '+escapeHtml(s.cashier)+'</div><div>Payment: '+escapeHtml(s.method)+(s.method==="M-Pesa"?" (simulated)":"")+'</div><div>Reference: '+escapeHtml(s.reference)+'</div></div>'+
      '<div class="receipt-lines">'+s.lines.map(l=>'<div class="receipt-item"><div>'+escapeHtml(l.name)+' <span>× '+l.qty+'</span></div><b>'+currency(l.price*l.qty)+'</b></div>').join("")+'</div>'+
      '<div class="receipt-total"><span>TOTAL</span><b>'+currency(s.total)+'</b></div>'+
      (s.method==="Cash"?'<div class="receipt-item"><span>Tendered</span><span>'+currency(s.tendered)+'</span></div><div class="receipt-item"><span>Change</span><span>'+currency(s.change)+'</span></div>':'')+
      '<div class="receipt-foot">All details are fictional. No actual purchase or payment occurred. A JoelTechGeek Systems interactive concept.</div></div>';
  }
  function modal(){
    if(!ui.modal)return "";
    const x=ui.modal;
    let content="";
    if(x.type==="receipt"){
      const sale=data.sales.find(s=>s.id===x.id);
      content=sale?'<h2>Sample receipt</h2><p class="muted small">Printable illustration — not proof of a real payment.</p>'+receiptHtml(sale)+
        '<div class="modal-actions"><button class="btn" data-act="close">Close</button><button class="btn primary" data-act="print">Print / Save PDF</button></div>':empty("Sale not found.");
    }else if(x.type==="product"){
      content='<h2>Add a product</h2><p class="muted small">Create a fictional product in the browser-only inventory.</p>'+
        '<form data-form="product"><div class="form-grid">'+
        '<label>Product name<input class="field" name="name" required maxlength="80" placeholder="e.g. Notebook A5"/></label>'+
        '<label>SKU<input class="field" name="sku" required maxlength="24" pattern="[A-Za-z0-9-]{3,24}" placeholder="e.g. GB-110"/></label>'+
        '<label>Category<input class="field" name="category" required placeholder="e.g. Stationery"/></label>'+
        '<label>Supplier<select name="supplierId" class="field">'+data.suppliers.map(s=>'<option value="'+escapeHtml(s.id)+'">'+escapeHtml(s.name)+'</option>').join("")+'</select></label>'+
        '<label>Selling price (KES)<input name="price" class="field" type="number" min="0.01" step="0.01" required/></label>'+
        '<label>Unit cost (KES)<input name="cost" class="field" type="number" min="0" step="0.01" required/></label>'+
        '<label>Opening stock<input name="stock" class="field" type="number" min="0" step="1" value="0" required/></label>'+
        '<label>Reorder at<input name="reorder" class="field" type="number" min="0" step="1" value="5" required/></label></div>'+
        '<div class="modal-actions"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary" type="submit">Save product</button></div></form>';
    }else if(x.type==="adjust"){
      const p=byId(x.id);
      content=p?'<h2>Adjust stock</h2><p class="muted small">'+escapeHtml(p.name)+' · Current quantity: <b>'+p.stock+'</b></p>'+
        '<form data-form="adjust" data-id="'+escapeHtml(p.id)+'"><div class="form-grid one"><label>Quantity change (e.g. -2 or 5)<input name="delta" type="number" step="1" class="field" required placeholder="+ or − units"/></label>'+
        '<label>Reason<input name="reason" class="field" required minlength="4" maxlength="160" placeholder="Stocktake correction, loss or return"/></label></div>'+
        '<div class="notice">Stock cannot become negative. Adjustments appear in the movement history.</div><div class="modal-actions"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary" type="submit">Record adjustment</button></div></form>':empty("Product not found.");
    }else if(x.type==="purchase"){
      const pOptions=data.products.map(p=>'<option value="'+escapeHtml(p.id)+'">'+escapeHtml(p.name)+' · '+escapeHtml(p.sku)+'</option>').join("");
      content='<h2>New purchase order</h2><p class="muted small">Create a draft purchase first; stock only increases when the delivery is received.</p>'+
        '<label class="field-label" for="po-supplier">Supplier</label><select id="po-supplier" class="field">'+data.suppliers.map(s=>'<option value="'+escapeHtml(s.id)+'" '+(ui.poSupplier===s.id?'selected':'')+'>'+escapeHtml(s.name)+'</option>').join("")+'</select>'+
        '<div class="purchase-entry"><div class="form-grid">'+
        '<label>Product<select class="field" id="po-item">'+pOptions+'</select></label>'+
        '<label>Quantity<input class="field" id="po-qty" type="number" min="1" step="1" value="10"/></label>'+
        '<label>Unit cost (KES)<input class="field" id="po-cost" type="number" min="0.01" step="0.01" value="'+escapeHtml(data.products[0]?.cost||0)+'"/></label>'+
        '<div class="align-end"><button type="button" class="btn" data-act="po-add-line">+ Add to order</button></div></div></div>'+
        '<div class="purchase-lines"><h3>Draft lines ('+ui.poLines.length+')</h3>'+
        (ui.poLines.length?ui.poLines.map((l,i)=>'<div class="purchase-line"><div><b>'+escapeHtml(byId(l.productId)?.name||"Unknown")+'</b><p class="muted small">'+l.qty+' × '+currency(l.cost)+'</p></div><b>'+currency(l.qty*l.cost)+'</b><button class="icon-btn" aria-label="Remove line" data-act="po-remove-line" data-index="'+i+'">×</button></div>').join(""):empty("Add one or more products to the order."))+
        '<div class="total-line"><span>Order cost</span><b>'+currency(ui.poLines.reduce((n,l)=>n+l.qty*l.cost,0))+'</b></div></div>'+
        '<div class="modal-actions"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="po-save" '+(!ui.poLines.length?"disabled":"")+'>Create draft order</button></div>';
    }else if(x.type==="po"){
      const po=data.purchaseOrders.find(p=>p.id===x.id);
      content=po?'<h2>Purchase order '+escapeHtml(po.id)+'</h2><p class="muted small">'+escapeHtml(supplier(po.supplierId))+' · '+dateFmt(po.createdAt)+'</p>'+
        '<div class="po-status">'+pill(po.status)+'<span class="muted small">'+receivedUnits(po)+' / '+orderedUnits(po)+' units received</span></div>'+
        '<div class="purchase-lines">'+po.lines.map(l=>'<div class="line-summary"><span>'+escapeHtml(byId(l.productId)?.name||"Product")+
        '<span class="subtext">Ordered '+l.qty+' · Received '+l.receivedQty+' · Remaining '+(l.qty-l.receivedQty)+'</span></span><b>'+currency(l.qty*l.cost)+'</b></div>').join("")+
        '<div class="total-line"><span>Order cost</span><b>'+currency(po.lines.reduce((n,l)=>n+l.qty*l.cost,0))+'</b></div></div>'+
        (po.receipts.length?'<div class="receipt-history"><h3>Receiving history</h3>'+po.receipts.map(receipt=>
          '<div class="line-summary"><span>'+escapeHtml(receipt.id)+' · '+dateFmt(receipt.createdAt)+'</span><b>'+
          receipt.lines.reduce((sum,line)=>sum+line.qty,0)+' units</b></div>').join("")+'</div>':'')+
        '<div class="modal-actions"><button class="btn" data-act="close">Close</button>'+
        (po.status!=="Received"?'<button class="btn primary" data-act="receive" data-id="'+escapeHtml(po.id)+'">Receive stock</button>':'')+'</div>':empty("Purchase not found.");
    }else if(x.type==="receive"){
      const po=data.purchaseOrders.find(p=>p.id===x.id);
      content=po&&po.status!=="Received"?'<h2>Receive stock · '+escapeHtml(po.id)+'</h2>'+
        '<p class="muted small">Enter how many units arrived in this delivery. Leave a product at 0 if it has not arrived. You cannot receive more than the remaining ordered quantity.</p>'+
        '<form data-form="receive" data-id="'+escapeHtml(po.id)+'"><div class="purchase-lines">'+
        po.lines.map(l=>{
          const p=byId(l.productId),remaining=l.qty-l.receivedQty;
          return '<div class="receive-row"><div><b>'+escapeHtml(p?.name||"Product")+'</b>'+
            '<span class="subtext">Ordered '+l.qty+' · Previously received '+l.receivedQty+' · Remaining '+remaining+'</span></div>'+
            (remaining>0?'<label class="receive-field" for="receive-'+escapeHtml(l.productId)+'">Received now'+
             '<input class="field" id="receive-'+escapeHtml(l.productId)+'" name="receive-'+escapeHtml(l.productId)+
             '" type="number" min="0" max="'+remaining+'" step="1" placeholder="0" value="'+escapeHtml(ui.receiveQuantities[l.productId]??"")+'"/></label>':
             '<span class="pill good">Fully received</span>')+'</div>';
        }).join("")+'</div>'+
        '<div class="notice section">Only quantities confirmed here will be added to inventory. Any remaining units stay outstanding for the next delivery.</div>'+
        '<div class="modal-actions"><button type="button" class="btn" data-act="close">Cancel</button>'+
        '<button type="submit" class="btn primary">Confirm received quantities</button></div></form>':empty("This order is already fully received.");

    }
    return '<div class="modal-backdrop" data-overlay="true"><div class="modal" role="dialog" aria-modal="true" aria-label="'+(x.type==="receipt"?"Sample receipt":"Demo action")+'"><div class="modal-closebar"><span class="modal-eyebrow">GREENBASKET / INTERACTIVE DEMO</span><button type="button" class="icon-btn" data-act="close" aria-label="Close dialog">×</button></div>'+content+'</div></div>';
  }
  function navList(){return nav.filter(([id])=>roles[ui.role].items.includes(id)).map(([id,title,symbol])=>
    '<button class="nav-link '+(ui.view===id?'selected':'')+'" data-nav="'+id+'"><span class="nav-icon">'+symbol+'</span><span>'+title+'</span></button>').join("");}
  let lastDesktopViewKey=null;
function render(){
 const viewKey=[ui.role,ui.view].join(':');
 const previousPosition=document.scrollingElement?.scrollTop||0;
 const preservePosition=lastDesktopViewKey===viewKey;
    const pages={dashboard,pos,inventory,purchasing,sales,reports,settings};
    if(!pages[ui.view])ui.view=roles[ui.role].start;
    const title=nav.find(([id])=>id===ui.view)?.[1]||"Store overview";
    root.innerHTML='<div class="app-shell"><aside class="sidebar"><div class="identity"><div class="symbol">G</div><div><b>GreenBasket</b><small>RETAIL OPERATIONS · DEMO</small></div></div>'+
      '<a class="site-return" href="/demos/retail">← Back to JoelTechGeek</a><div class="nav-caption">WORKSPACE</div><nav aria-label="Store navigation" class="nav-group">'+navList()+'</nav>'+
      '<div class="sidebar-footer"><div class="demo-stamp">● SAMPLE ENVIRONMENT</div><p>Fictional store & transactions. No real payments or messaging.</p><button data-act="reset" class="side-reset">↻ Reset sample data</button></div></aside>'+
      '<div class="workspace"><header class="topbar"><div class="crumb"><a class="crumb-back" href="/demos/retail" aria-label="Back to JoelTechGeek">←</a><span>GreenBasket</span><span class="crumb-divider">›</span><b>'+escapeHtml(title)+'</b></div><div class="top-actions"><span class="sample-badge">Interactive concept</span><label class="sr-only" for="role-switch">Switch simulated role</label><select id="role-switch" class="role-select">'+Object.entries(roles).map(([id,r])=>'<option value="'+id+'" '+(ui.role===id?'selected':'')+'>'+escapeHtml(r.label)+'</option>').join("")+'</select><div class="avatar">'+(ui.role==="owner"?"AO":ui.role==="cashier"?"MW":"DK")+'</div></div></header>'+
      '<main id="main" class="content" tabindex="-1">'+pages[ui.view]()+'</main></div>'+
      '<nav class="bottom-nav" aria-label="Mobile demo navigation">'+nav.filter(([id])=>roles[ui.role].items.includes(id)).map(([id,title,symbol])=>'<button data-nav="'+id+'" class="'+(ui.view===id?"selected":"")+'"><span>'+symbol+'</span><small>'+escapeHtml(title)+'</small></button>').join("")+'</nav></div>'+
      (ui.toast?'<div class="toast" role="status"><span>'+escapeHtml(ui.toast)+'</span><button data-act="dismiss" aria-label="Dismiss message">×</button></div>':'')+
      modal()+
      (ui.modal?.type==="receipt"&&data.sales.some(s=>s.id===ui.modal.id)?'<div class="print-only">'+receiptHtml(data.sales.find(s=>s.id===ui.modal.id))+'</div>':'');
 if(preservePosition&&document.scrollingElement)document.scrollingElement.scrollTop=previousPosition;
 lastDesktopViewKey=viewKey;
  }
  function changeRole(id){
    if(!roles[id])return;
    ui.role=id;ui.view=roles[id].start;ui.modal=null;ui.toast="Switched to "+roles[id].label+" (simulated).";render();
  }
  function go(id){
    const pages=["dashboard","pos","inventory","purchasing","sales","reports","settings"];
    if(!pages.includes(id)||!roles[ui.role].items.includes(id))return;
    ui.view=id;ui.modal=null;ui.toast="";render();
  }
  function addCart(id){
    const p=byId(id);
    if(!p){toast("Product not found.");return;}
    let line=ui.cart.find(l=>l.id===id);
    if((line?.qty||0)>=p.stock){toast("Only "+p.stock+" units of "+p.name+" are available.");return;}
    if(line)line.qty++;else ui.cart.push({id,qty:1});
    ui.toast="";render();
  }
  function modifyCart(id,change){
    const line=ui.cart.find(l=>l.id===id);
    if(!line)return;
    line.qty+=change;
    if(line.qty<=0)ui.cart=ui.cart.filter(l=>l.id!==id);
    ui.toast="";render();
  }
  function safe(action){try{action()}catch(error){toast(error?.message||"The demo action could not be completed.");}}
  document.addEventListener("click",event=>{
    const element=event.target.closest("[data-nav],[data-act],[data-cat],[data-filter]");
    if(!element||!root.contains(element))return;
    const id=element.dataset.id,act=element.dataset.act;
    if(element.dataset.nav){go(element.dataset.nav);return;}
    if(element.dataset.cat!==undefined){ui.posCategory=element.dataset.cat;render();return;}
    if(element.dataset.filter!==undefined){ui.invFilter=element.dataset.filter;render();return;}
    if(act==="dismiss"){ui.toast="";render();return;}
    if(act==="reset"){
      if(!window.confirm("Reset the fictional GreenBasket demo? All changes in this browser will be lost."))return;
      data=core.seed();ui.cart=[];ui.poLines=[];ui.tender="";ui.modal=null;ui.view=roles[ui.role].start;persist();toast("Sample data restored.");return;
    }
    if(act==="new-product"){ui.modal={type:"product"};render();return;}
    if(act==="adjust"){ui.modal={type:"adjust",id};render();return;}
    if(act==="new-po"){ui.poLines=[];ui.poSupplier=data.suppliers[0].id;ui.modal={type:"purchase"};render();return;}
    if(act==="view-po"){ui.modal={type:"po",id};render();return;}
    if(act==="receipt"){ui.modal={type:"receipt",id};render();return;}
    if(act==="close"){ui.modal=null;render();return;}
    if(act==="print"){window.print();return;}
    if(act==="switch-role"){changeRole(element.dataset.role);return;}
    if(act==="cart-add"){addCart(id);return;}
    if(act==="cart-less"){modifyCart(id,-1);return;}
    if(act==="cart-clear"){ui.cart=[];ui.tender="";render();return;}
    if(act==="checkout"){safe(()=>{
      const sale=core.checkout(data,ui.cart,ui.paymentMethod,ui.tender,roles[ui.role].label);
      persist();ui.cart=[];ui.tender="";ui.modal={type:"receipt",id:sale.id};ui.toast="Sample sale recorded. Stock and reports updated.";render();
    });return;}
    if(act==="po-add-line"){safe(()=>{
      const pid=document.getElementById("po-item")?.value;
      const qty=Number(document.getElementById("po-qty")?.value);
      const cost=Number(document.getElementById("po-cost")?.value);
      if(!byId(pid)||!Number.isInteger(qty)||qty<1||!Number.isFinite(cost)||cost<=0)throw new Error("Choose a product, positive whole-number quantity and a valid cost.");
      if(ui.poLines.some(x=>x.productId===pid))throw new Error("This product is already in the order. Remove it before changing its quantity.");
      ui.poLines.push({productId:pid,qty,cost:Math.round(cost*100)/100});ui.toast="";render();
    });return;}
    if(act==="po-remove-line"){ui.poLines.splice(Number(element.dataset.index),1);render();return;}
    if(act==="po-save"){safe(()=>{
      const po=core.createPurchase(data,ui.poSupplier,ui.poLines);
      persist();ui.poLines=[];ui.modal={type:"po",id:po.id};ui.toast="Draft purchase order created. Receive it to add stock.";render();
    });return;}
    if(act==="receive"){
      const po=data.purchaseOrders.find(x=>x.id===id);
      if(!po||po.status==="Received"){toast("This order has already been fully received.");return;}
      ui.receiveQuantities={};ui.modal={type:"receive",id};ui.toast="";render();return;
    }
  });
  document.addEventListener("change",event=>{
    const t=event.target;
    if(!root.contains(t))return;
    if(t.id==="role-switch"){changeRole(t.value);return;}
    if(t.id==="pay-method"){ui.paymentMethod=t.value;ui.tender="";render();return;}
    if(t.id==="po-supplier"){ui.poSupplier=t.value;return;}
    if(t.id==="po-item"){const p=byId(t.value);const cost=document.getElementById("po-cost");if(cost&&p)cost.value=String(p.cost);return;}
  });
  document.addEventListener("input",event=>{
    const t=event.target;
    if(!root.contains(t))return;
    if(t.name?.startsWith("receive-")){
      ui.receiveQuantities[t.name.slice("receive-".length)]=t.value;
      return;
    }
    if(t.id==="tender"){
      ui.tender=t.value;
      const node=document.querySelector(".change-line b");
      if(node)node.textContent=currency(Math.max(0,Number(ui.tender)-cartTotal()));
      return;
    }
    if(t.dataset.search){
      const key=t.dataset.search==="pos"?"posQuery":"invQuery",position=t.selectionStart;
      ui[key]=t.value;render();
      const same=document.querySelector('[data-search="'+t.dataset.search+'"]');
      if(same){same.focus();if(typeof position==="number")same.setSelectionRange(position,position);}
    }
  });
  document.addEventListener("submit",event=>{
    const form=event.target,kind=form.dataset?.form;
    if(!kind||!root.contains(form))return;
    event.preventDefault();
    safe(()=>{
      const fields=Object.fromEntries(new FormData(form).entries());
      if(kind==="product"){
        const p=core.addProduct(data,fields);persist();ui.modal=null;ui.view="inventory";ui.toast="Created "+p.name+" with stock tracking.";render();
      }else if(kind==="adjust"){
        const p=core.adjust(data,form.dataset.id,fields.delta,fields.reason);persist();ui.modal=null;ui.toast="Stock adjusted. "+p.name+" now has "+p.stock+" units.";render();
      }else if(kind==="receive"){
        const po=data.purchaseOrders.find(po=>po.id===form.dataset.id);
        if(!po)throw new Error("Purchase order not found.");
        const delivered=po.lines.filter(line=>line.receivedQty<line.qty).map(line=>({
          productId:line.productId,
          qty:fields["receive-"+line.productId]??"0"
        }));
        const count=delivered.reduce((sum,line)=>sum+(Number(line.qty)||0),0);
        core.receivePurchase(data,po.id,delivered);
        persist();ui.receiveQuantities={};ui.modal={type:"po",id:po.id};
        ui.toast=count+" units received. "+(po.status==="Received"?"Order complete.":"Remaining quantities can be received later.");
        render();
      }
    });
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&ui.modal){ui.modal=null;render();}
  });
  render();
})(retailCore);
