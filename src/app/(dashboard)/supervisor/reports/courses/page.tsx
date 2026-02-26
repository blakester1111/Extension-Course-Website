export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CourseAnalytics } from '@/components/reports/course-analytics'
import { ReportFilters } from '@/components/reports/report-filters'
import { filterByOrg, filterByStaff, resolveOrgDefault } from '@/lib/org-filter'
import { Suspense } from 'react'

export const metadata = {
  title: 'Course Analytics — FCDC Extension Courses',
}

export default async function CourseAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const orgFilter = resolveOrgDefault(params.org, profile?.organization)

  // Get all published courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, lesson_count, category')
    .eq('is_published', true)
    .order('title')

  // Get ALL enrolled users via enrollments table (any role)
  const { data: enrollmentRows } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('status', 'active')

  let enrolledIds = [...new Set((enrollmentRows || []).map(e => e.student_id))]

  if (!isAdmin) {
    // Supervisor: filter to assigned students + unassigned
    const { data: assignedStudents } = await supabase
      .from('profiles')
      .select('id')
      .eq('supervisor_id', user.id)
    const { data: unassignedStudents } = await supabase
      .from('profiles')
      .select('id')
      .is('supervisor_id', null)
    const visibleIds = new Set([
      ...(assignedStudents || []).map(s => s.id),
      ...(unassignedStudents || []).map(s => s.id),
    ])
    enrolledIds = enrolledIds.filter(id => visibleIds.has(id))
  }

  // Apply audience and organization filters
  enrolledIds = await filterByStaff(supabase, enrolledIds, params.audience)
  enrolledIds = await filterByOrg(supabase, enrolledIds, orgFilter)

  const studentIds = enrolledIds

  if (!courses || courses.length === 0 || studentIds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No course data available.
      </div>
    )
  }

  // Get enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id')
    .eq('status', 'active')
    .in('student_id', studentIds)

  // Get all submissions with lesson info
  const { data: allSubmissions } = await supabase
    .from('lesson_submissions')
    .select('student_id, status, lesson:lessons(id, course_id, sort_order, title)')
    .in('student_id', studentIds)

  // Get lessons per course
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, course_id, sort_order, title')
    .order('sort_order')

  // Build per-course analytics
  const courseData = (courses || []).map(course => {
    const courseEnrollments = (enrollments || []).filter(e => e.course_id === course.id)
    const enrollmentCount = courseEnrollments.length

    // Get submissions for this course
    const courseSubs = (allSubmissions || []).filter(s => {
      const lesson = s.lesson as any
      return lesson?.course_id === course.id
    })

    // Count completions
    const studentPassCounts = new Map<string, number>()
    for (const sub of courseSubs) {
      if (sub.status === 'graded_pass') {
        studentPassCounts.set(sub.student_id, (studentPassCounts.get(sub.student_id) || 0) + 1)
      }
    }
    const completionCount = [...studentPassCounts.entries()].filter(
      ([, count]) => count >= course.lesson_count && course.lesson_count > 0
    ).length
    const completionRate = enrollmentCount > 0 ? Math.round((completionCount / enrollmentCount) * 100) : 0

    // Per-lesson stats: correction rate
    const courseLessons = (allLessons || []).filter(l => l.course_id === course.id)
    const lessonStats = courseLessons.map(lesson => {
      const lessonSubs = courseSubs.filter(s => (s.lesson as any)?.id === lesson.id)
      const total = lessonSubs.length
      const corrections = lessonSubs.filter(s => s.status === 'graded_corrections').length
      const passed = lessonSubs.filter(s => s.status === 'graded_pass').length
      const correctionRate = total > 0 ? Math.round((corrections / total) * 100) : 0

      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        sortOrder: lesson.sort_order,
        totalSubmissions: total,
        passed,
        corrections,
        correctionRate,
      }
    })

    // Drop-off: find the last lesson each student passed, the lesson after that is where they "stopped"
    const dropOffMap = new Map<number, number>()
    for (const [studentId] of courseEnrollments.map(e => [e.student_id] as const)) {
      const passCount = studentPassCounts.get(studentId) || 0
      if (passCount < course.lesson_count && passCount > 0) {
        // Student stopped at lesson passCount+1 (0-indexed sort_order)
        dropOffMap.set(passCount, (dropOffMap.get(passCount) || 0) + 1)
      } else if (passCount === 0) {
        dropOffMap.set(0, (dropOffMap.get(0) || 0) + 1)
      }
    }

    return {
      id: course.id,
      title: course.title,
      category: course.category,
      lessonCount: course.lesson_count,
      enrollmentCount,
      completionCount,
      completionRate,
      lessonStats,
      dropOffData: courseLessons.map(lesson => ({
        lesson: `L${lesson.sort_order + 1}`,
        lessonTitle: lesson.title,
        dropOffs: dropOffMap.get(lesson.sort_order) || 0,
      })),
    }
  })

  return (
    <div className="space-y-6">
      <Suspense>
        <ReportFilters defaultOrg={orgFilter} />
      </Suspense>
      <CourseAnalytics courses={courseData} />
    </div>
  )
}
