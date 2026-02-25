import { z } from 'zod'

// Auth
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

// Courses
export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  category: z.enum(['basics', 'congresses', 'accs']),
  is_published: z.boolean().default(false),
  image_url: z.string().nullable().optional(),
  checkout_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
})

// Lessons
export const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sort_order: z.coerce.number().int().min(0),
})

// Questions
export const questionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required'),
  sort_order: z.coerce.number().int().min(0),
})

// Answers
export const answerSchema = z.object({
  answer_text: z.string().min(1, 'Answer is required'),
})

// Grading
export const gradingSchema = z.object({
  answers: z.array(z.object({
    answer_id: z.string().uuid(),
    supervisor_feedback: z.string(),
    needs_correction: z.boolean(),
  })),
  status: z.enum(['graded_pass', 'graded_corrections']),
})

// Profile
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type CourseInput = z.infer<typeof courseSchema>
export type LessonInput = z.infer<typeof lessonSchema>
export type QuestionInput = z.infer<typeof questionSchema>
export type AnswerInput = z.infer<typeof answerSchema>
export type GradingInput = z.infer<typeof gradingSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
