import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Find the next course for a student after completing a course.
 *
 * 1. If student has a study route assigned, find the next course in that route
 *    that they haven't completed yet.
 * 2. Otherwise, fall back to the next course in the same category by sort_order.
 *
 * Returns { id, title, slug } of the next course, or null if none.
 */
export async function findNextCourse(
  supabase: SupabaseClient,
  studentId: string,
  completedCourseId: string
): Promise<{ id: string; title: string; slug: string } | null> {
  // Get student's route assignment
  const { data: profile } = await supabase
    .from('profiles')
    .select('study_route_id')
    .eq('id', studentId)
    .single()

  // Get completed course details
  const { data: completedCourse } = await supabase
    .from('courses')
    .select('category, sort_order')
    .eq('id', completedCourseId)
    .single()

  if (!completedCourse) return null

  // Get all courses this student has certificates for (completed courses)
  const { data: certs } = await supabase
    .from('certificates')
    .select('course_id')
    .eq('student_id', studentId)

  const completedCourseIds = new Set((certs || []).map(c => c.course_id))
  completedCourseIds.add(completedCourseId) // Include the one just completed

  // Strategy 1: Use study route if assigned
  if (profile?.study_route_id) {
    // Get route's course order
    const { data: routeCourses } = await supabase
      .from('study_route_courses')
      .select('course_id, position, course:courses(id, title, slug, is_published)')
      .eq('route_id', profile.study_route_id)
      .order('position')

    if (routeCourses && routeCourses.length > 0) {
      // Find position of the completed course in the route
      const completedPosition = routeCourses.find(rc => rc.course_id === completedCourseId)?.position

      if (completedPosition !== undefined) {
        // Find next uncompleted course after this position
        const next = routeCourses.find(rc => {
          const course = rc.course as any
          return rc.position > completedPosition
            && !completedCourseIds.has(rc.course_id)
            && course?.is_published
        })

        if (next) {
          const course = next.course as any
          return { id: course.id, title: course.title, slug: course.slug }
        }
      } else {
        // Completed course not in route — find first uncompleted course in route
        const next = routeCourses.find(rc => {
          const course = rc.course as any
          return !completedCourseIds.has(rc.course_id) && course?.is_published
        })

        if (next) {
          const course = next.course as any
          return { id: course.id, title: course.title, slug: course.slug }
        }
      }
    }
  }

  // Strategy 2: Fall back to next course in same category by sort_order
  const { data: nextCourse } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('category', completedCourse.category)
    .eq('is_published', true)
    .gt('sort_order', completedCourse.sort_order)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (nextCourse && !completedCourseIds.has(nextCourse.id)) {
    return nextCourse
  }

  return null
}
