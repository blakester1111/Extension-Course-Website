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

  // Fetch contact info: prefer profiles columns (after migration), fall back to most recent order
  const contactsByUser: Record<string, { phone: string | null; address: string | null; city: string | null; state: string | null; zip: string | null; country: string | null }> = {}
  for (const s of allStudents) {
    const p = s as any
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

  // Fall back to orders for students without profile contact fields
  const studentsWithoutContact = allStudents.filter(s => !contactsByUser[s.id]).map(s => s.id)
  if (studentsWithoutContact.length > 0) {
    const { data: orders } = await supabase
      .from('orders')
      .select('student_id, customer_phone, customer_address, customer_city, customer_state, customer_zip, customer_country, created_at')
      .in('student_id', studentsWithoutContact)
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

  // Get courses ordered by Full Chronological Route for materials dialog
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, category')
    .order('title', { ascending: true })

  const { data: studyRoutes } = await supabase
    .from('study_routes')
    .select('id, name')
    .order('name')

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isAdmin ? 'All Students' : 'My Students'}</h1>
        <p className="text-muted-foreground">{assignedCount} assigned, {unassignedCount} unassigned</p>
      </div>

      <SupervisorStudentsList students={studentProgress} isAdmin={isAdmin} coursesOrdered={coursesOrdered} contactsByUser={contactsByUser} />
    </div>
  )
}
