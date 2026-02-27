export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUsersList } from '@/components/admin/admin-users-list'
import type { UserRole } from '@/types/database'

export const metadata = {
  title: 'Manage Students — Admin',
}

export default async function AdminStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Exclude deadfiled users — they have their own admin page
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_deadfiled', false)
    .order('created_at', { ascending: false })

  const { data: supervisors } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['supervisor', 'admin', 'super_admin'])
    .order('full_name', { ascending: true })

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .order('title', { ascending: true })

  // Get study routes
  const { data: studyRoutes } = await supabase
    .from('study_routes')
    .select('id, name')
    .order('name')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id, status, invoice_number, course:courses(title)')

  const enrollmentsByUser: Record<string, { course_id: string; title: string; status: string; invoice_number: string | null }[]> = {}
  for (const e of enrollments || []) {
    const list = enrollmentsByUser[e.student_id] || []
    list.push({
      course_id: e.course_id,
      title: (e as any).course?.title || '',
      status: e.status,
      invoice_number: e.invoice_number,
    })
    enrollmentsByUser[e.student_id] = list
  }

  // Fetch honor roll streaks to compute leaderboard rank
  const { data: streaks } = await supabase
    .from('honor_roll_streaks')
    .select('student_id, current_streak_weeks, total_lessons_submitted')
    .order('current_streak_weeks', { ascending: false })
    .order('total_lessons_submitted', { ascending: false })

  const honorRollRanks: Record<string, number> = {}
  let rank = 1
  for (const s of streaks || []) {
    honorRollRanks[s.student_id] = rank
    rank++
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage all users — change roles, assign supervisors, organizations, and enroll in courses</p>
      </div>

      <AdminUsersList
        users={(allUsers || []).map((u: any) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          organization: u.organization || null,
          supervisor_id: u.supervisor_id || null,
          is_staff: u.is_staff ?? false,
          can_attest_certs: u.can_attest_certs ?? false,
          can_sign_certs: u.can_sign_certs ?? false,
          study_route_id: u.study_route_id || null,
          created_at: u.created_at,
        }))}
        enrollmentsByUser={enrollmentsByUser}
        supervisors={supervisors || []}
        courses={courses || []}
        currentUserId={user.id}
        currentUserRole={(currentProfile?.role as UserRole) || 'admin'}
        honorRollRanks={honorRollRanks}
        studyRoutes={studyRoutes || []}
      />
    </div>
  )
}
