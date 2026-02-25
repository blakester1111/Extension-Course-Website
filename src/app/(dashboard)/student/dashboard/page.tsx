export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export const metadata = {
  title: 'Student Dashboard — FCDC Extension Courses',
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('student_id', user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Student'}</h1>
        <p className="text-muted-foreground">Your enrolled courses and progress</p>
      </div>

      {(() => {
        const activeEnrollments = (enrollments || []).filter((e: any) => e.status === 'active')
        const pendingEnrollments = (enrollments || []).filter((e: any) => e.status === 'pending_invoice_verification')

        if (activeEnrollments.length === 0 && pendingEnrollments.length === 0) {
          return (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">Browse our catalog to find your first course.</p>
                <Link href="/catalog" className="text-primary hover:underline">
                  Browse Courses
                </Link>
              </CardContent>
            </Card>
          )
        }

        return (
          <>
            {pendingEnrollments.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-yellow-700">Pending Enrollment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingEnrollments.map((enrollment: any) => (
                    <Card key={enrollment.id} className="border-yellow-200 bg-yellow-50/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{enrollment.course?.title}</CardTitle>
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Awaiting invoice verification by your supervisor
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeEnrollments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeEnrollments.map((enrollment: any) => (
                  <Link key={enrollment.id} href={`/student/courses/${enrollment.course_id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg">{enrollment.course?.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground capitalize">
                          {enrollment.course?.category?.replace('_', ' & ')}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}
