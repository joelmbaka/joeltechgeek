# Sales Agent registration

Source page: `/careers/agents`. Next.js route: `POST /api/sales-agent-applications`.

## Deployment prerequisites

1. Run `migrations/sales-agent-applications.sql` against the **portfolio** PostgreSQL database referenced by `DATABASE_URL`. Do not apply it to RentPayor's database. Database changes are deliberately **not** executed automatically.
2. Set the server-only `DATABASE_URL` in Vercel (already used by the private job CRM if configured).
3. Set the existing server-only `RESEND_API_KEY` and a domain-verified `RESEND_FROM` sender in Vercel. Do not use the expired joelmbaka.com sender domain. You may override the internal recipient using `AGENT_APPLICATION_NOTIFY_TO`; otherwise the current contact inbox is used.
4. Recommended: configure a separate random server-only `AGENT_APPLICATION_HASH_SECRET` for HMAC rate-limit identifiers; until set, the server uses the existing database connection secret as the HMAC key. Never use a NEXT_PUBLIC_ variable for these secrets.
5. Preview-deploy `dev/joeltechgeek`, check form on narrow mobile screens and desktop, and submit one real test application before production deploy.

No additional Python service is required. Each new application is saved to PostgreSQL before two independent Resend emails are attempted: (1) an internal notification to `AGENT_APPLICATION_NOTIFY_TO` (default: founder's Gmail), and (2) a receipt acknowledgement to the applicant, with replies directed to that same Gmail address. The applicant is not automatically accepted. No additional Vercel environment variables are required.

Owner email delivery is recorded in `notification_status`, `notification_provider_id`, `notification_error`. Applicant email delivery is recorded separately in `applicant_notification_status`, `applicant_notification_provider_id`, `applicant_notification_error`. Failures do **not** discard applications; one failed email does not block the other. `sent` indicates Resend accepted the request, **not** guaranteed inbox delivery. Duplicate emails are not sent again. Each applicant remains `status = 'new'` until reviewed.

**Existing database:** Run `migrations/2026-10-22-agent-applicant-notification.sql` once on the Portfolio database before deploying the new code. It defaults historical applicants to `not_sent` without sending old applicants any message. The receipt email applies to new registrations only. Fresh installs from `migrations/sales-agent-applications.sql` already have these columns.

## Useful verification queries

```sql
select id, full_name, phone, email, location, background, source, status,
       notification_status, applicant_notification_status, created_at
from sales_agent_applications order by created_at desc limit 20;

select id, full_name, email, notification_error, created_at
from sales_agent_applications
where notification_status = 'failed' or applicant_notification_status = 'failed'
order by created_at desc;
```

Check 400 invalid/unchecked consent, honeypot no-write, duplicate email no-repeat, >30 attempts per hour from one address (429), missing DATABASE_URL (503), both recipient addresses and independent failures. Test actual inbox/spam delivery with one real registration. Never email acceptance or promise a commission until terms are agreed.

## Outreach attribution

For group-message outreach use `https://joeltechgeek.com/careers/agents?utm_source=whatsapp`. The source is recorded server-side and visitors can also apply organically. Approval and commission remain subject to individually agreed written terms, not an automatic account activation.
