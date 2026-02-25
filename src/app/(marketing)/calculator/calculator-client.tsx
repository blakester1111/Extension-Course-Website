'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { User } from 'lucide-react'
import type { CourseCategory } from '@/types/database'

export interface CourseData {
  id: string
  title: string
  category: CourseCategory
  lesson_count: number
  sort_order: number
}

type Route = 'basics_all' | 'basics_books' | 'congresses' | 'accs' | 'chronological'

const ROUTES: { value: Route; label: string }[] = [
  { value: 'basics_all', label: 'Basics Books & Lectures' },
  { value: 'basics_books', label: 'Basics Books' },
  { value: 'congresses', label: 'Congresses' },
  { value: 'accs', label: 'ACCs' },
  { value: 'chronological', label: 'Chronological Study' },
]

// Books only (no lecture series) — categories that are "basics" but are book-only
// We determine this by whether the title contains "Lectures" or known lecture-only courses
const LECTURE_KEYWORDS = [
  'Lectures',
  'Lecture',
  'Congress',
  'ACC',
  'Milestone One',
  'Route to Infinity',
  'Life Continuum',
  'Source of Life Energy',
  'Command of Theta',
  'Philadelphia Doctorate',
  'Technique 88',
]

function isBookOnly(course: CourseData): boolean {
  if (course.category !== 'basics') return false
  // If the title contains lecture-related keywords, it's not book-only
  return !LECTURE_KEYWORDS.some((kw) => course.title.includes(kw))
}

function getCoursesForRoute(courses: CourseData[], route: Route): CourseData[] {
  switch (route) {
    case 'basics_all':
      return courses.filter((c) => c.category === 'basics')
    case 'basics_books':
      return courses.filter((c) => isBookOnly(c))
    case 'congresses':
      return courses.filter((c) => c.category === 'congresses')
    case 'accs':
      return courses.filter((c) => c.category === 'accs')
    case 'chronological':
      return [...courses]
    default:
      return []
  }
}

