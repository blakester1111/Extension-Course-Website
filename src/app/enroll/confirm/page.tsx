export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, LogIn } from 'lucide-react'

export const metadata = {
  title: 'Enrollment Confirmed — FCDC Extension Courses',
}

export default async function EnrollConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>
}) {
  const { course: courseId } = await searchParams

  if (!courseId) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not logged in, redirect to login with a return URL
  if (!user) {
    redirect(`/login?redirect=/enroll/confirm?course=${courseId}`)
  }

  // Get the course
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!existing) {
    // Auto-enroll the student
    await supabase
      .from('enrollments')
      .insert({
        student_id: user.id,
        course_id: courseId,
      })

    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'enrollment_confirmed',
        title: 'Enrollment Confirmed',
        message: `You have been enrolled in "${course.title}". Start studying now!`,
        link: `/student/courses/${courseId}`,
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">You&apos;re Enrolled!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You have been enrolled in <strong>{course.title}</strong>. You can start studying right away.
          </p>
          <Button className="w-full" asChild>
            <Link href={`/student/courses/${courseId}`}>
              Go to Course
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/student/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
