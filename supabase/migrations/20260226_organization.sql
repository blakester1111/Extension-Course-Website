-- Add organization column to profiles (day or foundation, null = unassigned)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS organization text
CHECK (organization IN ('day', 'foundation'));

-- Add organization column to orders (tracks selection at checkout)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS organization text;
