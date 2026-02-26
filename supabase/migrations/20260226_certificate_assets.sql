-- Certificate assets: signature images and seal for certificate rendering
-- Assets are org-wide (seal) or per-user (signatures)
CREATE TABLE IF NOT EXISTS public.certificate_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL CHECK (asset_type IN ('seal', 'attester_signature', 'sealer_signature')),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Seal is org-wide (user_id NULL), signatures are per-user
  -- Only one seal, one attester sig per user, one sealer sig per user
  -- Note: UNIQUE(asset_type, user_id) doesn't enforce for NULLs
  UNIQUE(asset_type, user_id)
);

-- Unique partial index for seal (user_id IS NULL) since UNIQUE doesn't cover NULLs
CREATE UNIQUE INDEX IF NOT EXISTS certificate_assets_seal_unique
  ON public.certificate_assets (asset_type) WHERE user_id IS NULL;

ALTER TABLE public.certificate_assets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view assets (needed for certificate rendering)
DO $$ BEGIN
  CREATE POLICY "Anyone can view certificate assets"
    ON public.certificate_assets FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Server can manage
DO $$ BEGIN
  CREATE POLICY "Server can manage certificate assets"
    ON public.certificate_assets FOR ALL
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TRIGGER certificate_assets_updated_at
  BEFORE UPDATE ON public.certificate_assets
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- Storage bucket for certificate asset images (signatures, seals)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('certificate-assets', 'certificate-assets', true, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ BEGIN
  CREATE POLICY "Public read certificate assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'certificate-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated upload certificate assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'certificate-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated delete certificate assets"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'certificate-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
