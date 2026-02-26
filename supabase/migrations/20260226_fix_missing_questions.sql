-- ============================================================================
-- FIX MISSING QUESTIONS FROM IMPORT
-- ============================================================================
-- This migration fixes questions that were missed during the original import
-- due to non-standard formatting in the .doc source files.
--
-- Issues found:
--   1. DMSMH Lesson 6: 8 questions (Q60-67) used "Question: N:" format
--   2. Science of Survival: 2 questions (Q54, Q61) used "Questions N:" (plural)
--   3. Life Continuum: 8 questions in Lessons 3, 9, 10 used bare number format
--   4. Freedom Congress: 6 questions in Lessons 11-12 used "Question Number N:" format
--   5. Final Course Exercises missing from 53 Lecture/Congress/ACC courses
-- ============================================================================

-- ============================================================================
-- PART 1: Fix 24 missing regular questions
-- ============================================================================

DO $$
DECLARE
  v_course_id uuid;
  v_lesson_id uuid;
  v_max_sort int;
BEGIN

-- --------------------------------------------------------------------------
-- 1A. DMSMH — Lesson 6 — Insert Q60-Q67 (8 questions)
-- Q59 already exists at sort_order 0. Insert Q60-Q67 at sort_order 1-8.
-- --------------------------------------------------------------------------
SELECT c.id INTO v_course_id
  FROM courses c WHERE c.title = 'Dianetics: The Modern Science of Mental Health';

IF v_course_id IS NOT NULL THEN
  -- Find Lesson 6 (6th lesson by sort_order)
  SELECT l.id INTO v_lesson_id
    FROM lessons l
    WHERE l.course_id = v_course_id
    ORDER BY l.sort_order
    OFFSET 5 LIMIT 1;

  IF v_lesson_id IS NOT NULL THEN
    -- Get current max sort_order in this lesson
    SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort
      FROM questions q WHERE q.lesson_id = v_lesson_id;

    INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
      (v_lesson_id, 'Give a Dianetic reason for analytical shutdown.', v_max_sort + 1),
      (v_lesson_id, 'What is the action of restimulation on an analyzer?', v_max_sort + 2),
      (v_lesson_id, 'Is all restimulation chronic?', v_max_sort + 3),
      (v_lesson_id, 'Which has the greatest power of choice–the Clear or the aberree?', v_max_sort + 4),
      (v_lesson_id, 'What is meant by justified thought? Give an example from your experience.', v_max_sort + 5),
      (v_lesson_id, 'Give an example from your own experience of dramatization.', v_max_sort + 6),
      (v_lesson_id, 'What is meant by a valence?', v_max_sort + 7),
      (v_lesson_id, 'Give some examples of valences from your own experience.', v_max_sort + 8);

    RAISE NOTICE 'DMSMH Lesson 6: Inserted 8 questions (Q60-Q67)';
  END IF;
END IF;

-- --------------------------------------------------------------------------
-- 1B. Science of Survival — Lesson 7 — Insert Q54
-- Q53 is the last imported question in Lesson 7. Q54 was missed (plural "Questions").
-- --------------------------------------------------------------------------
SELECT c.id INTO v_course_id
  FROM courses c WHERE c.title = 'Science of Survival';

IF v_course_id IS NOT NULL THEN
  -- Lesson 7 (7th lesson by sort_order)
  SELECT l.id INTO v_lesson_id
    FROM lessons l
    WHERE l.course_id = v_course_id
    ORDER BY l.sort_order
    OFFSET 6 LIMIT 1;

  IF v_lesson_id IS NOT NULL THEN
    SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort
      FROM questions q WHERE q.lesson_id = v_lesson_id;

    INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
      (v_lesson_id, 'Describe some people you know and how they relay written or spoken communication.', v_max_sort + 1);

    RAISE NOTICE 'Science of Survival Lesson 7: Inserted 1 question (Q54)';
  END IF;

  -- Lesson 8 (8th lesson by sort_order) — Insert Q61
  SELECT l.id INTO v_lesson_id
    FROM lessons l
    WHERE l.course_id = v_course_id
    ORDER BY l.sort_order
    OFFSET 7 LIMIT 1;

  IF v_lesson_id IS NOT NULL THEN
    SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort
      FROM questions q WHERE q.lesson_id = v_lesson_id;

    -- Q61 needs to be at sort_order 1 (after Q60 at sort_order 0)
    -- But we must shift existing questions first if they occupy that slot
    -- Safest: just append after the current max
    -- Actually Q60 is at sort_order 0, Q62-Q69 at sort_order 1-8
    -- We need Q61 between Q60 and Q62. Let's shift Q62+ up by 1 then insert.
    UPDATE questions SET sort_order = sort_order + 1
      WHERE lesson_id = v_lesson_id AND sort_order >= 1;

    INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
      (v_lesson_id, 'Describe a 3.5''s level of reality (agreement).', 1);

    RAISE NOTICE 'Science of Survival Lesson 8: Inserted 1 question (Q61)';
  END IF;
