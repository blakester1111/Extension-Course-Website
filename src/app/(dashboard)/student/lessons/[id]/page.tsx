export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LessonForm } from '@/components/student/lesson-form'
import { getOrCreateSubmission } from '../actions'
import { ArrowLeft } from 'lucide-react'
import { FormattedText } from '@/components/ui/formatted-text'

export const metadata = {
  title: 'Lesson — FCDC Extension Courses',
}

export default async function StudentLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get lesson with course info
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, course:courses(*)')
    .eq('id', lessonId)
    .single()

  if (!lesson) notFound()

  const courseId = lesson.course_id

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!enrollment) redirect('/catalog')

  // Get or create submission
  const { submission, error } = await getOrCreateSubmission(lessonId)
  if (error || !submission) redirect(`/student/courses/${courseId}`)

  // Get questions
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true })

  // Get existing answers
  const { data: answers } = await supabase
    .from('answers')
    .select('*')
    .eq('submission_id', submission.id)

  // Compute cumulative question offset (questions in all prior lessons)
  const { data: priorLessons } = await supabase
    .from('lessons')
    .select('id, sort_order')
    .eq('course_id', courseId)
    .lt('sort_order', lesson.sort_order)
    .order('sort_order', { ascending: true })

  let questionOffset = 0
  if (priorLessons && priorLessons.length > 0) {
    const priorIds = priorLessons.map(l => l.id)
    const { count } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .in('lesson_id', priorIds)
    questionOffset = count || 0
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/student/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Course
          </Link>
        </Button>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">{(lesson as any).course?.title}</p>
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="capitalize">
            {submission.status.replace(/_/g, ' ')}
          </Badge>
          {submission.grade !== null && submission.grade !== undefined && (
            <Badge className={submission.grade === 100
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }>
              {submission.grade}%
            </Badge>
          )}
        </div>
      </div>

      {lesson.instructions && (
        <div className="bg-muted/50 border rounded-lg p-5">
          <p className="text-sm font-medium text-muted-foreground mb-2">Lesson Instructions</p>
          <p className="whitespace-pre-line"><FormattedText text={lesson.instructions} /></p>
        </div>
      )}

      {/* Question count indicator */}
      {(questions || []).length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{questions!.length} question{questions!.length !== 1 ? 's' : ''} in this lesson</span>
          <span>Questions {questionOffset + 1}–{questionOffset + questions!.length} of course total</span>
        </div>
      )}

      <LessonForm
        submission={submission}
        questions={questions || []}
        existingAnswers={answers || []}
        totalQuestions={(questions || []).length}
        questionOffset={questionOffset}
      />
    </div>
  )
}
