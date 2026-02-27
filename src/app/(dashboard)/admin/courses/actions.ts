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
          is_backentered: true,
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
          is_backentered: true,
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

/** Delete a back-entered submission and its answers. Also removes certificate if course is no longer complete. */
export async function deleteBackenteredSubmission(submissionId: string) {
  const { supabase } = await requireAdmin()

  // Verify submission exists and is back-entered
  const { data: sub } = await supabase
    .from('lesson_submissions')
    .select('id, student_id, lesson_id, is_backentered, lesson:lessons(course_id)')
    .eq('id', submissionId)
    .single()

  if (!sub) return { error: 'Submission not found' }
  if (!sub.is_backentered) return { error: 'Only back-entered submissions can be deleted with this action' }

  const courseId = (sub.lesson as any)?.course_id

  // Delete answers first (FK constraint)
  await supabase.from('answers').delete().eq('submission_id', submissionId)

  // Delete the submission
  const { error } = await supabase
    .from('lesson_submissions')
    .delete()
    .eq('id', submissionId)

  if (error) return { error: error.message }

  // Check if there's a certificate for this course that should be removed
  if (courseId) {
    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)

    const { data: lessonIds } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)

    const { count: passedCount } = await supabase
      .from('lesson_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', sub.student_id)
      .eq('status', 'graded_pass')
      .in('lesson_id', (lessonIds || []).map(l => l.id))

    // If course is no longer fully passed, remove the certificate
    if ((passedCount || 0) < (totalLessons || 0)) {
      await supabase
        .from('certificates')
        .delete()
        .eq('student_id', sub.student_id)
        .eq('course_id', courseId)
    }
  }

  revalidatePath('/admin/students')
  revalidatePath('/admin/certificates')
  return { success: true }
}

/** Delete ALL back-entered submissions for a student in a course, plus certificate. */
export async function deleteBackenteredCourse(studentId: string, courseId: string) {
  const { supabase } = await requireAdmin()

  // Get all back-entered submissions for this student + course
  const { data: lessonIds } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)

  if (!lessonIds || lessonIds.length === 0) return { error: 'No lessons in course' }

  const { data: beSubs } = await supabase
    .from('lesson_submissions')
    .select('id')
    .eq('student_id', studentId)
    .eq('is_backentered', true)
    .in('lesson_id', lessonIds.map(l => l.id))

  if (!beSubs || beSubs.length === 0) return { error: 'No back-entered submissions found' }

  const subIds = beSubs.map(s => s.id)

  // Delete answers, then submissions
  await supabase.from('answers').delete().in('submission_id', subIds)
  const { error } = await supabase
    .from('lesson_submissions')
    .delete()
    .in('id', subIds)

  if (error) return { error: error.message }

  // Remove certificate for this course (if it was auto-created by back-enter)
  await supabase
    .from('certificates')
    .delete()
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .eq('is_backentered', true)

  revalidatePath('/admin/students')
  revalidatePath('/admin/certificates')
  return { success: true, deletedCount: subIds.length }
}

