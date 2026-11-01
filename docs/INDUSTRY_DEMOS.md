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
