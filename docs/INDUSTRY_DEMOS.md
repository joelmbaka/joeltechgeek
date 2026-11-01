# Interactive Industry Demos

## Routes
- /demos — indexable gallery; currently lists only Fire Safety Ops
- /demos/fire-safety — indexable overview, role walkthrough, and launch button
- /demos/fire-safety/demo.html — independent full-screen interactive concept; noindex and nofollow
- /demos/fire-safety/favicon.svg — scoped concept favicon

## Source and integration
The functional demo is copied from joelmbaka/fire-safety-ops-demo, branch feat/demo-implementation, file public/demo.html.
No business logic, fictional data, roles, checklist validation, approval rules, sample certificate disclaimer, reminder preview, or reset behavior was intentionally changed.
Only palette, favicon path, and links back to the company demo overview were changed in the copied file.
The original HTML/CSS/JS implementation stays self-contained, preserving the source prototype; Next.js hosts the static document without merging the other repository's dependencies.

JoelTechGeek's portfolio, case-study data, other products, and RentPayor's separate demo pages are untouched.

## Manual review
1. Navigate from desktop/mobile site menus or /industries to /demos; open Fire Safety Ops and launch.
2. Confirm navy/green styling and working back-to-site link.
3. On desktop as Grace (Operations), open customer/equipment/job JOB-0241.
4. Switch to Kevin (Technician), complete five passing sample checks, submit.
5. Switch to Amina (Manager), approve and inspect the SAMPLE watermarked print/PDF view.
6. Reset, submit a failed result with an explanation, review as manager; check that no passing certificate is produced.
7. Preview maintenance reminder (not sent), test role switching and local persistence after refresh.
8. Reset restores seed data. Test 375 / 768 / 1024 / 1440px layouts, keyboard interactions, canonical URLs, and noindex on the raw demo.

No backend, database, real authentication, messages, real compliance records, or server sessions. Do not put genuine personal or operational information in a public browser-local demo.


## Retail & wholesale concept (added Nov 1, 2026)

- /demos/retail — indexable product walkthrough
- /demos/retail/demo.html — full-screen static browser application, noindex
- /demos/retail/styles.css — responsive JoelTechGeek-aligned palette, POS and receipt print styles
- /demos/retail/retail-core.js — pure sales, purchasing and inventory domain model, initial fictional data
- /demos/retail/retail-app.js — client-side render, navigation and event handlers
- /demos/retail/favicon.svg — scoped icon

GreenBasket General Store, its products, suppliers and transactions are fictional. The simulated Owner, Cashier, and Stockkeeper selectors change visible navigation only; they are NOT authentication or permission controls. Payment methods are mock Cash / M-Pesa and never initiate payment requests. Data lives only in browser localStorage under a different key from the fire-safety demo. Neither a backend nor a real payment provider is involved.

### Core logic checked during implementation
- Draft orders do not affect stock. Receiving asks for the actual units delivered for each product, up to the ordered remainder.
- Partial deliveries update inventory only by accepted quantities and keep the purchase order open.
- Each confirmed receipt is logged, and fully received orders cannot be received again.
- A cash checkout calculates change and decrements stock.
- Overselling and negative manual stock adjustments are rejected before mutation.
- Duplicate lines in a supplier order are rejected.
- Basic product identifiers and positive quantity/cost values are validated.

### Manual acceptance sequence
1. Open /demos. Confirm both Fire Safety Ops and GreenBasket Retail have separate cards and links.
2. Open /demos/retail, launch raw demo, and return via Back to JoelTechGeek.
3. As Alex (Owner), go to Purchasing and order 20 Cooking oil 1L from Citywide Distributors. Save a draft. Confirm stock has NOT increased yet.
4. Receive only 8 units first and confirm stock rises from 4 to 12 and order is Partially received. Reopen; enter 13 (must be rejected because only 12 remain), then receive the remaining 12. Stock becomes 24, and status becomes Received.
5. Switch to Miriam (Cashier), add 5 Cooking oil 1L units in POS, then pay KES 1,500 via simulated Cash. Confirm KES 75 change, quantity becomes 19, and sample receipt can be printed.
6. Return as owner to Reports. Confirm revenue and estimated gross profit reflect this sale.
7. Try to sell more units than remain; checkout/cart should prevent overselling.
8. As Daniel (Stockkeeper), review inventory and movements; create a fictional product and perform a reasoned stock adjustment.
9. Test simulated M-Pesa mode; confirm no real M-Pesa prompt or network payment.
10. Refresh to confirm browser-only persistence; reset to restore initial data.
11. Test 375, 768, 1024, 1440px viewports, keyboard focus, sample receipt printing, return navigation and noindex on raw demo.

