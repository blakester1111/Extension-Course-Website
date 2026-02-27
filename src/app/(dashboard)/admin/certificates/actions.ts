'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, can_attest_certs, can_sign_certs')
    .eq('id', user.id)
    .single()
  if (!profile) throw new Error('No profile')
  return { supabase, user, profile }
}

async function requireAdmin() {
  const { supabase, user, profile } = await requireAuth()
  if (!['admin', 'super_admin'].includes(profile.role)) throw new Error('Not authorized')
  return { supabase, user, profile }
}

/** Admin grants/revokes cert permissions on a user */
export async function updateCertPermissions(
  profileId: string,
  permissions: { can_attest_certs?: boolean; can_sign_certs?: boolean }
) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('profiles')
    .update(permissions)
    .eq('id', profileId)
  if (error) return { error: error.message }
  revalidatePath('/admin/students')
  return { success: true }
}

/** Create a certificate record when a course is fully completed */
export async function createCertificate(studentId: string, courseId: string) {
  const { supabase } = await requireAdmin()

  // Check if cert already exists
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existing) return { error: 'Certificate already exists for this student and course' }

  const { error } = await supabase
    .from('certificates')
    .insert({
      student_id: studentId,
      course_id: courseId,
      status: 'pending_attestation',
    })

  if (error) return { error: error.message }
  revalidatePath('/admin/certificates')
  return { success: true }
}

/** Certs & Awards user attests that the course was completed fully and honestly */
export async function attestCertificate(certificateId: string, certificateNumber: string) {
  const { supabase, user, profile } = await requireAuth()

  if (!profile.can_attest_certs && !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'You do not have Certificates & Awards permission' }
  }

  if (!certificateNumber.trim()) {
    return { error: 'Certificate number is required' }
  }

  // Check for duplicate certificate number
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('certificate_number', certificateNumber.trim())
    .neq('id', certificateId)
    .maybeSingle()

  if (existing) {
    return { error: `Certificate number "${certificateNumber.trim()}" is already in use` }
  }

  const { error } = await supabase
    .from('certificates')
    .update({
      status: 'pending_seal',
      attested_by: user.id,
      attested_at: new Date().toISOString(),
      certificate_number: certificateNumber.trim(),
    })
    .eq('id', certificateId)
    .eq('status', 'pending_attestation')

  if (error) return { error: error.message }
  revalidatePath('/admin/certificates')
  return { success: true }
}

/** Keeper of Seals user signs and issues the certificate */
export async function sealCertificate(certificateId: string) {
  const { supabase, user, profile } = await requireAuth()

  if (!profile.can_sign_certs && !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'You do not have Keeper of Seals permission' }
  }

  const { error } = await supabase
    .from('certificates')
    .update({
      status: 'issued',
      sealed_by: user.id,
      sealed_at: new Date().toISOString(),
      issued_at: new Date().toISOString(),
    })
    .eq('id', certificateId)
    .eq('status', 'pending_seal')

  if (error) return { error: error.message }

  // Notify the student
  const { data: cert } = await supabase
    .from('certificates')
    .select('student_id, course:courses(title)')
    .eq('id', certificateId)
    .single()

  if (cert) {
    await supabase
      .from('notifications')
      .insert({
        user_id: cert.student_id,
        type: 'enrollment_confirmed',
        title: 'Certificate Issued!',
        message: `Your certificate for "${(cert.course as any)?.title}" has been issued. View it in your profile.`,
        link: '/student/certificates',
      })
  }

  revalidatePath('/admin/certificates')
  return { success: true }
}

/** Mark a certificate as mailed or clear mail status */
export async function updateMailStatus(
  certificateId: string,
  status: 'needs_mailing' | 'mailed' | null
) {
  const { supabase, profile } = await requireAuth()

  if (!profile.can_attest_certs && !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'You do not have permission to update mail status' }
  }

  const update: Record<string, any> = {
    mail_status: status,
    mailed_at: status === 'mailed' ? new Date().toISOString() : null,
  }

  const { error } = await supabase
    .from('certificates')
    .update(update)
    .eq('id', certificateId)

  if (error) return { error: error.message }
  revalidatePath('/admin/certificates')
  return { success: true }
}