/** Revert a grading decision — moves submission back to 'submitted' for re-grading. */
export async function revertSubmissionToSubmitted(submissionId: string) {
  const { supabase } = await requireAdmin()

  const { data: sub } = await supabase
    .from('lesson_submissions')
    .select('id, student_id, status, lesson:lessons(course_id)')
    .eq('id', submissionId)
    .single()

  if (!sub) return { error: 'Submission not found' }
  if (!['graded_pass', 'graded_corrections'].includes(sub.status)) {
    return { error: 'Can only revert graded submissions' }
  }

  const courseId = (sub.lesson as any)?.course_id

  // Clear grading data on the submission
  const { error } = await supabase
    .from('lesson_submissions')
    .update({
      status: 'submitted',
      grade: null,
      graded_by: null,
      graded_at: null,
    })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  // Clear supervisor feedback on answers (keep student answers intact)
  await supabase
    .from('answers')
    .update({ supervisor_feedback: null, needs_correction: false })
    .eq('submission_id', submissionId)

  // If was graded_pass, check if we need to remove certificate
  if (sub.status === 'graded_pass' && courseId) {
    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)

    const { data: lessonIds } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)

    const { count: passedCount } = await supabase
      .from('lesson_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', sub.student_id)
      .eq('status', 'graded_pass')
      .in('lesson_id', (lessonIds || []).map(l => l.id))

    if ((passedCount || 0) < (totalLessons || 0)) {
      // Delete only non-issued certificates (don't revoke already issued ones automatically)
      await supabase
        .from('certificates')
        .delete()
        .eq('student_id', sub.student_id)
        .eq('course_id', courseId)
        .in('status', ['pending_attestation', 'pending_seal'])
    }
  }

  // Recalculate honor roll if it was a pass being reverted
  if (sub.status === 'graded_pass') {
    // Decrement total lessons submitted in honor roll
    const { data: streak } = await supabase
      .from('honor_roll_streaks')
      .select('total_lessons_submitted')
      .eq('student_id', sub.student_id)
      .maybeSingle()

    if (streak && streak.total_lessons_submitted > 0) {
      await supabase
        .from('honor_roll_streaks')
        .update({ total_lessons_submitted: streak.total_lessons_submitted - 1 })
        .eq('student_id', sub.student_id)
    }
  }

  revalidatePath('/admin/students')
  revalidatePath('/admin/certificates')
  revalidatePath('/supervisor/queue')
  return { success: true }
}

/** Delete a certificate record (admin only). For issued certs, use with caution. */
export async function deleteCertificate(certificateId: string) {
  const { supabase } = await requireAdmin()

  const { data: cert } = await supabase
    .from('certificates')
    .select('id, status, mail_status')
    .eq('id', certificateId)
    .single()

  if (!cert) return { error: 'Certificate not found' }

  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', certificateId)

  if (error) return { error: error.message }

  revalidatePath('/admin/certificates')
  revalidatePath('/student/certificates')
  return { success: true }
}

