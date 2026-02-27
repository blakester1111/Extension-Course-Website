'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GraduationCap, ChevronDown, ChevronUp, Route } from 'lucide-react'

interface CourseInRoute {
  courseId: string
  title: string
  totalLessons: number
  passedLessons: number
  position: number
}

interface RouteData {
  routeId: string
  routeName: string
  courses: CourseInRoute[]
}

interface RouteProgressProps {
  assignedRouteId: string | null
  routes: RouteData[]
}

const routeColors: Record<number, { barColor: string; color: string; bgColor: string }> = {
  0: { barColor: 'bg-blue-500', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  1: { barColor: 'bg-purple-500', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
  2: { barColor: 'bg-emerald-500', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30' },
  3: { barColor: 'bg-amber-500', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  4: { barColor: 'bg-rose-500', color: 'text-rose-700 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-950/30' },
  5: { barColor: 'bg-cyan-500', color: 'text-cyan-700 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-950/30' },
  6: { barColor: 'bg-indigo-500', color: 'text-indigo-700 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30' },
}

function getColor(index: number) {
  return routeColors[index % Object.keys(routeColors).length]
}

export function RouteProgress({ assignedRouteId, routes }: RouteProgressProps) {
  const [showOthers, setShowOthers] = useState(false)

  if (routes.length === 0) return null

  const assignedRoute = routes.find(r => r.routeId === assignedRouteId)
  const otherRoutes = routes.filter(r => r.routeId !== assignedRouteId)

  return (
    <div className="space-y-4">
      {/* Assigned route — full width, larger text */}
      {assignedRoute ? (
        <PrimaryRouteCard route={assignedRoute} />
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No study route selected. You can choose one in your Profile settings.
        </p>
      )}

      {/* Toggle for other routes */}
      {otherRoutes.length > 0 && (
        <>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOthers(!showOthers)}
              className="text-muted-foreground"
            >
              {showOthers ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide other routes
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show other routes
                </>
              )}
            </Button>
          </div>

          {showOthers && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {otherRoutes.map((route, idx) => (
                <CompactRouteCard
                  key={route.routeId}
                  route={route}
                  colorIndex={idx + 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Primary (assigned) route — full width, larger text                 */
/* ------------------------------------------------------------------ */

function PrimaryRouteCard({ route }: { route: RouteData }) {
  const colors = getColor(0)
  const totalLessons = route.courses.reduce((s, c) => s + c.totalLessons, 0)
  const passedLessons = route.courses.reduce((s, c) => s + c.passedLessons, 0)
  const completedCourses = route.courses.filter(
    c => c.passedLessons >= c.totalLessons && c.totalLessons > 0
  ).length
  const totalCourses = route.courses.length
  const pct = totalLessons > 0 ? Math.round((passedLessons / totalLessons) * 100) : 0
  const isComplete = completedCourses === totalCourses && totalCourses > 0

  return (
    <Card className={isComplete ? `border-2 border-amber-400 ${colors.bgColor}` : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2.5">
            <Route className={`h-5 w-5 shrink-0 ${colors.color}`} />
            {route.routeName}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs">
              Your Route
            </Badge>
            {isComplete && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-sm gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                Complete
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{passedLessons} / {totalLessons} lessons</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colors.barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Per-course breakdown — larger text */}
        <div className="space-y-1.5 pt-1">
          {route.courses.map(c => {
            const done = c.passedLessons >= c.totalLessons && c.totalLessons > 0

            return (
              <div key={c.courseId} className="flex items-center gap-2.5 text-sm">
                <span className={`shrink-0 ${done ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {done ? '✓' : '○'}
                </span>
                <span className={`flex-1 ${done ? 'line-through text-muted-foreground' : ''}`}>
                  {c.title}
                </span>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {c.passedLessons}/{c.totalLessons}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-sm text-muted-foreground pt-1">
          {completedCourses}/{totalCourses} courses completed
        </p>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Compact card for non-assigned routes in the expandable grid        */
/* ------------------------------------------------------------------ */

function CompactRouteCard({
  route,
  colorIndex,
}: {
  route: RouteData
  colorIndex: number
}) {
  const colors = getColor(colorIndex)
  const totalLessons = route.courses.reduce((s, c) => s + c.totalLessons, 0)
  const passedLessons = route.courses.reduce((s, c) => s + c.passedLessons, 0)
  const completedCourses = route.courses.filter(
    c => c.passedLessons >= c.totalLessons && c.totalLessons > 0
  ).length
  const totalCourses = route.courses.length
  const pct = totalLessons > 0 ? Math.round((passedLessons / totalLessons) * 100) : 0
  const isComplete = completedCourses === totalCourses && totalCourses > 0

  return (
    <Card className={isComplete ? `border-2 border-amber-400 ${colors.bgColor}` : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 min-w-0">
            <Route className={`h-4 w-4 shrink-0 ${colors.color}`} />
            <span className="truncate">{route.routeName}</span>
          </CardTitle>
          {isComplete && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs gap-1 shrink-0">
              <GraduationCap className="h-3 w-3" />
              Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{passedLessons} / {totalLessons} lessons</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colors.barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 pt-1">
          {route.courses.map(c => {
            const done = c.passedLessons >= c.totalLessons && c.totalLessons > 0

            return (
              <div key={c.courseId} className="flex items-center gap-2 text-xs">
                <span className={`shrink-0 ${done ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {done ? '✓' : '○'}
                </span>
                <span className={`truncate flex-1 ${done ? 'line-through text-muted-foreground' : ''}`}>
                  {c.title}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {c.passedLessons}/{c.totalLessons}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground pt-1">
          {completedCourses}/{totalCourses} courses completed
        </p>
      </CardContent>
    </Card>
  )
}
