# JTG CRM — Unified Work Queue & Lead Context Redesign
**Date:** 2026-11-05 (Africa/Nairobi)
**Repository:** `joelmbaka/joeltechgeek`
**Development branch:** `mobile`
**Status:** Code implemented and committed; PostgreSQL additive migrations applied; production deployment and full Android/web build + device acceptance still to verify.

## Product decisions
A lead's **sales stage** is separate from its **daily eligibility**. A sales rep should work a queue and immediately advance to another eligible lead after logging an outcome. Prospects called unsuccessfully last week or months ago remain eligible when their retry interval expires. There is **no Waiting state**; promise-to-reply scenarios use scheduled follow-ups.

### Unified View (replaces overlapping Queue and Sort)
- **For You (default):** due tasks plus active leads requiring attention, excluding ordinary records worked earlier today; incomplete due tasks remain actionable.
- **To Call:** valid callable contact; new leads, eligible retries, or explicitly due typed `Call` follow-ups.
- **Follow-ups:** all active scheduled actions, future and overdue, ordered by due date.
- **Done Today:** leads with an outreach/action-completed event during the user's *local* calendar day.
- **High Priority:** active high-priority leads, due work first.
- **All Leads:** includes won/lost/competitors/do-not-contact, with optional A–Z toggle.
Search checks all work views, even when a lead is hidden as scheduled or Done Today. The separate business-category filter is retained.

### Calling eligibility
- 1–2 consecutive `no_answer`, `switched_off` or `busy` calls: next local calendar day.
- 3–4 consecutive failures: after 3 local calendar days.
- 5+ failures: manual review; create an explicit scheduled Call action to retry.
- `wrong_number` / `number_unavailable`: blocked until a valid different phone is recorded.
- New calls snapshot the selected `called_phone`, enabling safe change-of-number detection for later calls; historical events are deliberately not rewritten.
- Future scheduled actions override automatic retries; explicitly due typed Call actions become callable when due (subject to valid contact/number).
- Successful conversations reset the consecutive-failure sequence. Work is derived from existing event history, scoped to a contact when selected, with careful fallback for legacy unassigned calls.
- Due Call follow-ups are completed when a matching call is recorded through the supported new clients; unrelated outstanding actions are preserved.
- Queue/date eligibility is calculated by PostgreSQL using the request's validated IANA time zone, not a hard-coded Nairobi date or a daily cron.

### Lead card and detail
- Card: company/individual identity, contact/category, priority/stage, concise persistent brief, last interaction, next action/due date, and work-state hint.
- `lead_brief`: up to 220 chars, user-editable; `problem_summary` is a safe fallback for existing research.
- `important_details`: optional free-form long-lived context (up to 5,000 chars).
- `lead_facts`: up to 12 generic labeled facts (labels <=80, values <=300); no hardcoded industry fields.
- Activity notes remain timestamped and *separate* from the persistent context.
- Typed next action `call | email | whatsapp | meeting | other` is stored on the lead and on **new** action-history events. Historical untyped actions stay untyped.
- Lead Detail: persistent brief and summary, contact and next action, outreach form, independent follow-up form, generic facts, contacts, and expandable history.
- **Save & Stay** / **Save & Next** on Android and web. Save & Next navigates into the `To Call` view after saving and respects the category filter, avoiding loops in All Leads. A save failure must not advance the user.
- Android reminders remain informative but short: company/target contact title and next action body; no scheduled time or timezone in notification text. 9 AM user-local default (and same-day +10 min when needed) still schedules internally. Reminder date/time remains visible in Lead Details/history.

## Changed code (high-level)
- Queue SQL and API: `lib/agent-crm/work-queue.ts`, `app/api/agent-crm/leads/route.ts`.
- Typed actions: `lib/agent-crm/action-types.ts`; lead create/activity/follow-up/complete routes.
- Editable lead context and facts: `lib/agent-crm/lead-facts.ts`, `app/api/agent-crm/leads/[id]/brief/route.ts`.
- Shared models/columns: `lib/agent-crm/types.ts`, `lib/agent-crm/db.ts`, `mobile-app/src/lib/types.ts`.
- Android: `mobile-app/src/app/index.tsx`, `mobile-app/src/app/leads/[id].tsx`, `mobile-app/src/app/leads/new.tsx`.
- Web: `app/crm/CrmClient.tsx`, `app/crm/AddLeadModal.tsx`.
- Tests: `tests/agent-crm-workflow-redesign.test.cjs`; existing CRM reminder tests remain.
- CI: `.github/workflows/crm-workflow-ci.yml` for web/mobile type checks and CRM tests on changes to `mobile`.

