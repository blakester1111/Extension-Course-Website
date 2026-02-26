-- Deadfile flag on profiles
-- Deadfiled users are blocked from signing in and stripped from all honor roll / hall of fame.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deadfiled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deadfiled_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deadfiled_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deadfile_reason text;
