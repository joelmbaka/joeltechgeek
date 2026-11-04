# Phase 5 production cutover: personal CRM user IDs

## Target
- One `public.crm_users` table and a stable `crm_users.id` for each person.
- `crm_leads.user_id`, `crm_business_categories.user_id`,
  `crm_mobile_sessions.user_id`, `crm_mobile_auth_codes.user_id`.
- Contacts, activities, and follow-up changes belong through `lead_id`,
  with no duplicate user identifier.
- Keep the public `/api/agent-crm` URL temporarily for published Android
  compatibility; this URL is **not** an ownership or agent-ID source.

## One coordinated deployment (do not skip)
1. Take a Neon restore point/branch, snapshot current counts and agent UUIDs.
2. In a short maintenance window, pause CRM writes to the old Vercel backend.
   With the old API live, changing these columns will break reads/writes.
3. Run `migrations/2026-11-04-crm-phase5-personal-users.sql` against the
   **production** JoelTechGeek Neon branch, once, in its own transaction.
   The script copies existing user IDs exactly, then changes FKs and columns.
4. Immediately deploy the Phase 5 `mobile` backend to the existing Vercel
   project (not Git integrated). Confirm every Next.js CRM route is on this
   commit; restart/refresh all old backend instances if applicable.
5. Sign into the web CRM again (old Auth.js JWT sessions have no
   `crm_user_id` claim). Existing Android refresh tokens should still work
   because the UUID and token signing keys have not changed.
6. Test Google login from a *new* Google account. Confirm it gets its own
   private CRM and never sees an existing user's leads.
7. Verify existing users see original leads, all contacts and timeline events,
   and timed reminders; check Play reviewer synthetic login separately.
8. Only then publish the matching mobile OTA/build. Keep the `agent` JSON
   alias and `/api/agent-crm` routes until old published Android builds age out.

## Before/after read-only verification
```sql
SELECT COUNT(*) FROM public.crm_leads;
SELECT COUNT(*) FROM public.crm_lead_contacts;
SELECT COUNT(*) FROM public.crm_lead_events;
SELECT COUNT(*) FROM public.crm_users;
SELECT COUNT(*) FROM public.crm_leads l
 LEFT JOIN public.crm_users u ON u.id=l.user_id WHERE u.id IS NULL;
SELECT COUNT(*) FROM information_schema.columns
 WHERE table_schema='public' AND table_name LIKE 'crm_%'
   AND column_name='agent_id';
```
Expect zero orphaned lead owners and zero CRM `agent_id` columns.

## Rollback
If the migration itself fails, PostgreSQL rolls back its transaction.
If the new backend fails after deployment, do **not** blindly redeploy the
old backend against the new schema. Coordinate restoration of the previous
Neon state *and* the old backend from the saved restore point, reconciling
any writes since cutover. Do not delete `sales_agent_applications`; it can
belong to separate non-CRM application workflows.

## Verification status
Executed successfully on isolated Neon branch
`br-super-darkness-agv153ka` on 2026-11-04: 9 identities, 1,172 leads,
1,025 contacts, 112 events, 41 mobile sessions, 21 auth codes,
zero orphaned lead owners. **Not yet deployed or run on production.**
