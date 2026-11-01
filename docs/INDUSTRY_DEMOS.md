# Interactive Industry Demos — Fire Safety Pilot

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
