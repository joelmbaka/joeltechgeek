import { Pool } from 'pg';

let pool: Pool | null = null;

export function getCrmPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  if (!pool) {
    const url = new URL(connectionString);
    // Neon/pg handles TLS, not PostgreSQL channel binding URL options.
    url.searchParams.delete('channel_binding');
    pool = new Pool({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });
  }
  return pool;
}

// Avoid timezone conversion when serializing PostgreSQL DATE values.
export const LEAD_COLUMNS = String.raw`id, company_name, industry, country, city, website,
  contact_name, contact_role, phone, email, existing_system,
  problem_summary, qualification_reason, source_url, priority,
  stage, COALESCE(last_outcome_v2, last_outcome) AS last_outcome, last_notes, next_action,
  next_action_at::text AS next_action_at,
  next_action_time::text AS next_action_time, next_action_timezone,
  next_action_due_at, next_action_contact_id::text AS next_action_contact_id, last_contacted_at,
  do_not_contact, updated_at,
  COALESCE(NULLIF(btrim(lead_title), ''), NULLIF(btrim(company_name), ''), 'Untitled lead') AS lead_title`;
