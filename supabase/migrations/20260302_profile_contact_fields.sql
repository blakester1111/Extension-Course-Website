-- Add contact fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;

-- Populate from most recent paid order for each user
UPDATE profiles p
SET
  phone = sub.customer_phone,
  address = sub.customer_address,
  city = sub.customer_city,
  state = sub.customer_state,
  zip = sub.customer_zip,
  country = sub.customer_country
FROM (
  SELECT DISTINCT ON (student_id)
    student_id,
    customer_phone,
    customer_address,
    customer_city,
    customer_state,
    customer_zip,
    customer_country
  FROM orders
  WHERE student_id IS NOT NULL
    AND status = 'paid'
  ORDER BY student_id, created_at DESC
) sub
WHERE p.id = sub.student_id
  AND p.phone IS NULL;

-- Add trigger to sync profiles.email when auth.users.email changes
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;
CREATE TRIGGER on_auth_user_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_change();
