'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UsersFilterBar, type SortOption } from '@/components/admin/users-filter-bar'
import { StudentNotesDialog } from '@/components/admin/student-notes-dialog'
import { StudentMaterialsDialog } from '@/components/admin/student-materials-dialog'
import { UserProfileDialog, type ContactInfo } from '@/components/admin/user-profile-dialog'

interface StudentData {
  id: string
  full_name: string
  email: string
  role: string
  organization: string | null
  is_staff: boolean
  created_at: string
  enrolledCourses: number
  completedLessons: number
  pendingSubmissions: number
  isAssigned: boolean
  supervisorName: string | null
}

interface SupervisorStudentsListProps {
  students: StudentData[]
  isAdmin: boolean
  coursesOrdered: { id: string; title: string; category: string }[]
  contactsByUser: Record<string, ContactInfo>
}

export function SupervisorStudentsList({ students, isAdmin, coursesOrdered, contactsByUser }: SupervisorStudentsListProps) {
  const [search, setSearch] = useState('')
  const [org, setOrg] = useState('all')
  const [audience, setAudience] = useState('all')
  const [sort, setSort] = useState<SortOption>('name-asc')

  const filtered = useMemo(() => {
    let result = [...students]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    }

    if (org === 'day') {
      result = result.filter(s => s.organization === 'day')
    } else if (org === 'foundation') {
      result = result.filter(s => s.organization === 'foundation')
    } else if (org === 'unassigned') {
      result = result.filter(s => !s.organization)
    }

    if (audience === 'staff') {
      result = result.filter(s => s.is_staff)
    } else if (audience === 'public') {
      result = result.filter(s => !s.is_staff)
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
  }, [students, search, org, audience, sort])

  const assigned = filtered.filter(s => s.isAssigned)
  const unassigned = filtered.filter(s => !s.isAssigned)

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{isAdmin ? 'Assigned Students' : 'My Students'} ({assigned.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {assigned.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No students match the current filters</p>
          ) : (
            assigned.map(s => (
              <StudentCard key={s.id} student={s} coursesOrdered={coursesOrdered} contactInfo={contactsByUser[s.id] || null} />
            ))
          )}
        </CardContent>
      </Card>

      {unassigned.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Unassigned Students ({unassigned.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {unassigned.map(s => (
              <StudentCard key={s.id} student={s} coursesOrdered={coursesOrdered} contactInfo={contactsByUser[s.id] || null} />
            ))}
          </CardContent>
        </Card>
      )}
    </>
  )
}

function StudentCard({
  student: s,
  coursesOrdered,
  contactInfo,
}: {
  student: StudentData
  coursesOrdered: { id: string; title: string; category: string }[]
  contactInfo: ContactInfo | null
}) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <div className="border rounded-md px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Name / Email */}
          <div className="min-w-0 w-full sm:w-auto sm:flex-1">
            <button
              onClick={() => setProfileOpen(true)}
              className="font-medium text-sm truncate text-primary hover:underline cursor-pointer text-left"
            >
              {s.full_name}
            </button>
            <p className="text-xs text-muted-foreground truncate">{s.email}</p>
          </div>

          {/* Progress badges */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs">{s.completedLessons} passed</Badge>
            {s.pendingSubmissions > 0 && (
              <Badge className="text-xs">{s.pendingSubmissions} awaiting</Badge>
            )}
          </div>

          {/* Notes + Materials buttons */}
          <div className="shrink-0 flex items-center gap-1.5">
            <StudentNotesDialog studentId={s.id} studentName={s.full_name} />
            <StudentMaterialsDialog studentId={s.id} studentName={s.full_name} courses={coursesOrdered} />
          </div>
        </div>
      </div>

      <UserProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={{
          id: s.id,
          full_name: s.full_name,
          email: s.email,
          role: s.role,
          organization: s.organization,
          supervisor_id: null,
          is_staff: s.is_staff,
          can_attest_certs: false,
          can_sign_certs: false,
          created_at: s.created_at,
        }}
        contactInfo={contactInfo}
        isAdmin={false}
      />
    </>
  )
}
