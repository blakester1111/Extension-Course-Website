export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { CoursePublishToggle } from '@/components/admin/course-publish-toggle'
import { DeleteCourseButton } from '@/components/admin/delete-course-button'
import { AdminCourseSection } from './course-section'

export const metadata = {
  title: 'Manage Courses — Admin',
}

const CATEGORIES = [
  { value: 'basics', label: 'Basics' },
  { value: 'congresses', label: 'Congresses' },
  { value: 'accs', label: 'ACCs' },
] as const

export default async function AdminCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('sort_order', { ascending: true })

  const coursesByCategory: Record<string, typeof courses> = {}
  for (const cat of CATEGORIES) {
    coursesByCategory[cat.value] = (courses || []).filter(
      (c: any) => c.category === cat.value
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Manage your course catalog &middot; {courses?.length || 0} total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Link>
        </Button>
      </div>

      {!courses || courses.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No courses yet</p>
      ) : (
        CATEGORIES.map((cat) => {
          const catCourses = coursesByCategory[cat.value] || []
          if (catCourses.length === 0) return null
          return (
            <AdminCourseSection
              key={cat.value}
              label={cat.label}
              count={catCourses.length}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catCourses.map((course: any) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>${(course.price_cents / 100).toFixed(2)}</TableCell>
                      <TableCell>{course.lesson_count}</TableCell>
                      <TableCell>
                        <CoursePublishToggle courseId={course.id} isPublished={course.is_published} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/courses/${course.id}`}>Edit</Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/courses/${course.id}/lessons`}>Lessons</Link>
                          </Button>
                          <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminCourseSection>
          )
        })
      )}
    </div>
  )
}
