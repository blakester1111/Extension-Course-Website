export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users, ClipboardCheck, TrendingUp, TrendingDown,
  FileText, Minus, UserCheck, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import {
  WeeklyActivityChart,
  CourseEnrollmentChart,
  OrgBreakdownChart,
  MonthlyTrendChart,
} from '@/components/admin/dashboard-charts'
import { getCurrentWeekStart } from '@/lib/report-periods'
import { addDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns'

export const metadata = {
  title: 'Admin Dashboard — FCDC Extension Courses',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/')

  const { data: allRoutes } = await supabase
    .from('study_routes')
    .select('id, name')
    .order('name')

  const { data: tzSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'timezone')
    .maybeSingle()
  const tz = tzSetting?.value || 'America/New_York'

  // Week boundaries
  const thisWeekStart = getCurrentWeekStart(tz)
  const thisWeekEnd = addDays(thisWeekStart, 7)
  const lastWeekStart = addDays(thisWeekStart, -7)

  // ---- Parallel data fetches ----
  const [
    { count: totalEnrolledCount },
    { count: pendingGradeCount },
    { count: pendingInvoiceCount },
    { data: allProfiles },
    { data: thisWeekAllSubs },
    { data: lastWeekAllSubs },
    { data: thisWeekPassed },
    { data: lastWeekPassed },
    { data: thisWeekCompletions },
    { data: lastWeekCompletions },
    { data: enrollmentsByCourse },
    { data: monthlySubs },
    { data: monthlyCerts },
  ] = await Promise.all([
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('lesson_submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'pending_invoice_verification'),

    // All profiles for org/staff breakdown
    supabase.from('profiles').select('organization, is_staff, is_deadfiled').eq('is_deadfiled', false),

    // This week submissions (all, for activity chart + active student count)
    supabase.from('lesson_submissions')
      .select('student_id, submitted_at')
      .gte('submitted_at', thisWeekStart.toISOString())
      .lt('submitted_at', thisWeekEnd.toISOString())
      .in('status', ['submitted', 'graded_pass', 'graded_corrections']),

    // Last week submissions
    supabase.from('lesson_submissions')
      .select('student_id, submitted_at')
      .gte('submitted_at', lastWeekStart.toISOString())
      .lt('submitted_at', thisWeekStart.toISOString())
      .in('status', ['submitted', 'graded_pass', 'graded_corrections']),

    // This week passed
    supabase.from('lesson_submissions')
      .select('graded_at')
      .eq('status', 'graded_pass')
      .eq('is_backentered', false)
      .gte('graded_at', thisWeekStart.toISOString())
      .lt('graded_at', thisWeekEnd.toISOString()),

    // Last week passed
    supabase.from('lesson_submissions')
      .select('graded_at')
      .eq('status', 'graded_pass')
      .eq('is_backentered', false)
      .gte('graded_at', lastWeekStart.toISOString())
      .lt('graded_at', thisWeekStart.toISOString()),

    // This week completions (certificates created = student finished all lessons 100%)
    supabase.from('certificates')
      .select('created_at')
      .gte('created_at', thisWeekStart.toISOString())
      .lt('created_at', thisWeekEnd.toISOString()),

    // Last week completions
    supabase.from('certificates')
      .select('created_at')
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', thisWeekStart.toISOString()),

    // Enrollments by course (for bar chart)
    supabase.from('enrollments')
      .select('course_id, course:courses(title)')
      .eq('status', 'active'),

    // Monthly submissions (last 6 months) for trend line
    supabase.from('lesson_submissions')
      .select('submitted_at')
      .in('status', ['submitted', 'graded_pass', 'graded_corrections'])
      .gte('submitted_at', subMonths(new Date(), 6).toISOString()),

    // Monthly certificates (last 6 months)
    supabase.from('certificates')
      .select('created_at')
      .gte('created_at', subMonths(new Date(), 6).toISOString()),
  ])

  // ---- Active students: unique students who submitted at least 1 lesson ----
  const thisWeekActiveStudents = new Set((thisWeekAllSubs || []).map((s: any) => s.student_id)).size
  const lastWeekActiveStudents = new Set((lastWeekAllSubs || []).map((s: any) => s.student_id)).size

  const thisWeekCompCount = thisWeekCompletions?.length || 0
  const lastWeekCompCount = lastWeekCompletions?.length || 0

  // ---- Weekly activity bar chart data ----
  const weekDays: { label: string; submitted: number; passed: number }[] = []
  for (let i = 0; i < 7; i++) {
    const dayStart = addDays(thisWeekStart, i)
    const dayEnd = addDays(dayStart, 1)
    const dayLabel = format(dayStart, 'EEE')

    const submitted = (thisWeekAllSubs || []).filter((s: any) => {
      const d = new Date(s.submitted_at)
      return d >= dayStart && d < dayEnd
    }).length

    const passed = (thisWeekPassed || []).filter((s: any) => {
      const d = new Date(s.graded_at)
      return d >= dayStart && d < dayEnd
    }).length

    weekDays.push({ label: dayLabel, submitted, passed })
  }

  // ---- Course enrollment bar chart ----
  const courseCounts: Record<string, { name: string; enrolled: number }> = {}
  for (const e of enrollmentsByCourse || []) {
    const title = (e as any).course?.title || 'Unknown'
    if (!courseCounts[e.course_id]) {
      courseCounts[e.course_id] = { name: title, enrolled: 0 }
    }
    courseCounts[e.course_id].enrolled++
  }
  const courseChartData = Object.values(courseCounts).sort((a, b) => b.enrolled - a.enrolled)

  // ---- Org breakdown pie charts (public vs staff) ----
  const publicOrgCounts = { Day: 0, Foundation: 0, Unassigned: 0 }
  const staffOrgCounts = { Day: 0, Foundation: 0, Unassigned: 0 }
  for (const p of allProfiles || []) {
    const target = (p as any).is_staff ? staffOrgCounts : publicOrgCounts
    if ((p as any).organization === 'day') target.Day++
    else if ((p as any).organization === 'foundation') target.Foundation++
    else target.Unassigned++
  }
  const publicOrgData = Object.entries(publicOrgCounts).map(([name, value]) => ({ name, value }))
  const staffOrgData = Object.entries(staffOrgCounts).map(([name, value]) => ({ name, value }))

  // ---- Monthly trend line chart (last 6 months) ----
  const monthlyData: { label: string; submissions: number; completions: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(new Date(), i)
    const mStart = startOfMonth(month)
    const mEnd = endOfMonth(month)
    const label = format(month, 'MMM')

    const submissions = (monthlySubs || []).filter((s: any) => {
      const d = new Date(s.submitted_at)
      return d >= mStart && d <= mEnd
    }).length

    const completions = (monthlyCerts || []).filter((c: any) => {
      const d = new Date(c.created_at)
      return d >= mStart && d <= mEnd
    }).length

    monthlyData.push({ label, submissions, completions })
  }

  const needsOnboarding = !profile?.onboarding_completed_at
  const studyRoutes = (allRoutes || []).map(r => ({ id: r.id, name: r.name }))

  function trend(current: number, previous: number) {
    if (current > previous) return 'up'
    if (current < previous) return 'down'
    return 'flat'
  }

  const activeTrend = trend(thisWeekActiveStudents, lastWeekActiveStudents)
  const compTrend = trend(thisWeekCompCount, lastWeekCompCount)

  return (
    <div className="space-y-6">
      <OnboardingFlow
        role={profile.role as any}
        fullName={profile.full_name || ''}
        needsOnboarding={needsOnboarding}
        studyRoutes={studyRoutes}
        currentRouteId={profile.study_route_id || null}
        certMailPreference={profile.cert_mail_preference || 'digital'}
      />

      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
      </div>

      {/* ---- Row 1: Key stats ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/admin/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold mt-1">{totalEnrolledCount || 0}</p>
              <p className="text-xs text-muted-foreground">Active Enrollments</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/supervisor/queue">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold mt-1">{pendingGradeCount || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Grades</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/supervisor/enrollments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold mt-1">{pendingInvoiceCount || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Invoices</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-2xl font-bold mt-1">{(allProfiles || []).length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Row 2: This Week vs Last Week ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Active Students This Week</p>
              </div>
              {activeTrend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {activeTrend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {activeTrend === 'flat' && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
            <p className="text-3xl font-bold mt-2">{thisWeekActiveStudents}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Last week: {lastWeekActiveStudents}
              <span className={thisWeekActiveStudents >= lastWeekActiveStudents ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                ({thisWeekActiveStudents >= lastWeekActiveStudents ? '+' : ''}{thisWeekActiveStudents - lastWeekActiveStudents})
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Students who submitted at least one lesson</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Course Completions This Week</p>
              </div>
              {compTrend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {compTrend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {compTrend === 'flat' && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
            <p className="text-3xl font-bold mt-2">{thisWeekCompCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Last week: {lastWeekCompCount}
              <span className={thisWeekCompCount >= lastWeekCompCount ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                ({thisWeekCompCount >= lastWeekCompCount ? '+' : ''}{thisWeekCompCount - lastWeekCompCount})
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Students who finished all lessons at 100%</p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Row 3: Charts ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyActivityChart data={weekDays} />
        <MonthlyTrendChart data={monthlyData} />
      </div>

      {/* ---- Row 4: Breakdown charts ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <OrgBreakdownChart data={publicOrgData} title="Public Students by Org" />
        <OrgBreakdownChart data={staffOrgData} title="Staff Students by Org" />
        <CourseEnrollmentChart data={courseChartData} />
      </div>
    </div>
  )
}