Do not represent this fictional demo as a commercial deployment, real accounting report, or proof of payment. Preserve fire safety unchanged while reviewing retail.

### Retail developer checks

```bash
npm run test:retail-demo
npx tsc --noEmit
npx eslint .
npm run build
```

The repeatable tests use Node's built-in runner and no additional dependencies. Complete the browser/manual acceptance checklist before public deployment.

### Follow-up: stockkeeper and partial receiving

The Stockkeeper overview no longer displays a Point of Sale shortcut or an inaccessible Sales shortcut. The Cashier overview does not offer an inaccessible Purchasing shortcut. A purchase order can receive multiple partial deliveries; enter the quantity received now for each product (0 or blank for missing items). The number is limited to the outstanding ordered balance. A draft does not affect stock; receipts update quantities and a receipt history. Old browser-local orders are normalized without duplicating existing stock.


## Construction & site operations — Milliol-aligned demo (November 1, 2026)

Routes: /demos/construction (public introduction), /demos/construction/demo.html (standalone noindex mobile application), and scoped /demos/construction/{core.js,app.js,styles.css,favicon.svg}.

The SiteFlow Construction brand and all data are fictional. This is a **workflow-reference demo**, not a connection to Milliol's API, project database, employees, customers, or payment services. The source of workflow role boundaries is the current mobile implementation in joelmbaka/milliol-realtors on GitHub, particularly src/auth/permissions.ts, src/supply/supplyModel.ts, src/navigation/roleNavigation.ts and the Expo site work / stock / procurement / finance screens.

### Role-specific navigation

- Project Manager (Nia) maps to Milliol's leadership/Admin permissions: primary **Home / Review / Finance** tabs and a project drawer for **Work, Materials, Stock, Reports, Activity**. Reviews submitted work, progress, material requests, purchase orders and reports; financial information is read-only.
- Supervisor (Peter): **Work / Reports** tabs. Creates and submits Labour or Subcontract work items, records submitted progress with illustrative evidence, and submits site reports. A new work item becomes In progress only when Project Manager approves and starts it.
- Stockkeeper (Asha): **To do / Stock / History** tabs. Creates material requests linked to approved work, monitors requests and expected supplier deliveries, issues approved quantities, receives ordered materials in partial batches and records returns.
- Accountant (Samuel): **To do / Invoices / Payments** tabs and a project drawer for Purchase Orders and Work. The To do screen has **Create PO / Send / Pay** queues. Creates POs **only from approved uncovered material shortages**, sends Manager-approved POs (automatically creating the fictional payable) and records partial/final supplier payments.

### State transitions enforced in browser-local core

Work: Supervisor submission -> Awaiting approval -> Manager Approve & start or Return -> In progress -> Supervisor submits progress -> Manager approves/returns progress. Approved percent changes only when reviewed. Sample evidence attaches to progress submission; there is no upload endpoint.

Materials: Stockkeeper request -> Submitted -> Manager approves/returns -> Approved -> Stockkeeper issues available quantities (including partial issue); low stock stays in the request queue. Available stock is reduced only on issue. Returned stock increases the balance.

Purchasing: Accountant creates PO for an approved shortage -> Submitted -> Manager approves/returns -> Accountant sends approved PO -> Issued + one supplier payable -> Stockkeeper receives partial/remaining goods -> stock increases by accepted quantities. Over-ordering and double creation against the same uncovered shortage are prevented in the simulated state.

Finance: The Accountant sees supplier payables generated by issued POs and can record partial/final payments (never exceeding outstanding amount). Manager cannot execute payments. Received stock does not increase an invoice or count as a payment.

