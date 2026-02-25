-- ============================================================
-- Migration 00008: Staff enrollment, super_admin role, invoice verification
-- ============================================================

-- A) Expand role constraint to include super_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'supervisor', 'admin', 'super_admin'));

-- B) Add is_staff boolean to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_staff boolean NOT NULL DEFAULT false;

-- C) Add enrollment status, invoice_number, verified_by, verified_at
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('active', 'pending_invoice_verification'));
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS verified_at timestamptz;
CREATE INDEX IF NOT EXISTS enrollments_pending_idx ON public.enrollments(status) WHERE status = 'pending_invoice_verification';

-- D) Expand notification type constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'lesson_graded', 'lesson_submitted', 'enrollment_confirmed',
    'corrections_needed', 'invoice_pending', 'invoice_verified'
  ));

-- E) Set blakester1111@gmail.com as super_admin
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'blakester1111@gmail.com';

-- ============================================================
-- F) SECURITY DEFINER helper functions (bypass RLS to avoid infinite recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_supervisor_id(student_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT supervisor_id FROM profiles WHERE id = student_id;
$$;

-- ============================================================
-- G) Update RLS policies using get_user_role() to avoid recursion
-- ============================================================

-- G.1) profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- G.2) enrollments
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage all enrollments"
  ON public.enrollments FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Supervisors can view assigned student enrollments" ON public.enrollments;
CREATE POLICY "Supervisors can view assigned student enrollments"
  ON public.enrollments FOR SELECT
  USING (get_user_role(auth.uid()) IN ('supervisor', 'admin', 'super_admin'));

DROP POLICY IF EXISTS "Supervisors can enroll students" ON public.enrollments;
CREATE POLICY "Supervisors can enroll students"
  ON public.enrollments FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('supervisor', 'admin', 'super_admin'));

DROP POLICY IF EXISTS "Supervisors can verify enrollments" ON public.enrollments;
CREATE POLICY "Supervisors can verify enrollments"
  ON public.enrollments FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('supervisor', 'admin', 'super_admin'));

-- G.3) courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- G.4) lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons"
  ON public.lessons FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- G.5) questions
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- G.6) lesson_submissions
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.lesson_submissions;
CREATE POLICY "Admins can manage all submissions"
  ON public.lesson_submissions FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Supervisors can grade submissions" ON public.lesson_submissions;
CREATE POLICY "Supervisors can grade submissions"
  ON public.lesson_submissions FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('supervisor', 'admin', 'super_admin'));

DROP POLICY IF EXISTS "Supervisors can view assigned student submissions" ON public.lesson_submissions;
CREATE POLICY "Supervisors can view assigned student submissions"
  ON public.lesson_submissions FOR SELECT
  USING (
    get_supervisor_id(lesson_submissions.student_id) = auth.uid()
    OR get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- G.7) answers
DROP POLICY IF EXISTS "Admins can manage all answers" ON public.answers;
CREATE POLICY "Admins can manage all answers"
  ON public.answers FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Supervisors can grade answers" ON public.answers;
CREATE POLICY "Supervisors can grade answers"
  ON public.answers FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('supervisor', 'admin', 'super_admin'));

DROP POLICY IF EXISTS "Supervisors can view assigned student answers" ON public.answers;
CREATE POLICY "Supervisors can view assigned student answers"
  ON public.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_submissions ls
      WHERE ls.id = answers.submission_id
      AND (
        get_supervisor_id(ls.student_id) = auth.uid()
        OR get_user_role(auth.uid()) IN ('admin', 'super_admin')
      )
    )
  );

-- G.8) notifications
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- G.9) storage.objects (course-images bucket)
DROP POLICY IF EXISTS "Admins can upload course images" ON storage.objects;
CREATE POLICY "Admins can upload course images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-images'
    AND get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Admins can update course images" ON storage.objects;
CREATE POLICY "Admins can update course images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-images'
    AND get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Admins can delete course images" ON storage.objects;
CREATE POLICY "Admins can delete course images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-images'
    AND get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );
