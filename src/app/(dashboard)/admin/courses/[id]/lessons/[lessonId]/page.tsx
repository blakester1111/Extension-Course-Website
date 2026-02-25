export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuestionList } from '@/components/admin/question-list'
import { LessonInstructions } from '@/components/admin/lesson-instructions'
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
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          <p className="text-muted-foreground">{(lesson as any).course?.title}</p>
        </div>
      </div>

      <LessonInstructions
        lessonId={lessonId}
        courseId={id}
        initialInstructions={lesson.instructions || ''}
      />

      <QuestionList lessonId={lessonId} courseId={id} questions={questions || []} />
    </div>
  )
}
