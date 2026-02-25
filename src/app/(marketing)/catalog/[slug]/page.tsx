export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { PurchaseButton } from '@/components/catalog/purchase-button'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('title, description')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!course) return { title: 'Course Not Found' }

  return {
    title: `${course.title} — FCDC Extension Courses`,
    description: course.description,
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!course) notFound()

  // Check if user is enrolled
  const { data: { user } } = await supabase.auth.getUser()
  let isEnrolled = false
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle()
    isEnrolled = !!enrollment
  }

  const categoryLabels: Record<string, string> = { basics: 'Basics', congresses: 'Congresses', accs: 'ACCs' }
  const categoryLabel = categoryLabels[course.category] || course.category

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top section: Image + Course Info */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
        <div className="bg-muted rounded-lg flex items-center justify-center p-4 shrink-0">
          {course.image_url ? (
            <img
              src={course.image_url}
              alt={course.title}
              width={204}
              height={160}
              className="max-w-[204px] w-full h-auto object-contain"
            />
          ) : (
            <div className="w-[204px] h-[160px] flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {isEnrolled ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Enrolled</span>
              </div>
              <Button asChild>
                <Link href={`/student/courses/${course.id}`}>Go to Course</Link>
              </Button>
            </div>
          ) : user ? (
            <PurchaseButton
              courseId={course.id}
              priceCents={course.price_cents}
              checkoutUrl={course.checkout_url}
            />
          ) : (
            <Button asChild>
              <Link href={`/login?redirect=/catalog/${course.slug}`}>Sign In to Enroll</Link>
            </Button>
          )}

          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Donation:</span>{' '}
              <span className="font-semibold">
                {course.price_cents === 0 ? 'Free' : `$${(course.price_cents / 100).toFixed(0)}`}
              </span>
            </p>
            {course.length_hours && (
              <p>
                <span className="text-muted-foreground">Length:</span>{' '}
                <span className="font-semibold">{course.length_hours} hours</span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Category:</span>{' '}
              <span className="font-semibold">{categoryLabel}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold">{course.title}</h1>

      {/* Synopsis */}
      {course.synopsis && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Synopsis</h2>
          <div
            className="text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: course.synopsis }}
          />
        </div>
      )}

      {/* Full Description */}
      {course.full_description && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Full Description</h2>
          <div
            className="text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: course.full_description }}
          />
        </div>
      )}
    </div>
  )
}