Reports: Supervisor submits a site report -> Manager approves/returns. Seed includes submitted and approved reports.

### Minimal scope and acceptance

A four-role, independently navigable mobile-shaped interface, shared fictional site, seeded pending/approved/in-progress/partially-received/partially-paid records, browser-local persistence/reset, sample evidence, role-checked mutations, and no live services. Excludes real uploads, crew attendance, subcontract certification accounting, invoice accounting journals, compliance, notifications, payments, project membership, transfers, and multi-project administration.

Acceptance: 
- Supervisor creates work and submits progress. Manager approves work and progress; approved percent changes only after review.
- Stockkeeper creates a material request. Manager approves. Accountant creates and submits a shortage PO. Manager approves it. Accountant sends it. Stockkeeper receives part/all goods and issues approved materials. No negative stock or over-receiving.
- Accountant records partial/final payments on the generated payable.
- Supervisor submits a report and Manager reviews it.
- All areas navigate freely (not a guided tour) and all four roles see the same records.

Run: npm run test:construction-demo. On the branch, tests cover workflows, role boundaries, navigation, storage, and simulated documents. Run npm run build and visual browser QA locally before production. Other industry demos must remain untouched.

## Field Services & Maintenance — Northstar demo (November 1, 2026)

- /demos/field-services — indexable industry introduction and four-role walkthrough
- /demos/field-services/demo.html — browser-only interactive static page, noindex / nofollow
- /demos/field-services/core.js — pure ticket, dispatch, checklist, stock, review, invoicing and payment rules
- /demos/field-services/app.js — role-based interactive UI, scoped localStorage persistence
- /demos/field-services/styles.css — responsive JoelTechGeek palette, printable sample invoice
- /demos/field-services/favicon.svg — scoped concept favicon

All Northstar people, customers, addresses, assets, visits, parts, prices, work, invoices, and payments are fictional. Role selection is for demonstrations, not actual authentication or permission protection. Payment marking is simulated with no gateway or M-Pesa network calls. No real customer notifications, work scheduling, finance records, maintenance compliance certificates or equipment inspections.

### Recommended scenario
1. Open the Field Services demo. Grace (Dispatcher) creates a service request for Harbor Point Offices' HVAC unit; assign it to Daniel with a visit date.
2. Switch to Daniel (Technician), start the assigned job. Record one Air filter 20 × 20, and confirm inventory reduces by one.
3. Submit a four-item Pass service checklist with notes and labour hours. Switch to Nia (Service Manager), review and approve; confirm unapproved jobs cannot be billed.
4. Switch to Amina (Billing). Generate a sample invoice from the approved job; inspect line items and printable demo disclaimer. Record a simulated Cash payment; confirm both invoice and service job show Paid and reports update.
5. Reset. Try submitting one checklist result as Attention; manager approval must be blocked. Return with a reason, resume as technician, submit all Pass, and approve.
6. Test overselling parts, blank/invalid checklists, malformed customer requests, incomplete assignment, duplicate invoices and duplicate payments. These must leave data unchanged.
7. Refresh to confirm local browser state and reset to restore. Check 375 / 768 / 1024 / 1440 px, keyboard interactions and printer view.
8. Verify all four industry cards coexist, field-services source assets are noindex, and no existing Fire Safety, Retail or Construction demo routes changed.

### Developer checks
- npm run test:field-services-demo
- npx tsc --noEmit
- npx eslint .
- npm run build


## Four workflow-based, neutrally named minimal demos (November 1, 2026)

The remaining industry demos are intentionally small and self-contained. Existing software was inspected to understand workflows only; demo titles, metadata and interfaces use neutral industry names, not those products' brand names. Their UI uses one shared static engine, four industry-specific workflow scripts, and a shared responsive theme.

| Industry | Public demo title | URL | Scope |
|---|---|---|---|
| Logistics | Cargo Dispatch | /demos/logistics | Post load → driver booking → dispatch assignment → in transit → delivery-note reference → close |
| School finance | School Fee Management | /demos/education | Three linked children, pre-issued grade-term invoices with add-ons → sample parent checkout → immediately updated finance ledger and balances |
| Rent | Rental Management | /demos/property | Mobile Rent / Leases / Tenants / Portfolio → manual received rent and receipts → payments, expenses, owner position |
| Healthcare | Clinic Operations | /demos/healthcare | Fictional patient → OPD encounter → triage handoff → service → sample bill → fake payment |

