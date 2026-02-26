export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeeklyStatsCards } from '@/components/reports/weekly-stats-cards'
import { ActivityChart } from '@/components/reports/activity-chart'
import { DateRangeSelector } from '@/components/reports/date-range-selector'
import { getPeriodBuckets, getComparisonPeriods, parsePeriodParams } from '@/lib/report-periods'
import { ReportFilters } from '@/components/reports/report-filters'
import { filterByOrg, filterByStaff, resolveOrgDefault } from '@/lib/org-filter'
import { Suspense } from 'react'

export const metadata = {
  title: 'Reports Overview — FCDC Extension Courses',
}

async function getTimezone(supabase: any) {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'timezone')
    .maybeSingle()
  return data?.value || 'America/New_York'
}

export default async function ReportsOverviewPage({
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
  const timezone = await getTimezone(supabase)

  const periodParams = { ...parsePeriodParams(params), timezone }
  const orgFilter = resolveOrgDefault(params.org, profile?.organization)

  // Get all enrolled student IDs (any role)
  const { data: enrollmentRows } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('status', 'active')

  let enrolledIds = [...new Set((enrollmentRows || []).map(e => e.student_id))]

  if (!isAdmin) {
    // Supervisor: filter to assigned students
    const { data: assignedStudents } = await supabase
      .from('profiles')
      .select('id')
      .eq('supervisor_id', user.id)
    const assignedIds = new Set((assignedStudents || []).map(s => s.id))
    enrolledIds = enrolledIds.filter(id => assignedIds.has(id))
  }

  // Apply audience (paid/staff) and organization filters
  enrolledIds = await filterByStaff(supabase, enrolledIds, params.audience)
  enrolledIds = await filterByOrg(supabase, enrolledIds, orgFilter)

  const studentIds = enrolledIds.length > 0 ? enrolledIds : ['_none_']

  // Get comparison periods
  const comparison = getComparisonPeriods(periodParams)
  const buckets = getPeriodBuckets(periodParams)

  // Fetch current period submissions
  const { data: currentSubs } = await supabase
    .from('lesson_submissions')
    .select('student_id, status, submitted_at, graded_at')
    .not('submitted_at', 'is', null)
    .gte('submitted_at', comparison.current.start.toISOString())
    .lte('submitted_at', comparison.current.end.toISOString())
    .in('student_id', studentIds)

  // Fetch previous period (if exists)
  let prevSubs: any[] = []
  if (comparison.previous) {
    const { data } = await supabase
      .from('lesson_submissions')
      .select('student_id, status, submitted_at, graded_at')
      .not('submitted_at', 'is', null)
      .gte('submitted_at', comparison.previous.start.toISOString())
      .lte('submitted_at', comparison.previous.end.toISOString())
      .in('student_id', studentIds)
    prevSubs = data || []
  }

  // Current period passed
  const { data: currentPassed } = await supabase
    .from('lesson_submissions')
    .select('student_id')
    .eq('status', 'graded_pass')
    .not('graded_at', 'is', null)
    .gte('graded_at', comparison.current.start.toISOString())
    .lte('graded_at', comparison.current.end.toISOString())
    .in('student_id', studentIds)

  let prevPassed: any[] = []
  if (comparison.previous) {
    const { data } = await supabase
      .from('lesson_submissions')
      .select('student_id')
      .eq('status', 'graded_pass')
      .not('graded_at', 'is', null)
      .gte('graded_at', comparison.previous.start.toISOString())
      .lte('graded_at', comparison.previous.end.toISOString())
      .in('student_id', studentIds)
    prevPassed = data || []
  }

  // Stats
  const submittedCurrent = currentSubs?.length || 0
  const submittedPrev = prevSubs.length
  const activeCurrent = new Set((currentSubs || []).map(s => s.student_id)).size
  const activePrev = new Set(prevSubs.map(s => s.student_id)).size
  const passedCurrent = currentPassed?.length || 0
  const passedPrev = prevPassed.length

  // Completions
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id, course:courses(lesson_count)')
    .eq('status', 'active')
    .in('student_id', studentIds)

  const { data: allPassedSubs } = await supabase
    .from('lesson_submissions')
    .select('student_id, lesson:lessons(course_id), graded_at')
    .eq('status', 'graded_pass')
    .in('student_id', studentIds)

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

  let completionsCurrent = 0
  let completionsPrev = 0
  for (const enrollment of enrollments || []) {
    const lessonCount = (enrollment.course as any)?.lesson_count || 0
    if (lessonCount === 0) continue
    const key = `${enrollment.student_id}:${enrollment.course_id}`
    const progress = passCountByEnrollment.get(key)
    if (progress && progress.count >= lessonCount && progress.lastGradedAt) {
      const completionDate = new Date(progress.lastGradedAt)
      if (completionDate >= comparison.current.start && completionDate <= comparison.current.end) completionsCurrent++
      if (comparison.previous && completionDate >= comparison.previous.start && completionDate <= comparison.previous.end) completionsPrev++
    }
  }

  // Chart data: fetch counts per bucket
  const chartData = await Promise.all(
    buckets.map(async (bucket) => {
      const { count: subs } = await supabase
        .from('lesson_submissions')
        .select('*', { count: 'exact', head: true })
        .not('submitted_at', 'is', null)
        .gte('submitted_at', bucket.start.toISOString())
        .lte('submitted_at', bucket.end.toISOString())
        .in('student_id', studentIds)

      const { count: passed } = await supabase
        .from('lesson_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'graded_pass')
        .not('graded_at', 'is', null)
        .gte('graded_at', bucket.start.toISOString())
        .lte('graded_at', bucket.end.toISOString())
        .in('student_id', studentIds)

      return {
        label: bucket.label,
        submitted: subs || 0,
        passed: passed || 0,
      }
    })
  )

  const comparisonLabel = comparison.previous ? `vs ${comparison.previous.label}` : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Suspense>
          <DateRangeSelector />
        </Suspense>
        <Suspense>
          <ReportFilters defaultOrg={orgFilter} />
        </Suspense>
      </div>

      <WeeklyStatsCards
        submittedCurrent={submittedCurrent}
        submittedPrev={submittedPrev}
        activeCurrent={activeCurrent}
        activePrev={activePrev}
        passedCurrent={passedCurrent}
        passedPrev={passedPrev}
        completionsCurrent={completionsCurrent}
        completionsPrev={completionsPrev}
        comparisonLabel={comparisonLabel}
        periodLabel={comparison.current.label}
      />

      <ActivityChart data={chartData} mode={periodParams.mode} />
    </div>
  )
}
