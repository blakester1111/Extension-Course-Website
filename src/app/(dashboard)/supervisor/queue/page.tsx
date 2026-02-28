export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow, differenceInHours } from 'date-fns'
import { AlertTriangle, Clock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export const metadata = {
  title: 'Grading Queue — Supervisor',
}

export default async function SupervisorQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get submissions from assigned students that are 'submitted'
  const { data: submissions } = await supabase
    .from('lesson_submissions')
    .select(`
      *,
      student:profiles!lesson_submissions_student_id_fkey(full_name, email),
      lesson:lessons(title, course:courses(title))
    `)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: true })

  const filteredSubmissions = submissions || []

  // Detect out-of-order submissions: student submitted a lesson without completing prior ones
  // For each submission, check if prior lessons in the same course are all graded_pass
  const outOfOrderIds = new Set<string>()
  for (const sub of filteredSubmissions) {
    const courseId = (sub as any).lesson?.course?.title ? (sub as any).lesson?.course_id : null
    if (!courseId) {
      // Need to get course_id from lesson — fetch lesson sort_order
    }
  }

  // Batch check: get all relevant lesson sort_orders and student submissions
  const submissionLessonIds = filteredSubmissions.map((s: any) => s.lesson_id)
  const { data: submissionLessons } = await supabase
    .from('lessons')
    .select('id, course_id, sort_order')
    .in('id', submissionLessonIds.length > 0 ? submissionLessonIds : ['none'])

  const lessonMap = new Map((submissionLessons || []).map(l => [l.id, l]))

  // For each submission, check if student has completed all prior lessons
  for (const sub of filteredSubmissions) {
    const lesson = lessonMap.get(sub.lesson_id)
    if (!lesson || lesson.sort_order === 0) continue // First lesson — no priors

    // Get all prior lessons in this course
    const { data: priorLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', lesson.course_id)
      .lt('sort_order', lesson.sort_order)

    if (!priorLessons || priorLessons.length === 0) continue

    // Check if student has graded_pass or submitted (in queue) for all prior lessons
    // Don't flag as out-of-order if prior lessons are already submitted and awaiting grading
    const { data: priorSubmissions } = await supabase
      .from('lesson_submissions')
      .select('lesson_id, status')
      .eq('student_id', sub.student_id)
      .in('lesson_id', priorLessons.map(l => l.id))
      .in('status', ['graded_pass', 'submitted'])

    const coveredIds = new Set((priorSubmissions || []).map(s => s.lesson_id))
    const allPriorCovered = priorLessons.every(l => coveredIds.has(l.id))
    if (!allPriorCovered) {
      outOfOrderIds.add(sub.id)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grading Queue</h1>
        <p className="text-muted-foreground">{filteredSubmissions.length} submissions awaiting grading</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No submissions to grade</p>
          ) : (
            <TooltipProvider>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((sub: any) => {
                  const isOverdue = sub.submitted_at && differenceInHours(new Date(), new Date(sub.submitted_at)) >= 24
                  const isOutOfOrder = outOfOrderIds.has(sub.id)

                  return (
                  <TableRow key={sub.id} className={isOverdue ? 'bg-red-50/50 dark:bg-red-950/10' : ''}>
                    <TableCell className="px-2">
                      <div className="flex gap-1">
                        {isOutOfOrder && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Out of order — prior lessons not yet submitted or completed</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {isOverdue && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Clock className="h-4 w-4 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Overdue — submitted over 24 hours ago</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{sub.student?.full_name}</TableCell>
                    <TableCell>{sub.lesson?.course?.title}</TableCell>
                    <TableCell>{sub.lesson?.title}</TableCell>
                    <TableCell>
                      {sub.grade !== null && sub.grade !== undefined ? (
                        <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                          Resubmission ({sub.grade}%)
                        </Badge>
                      ) : (
                        <Badge variant="outline">New</Badge>
                      )}
                    </TableCell>
                    <TableCell className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}>
                      {sub.submitted_at
                        ? formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" asChild>
                        <Link href={`/supervisor/grade/${sub.id}`}>Grade</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
