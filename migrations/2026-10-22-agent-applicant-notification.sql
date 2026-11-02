-- Apply to the existing Portfolio Neon database before deploying applicant acknowledgements.
-- Historical applicants default to not_sent; this migration does not email them.
alter table public.sales_agent_applications
  add column if not exists applicant_notification_status varchar(24) not null default 'not_sent'
    check (applicant_notification_status in ('not_sent', 'pending', 'sent', 'failed'));

alter table public.sales_agent_applications
  add column if not exists applicant_notification_provider_id varchar(255);

alter table public.sales_agent_applications
  add column if not exists applicant_notification_error text;

create index if not exists idx_sales_agent_applications_applicant_notification
  on public.sales_agent_applications (applicant_notification_status, created_at desc);
