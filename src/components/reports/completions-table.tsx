'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, Download, Search, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'

interface Completion {
  studentName: string
  studentEmail: string
  courseTitle: string
  courseId: string
  enrolledAt: string
  completedAt: string
  daysToComplete: number
}

interface CompletionsTableProps {
  completions: Completion[]
  courses: { id: string; title: string }[]
}

type SortKey = 'studentName' | 'courseTitle' | 'completedAt' | 'daysToComplete'

export function CompletionsTable({ completions, courses }: CompletionsTableProps) {
  const [courseFilter, setCourseFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('completedAt')
  const [sortDesc, setSortDesc] = useState(true)

  let filtered = completions
  if (courseFilter !== 'all') {
    filtered = filtered.filter(c => c.courseId === courseFilter)
  }
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(c =>
      c.studentName.toLowerCase().includes(q) || c.studentEmail.toLowerCase().includes(q)
    )
  }

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'studentName':
        cmp = a.studentName.localeCompare(b.studentName)
        break
      case 'courseTitle':
        cmp = a.courseTitle.localeCompare(b.courseTitle)
        break
      case 'completedAt':
        cmp = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        break
      case 'daysToComplete':
        cmp = a.daysToComplete - b.daysToComplete
        break
    }
    return sortDesc ? -cmp : cmp
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc(!sortDesc)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  function exportCSV() {
    const header = 'Student Name,Email,Course,Enrolled,Completed,Days to Complete'
    const rows = sorted.map(c =>
      `"${c.studentName}","${c.studentEmail}","${c.courseTitle}","${format(new Date(c.enrolledAt), 'yyyy-MM-dd')}","${format(new Date(c.completedAt), 'yyyy-MM-dd')}",${c.daysToComplete}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `completions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortButton = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(col)}
      className="flex items-center gap-1 hover:text-foreground"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              Course Completions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {sorted.length} total completion{sorted.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={sorted.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No completions found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton col="studentName" label="Student" /></TableHead>
                <TableHead><SortButton col="courseTitle" label="Course" /></TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead><SortButton col="completedAt" label="Completed" /></TableHead>
                <TableHead><SortButton col="daysToComplete" label="Days" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((comp, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{comp.studentName}</div>
                      <div className="text-xs text-muted-foreground">{comp.studentEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{comp.courseTitle}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(comp.enrolledAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(comp.completedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{comp.daysToComplete} days</Badge>
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
