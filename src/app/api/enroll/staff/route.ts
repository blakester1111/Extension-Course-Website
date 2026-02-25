import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { courseId, invoiceNumber } = await request.json()

    // Verify user is staff
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_staff')
      .eq('id', user.id)
      .single()

    if (!profile?.is_staff) {
      return NextResponse.json({ error: 'Not authorized for staff enrollment' }, { status: 403 })
    }

    if (!invoiceNumber?.trim()) {
      return NextResponse.json({ error: 'Invoice number is required' }, { status: 400 })
    }

    // Check course exists and is published
    const { data: course } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .eq('is_published', true)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check existing enrollment
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
        status: 'pending_invoice_verification',
        invoice_number: invoiceNumber.trim(),
      })

    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'invoice_pending',
      title: 'Enrollment Pending',
      message: `Your enrollment in "${course.title}" is pending invoice verification.`,
      link: '/student/dashboard',
    })

    return NextResponse.json({ success: true, status: 'pending_invoice_verification' })
  } catch {
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
