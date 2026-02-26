-- Certificate delivery preference: whether student wants physical mail or digital only
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cert_mail_preference text NOT NULL DEFAULT 'digital'
  CHECK (cert_mail_preference IN ('digital', 'mail'));