END IF;

-- --------------------------------------------------------------------------
-- 1C. Life Continuum — Lessons 3, 9, 10 — Insert 8 questions
-- Lessons exist in DB but have no questions (bare number format was missed)
-- --------------------------------------------------------------------------
SELECT c.id INTO v_course_id
  FROM courses c WHERE c.title = 'The Life Continuum';

IF v_course_id IS NOT NULL THEN
  -- Lesson 3 (3rd lesson) — Q5-Q8 (4 questions)
  SELECT l.id INTO v_lesson_id
    FROM lessons l
    WHERE l.course_id = v_course_id
    ORDER BY l.sort_order
    OFFSET 2 LIMIT 1;

  IF v_lesson_id IS NOT NULL THEN
    INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
      (v_lesson_id, 'How is the Hubbard Chart of Attitudes a prediction chart?', 0),
      (v_lesson_id, 'Describe how you can use the Hubbard Chart of Attitudes as a character index chart by which you can then take The Hubbard Chart of Human Evaluation and spot an individual and his behavior on it.', 1),
      (v_lesson_id, 'Explain how the Hubbard Chart of Attitudes'' foremost use is in processing.', 2),
      (v_lesson_id, 'Select a column from this chart and work out for yourself how it tells you everything that has to and must be hit in a case before you can be completely at ease about an individual being back to battery at 20.0.', 3);

    RAISE NOTICE 'Life Continuum Lesson 3: Inserted 4 questions (Q5-Q8)';
  END IF;

  -- Lesson 9 (9th lesson) — Q19-Q20 (2 questions)
  SELECT l.id INTO v_lesson_id
    FROM lessons l
    WHERE l.course_id = v_course_id
    ORDER BY l.sort_order
    OFFSET 8 LIMIT 1;

  IF v_lesson_id IS NOT NULL THEN
    INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
      (v_lesson_id, 'How does a person make a postulate, desire or wish upon himself come true?', 0),
      (v_lesson_id, 'Give an example of someone putting these mechanics into action.', 1);

    RAISE NOTICE 'Life Continuum Lesson 9: Inserted 2 questions (Q19-Q20)';
  END IF;

  -- Lesson 10 (10th lesson) — Q21-Q22 (2 questions)
  SELECT l.id INTO v_lesson_id
    FROM lessons l
    WHERE l.course_id = v_course_id
    ORDER BY l.sort_order
    OFFSET 9 LIMIT 1;

  IF v_lesson_id IS NOT NULL THEN
    INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
      (v_lesson_id, 'What are the two things that hold answers in suspension?', 0),
      (v_lesson_id, 'Describe the result of a preclear who is capable of handling problems in yes or no categories.', 1);

    RAISE NOTICE 'Life Continuum Lesson 10: Inserted 2 questions (Q21-Q22)';
  END IF;
END IF;

-- --------------------------------------------------------------------------
-- 1D. Freedom Congress — Lessons 11-12 — Insert Q35-Q40 (6 questions)
-- "Question Number N:" format was not matched by import regex
-- --------------------------------------------------------------------------
SELECT c.id INTO v_course_id
  FROM courses c WHERE c.title = 'Freedom Congress';

