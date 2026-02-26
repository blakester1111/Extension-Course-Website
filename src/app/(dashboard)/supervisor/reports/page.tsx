export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns'
import { WeeklyStatsCards } from '@/components/reports/weekly-stats-cards'
import { WeeklyChart } from '@/components/reports/weekly-chart'

export const metadata = {
  title: 'Reports Overview — FCDC Extension Courses',
}

export default async function ReportsOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  // Get scoped student IDs
  let studentIds: string[] = []
  if (isAdmin) {
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
    studentIds = (students || []).map(s => s.id)
  } else {
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('supervisor_id', user.id)
      .eq('role', 'student')
    studentIds = (students || []).map(s => s.id)
  }

  const now = new Date()
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const lastWeekStart = subWeeks(thisWeekStart, 1)
  const lastWeekEnd = subWeeks(thisWeekEnd, 1)

  // Fetch this week's submissions
  const { data: thisWeekSubs } = await supabase
    .from('lesson_submissions')
    .select('student_id, status, submitted_at, graded_at')
    .not('submitted_at', 'is', null)
    .gte('submitted_at', thisWeekStart.toISOString())
    .lte('submitted_at', thisWeekEnd.toISOString())
    .in('student_id', studentIds.length > 0 ? studentIds : ['_none_'])

  // Fetch last week's submissions for comparison
  const { data: lastWeekSubs } = await supabase
    .from('lesson_submissions')
    .select('student_id, status, submitted_at, graded_at')
    .not('submitted_at', 'is', null)
    .gte('submitted_at', lastWeekStart.toISOString())
    .lte('submitted_at', lastWeekEnd.toISOString())
    .in('student_id', studentIds.length > 0 ? studentIds : ['_none_'])

  // Fetch this week's graded_pass
  const { data: thisWeekPassed } = await supabase
    .from('lesson_submissions')
    .select('student_id')
    .eq('status', 'graded_pass')
    .not('graded_at', 'is', null)
    .gte('graded_at', thisWeekStart.toISOString())
    .lte('graded_at', thisWeekEnd.toISOString())
    .in('student_id', studentIds.length > 0 ? studentIds : ['_none_'])

  const { data: lastWeekPassed } = await supabase
    .from('lesson_submissions')
    .select('student_id')
    .eq('status', 'graded_pass')
    .not('graded_at', 'is', null)
    .gte('graded_at', lastWeekStart.toISOString())
    .lte('graded_at', lastWeekEnd.toISOString())
    .in('student_id', studentIds.length > 0 ? studentIds : ['_none_'])

  // Calculate stats
  const submittedThisWeek = thisWeekSubs?.length || 0
  const submittedLastWeek = lastWeekSubs?.length || 0
  const activeThisWeek = new Set((thisWeekSubs || []).map(s => s.student_id)).size
  const activeLastWeek = new Set((lastWeekSubs || []).map(s => s.student_id)).size
  const passedThisWeek = thisWeekPassed?.length || 0
  const passedLastWeek = lastWeekPassed?.length || 0

  // Course completions: get enrollments where all lessons are passed
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id, course:courses(lesson_count)')
    .eq('status', 'active')
    .in('student_id', studentIds.length > 0 ? studentIds : ['_none_'])

  const { data: allPassedSubs } = await supabase
    .from('lesson_submissions')
    .select('student_id, lesson:lessons(course_id), graded_at')
    .eq('status', 'graded_pass')
    .in('student_id', studentIds.length > 0 ? studentIds : ['_none_'])

  // Count completions by checking pass count vs lesson_count
  const passCountByEnrollment = new Map<string, { count: number; lastGradedAt: string | null }>()
  for (const sub of allPassedSubs || []) {
    const courseId = (sub.lesson as any)?.course_id
    if (!courseId) continue
    const key = `${sub.student_id}:${courseId}`
    const current = passCountByEnrollment.get(key) || { count: 0, lastGradedAt: null }
    current.count++
    if (sub.graded_at && (!current.lastGradedAt || sub.graded_at > current.lastGradedAt)) {
      current.lastGradedAt = sub.graded_at
    }
    passCountByEnrollment.set(key, current)
  }

  let completionsThisWeek = 0
  let completionsLastWeek = 0
  for (const enrollment of enrollments || []) {
    const lessonCount = (enrollment.course as any)?.lesson_count || 0
    if (lessonCount === 0) continue
    const key = `${enrollment.student_id}:${enrollment.course_id}`
    const progress = passCountByEnrollment.get(key)
    if (progress && progress.count >= lessonCount && progress.lastGradedAt) {
      const completionDate = new Date(progress.lastGradedAt)
      if (completionDate >= thisWeekStart && completionDate <= thisWeekEnd) completionsThisWeek++
      if (completionDate >= lastWeekStart && completionDate <= lastWeekEnd) completionsLastWeek++
    }
  }

  // 8-week chart data
  const weeklyData = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = subWeeks(thisWeekStart, i)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    const { count: weekSubs } = await supabase
      .from('lesson_submissions')
      .select('*', { count: 'exact', head: true })
      .not('submitted_at', 'is', null)
      .gte('submitted_at', weekStart.toISOString())
      .lte('submitted_at', weekEnd.toISOString())
      .in('student_id', studentIds.length > 0 ? studentIds : ['_none_'])

    const { count: weekPassed } = await supabase
      .from('lesson_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'graded_pass')
      .not('graded_at', 'is', null)
      .gte('graded_at', weekStart.toISOString())
      .lte('graded_at', weekEnd.toISOString())
      .in('student_id', studentIds.length > 0 ? studentIds : ['_none_'])

    weeklyData.push({
      week: format(weekStart, 'MMM d'),
      submitted: weekSubs || 0,
      passed: weekPassed || 0,
    })
  }

  return (
    <div className="space-y-6">
      <WeeklyStatsCards
        submittedThisWeek={submittedThisWeek}
        submittedLastWeek={submittedLastWeek}
        activeThisWeek={activeThisWeek}
        activeLastWeek={activeLastWeek}
        passedThisWeek={passedThisWeek}
        passedLastWeek={passedLastWeek}
        completionsThisWeek={completionsThisWeek}
        completionsLastWeek={completionsLastWeek}
      />

      <WeeklyChart data={weeklyData} />
    </div>
  )
}
