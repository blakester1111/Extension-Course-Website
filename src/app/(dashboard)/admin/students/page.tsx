export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StudentSupervisorAssign } from '@/components/admin/student-supervisor-assign'
import { StudentEnrollButton } from '@/components/admin/student-enroll-button'
import { StaffToggleButton } from '@/components/admin/staff-toggle-button'
import { UserRoleSelect } from '@/components/admin/user-role-select'
import { Badge } from '@/components/ui/badge'
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

  // Get ALL users (not just students) so admin can see and manage everyone
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all users who can supervise (supervisors + admins + super_admins)
  const { data: supervisors } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['supervisor', 'admin', 'super_admin'])
    .order('full_name', { ascending: true })

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .order('title', { ascending: true })

  // Get all enrollments to show enrolled courses per user
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course_id, status, invoice_number, course:courses(title)')

  const enrollmentsByUser = new Map<string, { course_id: string; title: string; status: string; invoice_number: string | null }[]>()
  for (const e of enrollments || []) {
    const list = enrollmentsByUser.get(e.student_id) || []
    list.push({
      course_id: e.course_id,
      title: (e as any).course?.title || '',
      status: e.status,
      invoice_number: e.invoice_number,
    })
    enrollmentsByUser.set(e.student_id, list)
  }

  const users = allUsers || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage all users — change roles, assign supervisors, and enroll in courses</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No users yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Enrolled Courses</TableHead>
                  <TableHead>Enroll</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: any) => {
                  const userEnrollments = enrollmentsByUser.get(u.id) || []
                  const enrolledCourseIds = new Set(userEnrollments.map(e => e.course_id))
                  const availableCourses = (courses || []).filter(c => !enrolledCourseIds.has(c.id))

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <UserRoleSelect
                          profileId={u.id}
                          currentRole={u.role as UserRole}
                          currentUserId={user.id}
                          currentUserRole={(currentProfile?.role as UserRole) || 'admin'}
                        />
                      </TableCell>
                      <TableCell>
                        <StudentSupervisorAssign
                          studentId={u.id}
                          currentSupervisorId={u.supervisor_id}
                          supervisors={(supervisors || []).filter(s => s.id !== u.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <StaffToggleButton profileId={u.id} isStaff={u.is_staff} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userEnrollments.length === 0 ? (
                            <span className="text-muted-foreground text-sm">None</span>
                          ) : (
                            userEnrollments.map(e => (
                              <Badge
                                key={e.course_id}
                                variant={e.status === 'pending_invoice_verification' ? 'outline' : 'secondary'}
                                className={`text-xs ${e.status === 'pending_invoice_verification' ? 'border-yellow-500 text-yellow-700' : ''}`}
                              >
                                {e.title}
                                {e.status === 'pending_invoice_verification' && ' (Pending)'}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StudentEnrollButton
                          studentId={u.id}
                          isStaff={u.is_staff}
                          availableCourses={availableCourses}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