IF v_course_id IS NOT NULL THEN
  -- Lesson 11 (11th lesson) — Q35-Q36 (2 questions)
  SELECT l.id INTO v_lesson_id
    FROM lessons l
    WHERE l.course_id = v_course_id
    ORDER BY l.sort_order
    OFFSET 10 LIMIT 1;

  IF v_lesson_id IS NOT NULL THEN
    INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
      (v_lesson_id, 'What is the difference between absolute mechanical control and Scientology control?', 0),
      (v_lesson_id, 'Give an example of Scientology control in application.', 1);

    RAISE NOTICE 'Freedom Congress Lesson 11: Inserted 2 questions (Q35-Q36)';
  END IF;

  -- Lesson 12 (12th lesson) — Q37-Q40 (4 questions)
  SELECT l.id INTO v_lesson_id
    FROM lessons l
    WHERE l.course_id = v_course_id
    ORDER BY l.sort_order
    OFFSET 11 LIMIT 1;

  IF v_lesson_id IS NOT NULL THEN
    INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
      (v_lesson_id, 'Give the basic theory of CCHs.', 0),
      (v_lesson_id, 'Explain how you could apply the basic theory of CCHs and control the attention of a preclear.', 1),
      (v_lesson_id, 'What is ability?', 2),
      (v_lesson_id, 'Give some examples of ability you have observed or demonstrated.', 3);

    RAISE NOTICE 'Freedom Congress Lesson 12: Inserted 4 questions (Q37-Q40)';
  END IF;
END IF;

RAISE NOTICE '--- Part 1 complete: 24 missing regular questions inserted ---';
END $$;


-- ============================================================================
-- PART 2: Add Final Course Exercise to 53 courses
-- ============================================================================
-- These are added as a new question in the last lesson of each course.
-- For courses where the DB has an extra lesson (instructions-only), the FCE
-- goes into that lesson. For others, it goes into the last lesson.
-- ============================================================================

DO $$
DECLARE
  v_course_id uuid;
  v_lesson_id uuid;
  v_max_sort int;
  v_count int := 0;
BEGIN

-- Helper: For each course, find last lesson, get max sort_order, insert FCE

-- ===================== BASICS LECTURES (12 courses) =====================

-- 1. Advanced Procedure & Axioms and Thought Emotion and Effort
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Advanced Procedure & Axioms and Thought Emotion and Effort';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series The Logics and Axioms and Thought, Emotion and Effort and the book Advanced Procedure and Axioms.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 2. Command of Theta
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Command of Theta';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series The Command of Theta.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 3. Dianetics: Lectures & Demonstrations
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Dianetics: Lectures & Demonstrations';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series Dianetics Lectures and Demonstrations.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 4. Hubbard Professional Course Lectures
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Hubbard Professional Course Lectures';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series Hubbard Professional Course Lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 5. The Life Continuum
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'The Life Continuum';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series The Life Continuum.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 6. Scientology: Milestone One
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Scientology: Milestone One';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series Scientology: Milestone One.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 7. The Philadelphia Doctorate Course
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'The Philadelphia Doctorate Course';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Restudy the definition of 8-8008 below and write an essay describing how you can apply the principles and data you have learned from the Philadelphia Doctorate Course and Scientology 8-8008. "The original definition of Scientology 8-8008 was the attainment of infinity (8) by the reduction of the apparent infinity (8) and power of the MEST universe to a zero (0) for himself, and the increase of the apparent zero (0) of one''s own universe to an infinity (8) for oneself."', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 8. The Phoenix Lectures
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'The Phoenix Lectures';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series Phoenix Lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 9. The Route to Infinity
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'The Route to Infinity';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series The Route to Infinity.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 10. Science of Survival Lectures
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Science of Survival Lectures';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series Science of Survival Lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 11. Source of Life Energy
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Source of Life Energy';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series Source of Life Energy.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 12. Technique 88: Incidents on the Track Before Earth
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Technique 88: Incidents on the Track Before Earth';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series Technique 88: Incidents of the Track Before Earth.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- ===================== CONGRESS LESSONS (18 courses — Unification has no FCE) =====================

-- 13. First International Congress of Dianeticists & Scientologists
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'First International Congress of Dianeticists & Scientologists';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the lecture series First International Congress of Dianeticists & Scientologists.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 14. Anatomy of the Human Mind Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Anatomy of the Human Mind Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Anatomy of the Human Mind Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 15. Anatomy of the Spirit of Man Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Anatomy of the Spirit of Man Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Anatomy of the Spirit of Man Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 16. Clean Hands Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Clean Hands Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Clean Hands Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 17. Clearing Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Clearing Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Clearing Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 18. Freedom Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Freedom Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Freedom Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 19. Games Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Games Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Games Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 20. London Clearing Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'London Clearing Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the London Clearing Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 21. London Congress on Dissemination & Help
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'London Congress on Dissemination & Help';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the London Congress on Dissemination & Help and the London Open Evening Lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 22. London Congress on Human Problems
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'London Congress on Human Problems';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the London Congress on Human Problems.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 23. London Congress on Nuclear Radiation, Control & Health
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'London Congress on Nuclear Radiation, Control & Health';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the London Congress on Nuclear Radiation, Control & Health.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 24. Melbourne Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Melbourne Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Melbourne Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 25. State of Man Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'State of Man Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the State of Man Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 26. Success Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Success Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Success Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 27. Theta Clear Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Theta Clear Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Theta Clear Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 28. Universe Processes Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Universe Processes Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Universe Processes Lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 29. Washington Congress on Anti-Radiation & Confront
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Washington Congress on Anti-Radiation & Confront';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Washington Congress on Anti-Radiation & Confront.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 30. Western Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Western Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Western Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- ===================== ACC LESSONS (23 courses) =====================

