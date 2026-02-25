'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendNotificationEmail } from '@/lib/resend/send-notification'

async function requireSupervisor() {
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

  return { supabase, user }
}

export async function gradeSubmission(
  submissionId: string,
  grades: {
    answerId: string
    feedback: string
    needsCorrection: boolean
  }[]
) {
  const { supabase, user } = await requireSupervisor()

  // Update each answer with feedback
  for (const grade of grades) {
    await supabase
      .from('answers')
      .update({
        supervisor_feedback: grade.feedback || null,
        needs_correction: grade.needsCorrection,
      })
      .eq('id', grade.answerId)
  }

  // Fetch ALL answers for this submission to calculate grade
  const { data: allAnswers } = await supabase
    .from('answers')
    .select('id, needs_correction')
    .eq('submission_id', submissionId)

  // Get total question count for this lesson
  const { data: submissionData } = await supabase
    .from('lesson_submissions')
    .select('lesson_id')
    .eq('id', submissionId)
    .single()

  const { count: totalQuestions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', submissionData!.lesson_id)

  // Calculate grade
  const correctCount = (allAnswers || []).filter(a => !a.needs_correction).length
  const total = totalQuestions || 1
  const grade = Math.round((correctCount / total) * 100)
  const status = grade === 100 ? 'graded_pass' : 'graded_corrections'

  // Update submission with grade + status
  const { error } = await supabase
    .from('lesson_submissions')
    .update({
      status,
      grade,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  // Get student info for notification
  const { data: submission } = await supabase
    .from('lesson_submissions')
    .select('student_id, lesson:lessons(title, course_id)')
    .eq('id', submissionId)
    .single()

  if (submission) {
    const lessonTitle = (submission as any).lesson?.title
    const courseId = (submission as any).lesson?.course_id

    const notifType = status === 'graded_pass' ? 'lesson_graded' : 'corrections_needed'
    const notifTitle = status === 'graded_pass'
      ? `Lesson Passed! (${grade}%)`
      : `Corrections Needed (${grade}%)`
    const notifMessage = status === 'graded_pass'
      ? `Your submission for "${lessonTitle}" has been approved with a grade of ${grade}%. Great work!`
      : `Your submission for "${lessonTitle}" received a grade of ${grade}%. ${correctCount} of ${total} questions correct. Please review the feedback and resubmit.`

    await supabase
      .from('notifications')
      .insert({
        user_id: submission.student_id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        link: `/student/courses/${courseId}`,
      })

    // Send email notification
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', submission.student_id)
      .single()

    if (studentProfile?.email) {
      sendNotificationEmail({
        to: studentProfile.email,
        subject: notifTitle,
        text: notifMessage,
        link: `/student/courses/${courseId}`,
      })
    }
  }

  revalidatePath('/supervisor/queue')
  redirect('/supervisor/queue')
}
