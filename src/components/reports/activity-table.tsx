'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Users, Search } from 'lucide-react'
import { format } from 'date-fns'

interface StudentActivity {
  id: string
  fullName: string
  email: string
  organization: string | null
  isStaff: boolean
  lastSubmission: string | null
  daysSinceLastSubmission: number | null
  courseNames: string[]
  enrollmentCount: number
  totalSubmissions: number
  passedLessons: number
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'never'
type SortField = 'name' | 'last-activity' | 'lessons-passed' | 'submissions'

function getActivityStatus(days: number | null): 'active' | 'inactive' | 'never' {
  if (days === null) return 'never'
  if (days <= 14) return 'active'
  return 'inactive'
}

function getStatusBadge(days: number | null) {
  const status = getActivityStatus(days)
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
    case 'inactive':
      return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Inactive ({days}d)</Badge>
    case 'never':
      return <Badge variant="destructive">Never submitted</Badge>
  }
}

export function ActivityTable({ students }: { students: StudentActivity[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('name')

  const filtered = students
    .filter(s => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!s.fullName.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) {
          return false
        }
      }
      // Status filter
      if (statusFilter !== 'all') {
        const status = getActivityStatus(s.daysSinceLastSubmission)
        if (statusFilter !== status) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortField) {
        case 'name':
          return (a.fullName || '').localeCompare(b.fullName || '')
        case 'last-activity':
          // Never submitted goes last, then most recent first
          if (a.daysSinceLastSubmission === null && b.daysSinceLastSubmission === null) return 0
          if (a.daysSinceLastSubmission === null) return 1
          if (b.daysSinceLastSubmission === null) return -1
          return a.daysSinceLastSubmission - b.daysSinceLastSubmission
        case 'lessons-passed':
          return b.passedLessons - a.passedLessons
        case 'submissions':
          return b.totalSubmissions - a.totalSubmissions
        default:
          return 0
      }
    })

  const activeCount = students.filter(s => getActivityStatus(s.daysSinceLastSubmission) === 'active').length
  const inactiveCount = students.filter(s => getActivityStatus(s.daysSinceLastSubmission) === 'inactive').length
  const neverCount = students.filter(s => getActivityStatus(s.daysSinceLastSubmission) === 'never').length

  function exportCSV() {
    const header = 'Student Name,Email,Organization,Staff,Status,Courses,Last Submission,Days Since,Total Submissions,Lessons Passed'
    const rows = filtered.map(s =>
      `"${s.fullName}","${s.email}","${s.organization || 'Unassigned'}","${s.isStaff ? 'Yes' : 'No'}","${getActivityStatus(s.daysSinceLastSubmission)}","${s.courseNames.join('; ')}","${s.lastSubmission ? format(new Date(s.lastSubmission), 'yyyy-MM-dd') : 'Never'}",${s.daysSinceLastSubmission ?? 'N/A'},${s.totalSubmissions},${s.passedLessons}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Activity
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {students.length} enrolled — {activeCount} active, {inactiveCount} inactive, {neverCount} never submitted
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
              <SelectItem value="never">Never Submitted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="last-activity">Sort: Last Activity</SelectItem>
              <SelectItem value="lessons-passed">Sort: Lessons Passed</SelectItem>
              <SelectItem value="submissions">Sort: Submissions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No students match the current filters.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead className="text-center">Lessons Passed</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(student => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.fullName}</div>
                      <div className="text-xs text-muted-foreground">{student.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.courseNames.map((name, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {student.passedLessons}
                  </TableCell>
                  <TableCell className="text-sm">
                    {student.lastSubmission
                      ? format(new Date(student.lastSubmission), 'MMM d, yyyy')
                      : <span className="text-muted-foreground italic">Never</span>
                    }
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(student.daysSinceLastSubmission)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
