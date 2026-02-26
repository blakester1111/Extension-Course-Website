export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPastWeeks } from '@/lib/report-periods'
import { WeeklyReportExport } from '@/components/reports/weekly-report-export'
import { ReportFilters } from '@/components/reports/report-filters'
import { filterByOrg, filterByStaff, resolveOrgDefault } from '@/lib/org-filter'
import { Suspense } from 'react'

export const metadata = {
  title: 'Weekly Report Export — FCDC Extension Courses',
}

export default async function WeeklyExportPage({
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

  // Get timezone
  const { data: tzSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'timezone')
    .maybeSingle()
  const timezone = tzSetting?.value || 'America/New_York'

  // Generate past 26 weeks for selection
  const weeks = getPastWeeks(26, timezone)

  // Determine selected week (default: current week)
  const selectedWeekIndex = params.week ? parseInt(params.week, 10) : 0
  const selectedWeek = weeks[selectedWeekIndex] || weeks[0]

  // Get enrolled student IDs
  const { data: enrollmentRows } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('status', 'active')

  let enrolledIds = [...new Set((enrollmentRows || []).map(e => e.student_id))]

  if (!isAdmin) {
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

  const studentIds = enrolledIds.length > 0 ? enrolledIds : ['_none_']

  // Get profiles
  const { data: studentProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', studentIds)

  const profileMap = new Map((studentProfiles || []).map(p => [p.id, p]))

  const weekStart = selectedWeek.start
  const weekEnd = selectedWeek.end

  // Submissions during this week
  const { data: weekSubmissions } = await supabase
    .from('lesson_submissions')
    .select('id, student_id, lesson_id, status, submitted_at, graded_at, graded_by, lesson:lessons(title, course_id, sort_order)')
    .not('submitted_at', 'is', null)
    .gte('submitted_at', weekStart.toISOString())
    .lte('submitted_at', weekEnd.toISOString())
    .in('student_id', studentIds)

  // Graded during this week (may have been submitted earlier)
  const { data: weekGraded } = await supabase
    .from('lesson_submissions')
    .select('id, student_id, lesson_id, status, submitted_at, graded_at, graded_by, lesson:lessons(title, course_id, sort_order)')
    .not('graded_at', 'is', null)
    .gte('graded_at', weekStart.toISOString())
    .lte('graded_at', weekEnd.toISOString())
    .in('student_id', studentIds)

  // Enrollments with course info
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id, course:courses(id, title, lesson_count)')
    .eq('status', 'active')
    .in('student_id', studentIds)

  // All-time pass counts (for completion detection)
  const { data: allPassed } = await supabase
    .from('lesson_submissions')
    .select('student_id, lesson:lessons(course_id), graded_at')
    .eq('status', 'graded_pass')
    .in('student_id', studentIds)

  // Courses map
  const courseMap = new Map<string, string>()
  for (const e of enrollments || []) {
    const course = e.course as any
    if (course) courseMap.set(course.id, course.title)
  }

  // Grader names
  const graderIds = [...new Set((weekGraded || []).map(s => s.graded_by).filter(Boolean))]
  const { data: graders } = graderIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', graderIds)
    : { data: [] }
  const graderMap = new Map((graders || []).map(g => [g.id, g.full_name]))

  // --- Build report data ---

  // 1. Summary stats
  const totalSubmitted = (weekSubmissions || []).length
  const activeStudentIds = new Set((weekSubmissions || []).map(s => s.student_id))
  const activeStudents = activeStudentIds.size
  const totalGraded = (weekGraded || []).length
  const passedThisWeek = (weekGraded || []).filter(s => s.status === 'graded_pass').length
  const correctionsThisWeek = (weekGraded || []).filter(s => s.status === 'graded_corrections').length

  // Turnaround for graded this week
  const turnaroundHours: number[] = []
  for (const sub of weekGraded || []) {
    if (sub.submitted_at && sub.graded_at) {
      const hours = (new Date(sub.graded_at).getTime() - new Date(sub.submitted_at).getTime()) / (1000 * 60 * 60)
      if (hours >= 0 && hours < 8760) turnaroundHours.push(hours)
    }
  }
  const avgTurnaroundHours = turnaroundHours.length > 0
    ? turnaroundHours.reduce((a, b) => a + b, 0) / turnaroundHours.length
    : 0

  // Completions this week
  const passCountMap = new Map<string, { count: number; lastGradedAt: string | null }>()
  for (const sub of allPassed || []) {
    const courseId = (sub.lesson as any)?.course_id
    if (!courseId) continue
    const key = `${sub.student_id}:${courseId}`
    const current = passCountMap.get(key) || { count: 0, lastGradedAt: null }
    current.count++
    if (sub.graded_at && (!current.lastGradedAt || sub.graded_at > current.lastGradedAt)) {
      current.lastGradedAt = sub.graded_at
    }
    passCountMap.set(key, current)
  }

  const completionsThisWeek: { studentName: string; courseTitle: string }[] = []
  for (const enrollment of enrollments || []) {
    const course = enrollment.course as any
    if (!course || course.lesson_count === 0) continue
    const key = `${enrollment.student_id}:${enrollment.course_id}`
    const progress = passCountMap.get(key)
    if (progress && progress.count >= course.lesson_count && progress.lastGradedAt) {
      const completionDate = new Date(progress.lastGradedAt)
      if (completionDate >= weekStart && completionDate <= weekEnd) {
        const p = profileMap.get(enrollment.student_id)
        completionsThisWeek.push({
          studentName: p?.full_name || 'Unknown',
          courseTitle: course.title,
        })
      }
    }
  }

  // 2. Per-student activity
  const studentActivity: {
    name: string
    email: string
    submitted: number
    passed: number
    corrections: number
  }[] = []

  const studentSubCounts = new Map<string, { submitted: number; passed: number; corrections: number }>()
  for (const sub of weekSubmissions || []) {
    const c = studentSubCounts.get(sub.student_id) || { submitted: 0, passed: 0, corrections: 0 }
    c.submitted++
    studentSubCounts.set(sub.student_id, c)
  }
  for (const sub of weekGraded || []) {
    const c = studentSubCounts.get(sub.student_id) || { submitted: 0, passed: 0, corrections: 0 }
    if (sub.status === 'graded_pass') c.passed++
    if (sub.status === 'graded_corrections') c.corrections++
    studentSubCounts.set(sub.student_id, c)
  }
  for (const [studentId, counts] of studentSubCounts) {
    const p = profileMap.get(studentId)
    if (p) {
      studentActivity.push({
        name: p.full_name,
        email: p.email,
        ...counts,
      })
    }
  }
  studentActivity.sort((a, b) => b.submitted - a.submitted)

  // 3. Per-course breakdown
  const courseBreakdown: {
    courseTitle: string
    submitted: number
    passed: number
    corrections: number
  }[] = []

  const courseCounts = new Map<string, { submitted: number; passed: number; corrections: number }>()
  for (const sub of weekSubmissions || []) {
    const courseId = (sub.lesson as any)?.course_id
    if (!courseId) continue
    const c = courseCounts.get(courseId) || { submitted: 0, passed: 0, corrections: 0 }
    c.submitted++
    courseCounts.set(courseId, c)
  }
  for (const sub of weekGraded || []) {
    const courseId = (sub.lesson as any)?.course_id
    if (!courseId) continue
    const c = courseCounts.get(courseId) || { submitted: 0, passed: 0, corrections: 0 }
    if (sub.status === 'graded_pass') c.passed++
    if (sub.status === 'graded_corrections') c.corrections++
    courseCounts.set(courseId, c)
  }
  for (const [courseId, counts] of courseCounts) {
    courseBreakdown.push({
      courseTitle: courseMap.get(courseId) || 'Unknown',
      ...counts,
    })
  }
  courseBreakdown.sort((a, b) => b.submitted - a.submitted)

  // 4. Supervisor grading breakdown
  const supervisorBreakdown: {
    name: string
    graded: number
    passed: number
    corrections: number
    avgTurnaroundHours: number
  }[] = []

  const supCounts = new Map<string, { graded: number; passed: number; corrections: number; totalHours: number }>()
  for (const sub of weekGraded || []) {
    if (!sub.graded_by) continue
    const c = supCounts.get(sub.graded_by) || { graded: 0, passed: 0, corrections: 0, totalHours: 0 }
    c.graded++
    if (sub.status === 'graded_pass') c.passed++
    if (sub.status === 'graded_corrections') c.corrections++
    if (sub.submitted_at && sub.graded_at) {
      const hours = (new Date(sub.graded_at).getTime() - new Date(sub.submitted_at).getTime()) / (1000 * 60 * 60)
      if (hours >= 0 && hours < 8760) c.totalHours += hours
    }
    supCounts.set(sub.graded_by, c)
  }
  for (const [supId, counts] of supCounts) {
    supervisorBreakdown.push({
      name: graderMap.get(supId) || 'Unknown',
      graded: counts.graded,
      passed: counts.passed,
      corrections: counts.corrections,
      avgTurnaroundHours: counts.graded > 0 ? counts.totalHours / counts.graded : 0,
    })
  }
  supervisorBreakdown.sort((a, b) => b.graded - a.graded)

  // Week selector options
  const weekOptions = weeks.map((w, i) => ({
    index: i,
    label: w.label,
  }))

  return (
    <div className="space-y-6">
      <Suspense>
        <ReportFilters defaultOrg={orgFilter} />
      </Suspense>
    <WeeklyReportExport
      weekLabel={selectedWeek.label}
      weekOptions={weekOptions}
      selectedWeekIndex={selectedWeekIndex}
      summary={{
        totalSubmitted,
        activeStudents,
        totalGraded,
        passedThisWeek,
        correctionsThisWeek,
        avgTurnaroundHours,
        completions: completionsThisWeek.length,
      }}
      completions={completionsThisWeek}
      studentActivity={studentActivity}
      courseBreakdown={courseBreakdown}
      supervisorBreakdown={supervisorBreakdown}
    />
    </div>
  )
}
