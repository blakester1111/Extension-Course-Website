export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SupervisorStudentsList } from '@/components/admin/supervisor-students-list'

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
    // Admin sees ALL students + enrolled non-students
    const { data: studentsByRole } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name', { ascending: true })

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

  const allStudents = [...assignedStudents, ...unassignedStudents]

  // Fetch supervisor names for admin view
  const supervisorNames = new Map<string, string>()
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
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        role: student.role,
        organization: student.organization || null,
        is_staff: student.is_staff ?? false,
        created_at: student.created_at,
        enrolledCourses: enrollments?.length || 0,
        completedLessons: completedLessons || 0,
        pendingSubmissions: pendingSubmissions || 0,
        isAssigned: isAdmin ? student.supervisor_id !== null : student.supervisor_id === user!.id,
        supervisorName: student.supervisor_id ? supervisorNames.get(student.supervisor_id) || null : null,
      }
    })
  )

  const assignedCount = studentProgress.filter(s => s.isAssigned).length
  const unassignedCount = studentProgress.filter(s => !s.isAssigned).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isAdmin ? 'All Students' : 'My Students'}</h1>
        <p className="text-muted-foreground">{assignedCount} assigned, {unassignedCount} unassigned</p>
      </div>

      <SupervisorStudentsList students={studentProgress} isAdmin={isAdmin} />
    </div>
  )
}
