'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { sendNudge } from '@/app/(dashboard)/supervisor/reports/inactive/actions'

interface InactiveStudent {
  id: string
  fullName: string
  email: string
  lastSubmission: string | null
  daysSinceLastSubmission: number | null
  courseNames: string[]
}

export function InactiveStudentsTable({ students }: { students: InactiveStudent[] }) {
  const [threshold, setThreshold] = useState('7')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [nudgedIds, setNudgedIds] = useState<Set<string>>(new Set())
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [isBulkSending, startBulkTransition] = useTransition()

  const thresholdDays = parseInt(threshold)

  const inactive = students.filter(s => {
    if (s.daysSinceLastSubmission === null) return true // Never submitted
    return s.daysSinceLastSubmission >= thresholdDays
  }).sort((a, b) => {
    // Never submitted goes to top, then most days inactive
    if (a.daysSinceLastSubmission === null && b.daysSinceLastSubmission === null) return 0
    if (a.daysSinceLastSubmission === null) return -1
    if (b.daysSinceLastSubmission === null) return 1
    return b.daysSinceLastSubmission - a.daysSinceLastSubmission
  })

  function getRowColor(days: number | null): string {
    if (days === null) return 'bg-red-50 dark:bg-red-950/20'
    if (days >= 21) return 'bg-red-50 dark:bg-red-950/20'
    if (days >= 14) return 'bg-orange-50 dark:bg-orange-950/20'
    return 'bg-yellow-50 dark:bg-yellow-950/20'
  }

  function getSeverityBadge(days: number | null) {
    if (days === null) {
      return <Badge variant="destructive">Never submitted</Badge>
    }
    if (days >= 21) {
      return <Badge variant="destructive">{days} days</Badge>
    }
    if (days >= 14) {
      return <Badge className="bg-orange-500 text-white hover:bg-orange-600">{days} days</Badge>
    }
    return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">{days} days</Badge>
  }

  async function handleNudge(student: InactiveStudent) {
    setSendingId(student.id)
    try {
      const firstName = student.fullName.split(' ')[0] || 'Student'
      await sendNudge(
        student.id,
        student.email,
        firstName,
        student.courseNames,
        student.daysSinceLastSubmission,
      )
      setNudgedIds(prev => new Set([...prev, student.id]))
    } catch (error) {
      console.error('Failed to send nudge:', error)
    } finally {
      setSendingId(null)
    }
  }

  async function handleBulkNudge() {
    startBulkTransition(async () => {
      for (const studentId of selected) {
        const student = inactive.find(s => s.id === studentId)
        if (!student || nudgedIds.has(student.id)) continue
        const firstName = student.fullName.split(' ')[0] || 'Student'
        try {
          await sendNudge(
            student.id,
            student.email,
            firstName,
            student.courseNames,
            student.daysSinceLastSubmission,
          )
          setNudgedIds(prev => new Set([...prev, student.id]))
        } catch (error) {
          console.error('Failed to send nudge to', student.email, error)
        }
      }
      setSelected(new Set())
    })
  }

  const allSelected = inactive.length > 0 && inactive.every(s => selected.has(s.id))

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Inactive Students
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {inactive.length} student{inactive.length !== 1 ? 's' : ''} inactive for {thresholdDays}+ days
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={threshold} onValueChange={setThreshold}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7+ days</SelectItem>
                <SelectItem value="14">14+ days</SelectItem>
                <SelectItem value="21">21+ days</SelectItem>
                <SelectItem value="30">30+ days</SelectItem>
              </SelectContent>
            </Select>
            {selected.size > 0 && (
              <Button
                onClick={handleBulkNudge}
                disabled={isBulkSending}
                size="sm"
              >
                {isBulkSending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Nudge {selected.size} selected</>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {inactive.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            All students are active! No one has been inactive for {thresholdDays}+ days.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelected(new Set(inactive.map(s => s.id)))
                      } else {
                        setSelected(new Set())
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Last Submission</TableHead>
                <TableHead>Inactive</TableHead>
                <TableHead className="w-28">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inactive.map(student => (
                <TableRow key={student.id} className={getRowColor(student.daysSinceLastSubmission)}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(student.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selected)
                        if (checked) next.add(student.id)
                        else next.delete(student.id)
                        setSelected(next)
                      }}
                    />
                  </TableCell>
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
                  <TableCell className="text-sm">
                    {student.lastSubmission
                      ? format(new Date(student.lastSubmission), 'MMM d, yyyy')
                      : <span className="text-muted-foreground italic">Never</span>
                    }
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(student.daysSinceLastSubmission)}
                  </TableCell>
                  <TableCell>
                    {nudgedIds.has(student.id) ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" /> Sent
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNudge(student)}
                        disabled={sendingId === student.id}
                      >
                        {sendingId === student.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><Send className="h-4 w-4 mr-1" /> Nudge</>
                        )}
                      </Button>
                    )}
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
