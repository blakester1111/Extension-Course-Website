'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNotificationEmail } from '@/lib/resend/send-notification'

async function requireStudent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function saveAnswers(
  submissionId: string,
  answers: { questionId: string; answerText: string }[]
) {
  const { supabase, user } = await requireStudent()

  // Verify ownership
  const { data: submission } = await supabase
    .from('lesson_submissions')
    .select('*')
    .eq('id', submissionId)
    .eq('student_id', user.id)
    .single()

  if (!submission || !['draft', 'graded_corrections'].includes(submission.status)) {
    return { error: 'Cannot edit this submission' }
  }

  // When correcting, only allow editing answers that need correction
  let filteredAnswers = answers
  if (submission.status === 'graded_corrections') {
    const { data: currentAnswers } = await supabase
      .from('answers')
      .select('question_id, needs_correction')
      .eq('submission_id', submissionId)

    const correctQuestionIds = new Set(
      (currentAnswers || [])
        .filter(a => !a.needs_correction)
        .map(a => a.question_id)
    )

    filteredAnswers = answers.filter(a => !correctQuestionIds.has(a.questionId))
  }

  for (const answer of filteredAnswers) {
    await supabase
      .from('answers')
      .upsert(
        {
          submission_id: submissionId,
          question_id: answer.questionId,
          answer_text: answer.answerText,
        },
        { onConflict: 'submission_id,question_id' }
      )
  }

  return { success: true }
}

export async function submitLesson(submissionId: string) {
  const { supabase, user } = await requireStudent()

  // Verify ownership and draft status
  const { data: submission } = await supabase
    .from('lesson_submissions')
    .select('*, lesson:lessons(course_id)')
    .eq('id', submissionId)
    .eq('student_id', user.id)
    .single()

  if (!submission || !['draft', 'graded_corrections'].includes(submission.status)) {
    return { error: 'Cannot submit this lesson' }
  }

  // Verify all questions are answered
  const { data: answers } = await supabase
    .from('answers')
    .select('*')
    .eq('submission_id', submissionId)

  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('lesson_id', submission.lesson_id)

  if (submission.status === 'graded_corrections') {
    // For resubmissions, validate that incorrect answers have been revised (non-empty)
    const incorrectAnswers = (answers || []).filter(a => a.needs_correction)
    const emptyIncorrect = incorrectAnswers.filter(a => !a.answer_text.trim())
    if (emptyIncorrect.length > 0) {
      return { error: 'Please revise all incorrect answers before resubmitting' }
    }
  } else {
    // For first submission, validate all questions answered
    const answeredIds = new Set((answers || []).map(a => a.question_id))
    const unanswered = (questions || []).filter(q => !answeredIds.has(q.id) || answers?.find(a => a.question_id === q.id && !a.answer_text.trim()))

    if (unanswered.length > 0) {
      return { error: 'Please answer all questions before submitting' }
    }
  }

  // Update status
  const { error } = await supabase
    .from('lesson_submissions')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (error) {
    return { error: error.message }
  }

  // Notify supervisor
  const { data: profile } = await supabase
    .from('profiles')
    .select('supervisor_id, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.supervisor_id) {
    const isResubmission = submission.grade !== null
    const notifMessage = isResubmission
      ? `${profile.full_name} resubmitted corrected answers for grading.`
      : `${profile.full_name} submitted a lesson for grading.`

    await supabase
      .from('notifications')
      .insert({
        user_id: profile.supervisor_id,
        type: 'lesson_submitted',
        title: isResubmission ? 'Resubmission' : 'New Submission',
        message: notifMessage,
        link: `/supervisor/grade/${submissionId}`,
      })

    // Send email to supervisor
    const { data: supervisorProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', profile.supervisor_id)
      .single()

    if (supervisorProfile?.email) {
      sendNotificationEmail({
        to: supervisorProfile.email,
        subject: isResubmission ? 'Resubmission to Grade' : 'New Submission to Grade',
        text: notifMessage,
        link: `/supervisor/grade/${submissionId}`,
      })
    }
  }

  const courseId = (submission as any).lesson?.course_id
  if (courseId) {
    revalidatePath(`/student/courses/${courseId}`)
  }
  revalidatePath(`/student/lessons/${submission.lesson_id}`)

  return { success: true }
}

export async function getOrCreateSubmission(lessonId: string) {
  const { supabase, user } = await requireStudent()

  // Check for existing submission
  const { data: existing } = await supabase
    .from('lesson_submissions')
    .select('*')
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (existing) return { submission: existing }

  // Create new draft submission
  const { data: submission, error } = await supabase
    .from('lesson_submissions')
    .insert({
      student_id: user.id,
      lesson_id: lessonId,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  return { submission }
}
