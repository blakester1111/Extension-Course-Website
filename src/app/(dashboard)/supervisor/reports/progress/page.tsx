export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProgressPageClient } from '@/components/reports/progress-page-client'
import { ReportFilters } from '@/components/reports/report-filters'
import { filterByOrg, filterByStaff, resolveOrgDefault } from '@/lib/org-filter'
import { Suspense } from 'react'

export const metadata = {
  title: 'Student Progress — FCDC Extension Courses',
}

export default async function ProgressPage({
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

  // Get ALL enrolled users (any role) via enrollments table
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

  if (enrolledIds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No enrolled students found.
      </div>
    )
  }

  // Get profiles for enrolled users
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', enrolledIds)
    .order('full_name', { ascending: true })

  const studentIds = (students || []).map(s => s.id)

  // Get active enrollments with course info
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id, course:courses(id, title, lesson_count)')
    .eq('status', 'active')
    .in('student_id', studentIds)

  // Get all passed lessons
  const { data: passedSubmissions } = await supabase
    .from('lesson_submissions')
    .select('student_id, lesson:lessons(id, course_id, sort_order), graded_at')
    .eq('status', 'graded_pass')
    .in('student_id', studentIds)

  // Get last submission date per student
  const { data: allSubmissions } = await supabase
    .from('lesson_submissions')
    .select('student_id, submitted_at')
    .not('submitted_at', 'is', null)
    .in('student_id', studentIds)
    .order('submitted_at', { ascending: false })

  // Build pass count map: studentId:courseId -> count
  const passCountMap = new Map<string, number>()
  // Also track which lesson sort_orders are passed per student+course
  const passedLessonsMap = new Map<string, Set<number>>()
  for (const sub of passedSubmissions || []) {
    const lesson = sub.lesson as any
    const courseId = lesson?.course_id
    if (!courseId) continue
    const key = `${sub.student_id}:${courseId}`
    passCountMap.set(key, (passCountMap.get(key) || 0) + 1)
    if (lesson.sort_order !== undefined) {
      const set = passedLessonsMap.get(key) || new Set()
      set.add(lesson.sort_order)
      passedLessonsMap.set(key, set)
    }
  }

  // Build last submission map
  const lastSubmissionMap = new Map<string, string>()
  for (const sub of allSubmissions || []) {
    if (!lastSubmissionMap.has(sub.student_id) && sub.submitted_at) {
      lastSubmissionMap.set(sub.student_id, sub.submitted_at)
    }
  }

  // Get all unique courses
  const courseMap = new Map<string, { id: string; title: string; lesson_count: number }>()
  for (const e of enrollments || []) {
    const course = e.course as any
    if (course && !courseMap.has(course.id)) {
      courseMap.set(course.id, { id: course.id, title: course.title, lesson_count: course.lesson_count })
    }
  }

  // Build student data
  const studentData = (students || []).map(student => {
    const studentEnrollments = (enrollments || [])
      .filter(e => e.student_id === student.id)
      .map(e => {
        const course = e.course as any
        const passedCount = passCountMap.get(`${student.id}:${e.course_id}`) || 0
        const passedLessonSortOrders = passedLessonsMap.get(`${student.id}:${e.course_id}`) || new Set<number>()
        return {
          courseId: e.course_id,
          courseTitle: course?.title || 'Unknown',
          lessonCount: course?.lesson_count || 0,
          passedCount,
          passedLessonSortOrders: [...passedLessonSortOrders],
        }
      })

    const totalLessons = studentEnrollments.reduce((sum, e) => sum + e.lessonCount, 0)
    const totalPassed = studentEnrollments.reduce((sum, e) => sum + e.passedCount, 0)
    const lessonsRemaining = totalLessons - totalPassed

    return {
      id: student.id,
      fullName: student.full_name,
      email: student.email,
      enrollments: studentEnrollments,
      totalLessons,
      totalPassed,
      lessonsRemaining,
      completionPercent: totalLessons > 0 ? Math.round((totalPassed / totalLessons) * 100) : 0,
      lastSubmission: lastSubmissionMap.get(student.id) || null,
    }
  })

  const courses = Array.from(courseMap.values()).sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="space-y-6">
      <Suspense>
        <ReportFilters defaultOrg={orgFilter} />
      </Suspense>
      <ProgressPageClient students={studentData} courses={courses} />
    </div>
  )
}
