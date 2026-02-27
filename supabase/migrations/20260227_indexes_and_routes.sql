-- ============================================================
-- 1. Performance indexes for common query patterns
-- ============================================================

-- Lesson submissions: grading queue, student dashboards, reports
CREATE INDEX IF NOT EXISTS idx_lesson_submissions_student_status
  ON public.lesson_submissions(student_id, status);

CREATE INDEX IF NOT EXISTS idx_lesson_submissions_status
  ON public.lesson_submissions(status);

CREATE INDEX IF NOT EXISTS idx_lesson_submissions_lesson_status
  ON public.lesson_submissions(lesson_id, status);

CREATE INDEX IF NOT EXISTS idx_lesson_submissions_graded_at
  ON public.lesson_submissions(graded_at)
  WHERE graded_at IS NOT NULL;

-- Enrollments: student dashboards, course reports
CREATE INDEX IF NOT EXISTS idx_enrollments_student
  ON public.enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_course
  ON public.enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_course_status
  ON public.enrollments(student_id, course_id, status);

-- Profiles: supervisor lookups, org filtering
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor
  ON public.profiles(supervisor_id)
  WHERE supervisor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_organization
  ON public.profiles(organization)
  WHERE organization IS NOT NULL;

-- Answers: submission lookups
CREATE INDEX IF NOT EXISTS idx_answers_submission
  ON public.answers(submission_id);

-- Certificates: status reporting, student lookups
CREATE INDEX IF NOT EXISTS idx_certificates_student_status
  ON public.certificates(student_id, status);

CREATE INDEX IF NOT EXISTS idx_certificates_status
  ON public.certificates(status);

-- ============================================================
-- 2. Study routes
-- ============================================================

-- Routes table: each route is a named study path
CREATE TABLE IF NOT EXISTS public.study_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Route courses: ordered list of courses in each route
CREATE TABLE IF NOT EXISTS public.study_route_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.study_routes(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  position integer NOT NULL,
  UNIQUE(route_id, course_id),
  UNIQUE(route_id, position)
);

CREATE INDEX IF NOT EXISTS idx_study_route_courses_route
  ON public.study_route_courses(route_id, position);

-- Student route assignment (on profiles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS study_route_id uuid REFERENCES public.study_routes(id) ON DELETE SET NULL;

-- RLS for study_routes (readable by all authenticated, writable by admins)
ALTER TABLE public.study_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read routes"
  ON public.study_routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage routes"
  ON public.study_routes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS for study_route_courses
ALTER TABLE public.study_route_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read route courses"
  ON public.study_route_courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage route courses"
  ON public.study_route_courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 3. Seed the study routes from the Extension Course Routes chart
-- ============================================================

-- Route 1: Chronological Route (Basics + Lectures in publication order)
INSERT INTO public.study_routes (name, description) VALUES
  ('Chronological Route', 'Courses in chronological publication order through the Basics and Lectures'),
  ('ACC Route', 'Advanced Clinical Courses in chronological order'),
  ('Congress Route', 'All Congresses in chronological order'),
  ('Combined Chronological', 'All courses — Basics, Congresses, and ACCs — interleaved in chronological order')
ON CONFLICT (name) DO NOTHING;
