import { CourseCard } from './course-card'
import type { Course } from '@/types/database'

export function CourseGrid({ courses, enrolledCourseIds = [] }: { courses: Course[]; enrolledCourseIds?: string[] }) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No courses found matching your criteria.</p>
      </div>
    )
  }

  const enrolledSet = new Set(enrolledCourseIds)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} isEnrolled={enrolledSet.has(course.id)} />
      ))}
    </div>
  )
}
