import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSaleNotificationEmail } from '@/lib/resend/send-sale-notification'
import { sendWelcomeEmail } from '@/lib/resend/send-welcome-email'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    // If webhook secret is configured, verify signature
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = getStripe().webhooks.constructEvent(
        body,
        signature!,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } else {
      // In development without webhook secret, parse the event directly
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') {
      console.log('Payment not completed, skipping')
      return NextResponse.json({ received: true })
    }

    const metadata = session.metadata || {}
    const orderId = metadata.order_id
    const courseId = metadata.course_id

    if (!orderId || !courseId) {
      console.error('Missing metadata in Stripe session:', session.id)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update order status
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('id', orderId)

    // Get the order details
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    // Get the course
    const { data: course } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single()

    // Try to find existing user by email and enroll them
    if (order) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', order.customer_email)
        .maybeSingle()

      if (profile) {
        // Link order to student
        await supabase
          .from('orders')
          .update({ student_id: profile.id })
          .eq('id', orderId)

        // Check if already enrolled
        const { data: existing } = await supabase
          .from('enrollments')
          .select('id')
          .eq('student_id', profile.id)
          .eq('course_id', courseId)
          .maybeSingle()

        if (!existing) {
          // Auto-enroll
          await supabase
            .from('enrollments')
            .insert({
              student_id: profile.id,
              course_id: courseId,
              status: 'active',
            })

          // Send in-app notification
          await supabase
            .from('notifications')
            .insert({
              user_id: profile.id,
              type: 'enrollment_confirmed',
              title: 'Enrollment Confirmed',
              message: `You have been enrolled in "${course?.title}". Start studying now!`,
              link: `/student/courses/${courseId}`,
            })

          // Send welcome email to the student
          if (course) {
            const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://extension.fcdc-services.com').replace(/\/$/, '')
            await sendWelcomeEmail({
              to: order.customer_email,
              firstName: order.customer_first_name,
              courseName: course.title,
              courseUrl: `${appUrl}/student/courses/${courseId}`,
            })
          }
        }
      }

      // Send sale notification email to staff
      if (course && order) {
        await sendSaleNotificationEmail({
          courseName: course.title,
          firstName: order.customer_first_name,
          lastName: order.customer_last_name,
          email: order.customer_email,
          phone: order.customer_phone || '',
          country: order.customer_country || '',
          address: order.customer_address || '',
          city: order.customer_city || '',
          state: order.customer_state || '',
          zip: order.customer_zip || '',
          paymentMethod: 'Credit Card',
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
