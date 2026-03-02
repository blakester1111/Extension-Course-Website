-- 1. Add correct_answer field to questions table (for grading manual answers)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer text;

-- 2. Student notes system
CREATE TABLE IF NOT EXISTS student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_created_at ON student_notes(created_at DESC);

-- RLS for student_notes
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and supervisors can view all notes"
  ON student_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'supervisor')
    )
  );

CREATE POLICY "Admins and supervisors can insert notes"
  ON student_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'supervisor')
    )
  );

CREATE POLICY "Admins can delete notes"
  ON student_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 3. Student materials ownership tracking
CREATE TABLE IF NOT EXISTS student_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  owns_book boolean NOT NULL DEFAULT false,
  owns_lectures boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_student_materials_student_id ON student_materials(student_id);

-- RLS for student_materials
ALTER TABLE student_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and supervisors can view materials"
  ON student_materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'supervisor')
    )
  );

CREATE POLICY "Admins and supervisors can insert materials"
  ON student_materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'supervisor')
    )
  );

CREATE POLICY "Admins and supervisors can update materials"
  ON student_materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'supervisor')
    )
  );
