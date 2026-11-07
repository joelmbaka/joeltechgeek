-- Normalized CRM category relationship, with legacy text-field compatibility.
-- Deliberately additive: deployed Android clients still submit 'industry' as a name.
-- Existing lead data is preserved. Once every client migrates to category IDs,
-- the legacy industry column and compatibility triggers can be retired.
BEGIN;

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS business_category_id uuid;

-- Existing leads may use categories that were never explicitly saved.
-- Create those catalogue records per user, without replacing any saved descriptions.
INSERT INTO public.crm_business_categories (user_id, name)
SELECT source.user_id, source.name
FROM (
  SELECT DISTINCT ON (user_id, lower(btrim(industry)))
    user_id, btrim(industry) AS name
  FROM public.crm_leads
  WHERE btrim(industry) <> ''
  ORDER BY user_id, lower(btrim(industry)), created_at, id
) AS source
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_business_categories c
  WHERE c.user_id = source.user_id
    AND lower(btrim(c.name)) = lower(btrim(source.name))
)
ON CONFLICT DO NOTHING;

-- Backfill with the owning user's category. Unclassified leads remain NULL.
UPDATE public.crm_leads l SET business_category_id = c.id
FROM public.crm_business_categories c
WHERE c.user_id = l.user_id
  AND lower(btrim(c.name)) = lower(btrim(l.industry))
  AND btrim(l.industry) <> ''
  AND l.business_category_id IS DISTINCT FROM c.id;

-- Composite ownership: a lead cannot reference another user's category.
CREATE UNIQUE INDEX IF NOT EXISTS crm_business_categories_id_user_unique
  ON public.crm_business_categories (id, user_id);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'crm_leads_business_category_owner_fkey'
                   AND conrelid = 'public.crm_leads'::regclass) THEN
    ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_business_category_owner_fkey
      FOREIGN KEY (business_category_id, user_id)
      REFERENCES public.crm_business_categories(id, user_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS crm_leads_user_category_idx
  ON public.crm_leads (user_id, business_category_id);

-- Legacy name writes resolve into the canonical FK. New ID writes resolve the
-- display name for older clients and existing queries during the rollout.
CREATE OR REPLACE FUNCTION public.crm_sync_lead_business_category()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  resolved_id uuid;
  resolved_name varchar(100);
  id_changed boolean;
  name_changed boolean;
BEGIN
  id_changed := TG_OP = 'INSERT'
    OR NEW.business_category_id IS DISTINCT FROM OLD.business_category_id;
  name_changed := TG_OP = 'INSERT'
    OR NEW.industry IS DISTINCT FROM OLD.industry;

  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Lead owner cannot be changed during category update'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' AND NOT id_changed AND NOT name_changed THEN
    RETURN NEW;
  END IF;

  -- On explicit category ID changes, the FK is authoritative.
  -- On old-client category name changes, the name is resolved to an ID.
  IF TG_OP = 'UPDATE' AND id_changed
     OR (TG_OP = 'INSERT' AND NEW.business_category_id IS NOT NULL) THEN
    IF NEW.business_category_id IS NULL THEN
      NEW.industry := '';
      RETURN NEW;
    END IF;
    SELECT c.name INTO resolved_name FROM public.crm_business_categories c
    WHERE c.id = NEW.business_category_id AND c.user_id = NEW.user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Business category does not belong to lead owner'
        USING ERRCODE = '23503';
    END IF;
    NEW.industry := resolved_name;
    RETURN NEW;
  END IF;

  IF btrim(coalesce(NEW.industry, '')) = '' THEN
    NEW.business_category_id := NULL;
    NEW.industry := '';
    RETURN NEW;
  END IF;
  SELECT c.id,c.name INTO resolved_id,resolved_name
  FROM public.crm_business_categories c
  WHERE c.user_id = NEW.user_id
    AND lower(btrim(c.name)) = lower(btrim(NEW.industry))
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Choose a saved business category'
      USING ERRCODE = '23503';
  END IF;
  NEW.business_category_id := resolved_id;
  NEW.industry := resolved_name;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS crm_leads_business_category_sync ON public.crm_leads;
CREATE TRIGGER crm_leads_business_category_sync
BEFORE INSERT OR UPDATE OF industry, business_category_id, user_id
ON public.crm_leads FOR EACH ROW
EXECUTE FUNCTION public.crm_sync_lead_business_category();

-- Preserve the text-based compatibility projection if the category is renamed.
CREATE OR REPLACE FUNCTION public.crm_sync_category_name_to_leads()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.crm_leads SET industry = NEW.name
  WHERE user_id = NEW.user_id AND business_category_id = NEW.id
    AND industry IS DISTINCT FROM NEW.name;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_business_category_name_sync ON public.crm_business_categories;
CREATE TRIGGER crm_business_category_name_sync
AFTER UPDATE OF name ON public.crm_business_categories
FOR EACH ROW WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION public.crm_sync_category_name_to_leads();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.crm_leads
    WHERE btrim(industry) <> '' AND business_category_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Category backfill is incomplete';
  END IF;
END $$;
COMMIT;
