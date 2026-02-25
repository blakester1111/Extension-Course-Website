ALTER TABLE courses ADD COLUMN IF NOT EXISTS synopsis text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS full_description text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS length_hours integer;
