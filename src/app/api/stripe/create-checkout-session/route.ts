import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      courseId,
      firstName,
      lastName,
      email,
      phone,
      country,
      address,
      city,
      state,
      zip,
      organization,
    } = body

    if (!courseId || !firstName || !lastName || !email || !phone || !address || !city || !state || !zip || !country) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!organization || !['day', 'foundation', 'unknown'].includes(organization)) {
      return NextResponse.json({ error: 'Please select an organization' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price_cents, is_published, slug')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.is_published) {
      return NextResponse.json({ error: 'Course is not available' }, { status: 400 })
    }

    if (course.price_cents === 0) {
      return NextResponse.json({ error: 'This is a free course — enroll directly' }, { status: 400 })
    }

    // Derive the app URL from the request origin
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const appUrl = origin.replace(/\/$/, '')

    // Map organization value for storage (unknown = null)
    const orgValue = organization === 'unknown' ? null : organization

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        course_id: courseId,
        amount_cents: course.price_cents,
        customer_email: email,
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_phone: phone || null,
        customer_country: country || null,
        customer_address: address || null,
        customer_city: city || null,
        customer_state: state || null,
        customer_zip: zip || null,
        organization: orgValue,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('Failed to create order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create Stripe Checkout session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: `Extension Course: ${course.title}`,
            },
            unit_amount: course.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: order.id,
        course_id: courseId,
        course_title: course.title,
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_email: email,
        customer_phone: phone || '',
        customer_country: country || '',
        customer_address: address || '',
        customer_city: city || '',
        customer_state: state || '',
        customer_zip: zip || '',
        organization: organization,
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${appUrl}/catalog/${course.slug}`,
    })

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Stripe checkout error:', message, error)
    return NextResponse.json({ error: `Checkout failed: ${message}` }, { status: 500 })
  }
}
