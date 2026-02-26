export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PersonalStats } from '@/components/gamification/personal-stats'
import { CategoryProgress } from '@/components/gamification/category-progress'

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
      course:courses(id, title, category, lesson_count)
    `)
    .eq('student_id', user.id)

  // Get streak data
  const { data: streak } = await supabase
    .from('honor_roll_streaks')
    .select('current_streak_weeks, longest_streak_weeks, total_lessons_submitted')
    .eq('student_id', user.id)
    .maybeSingle()

  // Get honor roll rank
  const { data: allStreaks } = await supabase
    .from('honor_roll_streaks')
    .select('student_id, current_streak_weeks')
    .gt('current_streak_weeks', 0)
    .order('current_streak_weeks', { ascending: false })

  let honorRank: number | null = null
  if (allStreaks) {
    const idx = allStreaks.findIndex((s: any) => s.student_id === user.id)
    if (idx >= 0) honorRank = idx + 1
  }

  // Get passed submissions per course for category progress
  const { data: passedSubs } = await supabase
    .from('lesson_submissions')
    .select('lesson_id, lesson:lessons(course_id), graded_at')
    .eq('student_id', user.id)
    .eq('status', 'graded_pass')

  // Build per-course passed count
  const passedByCourseLookup = new Map<string, number>()
  for (const sub of passedSubs || []) {
    const courseId = (sub.lesson as any)?.course_id
    if (!courseId) continue
    passedByCourseLookup.set(courseId, (passedByCourseLookup.get(courseId) || 0) + 1)
  }

  // Compute personal best week (most lessons passed in a single ISO week)
  const weekCounts = new Map<string, number>()
  for (const sub of passedSubs || []) {
    if (!sub.graded_at) continue
    const d = new Date(sub.graded_at)
    // ISO week key: year-week
    const jan4 = new Date(d.getFullYear(), 0, 4)
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1
    const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7)
    const key = `${d.getFullYear()}-W${weekNum}`
    weekCounts.set(key, (weekCounts.get(key) || 0) + 1)
  }
  const personalBestWeek = weekCounts.size > 0 ? Math.max(...weekCounts.values()) : 0

  // Build course progress for all published courses in enrolled categories
  const activeEnrollments = (enrollments || []).filter((e: any) => e.status === 'active')
  const pendingEnrollments = (enrollments || []).filter((e: any) => e.status === 'pending_invoice_verification')

  // Get ALL published courses for category progress (not just enrolled ones)
  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, title, category, lesson_count')
    .eq('is_published', true)
    .order('sort_order')

  const categoryProgressData = (allCourses || []).map((c: any) => ({
    courseId: c.id,
    title: c.title,
    category: c.category,
    totalLessons: c.lesson_count || 0,
    passedLessons: passedByCourseLookup.get(c.id) || 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Student'}</h1>
        <p className="text-muted-foreground">Your enrolled courses and progress</p>
      </div>

      {/* Personal stats */}
      <PersonalStats
        currentStreak={streak?.current_streak_weeks || 0}
        longestStreak={streak?.longest_streak_weeks || 0}
        totalLessons={streak?.total_lessons_submitted || 0}
        personalBestWeek={personalBestWeek}
        honorRank={honorRank}
      />

      {/* Category progress */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Category Progress</h2>
        <CategoryProgress courses={categoryProgressData} />
      </div>

      {/* Enrolled courses */}
      {(() => {
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
              <div>
                <h2 className="text-lg font-semibold mb-3">My Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeEnrollments.map((enrollment: any) => {
                    const passed = passedByCourseLookup.get(enrollment.course_id) || 0
                    const total = enrollment.course?.lesson_count || 0
                    const pct = total > 0 ? Math.round((passed / total) * 100) : 0
                    const isComplete = passed >= total && total > 0

                    return (
                      <Link key={enrollment.id} href={`/student/courses/${enrollment.course_id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{enrollment.course?.title}</CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">
                              {enrollment.course?.category?.replace('_', ' & ')}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{passed}/{total} lessons</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {isComplete && (
                              <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                                Complete
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}