Source workspaces were reviewed for process understanding, not public branding. These mini demos are standalone concepts, **not** copies of production applications or live integrations. School fees exclude academics and attendance; rentals use manager and finance roles without mandatory tenant login; clinic operations exclude real clinical decisions or patient records; logistics records sample delivery references without uploads or live GPS.

Architecture:
- public/demos/shared/minimal-engine.js — consistent role-switching, simple forms, step sequencing, safe HTML escaping, record tables, data persistence and reset.
- public/demos/shared/minimal.css — responsive workspace theme.
- public/demos/{logistics,education,property,healthcare}/demo.js — product-specific state, steps, validation, calculations and sample records.
- public/demos/{logistics,education,property,healthcare}/demo.html — isolated noindex concept routes.
- app/demos/{logistics,education,property,healthcare}/page.tsx — indexable explanations, launch links and workflow guides.
- app/demos/page.tsx — all 8 industry entries.

All sample names, invoices, payment references, cargo loads, truck capacities, properties and OPD records are fictional. No real M-Pesa, bank APIs, transport tracking, medical information or patient workflow is accessed.

### QA
- npm run test:mini-demos
- npx tsc --noEmit
- npm run build
- Open the 4 /demos/<industry>/demo.html routes, complete every guided step and switch role, refresh/persist and Reset.
- School fees must reconcile partial payments and preserve credit; rental management must allocate partial payments without double-counting and reject duplicate refs; logistics must enforce truck capacity and delivery states; clinic operations must gate invoicing behind completed OPD services and prevent duplicate payments.

Public naming rule: these four concepts must never display the exact names of the source applications in gallery cards, overview pages, raw HTML, browser titles, or in-demo headers. Use neutral industry workflow titles consistently.


## Operational UI revision — Cargo and shared industry demos

Public branding remains neutral. Cargo Dispatch now has its own two-account mobile presentation, with Grace (Dispatcher) and Kevin (Driver). It no longer uses the shared mini demo engine or its old numbered form source.

- Cargo dispatcher: post/edit/delete open loads; set pickup and delivery with location dropdowns; specify cargo weight, estimated route miles, container reference and driver pay in KES; see all statuses; approve booked loads; view simulated fleet locations and miles; mark completed driver payments as simulated.
- Cargo driver: browse available loads, book only one at a time, and progress an approved trip through Picked up, In transit, Delivered, and Complete upon empty-container return to Mombasa Port.
- Evidence: visible sample pickup-photo placeholder before pickup, delivery-note placeholder before delivery, and Equipment Interchange Receipt (EIR) placeholder before completion. No camera, file, or network upload exists.
- Cargo seed includes loads across Open, Booked, Assigned, Picked up, In transit, Delivered and Complete. All locations and mileage are simulated; no GPS, notifications, telematics or payment gateway.
- Cargo source: public/demos/logistics/core.js, app.js, styles.css and demo.html. Old logistics/demo.js has been retired.
- Clinic Operations retains its original fictional mini-demo workflow. School Fee Management and Rental Management now have standalone mobile interfaces with domain-specific navigation. Their internal configuration is now called actions instead of steps.
- Public industry landing pages present role capabilities, not numbered walkthroughs. Guided blocks were also removed from the Construction and Field Services app overviews.

Validation: npm run test:cargo-demo, npm run test:mini-demos, npm run test:construction-demo, npm run test:field-services-demo, and npm run build. Browser visual QA remains necessary.


### Cargo Dispatch navigation redesign (Macsim workflow reference)

The Cargo demo uses a **neutral brand** and a distinct muted teal theme, but its mobile navigation and information hierarchy were adapted from the existing mobile implementation after reviewing the dispatcher/staff, driver and admin areas in the reference repository. In particular, the shared tab structure is now **Board / Active / History**, rather than Overview / Loads / Fleet / Payments.

