export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PersonalStats } from '@/components/gamification/personal-stats'
import { RouteProgress } from '@/components/gamification/route-progress'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

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

  // Get passed submissions per course (all, for progress tracking including back-entered)
  const { data: passedSubs } = await supabase
    .from('lesson_submissions')
    .select('lesson_id, lesson:lessons(course_id), graded_at, is_backentered')
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
  // Exclude back-entered submissions from this stat
  const weekCounts = new Map<string, number>()
  for (const sub of passedSubs || []) {
    if (!sub.graded_at || (sub as any).is_backentered) continue
    const d = new Date(sub.graded_at)
    const jan4 = new Date(d.getFullYear(), 0, 4)
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1
    const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7)
    const key = `${d.getFullYear()}-W${weekNum}`
    weekCounts.set(key, (weekCounts.get(key) || 0) + 1)
  }
  const personalBestWeek = weekCounts.size > 0 ? Math.max(...weekCounts.values()) : 0

  const activeEnrollments = (enrollments || []).filter((e: any) => e.status === 'active')
  const pendingEnrollments = (enrollments || []).filter((e: any) => e.status === 'pending_invoice_verification')

  // Find current in-progress lesson
  let continueLearning: { lessonId: string; lessonTitle: string; courseTitle: string; courseId: string; status: string } | null = null
  if (activeEnrollments.length > 0) {
    const activeCourseIds = activeEnrollments.map((e: any) => e.course_id)
    const { data: inProgressSubs } = await supabase
      .from('lesson_submissions')
      .select('id, lesson_id, status, updated_at, lesson:lessons(title, course_id, course:courses(title))')
      .eq('student_id', user.id)
      .in('status', ['draft', 'graded_corrections'])
      .order('updated_at', { ascending: false })
      .limit(10)

    for (const sub of inProgressSubs || []) {
      const lesson = sub.lesson as any
      if (lesson && activeCourseIds.includes(lesson.course_id)) {
        continueLearning = {
          lessonId: sub.lesson_id,
          lessonTitle: lesson.title,
          courseTitle: lesson.course?.title || '',
          courseId: lesson.course_id,
          status: sub.status,
        }
        break
      }
    }
  }

  // ── Route Progress Data ──
  // Fetch all routes with their courses
  const { data: allRoutes } = await supabase
    .from('study_routes')
    .select('id, name')
    .order('name')

  const { data: allRouteCourses } = await supabase
    .from('study_route_courses')
    .select('route_id, course_id, position, course:courses(id, title, lesson_count, is_published)')
    .order('position')

  // Build route progress data
  const routeProgressData = (allRoutes || []).map(route => {
    const routeCourses = (allRouteCourses || [])
      .filter(rc => rc.route_id === route.id)
      .filter(rc => (rc.course as any)?.is_published)
      .sort((a, b) => a.position - b.position)

    return {
      routeId: route.id,
      routeName: route.name,
      courses: routeCourses.map(rc => {
        const course = rc.course as any
        return {
          courseId: rc.course_id,
          title: course?.title || '',
          totalLessons: course?.lesson_count || 0,
          passedLessons: passedByCourseLookup.get(rc.course_id) || 0,
          position: rc.position,
        }
      }),
    }
  })

  // Onboarding data
  const needsOnboarding = !profile?.onboarding_completed_at
  const studyRoutes = (allRoutes || []).map(r => ({ id: r.id, name: r.name }))

  return (
    <div className="space-y-6">
      <OnboardingFlow
        role="student"
        fullName={profile?.full_name || ''}
        needsOnboarding={needsOnboarding}
        studyRoutes={studyRoutes}
        currentRouteId={profile?.study_route_id || null}
        certMailPreference={profile?.cert_mail_preference || 'digital'}
      />

      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Student'}</h1>
        <p className="text-muted-foreground">Your enrolled courses and progress</p>
      </div>

      {/* Continue Learning CTA */}
      {continueLearning && (
        <Link href={`/student/lessons/${continueLearning.lessonId}`}>
          <Card className="border-primary/30 bg-primary/5 hover:shadow-md transition-shadow cursor-pointer mb-2">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {continueLearning.status === 'graded_corrections' ? 'Corrections Needed' : 'Continue Learning'}
                </p>
                <p className="font-semibold truncate">{continueLearning.lessonTitle}</p>
                <p className="text-xs text-muted-foreground">{continueLearning.courseTitle}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Personal stats */}
      <PersonalStats
        currentStreak={streak?.current_streak_weeks || 0}
        longestStreak={streak?.longest_streak_weeks || 0}
        totalLessons={streak?.total_lessons_submitted || 0}
        personalBestWeek={personalBestWeek}
        honorRank={honorRank}
      />

      {/* My Courses (moved above route progress) */}
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

      {/* Route Progress */}
      {routeProgressData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Route Progress</h2>
          <RouteProgress
            assignedRouteId={profile?.study_route_id || null}
            routes={routeProgressData}
          />
        </div>
      )}
    </div>
  )
}
