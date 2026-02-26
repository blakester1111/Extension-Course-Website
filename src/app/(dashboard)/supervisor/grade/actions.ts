'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendNotificationEmail } from '@/lib/resend/send-notification'
import { checkAndCreateCertificate } from '@/lib/certificates'

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

  // Get the lesson's questions to check which require images
  const { data: submissionForLesson } = await supabase
    .from('lesson_submissions')
    .select('lesson_id')
    .eq('id', submissionId)
    .single()

  const { data: imageQuestions } = await supabase
    .from('questions')
    .select('id')
    .eq('lesson_id', submissionForLesson!.lesson_id)
    .eq('requires_image', true)

  const imageQuestionIds = new Set((imageQuestions || []).map(q => q.id))

  // Get answer-to-question mapping
  const { data: answerQuestionMap } = await supabase
    .from('answers')
    .select('id, question_id')
    .eq('submission_id', submissionId)

  const answerToQuestion = new Map((answerQuestionMap || []).map(a => [a.id, a.question_id]))

  // Update each answer with feedback
  for (const grade of grades) {
    const updateData: Record<string, unknown> = {
      supervisor_feedback: grade.feedback || null,
      needs_correction: grade.needsCorrection,
    }

    // Clear image_path on image questions marked incorrect so student must re-upload
    if (grade.needsCorrection) {
      const questionId = answerToQuestion.get(grade.answerId)
      if (questionId && imageQuestionIds.has(questionId)) {
        updateData.image_path = null
      }
    }

    await supabase
      .from('answers')
      .update(updateData)
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

    // For 100% pass, find the next unsubmitted lesson in the course
    let nextLessonLink: string | null = null
    if (status === 'graded_pass' && courseId) {
      // Get current lesson's sort_order
      const { data: currentLesson } = await supabase
        .from('lessons')
        .select('sort_order')
        .eq('id', submissionData!.lesson_id)
        .single()

      if (currentLesson) {
        // Get all lessons in the course after this one
        const { data: nextLessons } = await supabase
          .from('lessons')
          .select('id, sort_order')
          .eq('course_id', courseId)
          .gt('sort_order', currentLesson.sort_order)
          .order('sort_order', { ascending: true })

        if (nextLessons && nextLessons.length > 0) {
          // Find first lesson that the student has NOT passed
          const nextLessonIds = nextLessons.map(l => l.id)
          const { data: passedSubs } = await supabase
            .from('lesson_submissions')
            .select('lesson_id')
            .eq('student_id', submission.student_id)
            .in('lesson_id', nextLessonIds)
            .eq('status', 'graded_pass')

          const passedSet = new Set((passedSubs || []).map(s => s.lesson_id))
          const nextUnsubmitted = nextLessons.find(l => !passedSet.has(l.id))
          if (nextUnsubmitted) {
            nextLessonLink = `/student/lessons/${nextUnsubmitted.id}`
          }
        }
      }
    }

    const notifMessage = status === 'graded_pass'
      ? `Your submission for "${lessonTitle}" has been approved with a grade of ${grade}%. Great work!`
      : `Your submission for "${lessonTitle}" received a grade of ${grade}%. ${correctCount} of ${total} questions correct. Please review the feedback and resubmit.`

    const notifLink = status === 'graded_pass' && nextLessonLink
      ? nextLessonLink
      : `/student/courses/${courseId}`

    await supabase
      .from('notifications')
      .insert({
        user_id: submission.student_id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        link: notifLink,
      })

    // Send email notification
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', submission.student_id)
      .single()

    if (studentProfile?.email) {
      const emailText = status === 'graded_pass' && nextLessonLink
        ? `${notifMessage} Click below to start your next lesson.`
        : notifMessage

      sendNotificationEmail({
        to: studentProfile.email,
        subject: notifTitle,
        text: emailText,
        link: notifLink,
        buttonText: status === 'graded_pass' && nextLessonLink ? 'Start Next Lesson' : undefined,
      })
    }

    // If this lesson passed, check if the entire course is now complete
    if (status === 'graded_pass' && courseId) {
      const courseCompleted = await checkAndCreateCertificate(supabase, submission.student_id, courseId)

      // Send course completion congrats email with next course link
      if (courseCompleted && studentProfile?.email) {
        // Get current course details
        const { data: currentCourse } = await supabase
          .from('courses')
          .select('title, category, sort_order')
          .eq('id', courseId)
          .single()

        if (currentCourse) {
          // Find the next course in the same category by sort_order
          const { data: nextCourse } = await supabase
            .from('courses')
            .select('id, title, slug')
            .eq('category', currentCourse.category)
            .eq('is_published', true)
            .gt('sort_order', currentCourse.sort_order)
            .order('sort_order', { ascending: true })
            .limit(1)
            .maybeSingle()

          const courseTitle = currentCourse.title
          const categoryLabel = currentCourse.category === 'basics' ? 'Basics'
            : currentCourse.category === 'congresses' ? 'Congresses' : 'ACCs'

          let congratsText = `Congratulations! You have completed the ${courseTitle} Extension Course. Your certificate is now being processed.`
          let congratsLink = '/student/certificates'
          let congratsButton = 'View My Certificates'

          if (nextCourse) {
            congratsText += ` Your next course in the ${categoryLabel} lineup is "${nextCourse.title}". Click below to learn more and enroll.`
            congratsLink = `/catalog/${nextCourse.slug}`
            congratsButton = 'View Next Course'
          } else {
            congratsText += ` You have completed all available courses in the ${categoryLabel} lineup. Well done!`
          }

          // Send congrats notification
          await supabase
            .from('notifications')
            .insert({
              user_id: submission.student_id,
              type: 'enrollment_confirmed',
              title: `Course Completed: ${courseTitle}`,
              message: congratsText,
              link: congratsLink,
            })

          // Send congrats email
          sendNotificationEmail({
            to: studentProfile.email,
            subject: `Congratulations! You completed ${courseTitle}`,
            text: congratsText,
            link: congratsLink,
            buttonText: congratsButton,
          })
        }
      }
    }
  }

  revalidatePath('/supervisor/queue')
  revalidatePath('/admin/certificates')
  redirect('/supervisor/queue')
}