- **Board:** load cards prioritize pickup → destination, container feet, tonnage, driver pay (KSH), full-trip sample distance and reservation status. Search works by route, container, driver and truck. Grace gets a New Load action and an additional status filter; Kevin sees open and his own reserved loads.
- **Active:** assigned, picked-up, in-transit and delivered loads. Driver actions live in the per-load detail screen, not directly on a guided task board.
- **History:** completed deliveries, evidence placeholders, and payment status.
- **Load detail:** full-screen nested route with back navigation, operational fields, driver/truck and sample location data, document placeholders, allowed actions, and activity timeline.
- **Create/edit:** a full-screen form with container feet/number, weight, pickup and destination dropdowns, consignee, empty-return depot, driver pay and trip mileage.
- **Dispatcher drawer:** Fleet, Drivers, Finance, Locations, Consignees and Settings are accessible as regular navigable screens. Admin-style management capabilities are represented through Grace; there is no third login role.
- **Driver bookings:** single active/pending reservation at a time; pending booking may be cancelled; dispatcher may approve or decline. Pickup-photo placeholder is required before pickup, delivery note before delivery, and EIR placeholder before completion. Completion releases the truck for another booking.

All content remains fictional and browser-local; photo/document displays are illustrative records, not uploaded files, and truck locations, mileage and payments are not connected to live services. No notifications are implemented.

QA: `npm run test:cargo-demo` covers the rebuilt full mobile navigation and lifecycle; `npm run build` and manual viewport/browser review remain appropriate before shipping.


## School finance demo — SchoolPey workflow alignment (November 1, 2026)

The School Fee Management demo is a fictional, standalone browser-local concept. It is not a connected SchoolPey account, does not access SchoolPey backend or production data, and never creates a real STK request or handles live money. SchoolPey's current parent mobile tabs, invoice detail, payment checkpoint and staff finance pages were used as references. No SchoolPey branding appears on public demo pages.

### Scope (existing school and student fee configuration)

- One fictional existing school: Cedar Grove Academy. Academic year 2026, Term 3, with immutable grade-specific example base fee plans for Grade 2, Grade 5 and Grade 8, plus read-only lunch, transport and examination support add-on options.
- Six enrolled fictional students across those three grades. One sample parent Mary Otieno is linked to exactly three: Amani (Grade 2), Brian (Grade 5), Zuri (Grade 8). Other students are visible only to the Finance view.
- Nine pre-issued Term 2 and Term 3 invoices; sample paid, partially paid, overdue and unpaid states, plus five existing reconciled sample payment receipts. Issued invoice line snapshots contain base fee and add-on categories, and amounts do not change after payment.

### Only two role workspaces

- Mary (Parent), mobile tabs Fees / Payments / Children. Fees supports Open / Paid / All filters. Child view exposes financial history. Invoice detail shows remaining amount, issue/due dates, original base/add-on line items, paid amount, and payment history.
- David (Finance), mobile tabs Overview / Invoices / Payments / Students. Overview computes issued, collected, outstanding and settled totals from the same shared ledger; grade structures and add-ons display read-only. Invoices include search, status filters, per-student balances, and invoice details; Payments contains receipts; Students lists six learners and school balances.
- Admin, school/org creation, fee-plan creation, grade management, and billing-generation screens are deliberately absent.

### Sample checkout behavior

Parent selects an issued, outstanding invoice and taps Pay with M-Pesa; checkout defaults to the entire current outstanding balance and phone 0722000011, accepting a smaller whole-KES amount. Clicking Confirm sample payment simulates completed provider confirmation + canonical allocation/receipt atomically in browser state. This educational shortcut is **not** the real SchoolPey mobile asynchronous provider callback/reconciliation process.

- Parent can pay only invoices belonging to their three linked children. Finance cannot initiate a parent checkout.
- Amount is strictly greater than zero, a whole KES number, and no more than current invoice balance. Zero-balance invoices cannot be paid again. A fictional request ID prevents duplicate allocation.
- Every completed checkout creates one fictional payment, reconciled ledger record and receipt with reference SIM-MPESA-..., immediately increments amount paid and reduces outstanding balance; partial remains open, full becomes Paid.
- All finance totals, records, and parent fees/payment history are derived from the same local state, persisted in a separate demo localStorage key and resettable.
- No uploaded files, real M-Pesa STK prompt, bank calls, genuine receipts, credit creation, or live student data.

