-- JoelTechGeek CRM: retain only the verified Google profile-picture URL.
-- No image uploads, binary storage, Vercel Blob, or extra OAuth scopes.
-- Apply before deploying the avatar-aware mobile auth endpoints.
ALTER TABLE public.sales_agent_applications
  ADD COLUMN IF NOT EXISTS google_picture_url text;
