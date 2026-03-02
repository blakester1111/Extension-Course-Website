export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUsersList } from '@/components/admin/admin-users-list'
import { MergeProfilesDialog } from '@/components/admin/merge-profiles-dialog'
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
    .select('id, title, category')
    .order('title', { ascending: true })

  // Get study routes
  const { data: studyRoutes } = await supabase
    .from('study_routes')
    .select('id, name')
    .order('name')

  // Get Full Chronological Route ordering for materials guide
  const chronRoute = (studyRoutes || []).find(r => r.name.toLowerCase().includes('chronological') && r.name.toLowerCase().includes('full'))
  let coursesOrdered: { id: string; title: string; category: string }[] = (courses || []) as any[]
  if (chronRoute) {
    const { data: routeCourses } = await supabase
      .from('study_route_courses')
      .select('course_id, position')
      .eq('route_id', chronRoute.id)
      .order('position')
    if (routeCourses && routeCourses.length > 0) {
      const posMap = new Map(routeCourses.map(rc => [rc.course_id, rc.position]))
      const sorted = [...(courses || [])].sort((a, b) => {
        const posA = posMap.get(a.id) ?? 9999
        const posB = posMap.get(b.id) ?? 9999
        return posA - posB
      }) as any[]

      // Insert books not on the chronological route before their lecture counterparts
      const inserts: [string, string][] = [
        ['Advanced Procedure and Axioms', 'Advanced Procedure & Axioms and Thought Emotion and Effort'],
        ['Scientology 8-8008', 'The Philadelphia Doctorate Course'],
      ]
      const result: typeof sorted = []
      const insertedIds = new Set<string>()
      for (const c of sorted) {
        for (const [bookTitle, lectureTitle] of inserts) {
          if (c.title === lectureTitle) {
            const book = sorted.find((x: any) => x.title === bookTitle)
            if (book && !insertedIds.has(book.id)) {
              result.push(book)
              insertedIds.add(book.id)
            }
          }
        }
        if (!insertedIds.has(c.id)) {
          result.push(c)
        }
      }
      coursesOrdered = result
    }
  }

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

  // Fetch contact info: prefer profiles columns (after migration), fall back to most recent order
  const contactsByUser: Record<string, { phone: string | null; address: string | null; city: string | null; state: string | null; zip: string | null; country: string | null }> = {}
  for (const u of allUsers || []) {
    const p = u as any
    if (p.phone || p.address || p.city || p.state || p.zip || p.country) {
      contactsByUser[p.id] = {
        phone: p.phone || null,
        address: p.address || null,
        city: p.city || null,
        state: p.state || null,
        zip: p.zip || null,
        country: p.country || null,
      }
    }
  }

  // Fall back to orders for users without profile contact fields
  const usersWithoutContact = (allUsers || []).filter(u => !contactsByUser[u.id]).map(u => u.id)
  if (usersWithoutContact.length > 0) {
    const { data: orders } = await supabase
      .from('orders')
      .select('student_id, customer_phone, customer_address, customer_city, customer_state, customer_zip, customer_country, created_at')
      .in('student_id', usersWithoutContact)
      .order('created_at', { ascending: false })

    for (const o of orders || []) {
      if (o.student_id && !contactsByUser[o.student_id]) {
        contactsByUser[o.student_id] = {
          phone: o.customer_phone,
          address: o.customer_address,
          city: o.customer_city,
          state: o.customer_state,
          zip: o.customer_zip,
          country: o.customer_country,
        }
      }
    }
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage all users — change roles, assign supervisors, organizations, and enroll in courses</p>
        </div>
        <MergeProfilesDialog
          users={(allUsers || []).map((u: any) => ({
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            role: u.role,
          }))}
        />
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
        coursesOrdered={coursesOrdered}
        currentUserId={user.id}
        currentUserRole={(currentProfile?.role as UserRole) || 'admin'}
        honorRollRanks={honorRollRanks}
        studyRoutes={studyRoutes || []}
        contactsByUser={contactsByUser}
      />
    </div>
  )
}
