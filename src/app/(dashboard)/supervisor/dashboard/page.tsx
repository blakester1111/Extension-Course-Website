export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardCheck, Users, Clock } from 'lucide-react'
import { differenceInHours } from 'date-fns'
import Link from 'next/link'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export const metadata = {
  title: 'Supervisor Dashboard — FCDC Extension Courses',
}

export default async function SupervisorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  // Count pending submissions
  let pendingCount: number | null = 0
  if (isAdmin) {
    // Admin sees ALL pending submissions
    const { count } = await supabase
      .from('lesson_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
    pendingCount = count
  } else {
    // Supervisor sees only assigned students' submissions (RLS handles this)
    const { count } = await supabase
      .from('lesson_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
    pendingCount = count
  }

  // Count overdue submissions (submitted > 24 hours ago)
  let overdueCount = 0
  {
    const { data: pendingSubs } = await supabase
      .from('lesson_submissions')
      .select('submitted_at')
      .eq('status', 'submitted')
    if (pendingSubs) {
      overdueCount = pendingSubs.filter(
        s => s.submitted_at && differenceInHours(new Date(), new Date(s.submitted_at)) >= 24
      ).length
    }
  }

  // Fetch study routes for onboarding wizard
  const { data: allRoutes } = await supabase
    .from('study_routes')
    .select('id, name')
    .order('name')

  // Count students
  let studentCount: number | null = 0
  if (isAdmin) {
    // Admin sees ALL students
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
    studentCount = count
  } else {
    // Supervisor sees only assigned students
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('supervisor_id', user.id)
      .eq('role', 'student')
    studentCount = count
  }

  const needsOnboarding = !profile?.onboarding_completed_at
  const studyRoutes = (allRoutes || []).map(r => ({ id: r.id, name: r.name }))

  return (
    <div className="space-y-6">
      <OnboardingFlow
        role={profile?.role || 'supervisor'}
        fullName={profile?.full_name || ''}
        needsOnboarding={needsOnboarding}
        studyRoutes={studyRoutes}
        currentRouteId={profile?.study_route_id || null}
        certMailPreference={profile?.cert_mail_preference || 'digital'}
      />

      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Supervisor'}</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Overview of all students and submissions' : 'Your supervision overview'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/supervisor/queue">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount || 0}</div>
              <p className="text-xs text-muted-foreground">Lessons awaiting grading</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/supervisor/queue">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer ${overdueCount > 0 ? 'border-red-300 dark:border-red-800' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Clock className={`h-4 w-4 ${overdueCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{overdueCount}</div>
              <p className="text-xs text-muted-foreground">Waiting over 24 hours</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/supervisor/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{isAdmin ? 'All Students' : 'Assigned Students'}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Total students enrolled' : 'Students under your supervision'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
