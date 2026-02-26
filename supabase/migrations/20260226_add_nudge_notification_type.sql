-- Add 'nudge' to the notifications type constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'lesson_graded', 'lesson_submitted', 'enrollment_confirmed',
    'corrections_needed', 'invoice_pending', 'invoice_verified', 'nudge'
  ));
