import type { CourseCategory } from '@/types/database'

export function getStreakBadge(weeks: number) {
  if (weeks >= 52) return { label: 'Diamond', className: 'bg-cyan-100 text-cyan-800' }
  if (weeks >= 26) return { label: 'Platinum', className: 'bg-purple-100 text-purple-800' }
  if (weeks >= 12) return { label: 'Gold', className: 'bg-yellow-100 text-yellow-800' }
  if (weeks >= 4) return { label: 'Silver', className: 'bg-gray-100 text-gray-800' }
  if (weeks >= 1) return { label: 'Bronze', className: 'bg-orange-100 text-orange-800' }
  return null
}

export interface LeaderboardEntry {
  id: string
  studentName: string
  currentStreakWeeks: number
  longestStreakWeeks: number
  totalLessonsSubmitted: number
}

export interface HallOfFameEntry {
  studentName: string
  completedAt: string
}

export type HallOfFameData = Record<CourseCategory, HallOfFameEntry[]>

export const categoryLabels: Record<CourseCategory, string> = {
  basics: 'Basics',
  congresses: 'Congresses',
  accs: 'ACCs',
}

/**
 * Compute Hall of Fame data: students who have passed ALL lessons
 * in ALL published courses within a category.
 */
export async function fetchHallOfFame(
  supabase: any,
  staffOnly: boolean
): Promise<HallOfFameData> {
  // Get all published courses with category + lesson count
  const { data: courses } = await supabase
    .from('courses')
    .select('id, category, lesson_count')
    .eq('is_published', true)

  if (!courses || courses.length === 0) {
    return { basics: [], congresses: [], accs: [] }
  }

  // Group courses by category
  const coursesByCategory = new Map<CourseCategory, { id: string; lesson_count: number }[]>()
  for (const c of courses) {
    const list = coursesByCategory.get(c.category) || []
    list.push({ id: c.id, lesson_count: c.lesson_count })
    coursesByCategory.set(c.category, list)
  }

  // Get all student IDs with the correct staff flag, excluding deadfiled users
  const { data: eligibleProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_staff', staffOnly)
    .eq('is_deadfiled', false)

  if (!eligibleProfiles || eligibleProfiles.length === 0) {
    return { basics: [], congresses: [], accs: [] }
  }

  const profileMap = new Map<string, string>()
  const eligibleIds: string[] = []
  for (const p of eligibleProfiles) {
    profileMap.set(p.id, p.full_name)
    eligibleIds.push(p.id)
  }

  // Get all passed submissions for these students, grouped by student+course
  const { data: passedSubs } = await supabase
    .from('lesson_submissions')
    .select('student_id, lesson:lessons(course_id), graded_at')
    .eq('status', 'graded_pass')
    .in('student_id', eligibleIds)

  // Count passed lessons per student per course, track latest graded_at
  const passMap = new Map<string, { count: number; latestGradedAt: string | null }>()
  for (const sub of passedSubs || []) {
    const courseId = (sub.lesson as any)?.course_id
    if (!courseId) continue
    const key = `${sub.student_id}:${courseId}`
    const entry = passMap.get(key) || { count: 0, latestGradedAt: null }
    entry.count++
    if (sub.graded_at && (!entry.latestGradedAt || sub.graded_at > entry.latestGradedAt)) {
      entry.latestGradedAt = sub.graded_at
    }
    passMap.set(key, entry)
  }

  // For each category, find students who completed ALL courses in that category
  const result: HallOfFameData = { basics: [], congresses: [], accs: [] }

  for (const [category, categoryCourses] of coursesByCategory) {
    if (categoryCourses.length === 0) continue

    for (const studentId of eligibleIds) {
      let completedAll = true
      let latestDate: string | null = null

      for (const course of categoryCourses) {
        if (course.lesson_count === 0) continue
        const key = `${studentId}:${course.id}`
        const progress = passMap.get(key)
        if (!progress || progress.count < course.lesson_count) {
          completedAll = false
          break
        }
        if (progress.latestGradedAt && (!latestDate || progress.latestGradedAt > latestDate)) {
          latestDate = progress.latestGradedAt
        }
      }

      if (completedAll && latestDate) {
        result[category].push({
          studentName: profileMap.get(studentId) || 'Unknown',
          completedAt: latestDate,
        })
      }
    }

    // Sort by completion date (most recent first)
    result[category].sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  }

  return result
}

export interface MonthlyMvpResult {
  month: string
  publicMvp: { name: string; lessons: number } | null
  staffMvp: { name: string; lessons: number } | null
}

/**
 * Compute the Monthly MVP — the student who passed the most lessons
 * in the current calendar month, split by staff/public.
 */
export async function fetchMonthlyMvp(supabase: any): Promise<MonthlyMvpResult> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Get all passed submissions this month (exclude back-entered)
  const { data: subs } = await supabase
    .from('lesson_submissions')
    .select('student_id, graded_at')
    .eq('status', 'graded_pass')
    .eq('is_backentered', false)
    .gte('graded_at', monthStart)

  if (!subs || subs.length === 0) {
    return { month: monthName, publicMvp: null, staffMvp: null }
  }

  // Count per student
  const countMap = new Map<string, number>()
  for (const s of subs) {
    countMap.set(s.student_id, (countMap.get(s.student_id) || 0) + 1)
  }

  const studentIds = [...countMap.keys()]

  // Get profiles to split by staff flag, excluding deadfiled users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, is_staff')
    .in('id', studentIds)
    .eq('is_deadfiled', false)

  if (!profiles) {
    return { month: monthName, publicMvp: null, staffMvp: null }
  }

  let publicMvp: { name: string; lessons: number } | null = null
  let staffMvp: { name: string; lessons: number } | null = null

  for (const p of profiles) {
    const count = countMap.get(p.id) || 0
    if (p.is_staff) {
      if (!staffMvp || count > staffMvp.lessons) {
        staffMvp = { name: p.full_name, lessons: count }
      }
    } else {
      if (!publicMvp || count > publicMvp.lessons) {
        publicMvp = { name: p.full_name, lessons: count }
      }
    }
  }

  return { month: monthName, publicMvp, staffMvp }
}
