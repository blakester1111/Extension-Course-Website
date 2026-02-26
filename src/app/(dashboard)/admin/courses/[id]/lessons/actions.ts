'use server'

import { createClient } from '@/lib/supabase/server'
import { lessonSchema, questionSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) throw new Error('Not authorized')
  return { supabase, user }
}

// Regex to detect "Lesson N" or "Lesson N: ..." or "Lesson N - ..." at the start of a title
const LESSON_NUM_RE = /^(Lesson\s+)\d+/i

/**
 * Renumber all lessons in a course whose titles match the "Lesson #" pattern.
 * Titles like "Lesson 5" or "Lesson 12: Some Topic" get their number updated
 * to match their position (1-based) in sort_order among ALL lessons in the course.
 */
async function renumberLessonTitles(supabase: any, courseId: string) {
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  if (!lessons || lessons.length === 0) return

  const updates: Promise<any>[] = []
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i]
    const match = lesson.title.match(LESSON_NUM_RE)
    if (match) {
      const expectedNum = i + 1
      const newTitle = lesson.title.replace(LESSON_NUM_RE, `${match[1]}${expectedNum}`)
      if (newTitle !== lesson.title) {
        updates.push(
          supabase.from('lessons').update({ title: newTitle }).eq('id', lesson.id)
        )
      }
    }
  }

  if (updates.length > 0) await Promise.all(updates)
}

export async function createLesson(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  // Get next sort order
  const { data: existing } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const raw = {
    title: formData.get('title'),
    sort_order: nextOrder,
  }

  const parsed = lessonSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({ ...parsed.data, course_id: courseId })
    .select()
    .single()

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath(`/admin/courses/${courseId}/lessons`)
  return { lesson }
}

export async function updateLesson(lessonId: string, courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const raw = {
    title: formData.get('title'),
    sort_order: formData.get('sort_order'),
  }

  const parsed = lessonSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('lessons')
    .update(parsed.data)
    .eq('id', lessonId)

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath(`/admin/courses/${courseId}/lessons`)
}

export async function deleteLesson(lessonId: string, courseId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)

  if (error) {
    return { error: error.message }
  }

  // Renumber remaining lessons with "Lesson #" pattern
  await renumberLessonTitles(supabase, courseId)

  revalidatePath(`/admin/courses/${courseId}/lessons`)
}

export async function reorderLessons(courseId: string, lessonIds: string[]) {
  const { supabase } = await requireAdmin()

  const updates = lessonIds.map((id, index) =>
    supabase.from('lessons').update({ sort_order: index }).eq('id', id)
  )

  await Promise.all(updates)

  // Renumber lessons with "Lesson #" pattern to match new order
  await renumberLessonTitles(supabase, courseId)

  revalidatePath(`/admin/courses/${courseId}/lessons`)
}

export async function updateLessonInstructions(lessonId: string, courseId: string, instructions: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('lessons')
    .update({ instructions })
    .eq('id', lessonId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`)
}

export async function updateLessonTitle(lessonId: string, courseId: string, title: string) {
  const { supabase } = await requireAdmin()

  const trimmed = title.trim()
  if (!trimmed) return { error: 'Title cannot be empty' }

  const { error } = await supabase
    .from('lessons')
    .update({ title: trimmed })
    .eq('id', lessonId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/courses/${courseId}/lessons`)
  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`)
  return {}
}

export async function createQuestion(lessonId: string, courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const { data: existing } = await supabase
    .from('questions')
    .select('sort_order')
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const raw = {
    question_text: formData.get('question_text'),
    sort_order: nextOrder,
  }

  const parsed = questionSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: question, error } = await supabase
    .from('questions')
    .insert({ ...parsed.data, lesson_id: lessonId })
    .select()
    .single()

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`)
  return { question }
}

export async function updateQuestion(questionId: string, lessonId: string, courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const raw = {
    question_text: formData.get('question_text'),
    sort_order: formData.get('sort_order'),
  }

  const parsed = questionSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('questions')
    .update(parsed.data)
    .eq('id', questionId)

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`)
}

export async function toggleQuestionRequiresImage(questionId: string, lessonId: string, courseId: string, requiresImage: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('questions')
    .update({ requires_image: requiresImage })
    .eq('id', questionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`)
  return { success: true }
}

export async function deleteQuestion(questionId: string, lessonId: string, courseId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`)
}
