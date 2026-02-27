export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, Circle, AlertCircle, Clock, Award, ArrowRight } from 'lucide-react'
import { findNextCourse } from '@/lib/next-course'

export const metadata = {
  title: 'Course — FCDC Extension Courses',
}

export default async function StudentCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', user.id)
    .eq('course_id', id)
    .maybeSingle()

  if (!enrollment) redirect('/catalog')

  // Block access if enrollment is pending invoice verification
  if (enrollment.status === 'pending_invoice_verification') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
            <CardTitle>Enrollment Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Your enrollment is pending invoice verification by your supervisor.
              You will be notified once approved.
            </p>
            <Button asChild>
              <Link href="/student/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', id)
    .order('sort_order', { ascending: true })

  // Get all submissions for this course
  const { data: submissions } = await supabase
    .from('lesson_submissions')
    .select('*')
    .eq('student_id', user.id)
    .in('lesson_id', (lessons || []).map(l => l.id))

  const submissionMap = new Map(
    (submissions || []).map(s => [s.lesson_id, s])
  )

  function getStatusIcon(lessonId: string) {
    const submission = submissionMap.get(lessonId)
    if (!submission) {
      return <Circle className="h-5 w-5 text-muted-foreground" />
    }
    switch (submission.status) {
      case 'graded_pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'graded_corrections':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'submitted':
        return <Circle className="h-5 w-5 text-blue-500 fill-blue-500" />
      default:
        return <Circle className="h-5 w-5 text-yellow-500" />
    }
  }

  function getStatusLabel(lessonId: string) {
    const submission = submissionMap.get(lessonId)
    if (!submission) return null
    const gradeStr = submission.grade !== null && submission.grade !== undefined ? ` ${submission.grade}%` : ''
    switch (submission.status) {
      case 'graded_pass': return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Passed{gradeStr}</Badge>
      case 'graded_corrections': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Corrections{gradeStr}</Badge>
      case 'submitted': return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Submitted</Badge>
      case 'draft': return <Badge variant="secondary">Draft</Badge>
    }
  }

  const completedCount = (submissions || []).filter(s => s.status === 'graded_pass').length
  const totalCount = lessons?.length || 0
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isCourseComplete = completedCount >= totalCount && totalCount > 0

  // If course complete, find certificate and next course
  let certificate: { id: string } | null = null
  let nextCourse: { id: string; title: string; slug: string } | null = null
  if (isCourseComplete) {
    const { data: cert } = await supabase
      .from('certificates')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', id)
      .maybeSingle()
    certificate = cert

    nextCourse = await findNextCourse(supabase, user.id, id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/student/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{completedCount} of {totalCount} lessons completed ({progressPercent}%)</p>
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${isCourseComplete ? 'bg-green-500' : 'bg-primary'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Course Completion Banner */}
      {isCourseComplete && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="py-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Course Complete!</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {certificate && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/student/certificates/${certificate.id}`}>
                    <Award className="h-4 w-4 mr-2" />
                    View Certificate
                  </Link>
                </Button>
              )}
              {nextCourse && (
                <Button size="sm" asChild>
                  <Link href={`/catalog/${nextCourse.slug}`}>
                    Next Course: {nextCourse.title}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(lessons || []).map((lesson) => {
          const submission = submissionMap.get(lesson.id)

          return (
            <Card key={lesson.id}>
              <CardContent className="flex items-center gap-4 py-4">
                {getStatusIcon(lesson.id)}
                <div className="flex-1">
                  <p className="font-medium">{lesson.title}</p>
                </div>
                {getStatusLabel(lesson.id)}
                <Button size="sm" variant={submission ? 'outline' : 'default'} asChild>
                  <Link href={`/student/lessons/${lesson.id}`}>
                    {submission?.status === 'graded_pass'
                      ? 'Review'
                      : submission?.status === 'graded_corrections'
                      ? 'Revise'
                      : submission
                      ? 'Continue'
                      : 'Start'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
