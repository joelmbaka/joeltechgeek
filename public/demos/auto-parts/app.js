(function (core) {
  "use strict";
  const KEY="joeltechgeek-auto-parts-demo-v1";
  const root=document.getElementById("app");
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const usd=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n)||0);
  const dt=s=>new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  const today=()=>new Date().toLocaleDateString("en-CA");
  let data;
  try{data=JSON.parse(localStorage.getItem(KEY)||"null");if(data?.version!==1||!Array.isArray(data.products)||!Array.isArray(data.sales))data=core.seed();}catch(e){data=core.seed();}
  const ui={role:"counter",view:"sale",query:"",cart:[],customerId:"",method:"Cash",modal:"",receiptId:"",notice:"",month:new Date().toISOString().slice(0,7),supplierId:data.suppliers[0]?.id||"",purchaseLines:[],purchaseProduct:"",purchaseQty:"",purchaseCost:"",filter:""};
  const roleNav={
    counter:[["sale","New sale","▣"],["history","Sales & receipts","▤"],["stock","Products","◫"],["customers","Customers","♙"]],
    office:[["sale","New sale","▣"],["stock","Products","◫"],["history","Sales & receipts","▤"],["purchases","Purchases","⇩"],["suppliers","Suppliers","▱"],["customers","Customers","♙"],["expenses","Expenses","◎"],["reports","Reports","▥"]]
  };
  const roles={counter:"Sales Counter",office:"Back Office"};
  const product=id=>data.products.find(p=>p.id===id);
  const lookupCustomer=id=>data.customers.find(c=>c.id===id);
  const supplier=id=>data.suppliers.find(s=>s.id===id);
  const low=p=>p.stock<=p.reorder;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){ui.notice="Browser storage unavailable. Changes may not persist.";}};
  const action=(label,name,cls="",extra="")=>'<button type="button" class="btn '+cls+'" data-action="'+name+'" '+extra+'>'+label+'</button>';
  const field=(label,name,value="",type="text",extra="")=>'<label class="field"><span>'+label+'</span><input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+extra+(["phone","email","brand","fitment","description"].includes(name)?"":" required")+'></label>';
  const header=(title,button="",desc="")=>'<div class="page-header"><div><h1>'+esc(title)+'</h1>'+(desc?'<p>'+esc(desc)+'</p>':'')+'</div>'+button+'</div>';
  const table=(heads,body)=>'<div class="table-scroll"><table><thead><tr>'+heads.map(x=>'<th>'+x+'</th>').join("")+'</tr></thead><tbody>'+body+'</tbody></table></div>';
  const blank=message=>'<div class="empty">'+esc(message)+'</div>';
  const selectOptions=(items,current)=>items.map(x=>'<option value="'+esc(x[0])+'" '+(String(x[0])===String(current)?"selected":"")+'>'+esc(x[1])+'</option>').join("");
  const showModal=(name)=>{ui.modal=name;render();};
  const toast=message=>{ui.notice=message;render();};
  const saleTotal=()=>core.money(ui.cart.reduce((n,l)=>n+(product(l.id)?.price||0)*l.qty,0));
  function viewSale(){
    const q=ui.query.toLowerCase().trim();
    const found=data.products.filter(p=>(p.name+" "+p.sku+" "+p.brand+" "+p.fitment).toLowerCase().includes(q));
    const results=found.map(p=>'<div class="product-row"><div class="product-info"><b>'+esc(p.name)+'</b><span class="muted small">'+esc(p.brand)+' · '+esc(p.sku)+' · '+esc(p.fitment)+'</span><span class="muted small">'+p.stock+' available</span></div><div class="product-actions"><b>'+usd(p.price)+'</b>'+action("Add","add-cart","primary small-btn",'data-id="'+esc(p.id)+'" '+(p.stock<=0?"disabled":""))+'</div></div>').join("");
    const cart=ui.cart.map(l=>{const p=product(l.id);if(!p)return "";return '<div class="cart-row"><div><b>'+esc(p.name)+'</b><span class="muted small">'+usd(p.price)+' each</span></div><div class="qty-controls">'+action("−","decrease","small-btn",'data-id="'+esc(l.id)+'"')+'<b>'+l.qty+'</b>'+action("+","increase","small-btn",'data-id="'+esc(l.id)+'" '+(l.qty>=p.stock?"disabled":""))+'</div><b>'+usd(p.price*l.qty)+'</b>'+action("×","remove-cart","small-btn",'data-id="'+esc(l.id)+'" aria-label="Remove item"')+'</div>'}).join("");
    return header("New sale","","Search, add products and issue a receipt.")+
      '<div class="sales-layout"><section class="card padded"><h2>Find products</h2><div class="search-wrap"><input id="product-search" type="search" placeholder="Search product, brand or SKU" value="'+esc(ui.query)+'" autocomplete="off" aria-label="Search products"></div><div class="product-list">'+(results||blank("No products match your search."))+'</div></section>'+
      '<section class="card padded checkout-panel"><h2>Cart</h2>'+(cart||blank("Choose products to start a sale."))+'<div class="total-row"><strong>Total</strong><strong>'+usd(saleTotal())+'</strong></div>'+
      '<form data-form="checkout"><label class="field"><span>Customer (optional)</span><select name="customerId" id="sale-customer"><option value="">Walk-in customer</option>'+selectOptions(data.customers.map(c=>[c.id,c.name]),ui.customerId)+'</select></label>'+
      '<label class="field"><span>Payment</span><select name="method" id="sale-method">'+selectOptions(["Cash","Card","M-Pesa","Bank transfer","Other"].map(s=>[s,s]),ui.method)+'</select></label>'+
      '<label class="field" id="tender-field" '+(ui.method!=="Cash"?'hidden':'')+'><span>Cash received</span><input name="tendered" type="number" min="0" step=".01" value="'+saleTotal()+'" /></label>'+
      '<button type="submit" class="btn primary full" '+(ui.cart.length?"":"disabled")+'>Complete sale & view receipt</button></form></section></div>';
  }
  function viewStock(){
    return header("Products",ui.role==="office"?action("+ Add product","add-product","primary"):"","Inventory and selling prices.")+
      '<section class="card"><div class="table-scroll">'+table(["Product","SKU","Stock","Cost","Price","Status",ui.role==="office"?"":" "],
      data.products.map(p=>'<tr><td><b>'+esc(p.name)+'</b><div class="muted small">'+esc(p.brand)+' · '+esc(p.fitment)+'</div></td><td>'+esc(p.sku)+'</td><td>'+p.stock+'</td><td>'+(ui.role==="office"?usd(p.cost):"—")+'</td><td><b>'+usd(p.price)+'</b></td><td><span class="pill '+(p.stock===0?"bad":low(p)?"warn":"good")+'">'+(p.stock===0?"Out of stock":low(p)?"Low stock":"Available")+'</span></td><td>'+(ui.role==="office"?action("Edit","edit-product","small-btn",'data-id="'+esc(p.id)+'"'):"")+'</td></tr>').join(""))+'</div></section>';
  }
  function viewCustomers(){
    return header("Customers",action("+ Add customer","add-customer","primary"),"Customers are optional for walk-in sales.")+
      '<section class="card">'+table(["Customer","Phone","Email","Purchases",""],data.customers.map(c=>{const sold=data.sales.filter(s=>s.customerId===c.id);return '<tr><td><b>'+esc(c.name)+'</b></td><td>'+esc(c.phone||"—")+'</td><td>'+esc(c.email||"—")+'</td><td>'+sold.length+'</td><td>'+action("History","customer-history","small-btn",'data-id="'+esc(c.id)+'"')+'</td></tr>'}).join(""))+'</section>';
  }
  function viewSuppliers(){
    return header("Suppliers",action("+ Add supplier","add-supplier","primary"))+
      '<section class="card">'+table(["Supplier","Phone","Email","Purchases"],data.suppliers.map(s=>'<tr><td><b>'+esc(s.name)+'</b></td><td>'+esc(s.phone||"—")+'</td><td>'+esc(s.email||"—")+'</td><td>'+data.purchases.filter(p=>p.supplierId===s.id).length+'</td></tr>').join(""))+'</section>';
  }
  function viewPurchases(){
    return header("Purchases",action("+ Record purchase","new-purchase","primary"),"Recording received purchases increases stock.")+
      '<section class="card">'+(data.purchases.length?table(["Purchase","Supplier","Items","Total","Status","Date"],data.purchases.map(p=>'<tr><td><b>'+esc(p.id)+'</b></td><td>'+esc(supplier(p.supplierId)?.name||"—")+'</td><td>'+p.lines.reduce((n,l)=>n+l.qty,0)+' units</td><td>'+usd(p.total)+'</td><td><span class="pill good">Received</span></td><td>'+dt(p.date)+'</td></tr>').join("")):blank("No purchases yet. Record stock received from a supplier."))+'</section>';
  }
  function viewHistory(){
    return header("Sales & receipts","", "Open a completed sale to view or print its receipt.")+
      '<section class="card">'+(data.sales.length?table(["Receipt","Customer","Payment","Amount","Date",""],data.sales.map(s=>'<tr><td><b>'+esc(s.id)+'</b></td><td>'+esc(lookupCustomer(s.customerId)?.name||"Walk-in")+'</td><td>'+esc(s.method)+'</td><td><b>'+usd(s.total)+'</b></td><td>'+dt(s.date)+'</td><td>'+action("Receipt","receipt","small-btn",'data-id="'+esc(s.id)+'"')+'</td></tr>').join("")):blank("No sales recorded yet."))+'</section>';
  }
  function viewExpenses(){
    const entries=data.expenses.slice().sort((a,b)=>b.date.localeCompare(a.date));
    return header("Expenses",action("+ Add expense","add-expense","primary"),"Operating costs such as rent, wages and utilities.")+
      '<section class="card">'+(entries.length?table(["Date","Category","Description","Amount"],entries.map(e=>'<tr><td>'+esc(e.date)+'</td><td><b>'+esc(e.category)+'</b></td><td>'+esc(e.description||"—")+'</td><td>'+usd(e.amount)+'</td></tr>').join("")):blank("No operating expenses recorded yet."))+'</section>';
  }
  function viewReports(){
    const r=core.report(data,ui.month);
    const line=(name,n,strong=false)=>'<div class="report-line '+(strong?"emphasis":"")+'"><span>'+name+'</span><b>'+usd(n)+'</b></div>';
    return header("Profit & loss","","Sales less product costs and operating expenses.")+
      '<section class="card padded report-card"><label class="field period-field"><span>Month</span><input id="report-month" type="month" value="'+esc(ui.month)+'"></label>'+
      '<div class="report-lines">'+line("Sales revenue",r.revenue)+line("Cost of goods sold",r.cogs)+line("Gross profit",r.gross,true)+line("Operating expenses",r.expenses)+line("Net operating profit",r.net,true)+'</div>'+
      '<p class="muted small">Simplified operating result before tax, financing and other adjustments. Product costs are recognized when sold, not when purchased.</p></section>';
  }
  function modalBody(){
    if(!ui.modal)return "";
    let title="",body="";
    if(ui.modal==="customer"){
      title="Add customer";body='<form data-form="customer" class="stack">'+field("Name","name")+field("Phone (optional)","phone","","tel")+field("Email (optional)","email","","email")+'<button class="btn primary full" type="submit">Save customer</button></form>';
      body=body.replace(/name="phone"([^>]*) required>/,'name="phone"$1>').replace(/name="email"([^>]*) required>/,'name="email"$1>');
    }
    if(ui.modal==="supplier"){
      title="Add supplier";body='<form data-form="supplier" class="stack">'+field("Supplier name","name")+field("Phone","phone")+field("Email","email","","email")+'<button class="btn primary full" type="submit">Save supplier</button></form>';
      body=body.replace(/name="phone"([^>]*) required>/,'name="phone"$1>').replace(/name="email"([^>]*) required>/,'name="email"$1>');
    }
    if(ui.modal==="product"){
      const p=ui.editId?product(ui.editId):null; title=p?"Edit product":"Add product";
      body='<form data-form="product" class="form-grid">'+
      field("Product name","name",p?.name||"")+field("SKU","sku",p?.sku||"")+
      field("Brand","brand",p?.brand||"")+field("Category","category",p?.category||"Other")+
      field("Vehicle fitment (optional)","fitment",p?.fitment||"")+
      (!p?field("Opening quantity","stock",0,"number",'min="0" step="1"'): '')+
      field("Cost price ($)","cost",p?.cost??0,"number",'min="0" step=".01"')+
      field("Selling price ($)","price",p?.price??0,"number",'min="0" step=".01"')+
      field("Low stock threshold","reorder",p?.reorder??5,"number",'min="0" step="1"')+
      '<label class="field"><span>Supplier</span><select name="supplierId"><option value="">None</option>'+selectOptions(data.suppliers.map(s=>[s.id,s.name]),p?.supplierId||"")+'</select></label>'+
      '<div class="form-footer"><button class="btn primary full" type="submit">Save product</button></div></form>';
      body=body.replace(/name="fitment"([^>]*) required>/,'name="fitment"$1>');
    }
    if(ui.modal==="purchase"){
      title="Record stock purchase";
      const lines=ui.purchaseLines.map((l,i)=>'<div class="line-item"><span>'+esc(product(l.id)?.name||"—")+' × '+l.qty+' at '+usd(l.cost)+'</span>'+action("Remove","remove-purchase-line","small-btn",'data-index="'+i+'"')+'</div>').join("");
      body='<div class="stack"><label class="field"><span>Supplier</span><select id="purchase-supplier">'+selectOptions(data.suppliers.map(s=>[s.id,s.name]),ui.supplierId)+'</select></label>'+
      '<div class="form-grid"><label class="field"><span>Product</span><select id="purchase-product">'+selectOptions(data.products.map(p=>[p.id,p.name]),ui.purchaseProduct||data.products[0]?.id)+'</select></label>'+
      '<label class="field"><span>Quantity</span><input id="purchase-qty" type="number" min="1" step="1" value="'+esc(ui.purchaseQty||1)+'"></label>'+
      '<label class="field"><span>Unit cost ($)</span><input id="purchase-cost" type="number" min="0" step=".01" value="'+esc(ui.purchaseCost||data.products[0]?.cost||0)+'"></label>'+
      '<div class="field purchase-add">'+action("+ Add item","add-purchase-line","primary")+'</div></div>'+
      '<div class="purchase-lines">'+(lines||blank("No items added."))+'</div>'+
      '<div class="total-row"><b>Total</b><b>'+usd(ui.purchaseLines.reduce((n,l)=>n+l.qty*l.cost,0))+'</b></div>'+
      action("Record received stock","save-purchase","primary full",ui.purchaseLines.length?"":"disabled")+'</div>';
    }
    if(ui.modal==="expense"){
      title="Add expense";body='<form data-form="expense" class="stack"><label class="field"><span>Category</span><select name="category">'+selectOptions(["Rent","Wages","Electricity","Water","Internet","Transport","Other"].map(x=>[x,x]),"Rent")+'</select></label>'+
      field("Amount ($)","amount","","number",'min="0.01" step=".01"')+field("Date","date",today(),"date")+field("Description (optional)","description")+
      '<button class="btn primary full" type="submit">Save expense</button></form>';
      body=body.replace(/name="description"([^>]*) required>/,'name="description"$1>');
    }
    if(ui.modal==="receipt"){
      const s=data.sales.find(x=>x.id===ui.receiptId);
      title="Receipt";
      if(!s){body=blank("Receipt not found.");}
      else body='<div class="receipt-paper"><h2>Northline Auto Parts</h2><p class="muted small">Fictional interactive demo · Not proof of payment</p><div class="receipt-details"><span>Receipt '+esc(s.id)+'</span><span>'+dt(s.date)+'</span></div><p>Customer: '+esc(lookupCustomer(s.customerId)?.name||"Walk-in customer")+'</p>'+
        s.lines.map(l=>'<div class="receipt-item"><span>'+esc(l.name)+' × '+l.qty+'</span><b>'+usd(l.total)+'</b></div>').join("")+
        '<div class="total-row"><b>Total paid</b><b>'+usd(s.total)+'</b></div><p>Method: '+esc(s.method)+'</p>'+(s.method==="Cash"?'<p>Cash received: '+usd(s.tendered)+' · Change: '+usd(s.change)+'</p>':'')+
        '<p class="muted small">Thank you for your purchase.</p></div>'+
        '<div class="modal-actions">'+action("Print receipt","print-receipt","primary")+action("Done","close-modal")+'</div>';
    }
    if(ui.modal==="customer-history"){
      const c=lookupCustomer(ui.customerId);
      title=c?.name||"Customer";
      const sales=data.sales.filter(s=>s.customerId===ui.customerId);
      body=sales.length?sales.map(s=>'<div class="line-item"><b>'+esc(s.id)+'</b><span>'+usd(s.total)+' · '+dt(s.date)+'</span>'+action("Receipt","receipt","small-btn",'data-id="'+esc(s.id)+'"')+'</div>').join(""):blank("No purchases for this customer.");
    }
    return '<div class="modal-backdrop" data-action="close-modal"><section class="dialog" role="dialog" aria-modal="true" aria-label="'+esc(title)+'" data-stop-close="true"><div class="dialog-head"><h2>'+esc(title)+'</h2>'+action("×","close-modal","small-btn",'aria-label="Close dialog"')+'</div>'+body+'</section></div>';
  }
  function render(){
    if(!roleNav[ui.role].some(i=>i[0]===ui.view))ui.view=roleNav[ui.role][0][0];
    const nav=roleNav[ui.role].map(item=>'<button type="button" class="nav-link '+(ui.view===item[0]?"selected":"")+'" data-nav="'+item[0]+'"><span class="nav-icon">'+item[2]+'</span>'+esc(item[1])+'</button>').join("");
    const pages={sale:viewSale,stock:viewStock,customers:viewCustomers,suppliers:viewSuppliers,purchases:viewPurchases,history:viewHistory,expenses:viewExpenses,reports:viewReports};
    root.innerHTML='<div class="app-shell"><aside class="sidebar"><div class="identity"><span class="symbol">A</span><div><b>Northline Parts</b><small>JOELTECHGEEK DEMO</small></div></div><a class="site-return" href="/demos/auto-parts">← About this demo</a><p class="nav-caption">WORKSPACE</p><nav class="nav-group" aria-label="Demo navigation">'+nav+'</nav><div class="sidebar-footer"><span class="demo-stamp">FICTIONAL BUSINESS</span><p>All transactions are simulated and stored in this browser.</p>'+action("Reset demo data","reset","side-reset")+'</div></aside>'+
      '<div class="workspace"><header class="topbar"><div class="crumb"><b>'+esc(roleNav[ui.role].find(x=>x[0]===ui.view)?.[1]||"")+'</b></div><div class="top-actions"><span class="sample-badge">Interactive demo</span><label class="sr-only" for="role-switch">Demo role</label><select class="role-select" id="role-switch">'+selectOptions(Object.entries(roles),ui.role)+'</select><div class="avatar">'+(ui.role==="office"?"BO":"SC")+'</div></div></header><main class="content">'+pages[ui.view]()+'</main></div></div>'+
      (ui.notice?'<div class="notice-toast" role="status">'+esc(ui.notice)+action("×","dismiss-notice","small-btn")+'</div>':"")+modalBody();
  }
  function safe(fn){try{fn();save();render();}catch(e){ui.notice=e.message||"Something went wrong.";render();}}
  document.addEventListener("click",e=>{
    const el=e.target.closest("[data-action],[data-nav]");
    if(!el||!root.contains(el))return;
    if(el.dataset.stopClose)return;
    if(el.dataset.nav){ui.view=el.dataset.nav;ui.notice="";render();window.scrollTo?.(0,0);return;}
    const a=el.dataset.action,id=el.dataset.id;
    if(a==="close-modal"){if(el.classList.contains("modal-backdrop")&&e.target!==el)return;ui.modal="";render();return;}
    if(a==="dismiss-notice"){ui.notice="";render();return;}
    if(a==="add-cart"){const p=product(id);if(p?.stock>0){const found=ui.cart.find(l=>l.id===id);if(found&&found.qty<p.stock)found.qty++;else if(!found)ui.cart.push({id,qty:1});render();}return;}
    if(a==="remove-cart"){ui.cart=ui.cart.filter(l=>l.id!==id);render();return;}
    if(a==="increase"||a==="decrease"){const line=ui.cart.find(l=>l.id===id);if(line){line.qty+=a==="increase"?1:-1;if(line.qty<=0)ui.cart=ui.cart.filter(l=>l.id!==id);render();}return;}
    if(a==="add-customer"){showModal("customer");return;}
    if(a==="add-supplier"){showModal("supplier");return;}
    if(a==="add-product"){ui.editId="";showModal("product");return;}
    if(a==="edit-product"){ui.editId=id;showModal("product");return;}
    if(a==="new-purchase"){ui.purchaseLines=[];ui.purchaseProduct=data.products[0]?.id||"";ui.purchaseCost=data.products[0]?.cost||0;ui.purchaseQty="1";showModal("purchase");return;}
    if(a==="add-expense"){showModal("expense");return;}
    if(a==="customer-history"){ui.customerId=id;showModal("customer-history");return;}
    if(a==="receipt"){ui.receiptId=id;showModal("receipt");return;}
    if(a==="print-receipt"){window.print();return;}
    if(a==="reset"){if(window.confirm("Reset this fictional demo and erase your browser-local changes?")){data=core.seed();ui.cart=[];ui.modal="";ui.notice="Demo data restored.";save();render();}return;}
    if(a==="add-purchase-line")safe(()=>{
      const p=product(ui.purchaseProduct||data.products[0]?.id);
      if(!p)throw Error("Choose a product.");
      if(ui.purchaseLines.some(l=>l.id===p.id))throw Error("Product already added.");
      ui.purchaseLines.push({id:p.id,qty:core.whole(ui.purchaseQty,"Quantity"),cost:core.positive(ui.purchaseCost,"Unit cost",true)});
    });
    if(a==="remove-purchase-line")safe(()=>{ui.purchaseLines.splice(Number(el.dataset.index),1);});
    if(a==="save-purchase")safe(()=>{
      core.purchase(data,{supplierId:ui.supplierId,lines:ui.purchaseLines.map(l=>({productId:l.id,qty:l.qty,cost:l.cost}))});
      ui.modal="";ui.purchaseLines=[];ui.notice="Stock received and inventory updated.";
    });
  });
  document.addEventListener("input",e=>{
    if(e.target.id==="product-search"){
      const start=e.target.selectionStart;ui.query=e.target.value;render();
      const input=document.getElementById("product-search");input?.focus();try{input?.setSelectionRange(start,start);}catch(err){}
    }
    if(e.target.id==="purchase-qty")ui.purchaseQty=e.target.value;
    if(e.target.id==="purchase-cost")ui.purchaseCost=e.target.value;
  });
  document.addEventListener("change",e=>{
    const el=e.target;
    if(el.id==="role-switch"){ui.role=el.value;ui.view=roleNav[ui.role][0][0];ui.modal="";ui.notice="";ui.cart=[];render();}
    if(el.id==="sale-customer"){ui.customerId=el.value;}
    if(el.id==="sale-method"){ui.method=el.value;render();}
    if(el.id==="purchase-supplier")ui.supplierId=el.value;
    if(el.id==="purchase-product"){ui.purchaseProduct=el.value;ui.purchaseCost=product(el.value)?.cost||0;render();}
    if(el.id==="report-month"){ui.month=el.value;render();}
  });
  document.addEventListener("submit",e=>{
    const form=e.target.closest("[data-form]");if(!form)return;
    e.preventDefault();
    const f=Object.fromEntries(new FormData(form).entries());
    safe(()=>{
      switch(form.dataset.form){
        case "checkout":{
          const s=core.sale(data,{lines:ui.cart.map(l=>({productId:l.id,qty:l.qty})),customerId:f.customerId,method:f.method,tendered:f.tendered});
          ui.cart=[];ui.receiptId=s.id;ui.customerId="";ui.modal="receipt";ui.notice="Sale completed. Receipt "+s.id+" generated.";break;
        }
        case "customer":core.customer(data,f);ui.modal="";ui.notice="Customer added.";break;
        case "supplier":core.supplier(data,f);ui.modal="";ui.notice="Supplier added.";break;
        case "product":core.product(data,{...f,id:ui.editId||null,stock:ui.editId?0:f.stock});ui.modal="";ui.notice="Product saved.";break;
        case "expense":core.expense(data,f);ui.modal="";ui.notice="Expense recorded.";break;
      }
    });
  });
  render();
})(autoPartsCore);
