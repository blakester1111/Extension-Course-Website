export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { CourseGrid } from '@/components/catalog/course-grid'
import { CategoryFilter } from '@/components/catalog/category-filter'

export const metadata = {
  title: 'Course Catalog — FCDC Extension Courses',
  description: 'Browse our collection of book and lecture extension courses.',
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: courses } = await query

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Course Catalog</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Browse our extension courses for book and lecture studies.
        </p>
      </div>

      <Suspense>
        <CategoryFilter />
      </Suspense>

      <CourseGrid courses={courses || []} />
    </div>
  )
}
