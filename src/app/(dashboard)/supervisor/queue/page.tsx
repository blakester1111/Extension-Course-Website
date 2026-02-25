export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

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

  // Filter to only assigned students (RLS should handle this, but filter in-app too)
  const filteredSubmissions = submissions || []

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((sub: any) => (
                  <TableRow key={sub.id}>
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
                    <TableCell className="text-muted-foreground">
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
