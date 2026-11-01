const retailCore = (function retailCore() {
  const uuid = (prefix) => prefix + "-" + ((typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase() : (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).toUpperCase());
  const iso = () => new Date().toISOString();
  const integer = (value, name, min = 0) => {
    const n = Number(value);
    if (!Number.isInteger(n) || !Number.isFinite(n) || n < min) throw new Error(name + " must be a whole number of at least " + min + ".");
    return n;
  };
  const amount = (value, name, min = 0) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < min) throw new Error(name + " must be at least " + min + ".");
    return Math.round(n * 100) / 100;
  };
  const seed = () => {
    const products = [
      {id:"P-101", sku:"GB-101", name:"Maize flour 2kg",category:"Food",stock:16,reorder:10,cost:135,price:180,supplierId:"S-1"},
      {id:"P-102", sku:"GB-102", name:"Cooking oil 1L",category:"Food",stock:4,reorder:8,cost:214,price:285,supplierId:"S-1"},
      {id:"P-103", sku:"GB-103", name:"Fresh milk 500ml",category:"Dairy",stock:28,reorder:12,cost:49,price:70,supplierId:"S-2"},
      {id:"P-104", sku:"GB-104", name:"Sugar 1kg",category:"Food",stock:3,reorder:8,cost:132,price:175,supplierId:"S-1"},
      {id:"P-105", sku:"GB-105", name:"Bread 400g",category:"Bakery",stock:18,reorder:9,cost:48,price:70,supplierId:"S-2"},
      {id:"P-106", sku:"GB-106", name:"Rice 2kg",category:"Food",stock:14,reorder:7,cost:242,price:335,supplierId:"S-1"},
      {id:"P-107", sku:"GB-107", name:"Tea leaves 250g",category:"Beverages",stock:5,reorder:6,cost:162,price:220,supplierId:"S-1"},
      {id:"P-108", sku:"GB-108", name:"Laundry soap 175g",category:"Home care",stock:32,reorder:12,cost:54,price:85,supplierId:"S-3"}
    ];
    const suppliers = [
      {id:"S-1",name:"Citywide Distributors",contact:"Procurement desk"},
      {id:"S-2",name:"Sunrise Fresh Supply",contact:"Dispatch coordinator"},
      {id:"S-3",name:"BrightHome Wholesale",contact:"Trade desk"}
    ];
    const now = new Date();
    const hourAgo = (h) => new Date(now.getTime()-h*3600000).toISOString();
    const seedSale = (id, ago, method, items, cashier) => {
      const lines=items.map(([pid,qty]) => {
        const p=products.find(x=>x.id===pid);
        return {productId:p.id,name:p.name,sku:p.sku,qty,price:p.price,cost:p.cost};
      });
      return {id,createdAt:hourAgo(ago),method,reference:method==="M-Pesa"?"SIM-MP-001":"SIM-CASH-001",lines,total:lines.reduce((sum,x)=>sum+x.qty*x.price,0),cashier,tendered:method==="Cash"?1000:null,change:method==="Cash"?1000-lines.reduce((sum,x)=>sum+x.qty*x.price,0):0};
    };
    return {
      version:1,
      products, suppliers,
      purchaseOrders:[{id:"PO-001",supplierId:"S-1",lines:[{productId:"P-106",qty:10,cost:242}],status:"Received",createdAt:hourAgo(38),receivedAt:hourAgo(28)}],
      sales:[
        seedSale("SALE-002",1.25,"M-Pesa",[["P-102",1],["P-105",2]],"Miriam · Cashier"),
        seedSale("SALE-001",2.5,"Cash",[["P-101",2],["P-103",1]],"Miriam · Cashier")
      ],
      movements:[{id:"MOVE-001",productId:"P-106",delta:10,reason:"Received purchase PO-001",createdAt:hourAgo(28),reference:"PO-001"}]
    };
  };
  const lookup = (d,id) => d.products.find(p=>p.id===id);
  function checkout(d,cart,method,tendered,cashier) {
    if(!Array.isArray(cart)||!cart.length)throw new Error("Add at least one item before checkout.");
    if(!["Cash","M-Pesa"].includes(method))throw new Error("Choose a supported simulated payment method.");
    const unique=new Set(), lines=[];
    for(const line of cart){
      const p=lookup(d,line.id),qty=integer(line.qty,"Quantity",1);
      if(!p)throw new Error("A product could not be found.");
      if(unique.has(p.id))throw new Error("Duplicate product in cart.");
      unique.add(p.id);
      if(p.stock<qty)throw new Error(p.name+" has only "+p.stock+" units available.");
      lines.push({productId:p.id,name:p.name,sku:p.sku,qty,price:p.price,cost:p.cost});
    }
    const total=lines.reduce((n,x)=>n+x.qty*x.price,0);
    const paid=method==="Cash"?amount(tendered,"Cash received",total):null;
    const sale={
      id:uuid("SALE"),createdAt:iso(),lines,total,method,
      reference:method==="M-Pesa"?uuid("SIM-MP"):uuid("SIM-CASH"),
      tendered:paid,change:paid===null?0:Math.round((paid-total)*100)/100,
      cashier:String(cashier||"Demo cashier")
    };
    for(const line of lines){
      const p=lookup(d,line.productId);
      p.stock-=line.qty;
      d.movements.unshift({id:uuid("MOVE"),productId:p.id,delta:-line.qty,reason:"Retail sale "+sale.id,reference:sale.id,createdAt:sale.createdAt});
    }
    d.sales.unshift(sale);
    return sale;
  }
  function createPurchase(d,supplierId,requestedLines){
    if(!d.suppliers.some(s=>s.id===supplierId))throw new Error("Select a valid supplier.");
    if(!Array.isArray(requestedLines)||!requestedLines.length)throw new Error("Add at least one product to the purchase order.");
    const unique=new Set();
    const lines=requestedLines.map(l=>{
      const p=lookup(d,l.productId), qty=integer(l.qty,"Order quantity",1),cost=amount(l.cost,"Unit cost",0.01);
      if(!p)throw new Error("The selected product does not exist.");
      if(unique.has(p.id))throw new Error("Each product can only appear once. Adjust its quantity instead.");
      unique.add(p.id);
      return {productId:p.id,qty,cost};
    });
    const po={id:uuid("PO"),createdAt:iso(),supplierId,lines,status:"Draft",receivedAt:null};
    d.purchaseOrders.unshift(po);
    return po;
  }
  function receivePurchase(d,id){
    const po=d.purchaseOrders.find(p=>p.id===id);
    if(!po||po.status!=="Draft")throw new Error("Only draft purchase orders can be received.");
    for(const line of po.lines){
      const p=lookup(d,line.productId);
      if(!p)throw new Error("This purchase contains an unknown product.");
    }
    const receivedAt=iso();
    for(const line of po.lines){
      const p=lookup(d,line.productId),previous=p.stock;
      p.cost=Math.round(((previous*p.cost)+(line.qty*line.cost))/(previous+line.qty)*100)/100;
      p.stock+=line.qty;
      d.movements.unshift({id:uuid("MOVE"),productId:p.id,delta:line.qty,reason:"Received purchase "+po.id,reference:po.id,createdAt:receivedAt});
    }
    po.status="Received";po.receivedAt=receivedAt;
    return po;
  }
  function addProduct(d,fields){
    const name=String(fields.name||"").trim(),sku=String(fields.sku||"").trim().toUpperCase(),category=String(fields.category||"General").trim();
    if(name.length<2||name.length>80)throw new Error("Enter a product name between 2 and 80 characters.");
    if(!/^[A-Z0-9-]{3,24}$/.test(sku))throw new Error("SKU must contain 3–24 letters, numbers, or dashes.");
    if(d.products.some(p=>p.sku===sku))throw new Error("That SKU already exists.");
    if(!d.suppliers.some(s=>s.id===fields.supplierId))throw new Error("Choose a valid supplier.");
    const stock=integer(fields.stock,"Opening stock",0),reorder=integer(fields.reorder,"Reorder level",0),price=amount(fields.price,"Selling price",0.01),cost=amount(fields.cost,"Purchase cost",0);
    const p={id:uuid("P"),name,sku,category,stock,reorder,price,cost,supplierId:fields.supplierId};
    d.products.unshift(p);
    if(stock>0)d.movements.unshift({id:uuid("MOVE"),productId:p.id,delta:stock,reason:"Opening balance",reference:p.id,createdAt:iso()});
    return p;
  }
  function adjust(d,id,rawDelta,reason){
    const p=lookup(d,id),delta=Number(rawDelta),note=String(reason||"").trim();
    if(!p)throw new Error("Product not found.");
    if(!Number.isInteger(delta)||delta===0)throw new Error("Enter a positive or negative whole-number adjustment.");
    if(p.stock+delta<0)throw new Error("An adjustment cannot make stock negative.");
    if(note.length<4||note.length>160)throw new Error("Explain the stock adjustment (4–160 characters).");
    p.stock+=delta;
    d.movements.unshift({id:uuid("MOVE"),productId:p.id,delta,reason:note,reference:"Manual adjustment",createdAt:iso()});
    return p;
  }
  function metrics(d){
    const sold=d.sales.reduce((s,x)=>s+x.total,0);
    const gross=d.sales.reduce((s,sale)=>s+sale.lines.reduce((n,x)=>n+(x.price-x.cost)*x.qty,0),0);
    return {revenue:sold,margin:gross,units:d.products.reduce((s,p)=>s+p.stock,0),stockValue:d.products.reduce((s,p)=>s+p.stock*p.cost,0),low:d.products.filter(p=>p.stock<=p.reorder).length,orders:d.purchaseOrders.filter(p=>p.status==="Draft").length,transactions:d.sales.length};
  }
  function reportProducts(d){
    const m=new Map();
    for(const sale of d.sales)for(const l of sale.lines){
      const s=m.get(l.productId)||{productId:l.productId,name:l.name,qty:0,revenue:0,profit:0};
      s.qty+=l.qty;s.revenue+=l.qty*l.price;s.profit+=l.qty*(l.price-l.cost);m.set(l.productId,s);
    }
    return [...m.values()].sort((a,b)=>b.revenue-a.revenue);
  }
  return {seed,checkout,createPurchase,receivePurchase,addProduct,adjust,metrics,reportProducts};
})();
