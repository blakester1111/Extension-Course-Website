-- Migration: Add image upload support for diagram/drawing questions
-- Adds requires_image column to questions table
-- Adds image_path column to answers table
-- Creates answer-images storage bucket with RLS policies

-- 1. Add requires_image column to questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS requires_image boolean NOT NULL DEFAULT false;

-- 2. Add image_path column to answers
ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_path text;

-- 3. Create storage bucket for answer images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'answer-images',
  'answer-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS policies for answer-images bucket
DO $$
BEGIN
  -- Students can upload answer images to their own submissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Students can upload answer images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Students can upload answer images"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'answer-images'
        AND (storage.foldername(name))[1] IN (
          SELECT ls.id::text FROM lesson_submissions ls WHERE ls.student_id = auth.uid()
        )
      );
  END IF;

  -- Students can update (overwrite) their own answer images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Students can update their answer images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Students can update their answer images"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'answer-images'
        AND (storage.foldername(name))[1] IN (
          SELECT ls.id::text FROM lesson_submissions ls WHERE ls.student_id = auth.uid()
        )
      );
  END IF;

  -- Students can delete their own answer images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Students can delete their answer images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Students can delete their answer images"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'answer-images'
        AND (storage.foldername(name))[1] IN (
          SELECT ls.id::text FROM lesson_submissions ls WHERE ls.student_id = auth.uid()
        )
      );
  END IF;

  -- Public read access for answer images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for answer images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public read access for answer images"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'answer-images');
  END IF;
END $$;
