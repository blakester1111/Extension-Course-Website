-- Certificate mail tracking
-- Adds mail_status and mailed_at to certificates for tracking physical mail

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS mail_status text DEFAULT NULL
    CHECK (mail_status IS NULL OR mail_status IN ('needs_mailing', 'mailed')),
  ADD COLUMN IF NOT EXISTS mailed_at timestamptz;