export function CalculatorClient({ courses }: { courses: CourseData[] }) {
  const { user, profile, loading: authLoading } = useUser()
  const [lessonsPerWeek, setLessonsPerWeek] = useState(5)
  const [selectedRoute, setSelectedRoute] = useState<Route>('chronological')
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [autoCompletedIds, setAutoCompletedIds] = useState<Set<string>>(new Set())

  // Fetch completion data for logged-in users
  useEffect(() => {
    if (authLoading || !user || courses.length === 0) return
    let cancelled = false

    async function fetchCompletions() {
      try {
        const supabase = createClient()
        const { data: submissions } = await supabase
          .from('lesson_submissions')
          .select('lesson_id, lessons!inner(course_id)')
          .eq('student_id', user!.id)
          .eq('status', 'graded_pass')

        if (cancelled || !submissions || submissions.length === 0) return

        const passCountByCourse: Record<string, number> = {}
        for (const sub of submissions) {
          const courseId = (sub as any).lessons?.course_id
          if (courseId) {
            passCountByCourse[courseId] = (passCountByCourse[courseId] || 0) + 1
          }
        }

        const completed = new Set<string>()
        for (const course of courses) {
          if (
            (passCountByCourse[course.id] || 0) >= course.lesson_count &&
            course.lesson_count > 0
          ) {
            completed.add(course.id)
          }
        }

        if (!cancelled) {
          setAutoCompletedIds(completed)
          setDoneIds(completed)
        }
      } catch {
        // Continue without auto-detection
      }
    }
    fetchCompletions()
    return () => { cancelled = true }
  }, [authLoading, user, courses])

  // Reset removed courses when route changes
  useEffect(() => {
    setRemovedIds(new Set())
  }, [selectedRoute])

  // Active courses for current route (minus removed)
  const routeCourses = useMemo(
    () => getCoursesForRoute(courses, selectedRoute),
    [courses, selectedRoute]
  )

  const activeCourses = useMemo(
    () => routeCourses.filter((c) => !removedIds.has(c.id) && !doneIds.has(c.id)),
    [routeCourses, removedIds, doneIds]
  )

  const totalRemainingLessons = activeCourses.reduce(
    (sum, c) => sum + (c.lesson_count || 0), 0
  )
  const totalWeeks = lessonsPerWeek > 0 ? Math.ceil(totalRemainingLessons / lessonsPerWeek) : 0
  const totalYears = totalWeeks / 52

  function removeCourse(id: string) {
    setRemovedIds((prev) => new Set(prev).add(id))
  }

  function weeksForCourse(lessonCount: number): number {
    return lessonsPerWeek > 0 ? Math.ceil(lessonCount / lessonsPerWeek) : 0
  }

  function formatYears(weeks: number): string {
    const yrs = weeks / 52
    if (yrs < 1) return `${weeks} weeks`
    if (yrs === Math.floor(yrs)) return `${Math.floor(yrs)} year${Math.floor(yrs) !== 1 ? 's' : ''}`
    return `${yrs.toFixed(1)} years`
  }

  return (
    <div className="space-y-10">
      {/* Logged-in banner */}
      {user && profile && (
        <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm">
          <User className="h-4 w-4 text-primary shrink-0" />
          <span>
            Signed in as <strong>{profile.full_name}</strong>
            {autoCompletedIds.size > 0 && (
              <>
                {' '}&mdash; {autoCompletedIds.size} course
                {autoCompletedIds.size !== 1 ? 's' : ''} auto-marked as completed
              </>
            )}
          </span>
        </div>
      )}

      {/* Lessons per week grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">How many lessons are you studying per week?</h2>
        <div className="grid grid-cols-10 gap-1.5 max-w-xl">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setLessonsPerWeek(n)}
              className={`h-10 rounded text-sm font-medium transition-colors ${
                n === lessonsPerWeek
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Route selector */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Select your Route</h2>
        <div className="grid grid-cols-2 gap-2 max-w-xl">
          {ROUTES.map((route) => (
            <button
              key={route.value}
              onClick={() => setSelectedRoute(route.value)}
              className={`px-4 py-2.5 rounded text-sm font-medium transition-colors ${
                route.value === selectedRoute
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              } ${route.value === 'chronological' ? 'col-span-1' : ''}`}
            >
              {route.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total Weeks result card */}
      <div className="rounded-xl bg-muted/60 border px-6 py-8 text-center max-w-xl shadow-sm">
        <p className="text-muted-foreground font-semibold text-sm uppercase tracking-wide">
          Total Weeks to Complete
        </p>
        <p className="text-6xl font-bold text-foreground mt-2">
          {totalRemainingLessons === 0 ? '0' : totalWeeks}
        </p>
        <p className="text-muted-foreground mt-1">
          {totalRemainingLessons === 0
            ? 'All done!'
            : `Over ${formatYears(totalWeeks)}`}
        </p>
      </div>

      {/* Course list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-primary">Courses</h2>
        <div className="divide-y">
          {activeCourses.map((course) => {
            const weeks = weeksForCourse(course.lesson_count)
            return (
              <div key={course.id} className="flex items-start justify-between py-3.5 gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {course.title} Extension Course
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {course.lesson_count} Lessons
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-amber-600">
                    {weeks} {weeks === 1 ? 'Week' : 'Weeks'}
                  </p>
                  <button
                    onClick={() => removeCourse(course.id)}
                    className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    &times; Remove
                  </button>
                </div>
              </div>
            )
          })}
          {activeCourses.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No courses selected. Choose a route above or add courses back.
            </div>
          )}
        </div>
      </div>

      {/* Removed courses — option to add back */}
      {removedIds.size > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Removed courses ({removedIds.size}) &mdash;{' '}
            <button
              onClick={() => setRemovedIds(new Set())}
              className="text-primary hover:underline"
            >
              Restore all
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
