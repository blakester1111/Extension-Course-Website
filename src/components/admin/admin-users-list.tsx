'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { StudentSupervisorAssign } from '@/components/admin/student-supervisor-assign'
import { StaffToggleButton } from '@/components/admin/staff-toggle-button'
import { UserRoleSelect } from '@/components/admin/user-role-select'
import { OrganizationAssign } from '@/components/admin/organization-assign'
import { CourseManageDialog } from '@/components/admin/course-manage-dialog'
import { UsersFilterBar, type SortOption } from '@/components/admin/users-filter-bar'
import { CertPermissionToggles } from '@/components/admin/cert-permission-toggles'
import { Trophy } from 'lucide-react'
import type { UserRole } from '@/types/database'

interface UserData {
  id: string
  full_name: string
  email: string
  role: string
  organization: string | null
  supervisor_id: string | null
  is_staff: boolean
  can_attest_certs: boolean
  can_sign_certs: boolean
  study_route_id: string | null
  created_at: string
}

interface Enrollment {
  course_id: string
  title: string
  status: string
  invoice_number: string | null
}

interface AdminUsersListProps {
  users: UserData[]
  enrollmentsByUser: Record<string, Enrollment[]>
  supervisors: { id: string; full_name: string; role: string }[]
  courses: { id: string; title: string }[]
  currentUserId: string
  currentUserRole: UserRole
  honorRollRanks: Record<string, number>
  studyRoutes: { id: string; name: string }[]
}

export function AdminUsersList({
  users,
  enrollmentsByUser,
  supervisors,
  courses,
  currentUserId,
  currentUserRole,
  honorRollRanks,
  studyRoutes,
}: AdminUsersListProps) {
  // Basic user list for transfer feature (id, name, email)
  const allUsersBasic = useMemo(() =>
    users.map(u => ({ id: u.id, full_name: u.full_name, email: u.email })),
    [users]
  )
  const [search, setSearch] = useState('')
  const [org, setOrg] = useState('all')
  const [audience, setAudience] = useState('all')
  const [sort, setSort] = useState<SortOption>('name-asc')

  const filtered = useMemo(() => {
    let result = [...users]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    }

    if (org === 'day') {
      result = result.filter(u => u.organization === 'day')
    } else if (org === 'foundation') {
      result = result.filter(u => u.organization === 'foundation')
    } else if (org === 'unassigned') {
      result = result.filter(u => !u.organization)
    }

    if (audience === 'staff') {
      result = result.filter(u => u.is_staff)
    } else if (audience === 'public') {
      result = result.filter(u => !u.is_staff)
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'name-asc':
          return (a.full_name || '').localeCompare(b.full_name || '')
        case 'name-desc':
          return (b.full_name || '').localeCompare(a.full_name || '')
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })

    return result
  }, [users, search, org, audience, sort])

  return (
    <>
      <UsersFilterBar
        search={search}
        onSearchChange={setSearch}
        org={org}
        onOrgChange={setOrg}
        audience={audience}
        onAudienceChange={setAudience}
        sort={sort}
        onSortChange={setSort}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-center text-muted-foreground py-12">No users match the current filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => {
            const userEnrollments = enrollmentsByUser[u.id] || []
            const enrolledCourseIds = new Set(userEnrollments.map(e => e.course_id))
            const availableCourses = courses.filter(c => !enrolledCourseIds.has(c.id))
            const honorRank = honorRollRanks[u.id]

            return (
              <UserCard
                key={u.id}
                user={u}
                userEnrollments={userEnrollments}
                availableCourses={availableCourses}
                allCourses={courses}
                supervisors={supervisors}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                honorRank={honorRank}
                studyRoutes={studyRoutes}
                allUsersBasic={allUsersBasic}
              />
            )
          })}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Per-user card with grid-aligned rows                               */
/* ------------------------------------------------------------------ */

function UserCard({
  user: u,
  userEnrollments,
  availableCourses,
  allCourses,
  supervisors,
  currentUserId,
  currentUserRole,
  honorRank,
  studyRoutes,
  allUsersBasic,
}: {
  user: UserData
  userEnrollments: Enrollment[]
  availableCourses: { id: string; title: string }[]
  allCourses: { id: string; title: string }[]
  supervisors: { id: string; full_name: string; role: string }[]
  currentUserId: string
  currentUserRole: UserRole
  honorRank: number | undefined
  studyRoutes: { id: string; name: string }[]
  allUsersBasic: { id: string; full_name: string; email: string }[]
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Name / Email / Rank / Joined */}
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <div className="w-48 shrink-0">
              <p className="font-medium text-sm truncate">{u.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
            </div>
            {honorRank && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0">
                <Trophy className="h-3 w-3" />
                #{honorRank}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground shrink-0">
              Joined {new Date(u.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Role */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">Role:</span>
            <UserRoleSelect
              profileId={u.id}
              currentRole={u.role as UserRole}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          </div>

          {/* Org */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">Org:</span>
            <OrganizationAssign
              profileId={u.id}
              currentOrg={u.organization || null}
            />
          </div>

          {/* Supervisor */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">Supervisor:</span>
            <StudentSupervisorAssign
              studentId={u.id}
              currentSupervisorId={u.supervisor_id}
              supervisors={supervisors.filter(s => s.id !== u.id)}
            />
          </div>

          {/* Staff + Cert perms */}
          <div className="flex items-center gap-3 shrink-0">
            <StaffToggleButton profileId={u.id} isStaff={u.is_staff} />
            <CertPermissionToggles
              profileId={u.id}
              canAttestCerts={u.can_attest_certs}
              canSignCerts={u.can_sign_certs}
            />
          </div>

          {/* Courses button */}
          <div className="shrink-0">
            <CourseManageDialog
              studentId={u.id}
              studentName={u.full_name}
              isStaff={u.is_staff}
              studyRouteId={u.study_route_id}
              enrollments={userEnrollments}
              availableCourses={availableCourses}
              allCourses={allCourses}
              allUsers={allUsersBasic}
              studyRoutes={studyRoutes}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
