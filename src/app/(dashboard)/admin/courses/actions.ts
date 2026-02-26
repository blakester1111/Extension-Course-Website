'use server'

import { createClient } from '@/lib/supabase/server'
import { courseSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { checkAndCreateCertificate } from '@/lib/certificates'

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
  return { supabase, user, profile }
}

export async function createCourse(formData: FormData) {
  const { supabase } = await requireAdmin()

  const raw = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    price: formData.get('price'),
    category: formData.get('category'),
    is_published: formData.get('is_published') === 'true',
    image_url: formData.get('image_url') || null,
    checkout_url: formData.get('checkout_url') || null,
  }

  const parsed = courseSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { price, ...rest } = parsed.data
  const { error } = await supabase
    .from('courses')
    .insert({ ...rest, price_cents: Math.round(price * 100) })

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/admin/courses')
  redirect('/admin/courses')
}

export async function updateCourse(id: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const raw = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    price: formData.get('price'),
    category: formData.get('category'),
    is_published: formData.get('is_published') === 'true',
    image_url: formData.get('image_url') || null,
    checkout_url: formData.get('checkout_url') || null,
  }

  const parsed = courseSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { price, ...rest } = parsed.data
  const { error } = await supabase
    .from('courses')
    .update({ ...rest, price_cents: Math.round(price * 100) })
    .eq('id', id)

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}`)
  redirect('/admin/courses')
}

export async function deleteCourse(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/courses')
  redirect('/admin/courses')
}

export async function toggleCoursePublished(id: string, is_published: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('courses')
    .update({ is_published })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/courses')
}

export async function uploadCourseImage(formData: FormData) {
  const { supabase } = await requireAdmin()

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('course-images')
    .upload(fileName, file)

  if (error) {
    return { error: error.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('course-images')
    .getPublicUrl(fileName)

  return { url: publicUrl }
}

export async function enrollStudent(studentId: string, courseId: string, invoiceNumber?: string) {
  const { supabase, user } = await requireAdmin()

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existing) {
    return { error: 'Student is already enrolled in this course' }
  }

  // Check if student is staff and invoice provided
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('is_staff')
    .eq('id', studentId)
    .single()

  const isStaffInvoice = studentProfile?.is_staff && invoiceNumber?.trim()

  const { error } = await supabase
    .from('enrollments')
    .insert({
      student_id: studentId,
      course_id: courseId,
      enrolled_by: user.id,
      status: isStaffInvoice ? 'pending_invoice_verification' : 'active',
      invoice_number: invoiceNumber?.trim() || null,
    })

  if (error) {
    return { error: error.message }
  }

  // Notify student
  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single()

  if (isStaffInvoice) {
    await supabase
      .from('notifications')
      .insert({
        user_id: studentId,
        type: 'invoice_pending',
        title: 'Enrollment Pending Approval',
        message: `Your enrollment in "${course?.title}" is pending invoice verification by your supervisor.`,
        link: '/student/dashboard',
      })
  } else {
    await supabase
      .from('notifications')
      .insert({
        user_id: studentId,
        type: 'enrollment_confirmed',
        title: 'Enrollment Confirmed',
        message: `You have been enrolled in "${course?.title}". Start studying now!`,
        link: `/student/courses/${courseId}`,
      })
  }

  revalidatePath('/admin/students')
  revalidatePath('/admin/courses')
  return { success: true }
}

export async function backenterStudent(
  studentId: string,
  courseId: string,
  passedLessonIds: string[],
  completionDate?: string,
  certificateNumber?: string
) {
  const { supabase, user } = await requireAdmin()

  // Use the provided date or fall back to now
  const dateStr = completionDate
    ? new Date(completionDate + 'T12:00:00Z').toISOString()
    : new Date().toISOString()

  // Ensure enrollment exists (create if not)
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!existing) {
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        enrolled_by: user.id,
        status: 'active',
      })
    if (enrollError) return { error: enrollError.message }
  }

  // For each selected lesson, create a submission with graded_pass
  for (const lessonId of passedLessonIds) {
    // Check if submission already exists
    const { data: existingSub } = await supabase
      .from('lesson_submissions')
      .select('id')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (existingSub) {
      // Update existing submission to graded_pass
      await supabase
        .from('lesson_submissions')
        .update({
          status: 'graded_pass',
          grade: 100,
          graded_by: user.id,
          graded_at: dateStr,
          submitted_at: dateStr,
        })
        .eq('id', existingSub.id)
    } else {
      // Create new submission as graded_pass
      const { data: newSub } = await supabase
        .from('lesson_submissions')
        .insert({
          student_id: studentId,
          lesson_id: lessonId,
          status: 'graded_pass',
          grade: 100,
          graded_by: user.id,
          graded_at: dateStr,
          submitted_at: dateStr,
        })
        .select('id')
        .single()

      // Create placeholder answers for all questions so the system is consistent
      if (newSub) {
        const { data: questions } = await supabase
          .from('questions')
          .select('id')
          .eq('lesson_id', lessonId)

        if (questions && questions.length > 0) {
          await supabase
            .from('answers')
            .insert(
              questions.map(q => ({
                submission_id: newSub.id,
                question_id: q.id,
                answer_text: '(Back-entered — completed in prior system)',
                needs_correction: false,
              }))
            )
        }
      }
    }
  }

  // No notifications for back-entered data — this is internal admin work

  // Check if course is now fully completed and auto-create certificate
  // Back-entered completions skip attestation/seal workflow
  await checkAndCreateCertificate(supabase, studentId, courseId, {
    backentered: true,
    certificateNumber: certificateNumber,
    completionDate: completionDate,
  })

  revalidatePath('/admin/students')
  revalidatePath('/admin/courses')
  revalidatePath('/admin/certificates')
  return { success: true }
}

export async function backenterFullCourse(
  studentId: string,
  courseId: string,
  completionDate?: string,
  certificateNumber?: string
) {
  const { supabase } = await requireAdmin()

  // Get all lessons for this course
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .order('sort_order')

  if (!lessons || lessons.length === 0) {
    return { error: 'No lessons found in this course' }
  }

  // Delegate to the lesson-level back-enter with all lesson IDs
  return backenterStudent(
    studentId,
    courseId,
    lessons.map(l => l.id),
    completionDate,
    certificateNumber
  )
}

/** Admin can fix completion dates on back-entered or graded submissions */
export async function updateSubmissionDate(
  submissionId: string,
  newDate: string
) {
  const { supabase } = await requireAdmin()

  const dateStr = new Date(newDate + 'T12:00:00Z').toISOString()

  const { error } = await supabase
    .from('lesson_submissions')
    .update({
      graded_at: dateStr,
      submitted_at: dateStr,
    })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  return { success: true }
}

/** Admin can fix the issued_at date on a certificate */
export async function updateCertificateDate(
  certificateId: string,
  newDate: string
) {
  const { supabase } = await requireAdmin()

  const dateStr = new Date(newDate + 'T12:00:00Z').toISOString()

  const { error } = await supabase
    .from('certificates')
    .update({ issued_at: dateStr })
    .eq('id', certificateId)

  if (error) return { error: error.message }

  revalidatePath('/admin/certificates')
  revalidatePath('/student/certificates')
  return { success: true }
}

export async function removeEnrollment(studentId: string, courseId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', studentId)
    .eq('course_id', courseId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/students')
  return { success: true }
}
