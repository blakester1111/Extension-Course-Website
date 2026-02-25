export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Students — Supervisor',
}

export default async function SupervisorStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  // Get students based on role
  let assignedStudents: any[] = []
  let unassignedStudents: any[] = []

  if (isAdmin) {
    // Admin sees ALL students + enrolled non-students (e.g. admin enrolled in a course)
    const { data: studentsByRole } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name', { ascending: true })

    // Also include non-student users who have enrollments
    const { data: allEnrollmentIds } = await supabase
      .from('enrollments')
      .select('student_id')

    const enrolledIds = new Set((allEnrollmentIds || []).map(e => e.student_id))
    const studentIds = new Set((studentsByRole || []).map(s => s.id))
    const nonStudentEnrolledIds = [...enrolledIds].filter(id => !studentIds.has(id))

    let enrolledNonStudents: any[] = []
    if (nonStudentEnrolledIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', nonStudentEnrolledIds)
      enrolledNonStudents = data || []
    }

    const allStudents = [...(studentsByRole || []), ...enrolledNonStudents]
    assignedStudents = allStudents.filter(s => s.supervisor_id !== null)
    unassignedStudents = allStudents.filter(s => s.supervisor_id === null)
  } else {
    // Supervisor sees assigned + unassigned
    const { data: assigned } = await supabase
      .from('profiles')
      .select('*')
      .eq('supervisor_id', user.id)
      .eq('role', 'student')
      .order('full_name', { ascending: true })

    const { data: unassigned } = await supabase
      .from('profiles')
      .select('*')
      .is('supervisor_id', null)
      .eq('role', 'student')
      .order('full_name', { ascending: true })

    assignedStudents = assigned || []
    unassignedStudents = unassigned || []
  }

  // Get enrollment + progress data for all visible students
  const allStudents = [...assignedStudents, ...unassignedStudents]

  // Fetch supervisor names for admin view
  let supervisorNames = new Map<string, string>()
  if (isAdmin) {
    const supervisorIds = [...new Set(assignedStudents.map(s => s.supervisor_id).filter(Boolean))]
    if (supervisorIds.length > 0) {
      const { data: supervisors } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', supervisorIds)
      for (const sup of supervisors || []) {
        supervisorNames.set(sup.id, sup.full_name)
      }
    }
  }

  const studentProgress = await Promise.all(
    allStudents.map(async (student) => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course:courses(title, lesson_count)')
        .eq('student_id', student.id)

      const { count: completedLessons } = await supabase
        .from('lesson_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .eq('status', 'graded_pass')

      const { count: pendingSubmissions } = await supabase
        .from('lesson_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .eq('status', 'submitted')

      return {
        ...student,
        enrolledCourses: enrollments?.length || 0,
        completedLessons: completedLessons || 0,
        pendingSubmissions: pendingSubmissions || 0,
        isAssigned: isAdmin ? student.supervisor_id !== null : student.supervisor_id === user!.id,
        supervisorName: student.supervisor_id ? supervisorNames.get(student.supervisor_id) || null : null,
      }
    })
  )

  const assigned = studentProgress.filter(s => s.isAssigned)
  const unassigned = studentProgress.filter(s => !s.isAssigned)

  function StudentTable({ students, emptyMessage, showSupervisor }: { students: typeof studentProgress; emptyMessage: string; showSupervisor?: boolean }) {
    if (students.length === 0) {
      return <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            {showSupervisor && <TableHead>Supervisor</TableHead>}
            <TableHead>Staff</TableHead>
            <TableHead>Courses</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Pending</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">
                {student.full_name}
                {student.role !== 'student' && (
                  <Badge variant="outline" className="ml-2 text-xs capitalize">
                    {student.role === 'super_admin' ? 'Super Admin' : student.role}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{student.email}</TableCell>
              {showSupervisor && (
                <TableCell className="text-muted-foreground">
                  {student.supervisorName || '—'}
                </TableCell>
              )}
              <TableCell>
                {student.is_staff && <Badge variant="outline" className="text-xs">Staff</Badge>}
              </TableCell>
              <TableCell>{student.enrolledCourses}</TableCell>
              <TableCell>
                <Badge variant="secondary">{student.completedLessons} lessons</Badge>
              </TableCell>
              <TableCell>
                {student.pendingSubmissions > 0 ? (
                  <Badge>{student.pendingSubmissions} awaiting</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isAdmin ? 'All Students' : 'My Students'}</h1>
        <p className="text-muted-foreground">{assigned.length} assigned, {unassigned.length} unassigned</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? 'Assigned Students' : 'My Students'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <StudentTable students={assigned} emptyMessage="No students assigned yet" showSupervisor={isAdmin} />
        </CardContent>
      </Card>

      {unassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Students</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <StudentTable students={unassigned} emptyMessage="No unassigned students" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
