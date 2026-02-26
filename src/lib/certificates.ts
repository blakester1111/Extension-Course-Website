import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Check if a student has completed all lessons in a course.
 * If so, auto-create a certificate record.
 *
 * For back-entered completions, the certificate is auto-issued with
 * "backentered" flag so it skips the attestation/seal workflow.
 *
 * For normal completions, it enters pending_attestation.
 */
export async function checkAndCreateCertificate(
  supabase: SupabaseClient,
  studentId: string,
  courseId: string,
  options?: {
    backentered?: boolean
    certificateNumber?: string
    completionDate?: string
  }
) {
  // Check if a certificate already exists for this student + course
  const { data: existingCert } = await supabase
    .from('certificates')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existingCert) return false // Already has a certificate record

  // Count total lessons in the course
  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  if (!totalLessons || totalLessons === 0) return false

  // Count passed submissions for this student in this course
  const { data: lessonIds } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)

  const { count: passedCount } = await supabase
    .from('lesson_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('status', 'graded_pass')
    .in('lesson_id', (lessonIds || []).map(l => l.id))

  if ((passedCount || 0) < totalLessons) return false

  // All lessons passed — create certificate
  if (options?.backentered) {
    // Back-entered: auto-issue, skip attestation/seal workflow
    const issuedAt = options.completionDate
      ? new Date(options.completionDate + 'T12:00:00Z').toISOString()
      : new Date().toISOString()

    await supabase
      .from('certificates')
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: 'issued',
        is_backentered: true,
        certificate_number: options.certificateNumber?.trim() || null,
        issued_at: issuedAt,
      })
    return true
  } else {
    // Normal completion: enter attestation workflow
    await supabase
      .from('certificates')
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: 'pending_attestation',
      })
    return true
  }
}
