export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Trophy } from 'lucide-react'
import { LeaderboardPodium, LeaderboardTable } from '@/components/honor-roll/leaderboard'
import { HallOfFame } from '@/components/honor-roll/hall-of-fame'
import { fetchHallOfFame, fetchMonthlyMvp, type LeaderboardEntry } from '@/lib/honor-roll'
import { MonthlyMvp } from '@/components/gamification/monthly-mvp'

export const metadata = {
  title: 'Honor Roll — FCDC Extension Courses',
  description: 'Celebrate our top students and their weekly submission streaks.',
}

export default async function HonorRollPage() {
  const supabase = await createClient()

  // Only show non-staff, non-deadfiled (public) students on the public page
  const { data: streaks } = await supabase
    .from('honor_roll_streaks')
    .select('*, student:profiles(full_name, is_staff, is_deadfiled)')
    .gt('total_lessons_submitted', 0)
    .order('current_streak_weeks', { ascending: false })
    .order('total_lessons_submitted', { ascending: false })
    .limit(200)

  const publicEntries: LeaderboardEntry[] = (streaks || [])
    .filter((s: any) => !s.student?.is_staff && !s.student?.is_deadfiled)
    .slice(0, 100)
    .map((entry: any) => ({
      id: entry.id,
      studentName: entry.student?.full_name || 'Anonymous',
      currentStreakWeeks: entry.current_streak_weeks,
      longestStreakWeeks: entry.longest_streak_weeks,
      totalLessonsSubmitted: entry.total_lessons_submitted,
    }))

  const publicHallOfFame = await fetchHallOfFame(supabase, false)
  const mvpData = await fetchMonthlyMvp(supabase)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Trophy className="h-12 w-12 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold">Honor Roll</h1>
        <p className="text-muted-foreground mt-2">
          Recognizing our most dedicated students and their weekly submission streaks.
        </p>
      </div>

      <MonthlyMvp data={mvpData} showStaff={false} />
      <LeaderboardPodium entries={publicEntries} />
      <LeaderboardTable entries={publicEntries} />
      <HallOfFame data={publicHallOfFame} />
    </div>
  )
}
