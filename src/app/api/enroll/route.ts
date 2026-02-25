import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend/send-welcome-email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { courseId } = await request.json()

    // Get course — must be free and published
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_published', true)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.price_cents !== 0) {
      return NextResponse.json({ error: 'This course is not free' }, { status: 400 })
    }

    // Check for existing enrollment
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 400 })
    }

    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        student_id: user.id,
        course_id: courseId,
      })

    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    // Notify student
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'enrollment_confirmed',
        title: 'Enrollment Confirmed',
        message: `You have been enrolled in "${course.title}". Start studying now!`,
        link: `/student/courses/${courseId}`,
      })

    // Send welcome email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', user.id)
      .single()

    if (profile?.email) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://extension.fcdc-services.com').replace(/\/$/, '')
      await sendWelcomeEmail({
        to: profile.email,
        firstName: profile.first_name || 'Student',
        courseName: course.title,
        courseUrl: `${appUrl}/student/courses/${courseId}`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
