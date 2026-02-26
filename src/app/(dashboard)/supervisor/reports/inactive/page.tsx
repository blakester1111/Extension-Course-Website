export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InactiveStudentsTable } from '@/components/reports/inactive-students-table'
import { ReportFilters } from '@/components/reports/report-filters'
import { filterByOrg, filterByStaff, resolveOrgDefault } from '@/lib/org-filter'
import { Suspense } from 'react'

export const metadata = {
  title: 'Inactive Students — FCDC Extension Courses',
}

export default async function InactiveStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const orgFilter = resolveOrgDefault(params.org, profile?.organization)

  // Get ALL enrolled users via enrollments table (any role)
  const { data: enrollmentRows } = await supabase
    .from('enrollments')
    .select('student_id, course:courses(title)')
    .eq('status', 'active')

  let enrolledIds = [...new Set((enrollmentRows || []).map(e => e.student_id))]

  if (!isAdmin) {
    // Supervisor: filter to assigned students + unassigned
    const { data: assignedStudents } = await supabase
      .from('profiles')
      .select('id')
      .eq('supervisor_id', user.id)
    const { data: unassignedStudents } = await supabase
      .from('profiles')
      .select('id')
      .is('supervisor_id', null)
    const visibleIds = new Set([
      ...(assignedStudents || []).map(s => s.id),
      ...(unassignedStudents || []).map(s => s.id),
    ])
    enrolledIds = enrolledIds.filter(id => visibleIds.has(id))
  }

  // Apply audience and organization filters
  enrolledIds = await filterByStaff(supabase, enrolledIds, params.audience)
  enrolledIds = await filterByOrg(supabase, enrolledIds, orgFilter)

  if (enrolledIds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No enrolled students found.
      </div>
    )
  }

  // Get profiles for enrolled users
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', enrolledIds)
    .order('full_name', { ascending: true })

  const studentIds = (students || []).map(s => s.id)

  // Build course names per student from enrollments
  const courseNamesMap = new Map<string, string[]>()
  for (const e of enrollmentRows || []) {
    if (!studentIds.includes(e.student_id)) continue
    const list = courseNamesMap.get(e.student_id) || []
    const title = (e.course as any)?.title
    if (title) list.push(title)
    courseNamesMap.set(e.student_id, list)
  }

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

  const now = new Date()
  const studentData = (students || []).map(s => {
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
    <div className="space-y-6">
      <Suspense>
        <ReportFilters defaultOrg={orgFilter} />
      </Suspense>
      <InactiveStudentsTable students={studentData} />
    </div>
  )
}
