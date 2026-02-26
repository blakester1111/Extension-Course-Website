export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CompletionsTable } from '@/components/reports/completions-table'

export const metadata = {
  title: 'Completions — FCDC Extension Courses',
}

export default async function CompletionsPage() {
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

  if (!isAdmin) {
    studentsQuery = studentsQuery.eq('supervisor_id', user.id)
  }

  const { data: students } = await studentsQuery
  const studentIds = (students || []).map(s => s.id)
  const studentMap = new Map((students || []).map(s => [s.id, s]))

  if (studentIds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No students found.
      </div>
    )
  }

  // Get active enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id, created_at, course:courses(id, title, lesson_count)')
    .eq('status', 'active')
    .in('student_id', studentIds)

  // Get all passed submissions with graded_at
  const { data: passedSubmissions } = await supabase
    .from('lesson_submissions')
    .select('student_id, lesson:lessons(course_id), graded_at')
    .eq('status', 'graded_pass')
    .in('student_id', studentIds)

  // Build pass count and last graded date per enrollment
  const enrollmentStats = new Map<string, { count: number; lastGradedAt: string | null }>()
  for (const sub of passedSubmissions || []) {
    const courseId = (sub.lesson as any)?.course_id
    if (!courseId) continue
    const key = `${sub.student_id}:${courseId}`
    const current = enrollmentStats.get(key) || { count: 0, lastGradedAt: null }
    current.count++
    if (sub.graded_at && (!current.lastGradedAt || sub.graded_at > current.lastGradedAt)) {
      current.lastGradedAt = sub.graded_at
    }
    enrollmentStats.set(key, current)
  }

  // Find completions
  const completions: {
    studentName: string
    studentEmail: string
    courseTitle: string
    courseId: string
    enrolledAt: string
    completedAt: string
    daysToComplete: number
  }[] = []

  for (const enrollment of enrollments || []) {
    const course = enrollment.course as any
    if (!course || course.lesson_count === 0) continue
    const key = `${enrollment.student_id}:${enrollment.course_id}`
    const stats = enrollmentStats.get(key)
    if (stats && stats.count >= course.lesson_count && stats.lastGradedAt) {
      const student = studentMap.get(enrollment.student_id)
      const enrolledDate = new Date(enrollment.created_at)
      const completedDate = new Date(stats.lastGradedAt)
      const days = Math.max(1, Math.round((completedDate.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24)))

      completions.push({
        studentName: student?.full_name || 'Unknown',
        studentEmail: student?.email || '',
        courseTitle: course.title,
        courseId: course.id,
        enrolledAt: enrollment.created_at,
        completedAt: stats.lastGradedAt,
        daysToComplete: days,
      })
    }
  }

  // Get unique courses for filter
  const courses = Array.from(
    new Map(
      (enrollments || [])
        .map(e => {
          const c = e.course as any
          return c ? [c.id, { id: c.id, title: c.title }] as const : null
        })
        .filter((v): v is [string, { id: string; title: string }] => v !== null)
    ).values()
  ).sort((a, b) => a.title.localeCompare(b.title))

  return (
    <CompletionsTable completions={completions} courses={courses} />
  )
}
