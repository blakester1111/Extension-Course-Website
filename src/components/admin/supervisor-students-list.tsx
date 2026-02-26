'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UsersFilterBar, type SortOption } from '@/components/admin/users-filter-bar'

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
}

export function SupervisorStudentsList({ students, isAdmin }: SupervisorStudentsListProps) {
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
        <CardHeader>
          <CardTitle>{isAdmin ? 'Assigned Students' : 'My Students'} ({assigned.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <StudentTable
            students={assigned}
            emptyMessage="No students match the current filters"
            showSupervisor={isAdmin}
          />
        </CardContent>
      </Card>

      {unassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Students ({unassigned.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <StudentTable
              students={unassigned}
              emptyMessage="No unassigned students"
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}

function StudentTable({
  students,
  emptyMessage,
  showSupervisor,
}: {
  students: StudentData[]
  emptyMessage: string
  showSupervisor?: boolean
}) {
  if (students.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            {showSupervisor && <TableHead>Supervisor</TableHead>}
            <TableHead>Org</TableHead>
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
                  {student.supervisorName || '\u2014'}
                </TableCell>
              )}
              <TableCell>
                {student.organization ? (
                  <Badge variant="outline" className="text-xs capitalize">{student.organization}</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">\u2014</span>
                )}
              </TableCell>
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
                  <span className="text-muted-foreground">\u2014</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
