export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Payment Successful — FCDC Extension Courses',
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; order_id?: string }>
}) {
  const { session_id, order_id } = await searchParams

  if (!order_id) notFound()

  const adminSupabase = createAdminClient()

  // Get order details
  const { data: order } = await adminSupabase
    .from('orders')
    .select('*, courses:course_id(id, title)')
    .eq('id', order_id)
    .single()

  if (!order) notFound()

  const course = order.courses as unknown as { id: string; title: string } | null

  // If user is logged in, try to enroll them now (backup to webhook)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let enrolled = false
  if (user && course) {
    // Link order to user if not already linked
    if (!order.student_id) {
      await adminSupabase
        .from('orders')
        .update({ student_id: user.id })
        .eq('id', order_id)
    }

    // Check if already enrolled
    const { data: existing } = await adminSupabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle()

    if (existing) {
      enrolled = true
    } else if (order.status === 'paid') {
      // Enroll now
      await adminSupabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: course.id,
          status: 'active',
        })

      await adminSupabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'enrollment_confirmed',
          title: 'Enrollment Confirmed',
          message: `You have been enrolled in "${course.title}". Start studying now!`,
          link: `/student/courses/${course.id}`,
        })

      enrolled = true
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for purchasing <strong>{course?.title || 'this course'}</strong>.
          </p>

          {enrolled && course ? (
            <>
              <p className="text-muted-foreground">
                You have been enrolled and can start studying right away.
              </p>
              <Button className="w-full" asChild>
                <Link href={`/student/courses/${course.id}`}>
                  Go to Course
                </Link>
              </Button>
            </>
          ) : user ? (
            <p className="text-muted-foreground">
              Your enrollment is being processed. You&apos;ll receive a notification once it&apos;s confirmed.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">
                Please sign up or log in with the email <strong>{order.customer_email}</strong> to access your course.
              </p>
              <Button className="w-full" asChild>
                <Link href={`/signup`}>Create Account</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/login`}>Sign In</Link>
              </Button>
            </>
          )}

          <Button variant="outline" className="w-full" asChild>
            <Link href="/catalog">Browse More Courses</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
