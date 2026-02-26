export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProgressBoard } from '@/components/reports/progress-board'

export const metadata = {
  title: 'Student Progress — FCDC Extension Courses',
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  // Get students
  let studentsQuery = supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  if (!isAdmin) {
    studentsQuery = studentsQuery.eq('supervisor_id', user.id)
  }

  const { data: students } = await studentsQuery
  const studentIds = (students || []).map(s => s.id)

  if (studentIds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No students found.
      </div>
    )
  }

  // Get active enrollments with course info
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id, course:courses(id, title, lesson_count)')
    .eq('status', 'active')
    .in('student_id', studentIds)

  // Get all passed lessons
  const { data: passedSubmissions } = await supabase
    .from('lesson_submissions')
    .select('student_id, lesson:lessons(course_id), graded_at')
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
  for (const sub of passedSubmissions || []) {
    const courseId = (sub.lesson as any)?.course_id
    if (!courseId) continue
    const key = `${sub.student_id}:${courseId}`
    passCountMap.set(key, (passCountMap.get(key) || 0) + 1)
  }

  // Build last submission map
  const lastSubmissionMap = new Map<string, string>()
  for (const sub of allSubmissions || []) {
    if (!lastSubmissionMap.has(sub.student_id) && sub.submitted_at) {
      lastSubmissionMap.set(sub.student_id, sub.submitted_at)
    }
  }

  // Get all unique courses for the filter
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
        return {
          courseId: e.course_id,
          courseTitle: course?.title || 'Unknown',
          lessonCount: course?.lesson_count || 0,
          passedCount,
        }
      })

    const totalLessons = studentEnrollments.reduce((sum, e) => sum + e.lessonCount, 0)
    const totalPassed = studentEnrollments.reduce((sum, e) => sum + e.passedCount, 0)

    return {
      id: student.id,
      fullName: student.full_name,
      email: student.email,
      enrollments: studentEnrollments,
      totalLessons,
      totalPassed,
      completionPercent: totalLessons > 0 ? Math.round((totalPassed / totalLessons) * 100) : 0,
      lastSubmission: lastSubmissionMap.get(student.id) || null,
    }
  })

  const courses = Array.from(courseMap.values()).sort((a, b) => a.title.localeCompare(b.title))

  return (
    <ProgressBoard
      students={studentData}
      courses={courses}
    />
  )
}
