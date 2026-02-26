-- Certificate permission flags on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_attest_certs boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_sign_certs boolean NOT NULL DEFAULT false;

-- Certificate records
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_attestation'
    CHECK (status IN ('pending_attestation', 'pending_seal', 'issued')),
  certificate_number text UNIQUE,
  is_backentered boolean NOT NULL DEFAULT false,
  attested_by uuid REFERENCES public.profiles(id),
  attested_at timestamptz,
  sealed_by uuid REFERENCES public.profiles(id),
  sealed_at timestamptz,
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Anyone can view certificates (for honor roll / public display)
CREATE POLICY "Anyone can view certificates"
  ON public.certificates FOR SELECT
  USING (true);

-- Server can manage certificates
CREATE POLICY "Server can manage certificates"
  ON public.certificates FOR ALL
  USING (true);

CREATE TRIGGER certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
