export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CheckoutForm } from '@/components/checkout/checkout-form'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!course) return { title: 'Course Not Found' }

  return {
    title: `Checkout: ${course.title} — FCDC Extension Courses`,
  }
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, price_cents, is_published')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!course) notFound()

  // Free courses don't need checkout
  if (course.price_cents === 0) {
    redirect(`/catalog/${slug}`)
  }

  // Check if user is logged in and already enrolled
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle()

    if (enrollment) {
      redirect(`/student/courses/${course.id}`)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h1 className="text-2xl font-bold mb-2">Checkout</h1>
      <p className="text-muted-foreground mb-8">
        Complete your details below to purchase <strong>{course.title}</strong>.
      </p>

      <CheckoutForm
        courseId={course.id}
        courseTitle={course.title}
        courseSlug={course.slug}
        priceCents={course.price_cents}
        userEmail={user?.email || ''}
        userName={user?.user_metadata?.full_name || ''}
      />
    </div>
  )
}
