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


## Construction & site operations concept (Nov 1, 2026)

- /demos/construction — public indexable SiteFlow overview and suggested walkthrough
- /demos/construction/demo.html — full-screen concept app, noindex and nofollow
- /demos/construction/core.js — fictional project data, validated transitions and cost calculations
- /demos/construction/app.js — simulated role-based interfaces and browser-local state
- /demos/construction/styles.css — responsive theme and mobile role navigation
- /demos/construction/favicon.svg — scoped concept icon

SiteFlow Construction is not connected to the separate commercial Milliol Construction Manager project and includes no proprietary or production data from any existing construction customer. Amani Heights, Horizon Buildworks, budgets, staff, suppliers, and stock are fictional.

### Simulated role workflows
- Supervisor: record material requests against tasks and enter increasing progress percentages with notes.
- Project Manager: approve or reject pending requests, draft material purchase orders, review reports.
- Storekeeper: issue no more than approved quantities and stock on hand; receive partial supplier deliveries and review stock movements.
- Accountant: record fictional direct site expenses and review sample costs and reports.

All transitions mutate only this browser's localStorage. Role switching is **not** authenticated permission control. Neither payment processing, statutory compliance, messaging, real cost accounting, supplier ordering nor real construction inspections occur.

Budget reporting intentionally counts **issued material consumption at the unit cost when issued**, plus explicitly entered direct site expenses. It does not double count inventory purchases. Figures are illustrative and are not official finance statements.

### Construction demo acceptance
1. Visit /demos and verify Fire Safety, Retail and SiteFlow each have separate cards. Open /demos/construction and launch the full-screen demo.
2. Supervisor: create a material request for 12 Cement 50 kg bags against Ground floor slab, with a note. Confirm Pending and no stock deduction.
3. Manager: approve the request, then confirm the request is Approved without stock deduction.
4. Storekeeper: issue 5 bags. Confirm Partially issued; stock decreases by 5; try issuing more than the approved remainder, which must be blocked. Then issue the remaining 7.
5. Supervisor: record updated progress on Ground floor slab. Confirm reports and activity update.
6. Manager: create a supplier order for 30 cement bags. Confirm a Draft does not affect stock.
7. Storekeeper: receive 12 bags. Confirm Partially received; enter 19 for the second delivery (must fail), then 18 to finish.
8. Accountant: record KES 4,200 in Site logistics. Confirm expenses and project direct-cost report increase.
9. Verify no cross-role navigation links to inaccessible pages, and test return navigation, refresh persistence and Reset demo.
10. Check at mobile/tablet/desktop widths (375, 768, 1024, 1440 px), keyboard controls, sitemap and noindex header on raw HTML.

No changes to the Fire Safety or Retail application assets are intended in this construction addition.


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
