-- Add is_backentered flag to lesson_submissions
ALTER TABLE public.lesson_submissions
  ADD COLUMN IF NOT EXISTS is_backentered boolean NOT NULL DEFAULT false;

-- Backfill existing back-entered submissions by checking answer text
UPDATE public.lesson_submissions ls
SET is_backentered = true
WHERE EXISTS (
  SELECT 1 FROM public.answers a
  WHERE a.submission_id = ls.id
    AND a.answer_text = '(Back-entered — completed in prior system)'
);

-- Recalculate total_lessons_submitted excluding back-entered for affected students
UPDATE public.honor_roll_streaks hrs
SET total_lessons_submitted = COALESCE(
  (SELECT COUNT(*) FROM public.lesson_submissions ls
   WHERE ls.student_id = hrs.student_id
     AND ls.status = 'graded_pass'
     AND ls.is_backentered = false),
  0
);

-- Update the honor roll trigger to skip back-entered submissions
CREATE OR REPLACE FUNCTION public.update_honor_roll_on_pass()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_week text;
  existing_record record;
BEGIN
  -- Only trigger when status changes to graded_pass
  IF NEW.status != 'graded_pass' OR (OLD.status = 'graded_pass') THEN
    RETURN NEW;
  END IF;

  -- Skip back-entered submissions — they should not affect the leaderboard
  IF NEW.is_backentered = true THEN
    RETURN NEW;
  END IF;

  current_week := to_char(now(), 'IYYY-"W"IW');

  SELECT * INTO existing_record
  FROM public.honor_roll_streaks
  WHERE student_id = NEW.student_id;

  IF NOT FOUND THEN
    INSERT INTO public.honor_roll_streaks (student_id, current_streak_weeks, longest_streak_weeks, total_lessons_submitted, last_submission_week)
    VALUES (NEW.student_id, 1, 1, 1, current_week);
  ELSE
    -- If same week, just increment total
    IF existing_record.last_submission_week = current_week THEN
      UPDATE public.honor_roll_streaks
      SET total_lessons_submitted = existing_record.total_lessons_submitted + 1
      WHERE student_id = NEW.student_id;
    ELSE
      -- New week submission
      UPDATE public.honor_roll_streaks
      SET
        current_streak_weeks = existing_record.current_streak_weeks + 1,
        longest_streak_weeks = GREATEST(existing_record.longest_streak_weeks, existing_record.current_streak_weeks + 1),
        total_lessons_submitted = existing_record.total_lessons_submitted + 1,
        last_submission_week = current_week
      WHERE student_id = NEW.student_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
