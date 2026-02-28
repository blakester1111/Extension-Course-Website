'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Users, CheckCircle, Clock, AlertTriangle, GraduationCap } from 'lucide-react'

interface WeeklyReportExportProps {
  weekLabel: string
  weekOptions: { index: number; label: string }[]
  selectedWeekIndex: number
  summary: {
    totalSubmitted: number
    activeStudents: number
    totalGraded: number
    passedThisWeek: number
    correctionsThisWeek: number
    avgTurnaroundHours: number
    completions: number
  }
  completions: { studentName: string; courseTitle: string }[]
  studentActivity: {
    name: string
    email: string
    submitted: number
    passed: number
    corrections: number
  }[]
  courseBreakdown: {
    courseTitle: string
    submitted: number
    passed: number
    corrections: number
  }[]
  supervisorBreakdown: {
    name: string
    graded: number
    passed: number
    corrections: number
    avgTurnaroundHours: number
  }[]
}

function formatTurnaround(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${Math.round(hours)}h`
  const days = Math.round(hours / 24 * 10) / 10
  return `${days}d`
}

export function WeeklyReportExport({
  weekLabel,
  weekOptions,
  selectedWeekIndex,
  summary,
  completions,
  studentActivity,
  courseBreakdown,
  supervisorBreakdown,
}: WeeklyReportExportProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function changeWeek(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('week', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  function exportCSV() {
    const lines: string[] = []

    // Summary
    lines.push('WEEKLY REPORT')
    lines.push(`Period,${weekLabel}`)
    lines.push('')
    lines.push('SUMMARY')
    lines.push(`Total Submissions,${summary.totalSubmitted}`)
    lines.push(`Active Students,${summary.activeStudents}`)
    lines.push(`Total Graded,${summary.totalGraded}`)
    lines.push(`Lessons Passed,${summary.passedThisWeek}`)
    lines.push(`Corrections Issued,${summary.correctionsThisWeek}`)
    lines.push(`Avg Turnaround,${formatTurnaround(summary.avgTurnaroundHours)}`)
    lines.push(`Course Completions,${summary.completions}`)
    lines.push('')

    // Completions
    if (completions.length > 0) {
      lines.push('COURSE COMPLETIONS')
      lines.push('Student,Course')
      for (const c of completions) {
        lines.push(`"${c.studentName}","${c.courseTitle}"`)
      }
      lines.push('')
    }

    // Student Activity
    lines.push('STUDENT ACTIVITY')
    lines.push('Name,Email,Submitted,Passed,Corrections')
    for (const s of studentActivity) {
      lines.push(`"${s.name}","${s.email}",${s.submitted},${s.passed},${s.corrections}`)
    }
    lines.push('')

    // Course Breakdown
    lines.push('COURSE BREAKDOWN')
    lines.push('Course,Submitted,Passed,Corrections')
    for (const c of courseBreakdown) {
      lines.push(`"${c.courseTitle}",${c.submitted},${c.passed},${c.corrections}`)
    }
    lines.push('')

    // Supervisor Breakdown
    if (supervisorBreakdown.length > 0) {
      lines.push('SUPERVISOR GRADING')
      lines.push('Supervisor,Graded,Passed,Corrections,Avg Turnaround')
      for (const s of supervisorBreakdown) {
        lines.push(`"${s.name}",${s.graded},${s.passed},${s.corrections},${formatTurnaround(s.avgTurnaroundHours)}`)
      }
    }

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weekly-report-${weekLabel.replace(/[^a-zA-Z0-9]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const summaryCards = [
    { label: 'Submissions', value: summary.totalSubmitted, icon: FileText },
    { label: 'Active Students', value: summary.activeStudents, icon: Users },
    { label: 'Lessons Passed', value: summary.passedThisWeek, icon: CheckCircle },
    { label: 'Corrections', value: summary.correctionsThisWeek, icon: AlertTriangle },
    { label: 'Avg Turnaround', value: formatTurnaround(summary.avgTurnaroundHours), icon: Clock },
    { label: 'Completions', value: summary.completions, icon: GraduationCap },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Weekly Report</h1>
          <p className="text-muted-foreground">Generate and export weekly statistics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedWeekIndex.toString()} onValueChange={changeWeek}>
            <SelectTrigger className="w-full sm:w-[320px]">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {weekOptions.map(w => (
                <SelectItem key={w.index} value={w.index.toString()}>{w.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">{card.label}</CardTitle>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Completions */}
      {completions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Completions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completions.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.studentName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.courseTitle}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Student Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Student Activity</CardTitle>
          <CardDescription>{studentActivity.length} students with activity this week</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table className="table-fixed min-w-[600px]">
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Passed</TableHead>
                <TableHead>Corrections</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No student activity this week.
                  </TableCell>
                </TableRow>
              ) : (
                studentActivity.map(s => (
                  <TableRow key={s.email}>
                    <TableCell className="font-medium truncate">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm truncate">{s.email}</TableCell>
                    <TableCell>{s.submitted}</TableCell>
                    <TableCell className="text-green-600">{s.passed}</TableCell>
                    <TableCell className="text-orange-500">{s.corrections}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Course Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Course Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table className="table-fixed min-w-[600px]">
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2}>Course</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Passed</TableHead>
                <TableHead>Corrections</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No course activity this week.
                  </TableCell>
                </TableRow>
              ) : (
                courseBreakdown.map(c => (
                  <TableRow key={c.courseTitle}>
                    <TableCell colSpan={2} className="font-medium">{c.courseTitle}</TableCell>
                    <TableCell>{c.submitted}</TableCell>
                    <TableCell className="text-green-600">{c.passed}</TableCell>
                    <TableCell className="text-orange-500">{c.corrections}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Supervisor Breakdown */}
      {supervisorBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supervisor Grading</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table className="table-fixed min-w-[600px]">
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Avg Turnaround</TableHead>
                  <TableHead>Graded</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Corrections</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisorBreakdown.map(s => (
                  <TableRow key={s.name}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{formatTurnaround(s.avgTurnaroundHours)}</TableCell>
                    <TableCell>{s.graded}</TableCell>
                    <TableCell className="text-green-600">{s.passed}</TableCell>
                    <TableCell className="text-orange-500">{s.corrections}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
