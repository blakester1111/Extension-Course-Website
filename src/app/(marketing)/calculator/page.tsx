import { createClient } from '@/lib/supabase/server'
import { CalculatorClient } from './calculator-client'
import type { CourseData } from './calculator-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Golden Age of Knowledge Calculator — FCDC Extension Course',
  description: 'Calculate how long it will take to complete your extension courses.',
}

export default async function CalculatorPage() {
  const supabase = await createClient()

  const { data: courseData } = await supabase
    .from('courses')
    .select('id, title, category, lesson_count, sort_order')
    .eq('is_published', true)
    .order('sort_order')

  const courses: CourseData[] = courseData || []

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Golden Age of Knowledge Calculator</h1>
        <p className="text-muted-foreground mt-2">
          Calculate your speed of progress on your Golden Age of Knowledge studies
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No published courses found.
        </div>
      ) : (
        <CalculatorClient courses={courses} />
      )}
    </div>
  )
}
