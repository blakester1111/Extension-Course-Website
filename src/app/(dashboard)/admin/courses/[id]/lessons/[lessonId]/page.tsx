export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuestionList } from '@/components/admin/question-list'
import { LessonInstructions } from '@/components/admin/lesson-instructions'
import { EditableLessonTitle } from '@/components/admin/editable-lesson-title'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Manage Questions — Admin',
}

export default async function AdminQuestionsPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>
}) {
  const { id, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, course:courses(title)')
    .eq('id', lessonId)
    .single()

  if (!lesson) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true })

  // Compute cumulative question offset (questions in all prior lessons)
  const { data: priorLessons } = await supabase
    .from('lessons')
    .select('id, sort_order')
    .eq('course_id', lesson.course_id)
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/courses/${id}/lessons`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <EditableLessonTitle
            lessonId={lessonId}
            courseId={id}
            initialTitle={lesson.title}
          />
          <p className="text-muted-foreground">{(lesson as any).course?.title}</p>
        </div>
      </div>

      <LessonInstructions
        lessonId={lessonId}
        courseId={id}
        initialInstructions={lesson.instructions || ''}
      />

      <QuestionList lessonId={lessonId} courseId={id} questions={questions || []} questionOffset={questionOffset} />
    </div>
  )
}
