'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendWelcomeEmail } from '@/lib/resend/send-welcome-email'

async function requireSupervisorOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['supervisor', 'admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Not authorized')
  }

  return { supabase, user, profile }
}

export async function supervisorEnrollStaff(
  studentId: string,
  courseId: string,
  invoiceNumber: string
) {
  const { supabase, user } = await requireSupervisorOrAdmin()

  if (!invoiceNumber.trim()) {
    return { error: 'Invoice number is required for staff enrollment' }
  }

  // Verify the student is_staff
  const { data: student } = await supabase
    .from('profiles')
    .select('is_staff')
    .eq('id', studentId)
    .single()

  if (!student?.is_staff) {
    return { error: 'This student is not designated as staff' }
  }

  // Check existing enrollment
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existing) {
    return { error: 'Student is already enrolled in this course' }
  }

  const { error } = await supabase
    .from('enrollments')
    .insert({
      student_id: studentId,
      course_id: courseId,
      enrolled_by: user.id,
      status: 'pending_invoice_verification',
      invoice_number: invoiceNumber.trim(),
    })

  if (error) return { error: error.message }

  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single()

  await supabase
    .from('notifications')
    .insert({
      user_id: studentId,
      type: 'invoice_pending',
      title: 'Enrollment Pending Approval',
      message: `Your enrollment in "${course?.title}" is pending invoice verification.`,
      link: '/student/dashboard',
    })

  revalidatePath('/supervisor/enrollments')
  revalidatePath('/supervisor/students')
  return { success: true }
}

export async function verifyInvoice(enrollmentId: string) {
  const { supabase, user } = await requireSupervisorOrAdmin()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*, course:courses(title)')
    .eq('id', enrollmentId)
    .eq('status', 'pending_invoice_verification')
    .single()

  if (!enrollment) {
    return { error: 'Enrollment not found or already verified' }
  }

  const { error } = await supabase
    .from('enrollments')
    .update({
      status: 'active',
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  await supabase
    .from('notifications')
    .insert({
      user_id: enrollment.student_id,
      type: 'invoice_verified',
      title: 'Enrollment Approved!',
      message: `Your enrollment in "${(enrollment as any).course?.title}" has been approved. Start studying now!`,
      link: `/student/courses/${enrollment.course_id}`,
    })

  // Send welcome email
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('email, first_name')
    .eq('id', enrollment.student_id)
    .single()

  const courseTitle = (enrollment as any).course?.title
  if (studentProfile?.email && courseTitle) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://extension.fcdc-services.com').replace(/\/$/, '')
    await sendWelcomeEmail({
      to: studentProfile.email,
      firstName: studentProfile.first_name || 'Student',
      courseName: courseTitle,
      courseUrl: `${appUrl}/student/courses/${enrollment.course_id}`,
    })
  }

  revalidatePath('/supervisor/enrollments')
  revalidatePath('/supervisor/students')
  revalidatePath('/admin/students')
  return { success: true }
}

export async function rejectInvoice(enrollmentId: string) {
  const { supabase } = await requireSupervisorOrAdmin()

  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId)
    .eq('status', 'pending_invoice_verification')

  if (error) return { error: error.message }

  revalidatePath('/supervisor/enrollments')
  revalidatePath('/supervisor/students')
  return { success: true }
}
