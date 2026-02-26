export type UserRole = 'student' | 'supervisor' | 'admin' | 'super_admin'
export type Organization = 'day' | 'foundation'
export type CourseCategory = 'basics' | 'congresses' | 'accs'
export type SubmissionStatus = 'draft' | 'submitted' | 'graded_pass' | 'graded_corrections'
export type EnrollmentStatus = 'active' | 'pending_invoice_verification'
export type NotificationType = 'lesson_graded' | 'lesson_submitted' | 'enrollment_confirmed' | 'corrections_needed' | 'invoice_pending' | 'invoice_verified' | 'nudge'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_staff: boolean
  is_deadfiled: boolean
  organization: Organization | null
  supervisor_id: string | null
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string
  synopsis: string | null
  full_description: string | null
  image_url: string | null
  price_cents: number
  checkout_url: string | null
  category: CourseCategory
  sort_order: number
  is_published: boolean
  lesson_count: number
  length_hours: number | null
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  instructions: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  lesson_id: string
  question_text: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_by: string | null
  status: EnrollmentStatus
  invoice_number: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
}

export interface LessonSubmission {
  id: string
  student_id: string
  lesson_id: string
  status: SubmissionStatus
  grade: number | null
  graded_by: string | null
  graded_at: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface Answer {
  id: string
  submission_id: string
  question_id: string
  answer_text: string
  supervisor_feedback: string | null
  needs_correction: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface HonorRollStreak {
  id: string
  student_id: string
  current_streak_weeks: number
  longest_streak_weeks: number
  total_lessons_submitted: number
  last_submission_week: string | null
  updated_at: string
}