-- 31. 16th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '16th American ACC: Control, Communication & Havingness';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 16th American ACC: Control, Communication & Havingness lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 32. 17th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '17th American ACC: Control on All Dynamics';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 17th American ACC: Control on All Dynamics lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 33. 18th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '18th American ACC: Confront & Tone 40';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 18th American ACC: Confront & Tone 40 lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 34. 19th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '19th American ACC: The Four Universes';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 19th American ACC: The Four Universes lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 35. 1st American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '1st American ACC: Exteriorization & the Phenomena of Space';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 1st American ACC: Exteriorization & the Phenomena of Space lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 36. 1st Melbourne ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '1st Melbourne ACC: Responsibility and the State of OT';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 1st Melbourne ACC: Responsibility and the State of OT lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 37. 20th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '20th American ACC: The First Postulate';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 20th American ACC: The First Postulate lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 38. 21st American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '21st American ACC: From Homo Sapiens to Clear';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 21st American ACC: From Homo Sapiens to Clear lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 39. 22nd American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '22nd American ACC: The Elements of Stable Case Gain';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 22nd American ACC: The Elements of Stable Case Gain lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 40. 2nd American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '2nd American ACC: The Rehabilitation of the Human Spirit';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 2nd American ACC: The Rehabilitation of the Human Spirit lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 41. 3rd American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '3rd American ACC: The Endowment of Livingness';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 3rd American ACC: The Endowment of Livingness lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 42. 3rd South African ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '3rd South African ACC: The Road to Havingness';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 3rd South African ACC: The Road to Havingness lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 43. 4th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '4th American ACC: Self-determined Beingness';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 4th American ACC: Self-determined Beingness lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 44. 4th London ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '4th London ACC: Native State & Postulates';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 4th London ACC: Native State & Postulates lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 45. 5th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '5th American ACC: Unlocking Universes';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 5th American ACC: Unlocking Universes lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 46. 5th London ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '5th London ACC: Unlocking Past Life Memory';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 5th London ACC: Unlocking Past Life Memory lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 47. 6th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '6th American ACC: The Role of Duplication';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 6th American ACC: The Role of Duplication lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 48. 6th London ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '6th London ACC: The HAS Co-Audit & Broad Scale Clearing';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 6th London ACC: The HAS Co-audit & Broad Scale Clearing lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 49. 7th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '7th American ACC: Certainty of Communication';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 7th American ACC: Certainty of Communication lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 50. 8th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '8th American ACC: The Power of Consideration';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 8th American ACC: The Power of Consideration lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 51. 9th American ACC
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = '9th American ACC: Communication—The Solution to Entrapment';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the 9th American ACC: Communication – The Solution to Entrapment lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 52. Six Basic Processes Cause-Distance-Effect
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'Six Basic Processes Cause-Distance-Effect: A Basic Course in Scientology';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the Cause-Distance-Effect: A Basic Course in Scientology lectures.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

-- 53. South African Anatomy Congress
SELECT c.id INTO v_course_id FROM courses c
  WHERE c.title = 'South African Anatomy Congress';
IF v_course_id IS NOT NULL THEN
  SELECT l.id INTO v_lesson_id FROM lessons l
    WHERE l.course_id = v_course_id ORDER BY l.sort_order DESC LIMIT 1;
  SELECT COALESCE(MAX(q.sort_order), -1) INTO v_max_sort FROM questions q WHERE q.lesson_id = v_lesson_id;
  INSERT INTO questions (lesson_id, question_text, sort_order) VALUES
    (v_lesson_id, 'Final Course Exercise: Describe how you can apply the principles and data you have learned from the South African Anatomy Congress.', v_max_sort + 1);
  v_count := v_count + 1;
END IF;

RAISE NOTICE '--- Part 2 complete: % Final Course Exercise questions inserted ---', v_count;
END $$;
