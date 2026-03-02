export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActivityTable } from '@/components/reports/activity-table'
import { ReportFilters } from '@/components/reports/report-filters'
import { filterByOrg, filterByStaff, resolveOrgDefault } from '@/lib/org-filter'
import { Suspense } from 'react'

export const metadata = {
  title: 'Student Activity — FCDC Extension Courses',
}

export default async function ActivityPage({
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

  // Get ALL enrolled users via enrollments table
  const { data: enrollmentRows } = await supabase
    .from('enrollments')
    .select('student_id, course_id, status, course:courses(title)')
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
      <div className="space-y-6">
        <Suspense>
          <ReportFilters defaultOrg={orgFilter} />
        </Suspense>
        <div className="text-center py-12 text-muted-foreground">
          No enrolled students found.
        </div>
      </div>
    )
  }

  // Get profiles for enrolled users
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, organization, is_staff')
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

  // Count total enrolled courses per student
  const enrollmentCountMap = new Map<string, number>()
  for (const e of enrollmentRows || []) {
    if (!studentIds.includes(e.student_id)) continue
    enrollmentCountMap.set(e.student_id, (enrollmentCountMap.get(e.student_id) || 0) + 1)
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

  // Count total submissions per student
  const submissionCountMap = new Map<string, number>()
  for (const sub of allSubmissions || []) {
    submissionCountMap.set(sub.student_id, (submissionCountMap.get(sub.student_id) || 0) + 1)
  }

  // Get graded_pass count per student
  const { data: passedSubmissions } = await supabase
    .from('lesson_submissions')
    .select('student_id')
    .in('student_id', studentIds)
    .eq('status', 'graded_pass')

  const passedCountMap = new Map<string, number>()
  for (const sub of passedSubmissions || []) {
    passedCountMap.set(sub.student_id, (passedCountMap.get(sub.student_id) || 0) + 1)
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
      organization: s.organization as string | null,
      isStaff: s.is_staff as boolean,
      lastSubmission: lastSub || null,
      daysSinceLastSubmission: daysSince,
      courseNames: courseNamesMap.get(s.id) || [],
      enrollmentCount: enrollmentCountMap.get(s.id) || 0,
      totalSubmissions: submissionCountMap.get(s.id) || 0,
      passedLessons: passedCountMap.get(s.id) || 0,
    }
  })

  return (
    <div className="space-y-6">
      <Suspense>
        <ReportFilters defaultOrg={orgFilter} />
      </Suspense>
      <ActivityTable students={studentData} />
    </div>
  )
}