/** Change which course an enrollment is for. Moves to new course, deletes old submissions/cert. */
export async function changeEnrollmentCourse(
  studentId: string,
  oldCourseId: string,
  newCourseId: string
) {
  const { supabase } = await requireAdmin()

  if (oldCourseId === newCourseId) return { error: 'Old and new course are the same' }

  // Check old enrollment exists
  const { data: oldEnrollment } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('course_id', oldCourseId)
    .maybeSingle()

  if (!oldEnrollment) return { error: 'No enrollment found for the old course' }

  // Check student is not already enrolled in new course
  const { data: existingNew } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', newCourseId)
    .maybeSingle()

  if (existingNew) return { error: 'Student is already enrolled in the new course' }

  // Delete old submissions + answers for old course
  const { data: oldLessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', oldCourseId)

  if (oldLessons && oldLessons.length > 0) {
    const { data: oldSubs } = await supabase
      .from('lesson_submissions')
      .select('id')
      .eq('student_id', studentId)
      .in('lesson_id', oldLessons.map(l => l.id))

    if (oldSubs && oldSubs.length > 0) {
      await supabase.from('answers').delete().in('submission_id', oldSubs.map(s => s.id))
      await supabase.from('lesson_submissions').delete().in('id', oldSubs.map(s => s.id))
    }
  }

  // Delete certificate for old course
  await supabase
    .from('certificates')
    .delete()
    .eq('student_id', studentId)
    .eq('course_id', oldCourseId)

  // Update enrollment to new course
  const { error } = await supabase
    .from('enrollments')
    .update({ course_id: newCourseId })
    .eq('id', oldEnrollment.id)

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  revalidatePath('/admin/certificates')
  return { success: true }
}

/** Transfer an enrollment (and all its submissions/cert) from one student to another. */
export async function transferEnrollment(
  fromStudentId: string,
  toStudentId: string,
  courseId: string
) {
  const { supabase } = await requireAdmin()

  if (fromStudentId === toStudentId) return { error: 'Cannot transfer to same student' }

  // Verify target student exists
  const { data: toProfile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', toStudentId)
    .single()

  if (!toProfile) return { error: 'Target student not found' }

  // Check target doesn't already have this enrollment
  const { data: existingEnroll } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', toStudentId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existingEnroll) return { error: `${toProfile.full_name} is already enrolled in this course` }

  // Get lessons for this course
  const { data: lessonIds } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)

  // Transfer enrollment
  const { error: enrollErr } = await supabase
    .from('enrollments')
    .update({ student_id: toStudentId })
    .eq('student_id', fromStudentId)
    .eq('course_id', courseId)

  if (enrollErr) return { error: enrollErr.message }

  // Transfer submissions
  if (lessonIds && lessonIds.length > 0) {
    await supabase
      .from('lesson_submissions')
      .update({ student_id: toStudentId })
      .eq('student_id', fromStudentId)
      .in('lesson_id', lessonIds.map(l => l.id))
  }

  // Transfer certificate
  await supabase
    .from('certificates')
    .update({ student_id: toStudentId })
    .eq('student_id', fromStudentId)
    .eq('course_id', courseId)

  revalidatePath('/admin/students')
  revalidatePath('/admin/certificates')
  return { success: true, transferredTo: toProfile.full_name }
}

/** Bulk update dates on all back-entered submissions for a student+course. */
export async function bulkUpdateBackenteredDates(
  studentId: string,
  courseId: string,
  newDate: string
) {
  const { supabase } = await requireAdmin()

  const dateStr = new Date(newDate + 'T12:00:00Z').toISOString()

  // Get lesson IDs for course
  const { data: lessonIds } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)

  if (!lessonIds || lessonIds.length === 0) return { error: 'No lessons in course' }

  // Update all back-entered submissions
  const { data: updated, error } = await supabase
    .from('lesson_submissions')
    .update({ graded_at: dateStr, submitted_at: dateStr })
    .eq('student_id', studentId)
    .eq('is_backentered', true)
    .in('lesson_id', lessonIds.map(l => l.id))
    .select('id')

  if (error) return { error: error.message }

  // Also update back-entered certificate date
  await supabase
    .from('certificates')
    .update({ issued_at: dateStr })
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .eq('is_backentered', true)

  revalidatePath('/admin/students')
  revalidatePath('/admin/certificates')
  return { success: true, updatedCount: updated?.length || 0 }
}

