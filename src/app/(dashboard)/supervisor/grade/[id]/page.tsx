export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GradingForm } from '@/components/supervisor/grading-form'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Grade Submission — Supervisor',
}

export default async function GradeSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: submission } = await supabase
    .from('lesson_submissions')
    .select(`
      *,
      student:profiles!lesson_submissions_student_id_fkey(full_name, email),
      lesson:lessons(title, course_id, course:courses(title))
    `)
    .eq('id', submissionId)
    .single()

  if (!submission) notFound()

  const { data: answers } = await supabase
    .from('answers')
    .select('*, question:questions(question_text, sort_order)')
    .eq('submission_id', submissionId)
    .order('question(sort_order)', { ascending: true } as any)

  // Sort by question sort_order
  const sortedAnswers = (answers || []).sort(
    (a: any, b: any) => (a.question?.sort_order || 0) - (b.question?.sort_order || 0)
  )

  // Get total question count for grade calculation
  const { count: totalQuestions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', submission.lesson_id)

  // Compute cumulative question offset (questions in all prior lessons)
  const lessonData = submission as any
  const courseId = lessonData.lesson?.course_id
  const { data: currentLesson } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('id', submission.lesson_id)
    .single()

  let questionOffset = 0
  if (courseId && currentLesson) {
    const { data: priorLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .lt('sort_order', currentLesson.sort_order)

    if (priorLessons && priorLessons.length > 0) {
      const priorIds = priorLessons.map(l => l.id)
      const { count } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .in('lesson_id', priorIds)
      questionOffset = count || 0
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/supervisor/queue">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Queue
          </Link>
        </Button>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">
          {(submission as any).lesson?.course?.title} — {(submission as any).lesson?.title}
        </p>
        <h1 className="text-3xl font-bold">Grade Submission</h1>
        <p className="text-muted-foreground">
          Student: {(submission as any).student?.full_name} ({(submission as any).student?.email})
        </p>
      </div>

      <GradingForm submission={submission} answers={sortedAnswers} totalQuestions={totalQuestions || 0} questionOffset={questionOffset} />
    </div>
  )
}
