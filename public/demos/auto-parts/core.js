/* Automotive parts demo — fictional records, browser-only operations. */
const autoPartsCore = (function () {
  "use strict";
  const money = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const positive = (value, label, zero = false) => {
    const n = Number(value);
    if (!Number.isFinite(n) || (zero ? n < 0 : n <= 0)) throw new Error(label + " must be " + (zero ? "zero or more." : "greater than zero."));
    return money(n);
  };
  const whole = (value, label, zero = false) => {
    const n = Number(value);
    if (!Number.isInteger(n) || (zero ? n < 0 : n <= 0)) throw new Error(label + " must be a valid whole number.");
    return n;
  };
  const uid = prefix => prefix + "-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0,8).toUpperCase() : Math.random().toString(36).slice(2,10).toUpperCase());
  const now = () => new Date().toISOString();
  const seed = () => ({
    version: 1, currency: "USD",
    suppliers: [
      {id:"SUP-1",name:"Continental Parts Supply",email:"orders@example.com",phone:"+1 555 010 301"},
      {id:"SUP-2",name:"Metro Auto Wholesale",email:"supply@example.com",phone:"+1 555 010 302"}
    ],
    customers:[
      {id:"CUS-1",name:"Northside Auto Repair",phone:"+1 555 010 501",email:"northside@example.com"},
      {id:"CUS-2",name:"Marco's Garage",phone:"+1 555 010 502",email:"marco@example.com"}
    ],
    products: [
      {id:"PR-1",sku:"BP-COR-01",name:"Ceramic Brake Pad Set",brand:"RoadPro",category:"Brakes",fitment:"Toyota Corolla 2014–2019",stock:12,reorder:5,cost:22,price:39,supplierId:"SUP-1"},
      {id:"PR-2",sku:"OF-TOY-02",name:"Engine Oil Filter",brand:"Filtra",category:"Filters",fitment:"Toyota 1.5L / 1.8L",stock:25,reorder:8,cost:5,price:12,supplierId:"SUP-1"},
      {id:"PR-3",sku:"SP-NGK-03",name:"Spark Plug",brand:"Ignite",category:"Ignition",fitment:"Selected Toyota petrol engines",stock:32,reorder:10,cost:4,price:10,supplierId:"SUP-2"},
      {id:"PR-4",sku:"AF-HON-04",name:"Air Filter",brand:"Filtra",category:"Filters",fitment:"Honda Civic 2016–2021",stock:3,reorder:6,cost:9,price:19,supplierId:"SUP-1"},
      {id:"PR-5",sku:"BAT-12V-05",name:"12V Car Battery",brand:"VoltMax",category:"Electrical",fitment:"45 Ah, 12V",stock:6,reorder:3,cost:58,price:89,supplierId:"SUP-2"},
      {id:"PR-6",sku:"WIP-22-06",name:"Wiper Blade 22 inch",brand:"ClearView",category:"Accessories",fitment:"Universal 22 inch",stock:10,reorder:4,cost:6,price:15,supplierId:"SUP-2"}
    ],
    purchases: [], sales: [], expenses: [],
    sequence: 1001
  });
  const requireProduct = (d,id) => {
    const p=d.products.find(x=>x.id===id);
    if(!p) throw new Error("Product not found.");
    return p;
  };
  const requireSupplier = (d,id) => {
    if(!d.suppliers.some(x=>x.id===id))throw new Error("Select an existing supplier.");
  };
  const customer = (d,fields) => {
    const name=String(fields.name||"").trim();
    if(!name)throw new Error("Customer name is required.");
    const c={id:uid("CUS"),name,phone:String(fields.phone||"").trim(),email:String(fields.email||"").trim()};
    d.customers.push(c);return c;
  };
  const supplier = (d,fields) => {
    const name=String(fields.name||"").trim();
    if(!name)throw new Error("Supplier name is required.");
    const s={id:uid("SUP"),name,email:String(fields.email||"").trim(),phone:String(fields.phone||"").trim()};
    d.suppliers.push(s);return s;
  };
  const product = (d,fields) => {
    const name=String(fields.name||"").trim(),sku=String(fields.sku||"").trim();
    if(!name||!sku)throw new Error("Product name and SKU are required.");
    if(d.products.some(p=>p.sku.toLowerCase()===sku.toLowerCase()&&p.id!==fields.id))throw new Error("SKU already exists.");
    if(fields.supplierId)requireSupplier(d,fields.supplierId);
    const stock=whole(fields.stock??0,"Stock",true),reorder=whole(fields.reorder??0,"Reorder level",true);
    const cost=positive(fields.cost,"Cost price",true),price=positive(fields.price,"Selling price",true);
    const existing=fields.id?requireProduct(d,fields.id):null;
    if(existing){
      Object.assign(existing,{name,sku,brand:String(fields.brand||"").trim(),fitment:String(fields.fitment||"").trim(),category:String(fields.category||"Other"),reorder,cost,price,supplierId:fields.supplierId||""});
      return existing;
    }
    const p={id:uid("PR"),name,sku,brand:String(fields.brand||"").trim(),fitment:String(fields.fitment||"").trim(),category:String(fields.category||"Other"),stock,reorder,cost,price,supplierId:fields.supplierId||""};
    d.products.push(p);return p;
  };
  const purchase = (d,fields) => {
    requireSupplier(d,fields.supplierId);
    const lines=Array.isArray(fields.lines)?fields.lines:[];
    if(!lines.length)throw new Error("Add at least one product.");
    const ids=new Set();
    const verified=lines.map(line=>{
      const p=requireProduct(d,line.productId),qty=whole(line.qty,"Quantity"),cost=positive(line.cost,"Unit cost",true);
      if(ids.has(p.id))throw new Error("Each product can appear only once.");
      ids.add(p.id);return {productId:p.id,qty,cost};
    });
    const item={id:uid("PUR"),date:now(),supplierId:fields.supplierId,lines:verified,total:money(verified.reduce((n,l)=>n+l.qty*l.cost,0)),status:"Received"};
    // Weighted-average cost, because received units now belong to existing inventory.
    verified.forEach(l=>{const p=requireProduct(d,l.productId);p.cost=money((p.cost*p.stock+l.cost*l.qty)/(p.stock+l.qty));p.stock+=l.qty;});
    d.purchases.unshift(item);return item;
  };
  const sale = (d,fields) => {
    const lines=Array.isArray(fields.lines)?fields.lines:[];
    if(!lines.length)throw new Error("Add products to the cart.");
    const ids=new Set();
    const verified=lines.map(l=>{
      const p=requireProduct(d,l.productId),qty=whole(l.qty,"Quantity");
      if(ids.has(p.id))throw new Error("Duplicate cart item.");
      if(qty>p.stock)throw new Error("Not enough stock for "+p.name+".");
      ids.add(p.id);
      return {productId:p.id,name:p.name,sku:p.sku,qty,price:p.price,cost:p.cost,total:money(qty*p.price)};
    });
    if(fields.customerId&& !d.customers.some(c=>c.id===fields.customerId))throw new Error("Customer not found.");
    const method=String(fields.method||"Cash");
    if(!["Cash","Card","Bank transfer","Other"].includes(method))throw new Error("Choose a payment method.");
    const total=money(verified.reduce((n,l)=>n+l.total,0));
    const payment=method==="Cash"?positive(fields.tendered??total,"Amount received",true):total;
    if(payment<total)throw new Error("Amount received is less than total.");
    const item={id:"R-"+String(d.sequence++).padStart(5,"0"),date:now(),customerId:fields.customerId||null,method,lines:verified,total,cogs:money(verified.reduce((n,l)=>n+l.qty*l.cost,0)),tendered:payment,change:money(payment-total)};
    verified.forEach(l=>{requireProduct(d,l.productId).stock-=l.qty;});
    d.sales.unshift(item);return item;
  };
  const expense = (d,fields) => {
    const category=String(fields.category||"Other").trim();
    const date=String(fields.date||"").trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(new Date(date+"T12:00:00").getTime()))throw new Error("Choose a valid date.");
    const item={id:uid("EXP"),date,category,description:String(fields.description||"").trim(),amount:positive(fields.amount,"Expense amount")};
    d.expenses.unshift(item);return item;
  };
  const report = (d,month) => {
    const sales=d.sales.filter(s=>s.date.slice(0,7)===month), expenses=d.expenses.filter(e=>e.date.slice(0,7)===month);
    const revenue=money(sales.reduce((n,s)=>n+s.total,0)),cogs=money(sales.reduce((n,s)=>n+s.cogs,0)),overheads=money(expenses.reduce((n,e)=>n+e.amount,0));
    return {month,revenue,cogs,gross:money(revenue-cogs),expenses:overheads,net:money(revenue-cogs-overheads),salesCount:sales.length,sales,expenseEntries:expenses};
  };
  return {seed,customer,supplier,product,purchase,sale,expense,report,positive,whole,money};
})();
