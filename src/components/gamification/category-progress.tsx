'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, BookOpen, Mic2, FlaskConical } from 'lucide-react'
import type { CourseCategory } from '@/types/database'

interface CourseProgress {
  courseId: string
  title: string
  category: CourseCategory
  totalLessons: number
  passedLessons: number
}

interface CategoryProgressProps {
  courses: CourseProgress[]
}

const categoryConfig: Record<CourseCategory, {
  label: string
  badge: string
  icon: React.ElementType
  color: string
  bgColor: string
  barColor: string
}> = {
  basics: {
    label: 'Basics',
    badge: 'Basics Graduate',
    icon: BookOpen,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    barColor: 'bg-blue-500',
  },
  congresses: {
    label: 'Congresses',
    badge: 'Congress Scholar',
    icon: Mic2,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    barColor: 'bg-purple-500',
  },
  accs: {
    label: 'ACCs',
    badge: 'ACC Master',
    icon: FlaskConical,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    barColor: 'bg-emerald-500',
  },
}

export function CategoryProgress({ courses }: CategoryProgressProps) {
  // Group by category
  const byCategory = new Map<CourseCategory, CourseProgress[]>()
  for (const c of courses) {
    const list = byCategory.get(c.category) || []
    list.push(c)
    byCategory.set(c.category, list)
  }

  const categories = (['basics', 'congresses', 'accs'] as CourseCategory[]).filter(
    cat => byCategory.has(cat)
  )

  if (categories.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {categories.map(cat => {
        const config = categoryConfig[cat]
        const catCourses = byCategory.get(cat) || []
        const totalLessons = catCourses.reduce((s, c) => s + c.totalLessons, 0)
        const passedLessons = catCourses.reduce((s, c) => s + c.passedLessons, 0)
        const completedCourses = catCourses.filter(c => c.passedLessons >= c.totalLessons && c.totalLessons > 0).length
        const totalCourses = catCourses.length
        const pct = totalLessons > 0 ? Math.round((passedLessons / totalLessons) * 100) : 0
        const isComplete = completedCourses === totalCourses && totalCourses > 0
        const Icon = config.icon

        return (
          <Card key={cat} className={isComplete ? `border-2 border-amber-400 ${config.bgColor}` : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  {config.label}
                </CardTitle>
                {isComplete && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {config.badge}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Overall progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{passedLessons} / {totalLessons} lessons</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Per-course breakdown */}
              <div className="space-y-1 pt-1">
                {catCourses.map(c => {
                  const coursePct = c.totalLessons > 0
                    ? Math.round((c.passedLessons / c.totalLessons) * 100)
                    : 0
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
      })}
    </div>
  )
}
