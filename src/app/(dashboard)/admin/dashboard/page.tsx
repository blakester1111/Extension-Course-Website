export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, GraduationCap, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

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

  // Fetch study routes for onboarding wizard
  const { data: allRoutes } = await supabase
    .from('study_routes')
    .select('id, name')
    .order('name')

  const [
    { count: courseCount },
    { count: studentCount },
    { count: supervisorCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supervisor'),
    supabase.from('lesson_submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
  ])

  const needsOnboarding = !profile?.onboarding_completed_at
  const studyRoutes = (allRoutes || []).map(r => ({ id: r.id, name: r.name }))

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/courses">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courseCount || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentCount || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/supervisors">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supervisorCount || 0}</div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grades</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