/** Merge two profiles: move all data from source to target, then delete source. */
export async function mergeProfiles(sourceId: string, targetId: string) {
  const { supabase } = await requireAdmin()

  if (sourceId === targetId) return { error: 'Cannot merge a profile into itself' }

  // Verify both profiles exist
  const { data: source } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', sourceId)
    .single()

  const { data: target } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', targetId)
    .single()

  if (!source) return { error: 'Source profile not found' }
  if (!target) return { error: 'Target profile not found' }

  // Don't merge admin accounts — too risky
  if (['admin', 'super_admin'].includes(source.role)) {
    return { error: 'Cannot merge an admin profile. Demote first.' }
  }

  // --- Transfer enrollments ---
  // Get source enrollments
  const { data: sourceEnrolls } = await supabase
    .from('enrollments')
    .select('id, course_id')
    .eq('student_id', sourceId)

  // Get target's existing course IDs to detect conflicts
  const { data: targetEnrolls } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', targetId)

  const targetCourseIds = new Set((targetEnrolls || []).map(e => e.course_id))

  for (const enrollment of sourceEnrolls || []) {
    if (targetCourseIds.has(enrollment.course_id)) {
      // Conflict: both enrolled in same course — delete source enrollment
      // (target's enrollment and submissions take priority)
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', enrollment.course_id)

      if (lessons && lessons.length > 0) {
        const { data: subs } = await supabase
          .from('lesson_submissions')
          .select('id')
          .eq('student_id', sourceId)
          .in('lesson_id', lessons.map(l => l.id))

        if (subs && subs.length > 0) {
          await supabase.from('answers').delete().in('submission_id', subs.map(s => s.id))
          await supabase.from('lesson_submissions').delete().in('id', subs.map(s => s.id))
        }
      }

      await supabase.from('certificates').delete().eq('student_id', sourceId).eq('course_id', enrollment.course_id)
      await supabase.from('enrollments').delete().eq('id', enrollment.id)
    } else {
      // No conflict: transfer enrollment + related data
      await supabase.from('enrollments').update({ student_id: targetId }).eq('id', enrollment.id)

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', enrollment.course_id)

      if (lessons && lessons.length > 0) {
        await supabase
          .from('lesson_submissions')
          .update({ student_id: targetId })
          .eq('student_id', sourceId)
          .in('lesson_id', lessons.map(l => l.id))
      }

      await supabase
        .from('certificates')
        .update({ student_id: targetId })
        .eq('student_id', sourceId)
        .eq('course_id', enrollment.course_id)
    }
  }

  // --- Transfer notifications ---
  await supabase
    .from('notifications')
    .update({ user_id: targetId })
    .eq('user_id', sourceId)

  // --- Merge honor roll streaks ---
  const { data: sourceStreak } = await supabase
    .from('honor_roll_streaks')
    .select('*')
    .eq('student_id', sourceId)
    .maybeSingle()

  if (sourceStreak) {
    const { data: targetStreak } = await supabase
      .from('honor_roll_streaks')
      .select('*')
      .eq('student_id', targetId)
      .maybeSingle()

    if (targetStreak) {
      // Merge: add totals, keep max streaks
      await supabase
        .from('honor_roll_streaks')
        .update({
          total_lessons_submitted: targetStreak.total_lessons_submitted + sourceStreak.total_lessons_submitted,
          longest_streak_weeks: Math.max(targetStreak.longest_streak_weeks, sourceStreak.longest_streak_weeks),
        })
        .eq('student_id', targetId)

      await supabase.from('honor_roll_streaks').delete().eq('student_id', sourceId)
    } else {
      // Transfer source streak to target
      await supabase
        .from('honor_roll_streaks')
        .update({ student_id: targetId })
        .eq('student_id', sourceId)
    }
  }

  // --- Update supervisor references ---
  // Any students supervised by source → reassign to target
  await supabase
    .from('profiles')
    .update({ supervisor_id: targetId })
    .eq('supervisor_id', sourceId)

  // --- Transfer orders ---
  await supabase
    .from('orders')
    .update({ student_id: targetId })
    .eq('student_id', sourceId)

  // --- Delete source profile (cascades remaining FKs) ---
  await supabase.from('profiles').delete().eq('id', sourceId)

  // --- Delete source auth user ---
  await supabase.auth.admin.deleteUser(sourceId)

  revalidatePath('/admin/students')
  revalidatePath('/admin/certificates')
  return {
    success: true,
    message: `Merged "${source.full_name}" (${source.email}) into "${target.full_name}" (${target.email})`,
  }
}

/** Reset a submission back to draft so the student can re-answer from scratch. */
export async function resetSubmissionToDraft(submissionId: string) {
  const { supabase } = await requireAdmin()

  const { data: sub } = await supabase
    .from('lesson_submissions')
    .select('id, student_id, status, lesson:lessons(course_id)')
    .eq('id', submissionId)
    .single()

  if (!sub) return { error: 'Submission not found' }

  const courseId = (sub.lesson as any)?.course_id

  // Reset submission to draft
  const { error } = await supabase
    .from('lesson_submissions')
    .update({
      status: 'draft',
      grade: null,
      graded_by: null,
      graded_at: null,
      submitted_at: null,
    })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  // Clear all answer data so student starts fresh
  await supabase
    .from('answers')
    .update({
      answer_text: '',
      image_path: null,
      supervisor_feedback: null,
      needs_correction: false,
    })
    .eq('submission_id', submissionId)

  // If was graded_pass, handle certificate
  if (sub.status === 'graded_pass' && courseId) {
    await supabase
      .from('certificates')
      .delete()
      .eq('student_id', sub.student_id)
      .eq('course_id', courseId)
      .in('status', ['pending_attestation', 'pending_seal'])
  }

  revalidatePath('/admin/students')
  revalidatePath('/admin/certificates')
  return { success: true }
}
