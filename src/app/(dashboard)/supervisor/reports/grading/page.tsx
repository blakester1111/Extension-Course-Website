export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GradingStats } from '@/components/reports/grading-stats'
import { DateRangeSelector } from '@/components/reports/date-range-selector'
import { getPeriodBuckets, parsePeriodParams } from '@/lib/report-periods'
import { ReportFilters } from '@/components/reports/report-filters'
import { filterByOrg, filterByStaff, resolveOrgDefault } from '@/lib/org-filter'
import { Suspense } from 'react'

export const metadata = {
  title: 'Grading Performance — FCDC Extension Courses',
}

export default async function GradingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get timezone
  const { data: tzSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'timezone')
    .maybeSingle()
  const timezone = tzSetting?.value || 'America/New_York'

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization')
    .eq('id', user.id)
    .single()

  const periodParams = { ...parsePeriodParams(params), timezone }
  const buckets = getPeriodBuckets(periodParams)
  const orgFilter = resolveOrgDefault(params.org, profile?.organization)

  // Get enrolled student IDs and filter by audience + org
  const { data: enrollmentRows } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('status', 'active')
  let enrolledIds = [...new Set((enrollmentRows || []).map((e: any) => e.student_id))]
  enrolledIds = await filterByStaff(supabase, enrolledIds, params.audience)
  enrolledIds = await filterByOrg(supabase, enrolledIds, orgFilter)
  const studentIds = enrolledIds.length > 0 ? enrolledIds : ['_none_']

  // Get ALL graded submissions for all-time stats (filtered by org students)
  const { data: allGraded } = await supabase
    .from('lesson_submissions')
    .select('id, student_id, lesson_id, status, graded_by, graded_at, submitted_at, grade')
    .not('graded_at', 'is', null)
    .not('submitted_at', 'is', null)
    .in('student_id', studentIds)

  // Get supervisor profiles
  const graderIds = [...new Set((allGraded || []).map(s => s.graded_by).filter(Boolean))]
  const { data: graders } = graderIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', graderIds)
    : { data: [] }
  const graderMap = new Map((graders || []).map(g => [g.id, g.full_name]))

  // Calculate stats
  const turnaroundHours: number[] = []
  let totalGraded = 0
  let passedCount = 0
  let correctionCount = 0
  const gradeValues: number[] = []

  // Track which student+lesson combos had corrections to calculate
  // "corrections that passed on next attempt" rate
  const correctionLessons = new Set<string>()
  const passedAfterCorrection = new Set<string>()

  // Per-supervisor stats
  const supervisorStats = new Map<string, {
    name: string
    graded: number
    totalTurnaroundHours: number
    passed: number
    corrections: number
  }>()

  for (const sub of allGraded || []) {
    totalGraded++
    if (sub.status === 'graded_pass') passedCount++
    if (sub.status === 'graded_corrections') {
      correctionCount++
      correctionLessons.add(`${sub.student_id}:${sub.lesson_id}`)
    }
    if (sub.grade !== null) gradeValues.push(sub.grade)

    // Check if this pass was after a prior correction
    if (sub.status === 'graded_pass' && correctionLessons.has(`${sub.student_id}:${sub.lesson_id}`)) {
      passedAfterCorrection.add(`${sub.student_id}:${sub.lesson_id}`)
    }

    const submitted = new Date(sub.submitted_at!)
    const graded = new Date(sub.graded_at!)
    const hours = (graded.getTime() - submitted.getTime()) / (1000 * 60 * 60)
    if (hours >= 0 && hours < 8760) turnaroundHours.push(hours)

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

  const passRate = totalGraded > 0 ? Math.round((passedCount / totalGraded) * 100) : 0
  const correctionRate = totalGraded > 0 ? Math.round((correctionCount / totalGraded) * 100) : 0

  // Chart: graded per bucket
  const chartData = buckets.map(bucket => {
    const count = (allGraded || []).filter(s => {
      const d = new Date(s.graded_at!)
      return d >= bucket.start && d <= bucket.end
    }).length
    return { label: bucket.label, graded: count }
  })

  // Current period graded count
  const currentBucket = buckets[buckets.length - 1]
  const gradedCurrentPeriod = currentBucket
    ? (allGraded || []).filter(s => {
        const d = new Date(s.graded_at!)
        return d >= currentBucket.start && d <= currentBucket.end
      }).length
    : 0

  const supervisorData = Array.from(supervisorStats.values()).map(s => ({
    ...s,
    avgTurnaroundHours: s.graded > 0 ? s.totalTurnaroundHours / s.graded : 0,
    passRate: s.graded > 0 ? Math.round((s.passed / s.graded) * 100) : 0,
  })).sort((a, b) => b.graded - a.graded)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <Suspense>
          <DateRangeSelector />
        </Suspense>
        <Suspense>
          <ReportFilters defaultOrg={orgFilter} />
        </Suspense>
      </div>

      <GradingStats
        totalGraded={totalGraded}
        gradedCurrentPeriod={gradedCurrentPeriod}
        avgTurnaroundHours={avgTurnaroundHours}
        passRate={passRate}
        correctionRate={correctionRate}
        avgGrade={avgGrade}
        supervisors={supervisorData}
        chartData={chartData}
        mode={periodParams.mode}
      />
    </div>
  )
}