## Applied PostgreSQL migrations (project `small-scene-46266045`, database `neondb`)
These additive changes have already been applied to the **production database**; do not reapply manually unless checking migration parity.
1. `migrations/2026-11-05-crm-workflow-redesign.sql`: brief, details, action type, call history indexes.
2. `migrations/2026-11-05-crm-lead-facts.sql`: JSONB labeled facts.
3. `migrations/2026-11-05-crm-called-phone.sql`: called-phone snapshot on new events.
4. `migrations/2026-11-05-crm-action-type-history.sql`: action type on new event/follow-up history rows.
All previous leads, contact records, research notes, activity events and follow-ups were preserved. No mass rewrite of untyped historical actions or notes.

## Verification to date
- The generated work queue SQL was evaluated directly in a **read-only production Neon SELECT** and passed after the final contact-number corrections.
- The queue returned plausible aggregates on the large existing owner account (approximately 1,145 leads at verification); exact view counts are time-dependent.
- The updated read-only merged activity-history SQL executed successfully and included the `next_action_type` field.
- New fields were confirmed present in production Neon, and all schema changes above are additive.
- The `mobile` branch has repository test scripts and GitHub workflow checks.
- **Not yet verified:** successful GitHub CI run, full `tsc` checks in a checked-out repository, deployed Vercel API behavior, Android runtime UI, real notification delivery in new flow, and end-to-end Review Access tests.

## Local verification checklist (no new native dev APK expected)
First preserve local uncommitted changes (commit or stash), then fast-forward:
```bash
cd ~/Dev/joeltechgeek
git status
git pull --ff-only origin mobile
npm ci
npm run test:crm-workflow
npm run test:crm-reminder-defaults
npm run test:crm-reminder-content
npm run test:crm-phase5
npx tsc --noEmit

cd mobile-app
npm ci
npx tsc --noEmit
npx expo start --dev-client -c
```
Start the Next.js backend in a separate terminal using `npm run dev` from the repository root. Confirm the development app points to that backend. Only deploy to Vercel and Expo OTA **after** passing verification.

## Review Access acceptance plan
1. Log in with **Review Access**; do not test by modifying unrelated production/customer leads.
2. Verify For You, To Call, Follow-ups, Done Today, High Priority and All Leads on both Android and web.
3. Check global search finds a lead that is outside For You. Check All Leads alphabetical toggle.
4. Add a test lead with short brief, important details, and labeled facts; open card and details to verify presentation.
5. Record a first Call → No Answer. It should leave To Call today and be eligible on the following *local* calendar day.
6. Log additional unsuccessful calls on successive eligible days / controlled test fixtures: after third and fourth attempts, expect a 3-day cooldown; after fifth, expect review. Do not manipulate production device/server clocks casually.
7. Record `wrong_number`, correct that contact's phone, and verify eligibility resets for newly snapshotted calls.
8. Add a typed **Call** follow-up for the near future, then log that call when due. Verify its task is completed; an unrelated **Email** task is never auto-completed by a call.
9. Test Save & Stay and Save & Next repeatedly in To Call and after opening from All Leads; verify no loops and no advance on failed save.
10. Test individual leads without companies, multi-contact leads, closed leads, and contact attribution.
11. Confirm reminders still schedule and notification text contains identity + next action only.
12. Confirm web/mobile History explicitly distinguishes **Recorded** and **Reminder due** and shows action type on newly-created records.

## Important compatibility and intentional limits
- Existing date-only follow-ups already received the 9 AM backfill in earlier work. Existing **untyped** scheduled follow-ups remain available in For You/Follow-ups but are not **guessed** to be Call tasks; edit them to select Call when appropriate.
- Old `wrong_number` events have no phone snapshot. Do not infer a historic dialed number from the *current* contact phone. A newly logged call will populate the snapshot; explicit typed follow-up/manual review remains possible for legacy records.
- One active next action per lead is still the MVP model, not multiple simultaneous tasks.
- Local Expo notifications are reconciled on login/resume/edits; no server-pushed background reminders were added.
- No new native notification permissions or dependencies were added. Existing development build should work with the updated JS, once local backend and Expo are restarted.
- CI and deployment status must be checked: a Git commit is **not** a Vercel deployment or a published OTA.

## Next chat handoff
**Suggested opening:** "Continue the JTG CRM unified work queue redesign on branch `mobile`. Read `docs/crm-workflow-redesign-handoff.md` first. Verify GitHub CI and run the web/mobile TypeScript tests; fix any failures. Then run the Review Access end-to-end test plan before Vercel/Expo deployment. Preserve existing CRM data and note any deviations."

Do not conflate code completeness with deployment or device acceptance.

## Play Review fixture data (November 5, 2026)
Production Neon Review Access account has **33 isolated demo leads**: 12 retained and 21 new workflow fixtures. Each has a lead brief and structured facts, 21 have callable demo numbers, and 10 have typed follow-ups. All six work views return nonzero results using current Nairobi-local dates. For detailed scenario expectations, safeguards, and the fact that counts are time dependent, read [`docs/crm-play-review-fixtures.md`](./crm-play-review-fixtures.md). This is production database fixture preparation, **not** proof of an Android release or deployed backend.
