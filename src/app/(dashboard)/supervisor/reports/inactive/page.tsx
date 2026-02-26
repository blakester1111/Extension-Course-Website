export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InactiveStudentsTable } from '@/components/reports/inactive-students-table'

export const metadata = {
  title: 'Inactive Students — FCDC Extension Courses',
}

export default async function InactiveStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  // Get enrolled students
  let studentsQuery = supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  if (!isAdmin) {
    studentsQuery = studentsQuery.eq('supervisor_id', user.id)
  }

  const { data: students } = await studentsQuery
  const studentIds = (students || []).map(s => s.id)

  if (studentIds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No students found.
      </div>
    )
  }

  // Get active enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, course:courses(title)')
    .eq('status', 'active')
    .in('student_id', studentIds)

  const enrolledStudentIds = new Set((enrollments || []).map(e => e.student_id))

  // Get most recent submission per student
  const { data: allSubmissions } = await supabase
    .from('lesson_submissions')
    .select('student_id, submitted_at')
    .not('submitted_at', 'is', null)
    .in('student_id', studentIds)
    .order('submitted_at', { ascending: false })

  const lastSubmissionMap = new Map<string, string>()
  for (const sub of allSubmissions || []) {
    if (!lastSubmissionMap.has(sub.student_id) && sub.submitted_at) {
      lastSubmissionMap.set(sub.student_id, sub.submitted_at)
    }
  }

  // Build course names per student
  const courseNamesMap = new Map<string, string[]>()
  for (const e of enrollments || []) {
    const list = courseNamesMap.get(e.student_id) || []
    const title = (e.course as any)?.title
    if (title) list.push(title)
    courseNamesMap.set(e.student_id, list)
  }

  const now = new Date()
  const studentData = (students || [])
    .filter(s => enrolledStudentIds.has(s.id))
    .map(s => {
      const lastSub = lastSubmissionMap.get(s.id)
      const daysSince = lastSub
        ? Math.floor((now.getTime() - new Date(lastSub).getTime()) / (1000 * 60 * 60 * 24))
        : null

      return {
        id: s.id,
        fullName: s.full_name,
        email: s.email,
        lastSubmission: lastSub || null,
        daysSinceLastSubmission: daysSince,
        courseNames: courseNamesMap.get(s.id) || [],
      }
    })

  return (
    <InactiveStudentsTable students={studentData} />
  )
}