### Source and checks

- public/demos/education/{core.js,app.js,styles.css,demo.html}; the obsolete public/demos/education/demo.js / shared minimal engine use was removed.
- tests/school-demo.test.cjs; run npm run test:school-demo.
- tests/mini-demos.test.cjs now covers only the unchanged Clinic Operations demo; the Property and School demos have dedicated regression suites.
- Build/visual browser review locally with npm run build / npm run dev before shipping. Other industry apps and demos are untouched.


## Property / rent demo — RentPayor mobile workflow alignment (November 1, 2026)

Routes: public /demos/property, standalone noindex /demos/property/demo.html.
Source: public/demos/property/{core.js,views.js,app.js,styles.css,demo.html}.
Acceptance suite: npm run test:property-demo.
Source reference inspected: joelmbaka/rentpayor branch continuous-improvement, notably app/(app)/_layout.tsx, invoices/index.tsx, invoices/[invoiceId].tsx, leases, tenants, properties, units, payments.tsx and financials/index.tsx.

The Rental Management concept is completely fictional, browser-local, and not connected to RentPayor APIs or real tenants. Only JoelTechGeek's Beach Sunset colors are used; reference product branding is excluded from public pages.

### Mobile structure

- Exactly two fictional demo accounts, selectable in the mobile header: **Anne (Property Manager)** and **Alex (Tenant)**. No Finance account. They share the same browser-local records.
- Property Manager tabs: Rent, Leases, Tenants, Portfolio. The Rent filters include **Status, Period, Property and Tenant**. Tenants can be chosen individually to narrow open invoices.
- Property Manager in-phone drawer: **Collections & records** → Payments, Expenses, Accounting; **Operations** → Invoice history. They remain manager features, not a separate Finance role.
- Rent overview displays collected and invoiced in November, total outstanding, unit occupancy, search, and status/month/property filtering. Overdue invoices precede due invoices. Existing paid invoices appear under invoice history.
- Leases show active leases and linked invoices; Tenants show phone, unit, history and tenant credit; Portfolio lists properties, occupancy, units, and a standalone unit.

### Seed and actions

- Two fictional properties, six units (five occupied, one vacant), five tenants, five active monthly leases, ten current and historical rent invoices, prior payment records and two property expenses.
- Invoice details show lease-derived rent and service charge, tenant/property/unit, billing period, due date, paid amount, outstanding, payment activity and receipts.
- **Record manual payment** simulates rent *already received externally*, by bank, M-Pesa outside the demo, or cash, including transaction date, receiving account and unique reference. The demo allocates to the chosen invoice immediately; partial payment reduces the balance, full payment settles it; overpayment becomes separate tenant credit. There is no real collection in this manager workflow.
- Clicking a payment presents a fictional receipt showing received/applied/credit, payer, unit, source and reference; records update the shared rent dashboard and ledger.
- A vacant unit creates a lease assigned **only to Alex Wanjiru (`T-101`)**. Alex is fixed and read-only in the form, reusing his existing tenant record. The optional first November invoice and every new lease appear in his Tenant account (including multiple active leases).
- The Expenses drawer screen records fictional property costs; Accounting shows read-only illustrative owner positions derived from rent and expenses (not accounting journals, distributions, tax or full general ledger). Invoice history lists paid invoices.

- Tenant tabs: **My rent / Payments / My lease**. Alex sees only his own invoices (current and historical), payments, receipts, and lease details. Tenant screens are scoped to Alex: My rent now includes a **Pay now** button on open invoices, leading to a simulated M-Pesa checkout (sample `0722000011`, prefilled balance, partial/full payments, fictional receipt, no real STK or money). Manager-only actions remain blocked.

No real tenant authentication, real payments, notifications, actual document sharing, real maintenance/issue workflows, real bank accounts, or API calls. The mobile UI is independently navigable, not a guided demo, with browser-local persistence and reset. Run the full Next build and browser visual QA locally before merging/deploying.
