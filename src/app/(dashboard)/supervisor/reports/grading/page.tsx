export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GradingStats } from '@/components/reports/grading-stats'
import { startOfWeek, subWeeks, endOfWeek, format } from 'date-fns'

export const metadata = {
  title: 'Grading Performance — FCDC Extension Courses',
}

export default async function GradingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  // Get all graded submissions
  let gradedQuery = supabase
    .from('lesson_submissions')
    .select('id, status, graded_by, graded_at, submitted_at, grade')
    .not('graded_at', 'is', null)
    .not('submitted_at', 'is', null)

  const { data: gradedSubmissions } = await gradedQuery

  // Get supervisor profiles for names
  const graderIds = [...new Set((gradedSubmissions || []).map(s => s.graded_by).filter(Boolean))]
  const { data: graders } = graderIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', graderIds)
    : { data: [] }

  const graderMap = new Map((graders || []).map(g => [g.id, g.full_name]))

  // Calculate turnaround times
  const turnaroundHours: number[] = []
  let totalGraded = 0
  let firstPassCount = 0
  let correctionCount = 0
  const gradeValues: number[] = []

  // Per-supervisor stats
  const supervisorStats = new Map<string, {
    name: string
    graded: number
    totalTurnaroundHours: number
    passed: number
    corrections: number
  }>()

  const now = new Date()
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 })

  // Per week grading for chart (8 weeks)
  const weeklyGrading: { week: string; count: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = subWeeks(thisWeekStart, i)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const count = (gradedSubmissions || []).filter(s => {
      const gradedAt = new Date(s.graded_at!)
      return gradedAt >= weekStart && gradedAt <= weekEnd
    }).length

    weeklyGrading.push({
      week: format(weekStart, 'MMM d'),
      count,
    })
  }

  for (const sub of gradedSubmissions || []) {
    totalGraded++
    if (sub.status === 'graded_pass') firstPassCount++
    if (sub.status === 'graded_corrections') correctionCount++
    if (sub.grade !== null) gradeValues.push(sub.grade)

    const submitted = new Date(sub.submitted_at!)
    const graded = new Date(sub.graded_at!)
    const hours = (graded.getTime() - submitted.getTime()) / (1000 * 60 * 60)
    if (hours >= 0 && hours < 8760) { // Filter out bad data (> 1 year)
      turnaroundHours.push(hours)
    }

    // Per-supervisor
    if (sub.graded_by) {
      const stats = supervisorStats.get(sub.graded_by) || {
        name: graderMap.get(sub.graded_by) || 'Unknown',
        graded: 0,
        totalTurnaroundHours: 0,
        passed: 0,
        corrections: 0,
      }
      stats.graded++
      if (hours >= 0 && hours < 8760) stats.totalTurnaroundHours += hours
      if (sub.status === 'graded_pass') stats.passed++
      if (sub.status === 'graded_corrections') stats.corrections++
      supervisorStats.set(sub.graded_by, stats)
    }
  }

  const avgTurnaroundHours = turnaroundHours.length > 0
    ? turnaroundHours.reduce((a, b) => a + b, 0) / turnaroundHours.length
    : 0

  const avgGrade = gradeValues.length > 0
    ? gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length
    : 0

  const firstPassRate = totalGraded > 0
    ? Math.round((firstPassCount / totalGraded) * 100)
    : 0

  // Graded this week
  const gradedThisWeek = (gradedSubmissions || []).filter(s => {
    const gradedAt = new Date(s.graded_at!)
    return gradedAt >= thisWeekStart && gradedAt <= thisWeekEnd
  }).length

  const supervisorData = Array.from(supervisorStats.values()).map(s => ({
    ...s,
    avgTurnaroundHours: s.graded > 0 ? s.totalTurnaroundHours / s.graded : 0,
    firstPassRate: s.graded > 0 ? Math.round((s.passed / s.graded) * 100) : 0,
  })).sort((a, b) => b.graded - a.graded)

  return (
    <GradingStats
      totalGraded={totalGraded}
      gradedThisWeek={gradedThisWeek}
      avgTurnaroundHours={avgTurnaroundHours}
      firstPassRate={firstPassRate}
      avgGrade={avgGrade}
      supervisors={supervisorData}
      weeklyData={weeklyGrading}
    />
  )
}
