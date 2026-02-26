'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StudentSupervisorAssign } from '@/components/admin/student-supervisor-assign'
import { StaffToggleButton } from '@/components/admin/staff-toggle-button'
import { UserRoleSelect } from '@/components/admin/user-role-select'
import { OrganizationAssign } from '@/components/admin/organization-assign'
import { BackenterDialog } from '@/components/admin/backenter-dialog'
import { UsersFilterBar, type SortOption } from '@/components/admin/users-filter-bar'
import { CertPermissionToggles } from '@/components/admin/cert-permission-toggles'
import { enrollStudent } from '@/app/(dashboard)/admin/courses/actions'
import { toast } from 'sonner'
import { Plus, Trophy } from 'lucide-react'
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
}

export function AdminUsersList({
  users,
  enrollmentsByUser,
  supervisors,
  courses,
  currentUserId,
  currentUserRole,
  honorRollRanks,
}: AdminUsersListProps) {
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
}: {
  user: UserData
  userEnrollments: Enrollment[]
  availableCourses: { id: string; title: string }[]
  allCourses: { id: string; title: string }[]
  supervisors: { id: string; full_name: string; role: string }[]
  currentUserId: string
  currentUserRole: UserRole
  honorRank: number | undefined
}) {
  const [selectedCourse, setSelectedCourse] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const router = useRouter()

  async function handleEnroll() {
    if (!selectedCourse) return
    if (u.is_staff && !invoiceNumber.trim()) {
      toast.error('Invoice number required for staff enrollment')
      return
    }
    setEnrolling(true)
    const result = await enrollStudent(
      u.id,
      selectedCourse,
      u.is_staff ? invoiceNumber.trim() : undefined
    )
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Enrollment failed')
    } else {
      toast.success(u.is_staff ? 'Staff enrollment pending verification' : 'Student enrolled successfully')
      setSelectedCourse('')
      setInvoiceNumber('')
      router.refresh()
    }
    setEnrolling(false)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-x-2 gap-y-0 items-center">
          {/* ---- Row 1 ---- */}
          {/* Col 1: Name / Email + Honor rank */}
          <div className="min-w-0 flex items-center gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{u.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
            </div>
            {honorRank && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0">
                <Trophy className="h-3 w-3" />
                #{honorRank}
              </span>
            )}
          </div>

          {/* Col 2: Role label */}
          <div className="text-center">
            <span className="text-xs text-muted-foreground">Role:</span>
          </div>
          {/* Col 3: Role dropdown */}
          <div>
            <UserRoleSelect
              profileId={u.id}
              currentRole={u.role as UserRole}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          </div>

          {/* Col 4: Org label */}
          <span className="text-xs text-muted-foreground">Org:</span>
          {/* Col 5: Org dropdown */}
          <OrganizationAssign
            profileId={u.id}
            currentOrg={u.organization || null}
          />

          {/* Col 6: Supervisor label */}
          <span className="text-xs text-muted-foreground">Supervisor:</span>
          {/* Col 7: Supervisor dropdown */}
          <StudentSupervisorAssign
            studentId={u.id}
            currentSupervisorId={u.supervisor_id}
            supervisors={supervisors.filter(s => s.id !== u.id)}
          />

          {/* Col 8: Staff + Cert perms */}
          <div className="flex items-center gap-3">
            <StaffToggleButton profileId={u.id} isStaff={u.is_staff} />
            <CertPermissionToggles
              profileId={u.id}
              canAttestCerts={u.can_attest_certs}
              canSignCerts={u.can_sign_certs}
            />
          </div>

          {/* ---- Separator ---- */}
          <div className="col-span-8 border-t my-2" />

          {/* ---- Row 2 ---- */}
          {/* Col 1-4: Courses (span first 4 cols) */}
          <div className="col-span-4 flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">Courses:</span>

            {userEnrollments.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">None</span>
            ) : userEnrollments.length <= 3 ? (
              <div className="flex flex-wrap gap-1">
                {userEnrollments.map(e => (
                  <Badge
                    key={e.course_id}
                    variant={e.status === 'pending_invoice_verification' ? 'outline' : 'secondary'}
                    className={`text-xs ${e.status === 'pending_invoice_verification' ? 'border-yellow-500 text-yellow-700' : ''}`}
                  >
                    {e.title}
                    {e.status === 'pending_invoice_verification' && ' (Pending)'}
                  </Badge>
                ))}
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto py-0.5 px-2 text-xs">
                    <Badge variant="secondary" className="text-xs">
                      {userEnrollments.length} courses
                    </Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                  <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                    {userEnrollments.map(e => (
                      <Badge
                        key={e.course_id}
                        variant={e.status === 'pending_invoice_verification' ? 'outline' : 'secondary'}
                        className={`text-xs justify-start ${e.status === 'pending_invoice_verification' ? 'border-yellow-500 text-yellow-700' : ''}`}
                      >
                        {e.title}
                        {e.status === 'pending_invoice_verification' && ' (Pending)'}
                      </Badge>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Col 5: Course select (aligned under Org dropdown) */}
          <div>
            {availableCourses.length > 0 ? (
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Course..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-muted-foreground">All enrolled</span>
            )}
          </div>

          {/* Col 6: empty (under Supervisor label) */}
          <div />

          {/* Col 7: Invoice # (aligned under Supervisor dropdown) */}
          <div>
            {u.is_staff && availableCourses.length > 0 ? (
              <Input
                placeholder="Invoice #"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-48 h-8 text-xs"
              />
            ) : null}
          </div>

          {/* Col 8: Enroll + Back-Enter buttons + Joined date */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              {availableCourses.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEnroll}
                  disabled={!selectedCourse || enrolling || (u.is_staff && !invoiceNumber.trim())}
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              <BackenterDialog
                studentId={u.id}
                studentName={u.full_name}
                availableCourses={allCourses}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Joined {new Date(u.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
