export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { InvoiceVerifyButtons } from '@/components/supervisor/invoice-verify-buttons'

export const metadata = {
  title: 'Pending Invoices — Supervisor',
}

export default async function SupervisorEnrollmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all pending invoice enrollments
  const { data: pendingEnrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:profiles!enrollments_student_id_fkey(full_name, email, supervisor_id),
      course:courses(title)
    `)
    .eq('status', 'pending_invoice_verification')
    .order('created_at', { ascending: false })

  // Filter: supervisor sees their assigned students + unassigned students
  const myEnrollments = (pendingEnrollments || []).filter((e: any) =>
    e.student?.supervisor_id === user.id || e.student?.supervisor_id === null
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Invoices</h1>
        <p className="text-muted-foreground">
          {myEnrollments.length} enrollment{myEnrollments.length !== 1 ? 's' : ''} pending invoice verification
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {myEnrollments.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No pending invoices</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myEnrollments.map((enrollment: any) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">{enrollment.student?.full_name}</TableCell>
                    <TableCell className="text-sm">{enrollment.student?.email}</TableCell>
                    <TableCell>{enrollment.course?.title}</TableCell>
                    <TableCell className="font-mono text-sm">{enrollment.invoice_number}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(enrollment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <InvoiceVerifyButtons enrollmentId={enrollment.id} />
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
