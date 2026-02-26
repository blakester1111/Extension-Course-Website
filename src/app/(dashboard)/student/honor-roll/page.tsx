export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { LeaderboardPodium, LeaderboardTable } from '@/components/honor-roll/leaderboard'
import { HallOfFame } from '@/components/honor-roll/hall-of-fame'
import { HonorRollTabs } from '@/components/honor-roll/honor-roll-tabs'
import { fetchHallOfFame, fetchMonthlyMvp, type LeaderboardEntry } from '@/lib/honor-roll'
import { MonthlyMvp } from '@/components/gamification/monthly-mvp'

export const metadata = {
  title: 'Honor Roll — FCDC Extension Course',
  description: 'Celebrate our top students and their weekly submission streaks.',
}

export default async function HonorRollPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_staff, role')
    .eq('id', user.id)
    .single()

  const isStaff = profile?.is_staff ?? false
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'supervisor'
  // Admins/supervisors always see both tabs; staff members see both tabs
  const showBothTabs = isStaff || isAdmin

  // Fetch all streaks with staff + deadfile flags
  const { data: streaks } = await supabase
    .from('honor_roll_streaks')
    .select('*, student:profiles(full_name, is_staff, is_deadfiled)')
    .gt('total_lessons_submitted', 0)
    .order('current_streak_weeks', { ascending: false })
    .order('total_lessons_submitted', { ascending: false })
    .limit(200)

  // Exclude deadfiled users from all leaderboards
  const activeStreaks = (streaks || []).filter((s: any) => !s.student?.is_deadfiled)

  function mapEntries(list: any[]): LeaderboardEntry[] {
    return list.map((entry: any) => ({
      id: entry.id,
      studentName: entry.student?.full_name || 'Anonymous',
      currentStreakWeeks: entry.current_streak_weeks,
      longestStreakWeeks: entry.longest_streak_weeks,
      totalLessonsSubmitted: entry.total_lessons_submitted,
    }))
  }

  const publicEntries = mapEntries(
    activeStreaks.filter((s: any) => !s.student?.is_staff).slice(0, 100)
  )

  const publicHallOfFame = await fetchHallOfFame(supabase, false)
  const mvpData = await fetchMonthlyMvp(supabase)

  // If public student (not staff and not admin), just show public leaderboard
  if (!showBothTabs) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
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

  // Staff user: show both Public and Staff tabs
  const staffEntries = mapEntries(
    activeStreaks.filter((s: any) => s.student?.is_staff).slice(0, 100)
  )

  const staffHallOfFame = await fetchHallOfFame(supabase, true)

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Trophy className="h-12 w-12 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold">Honor Roll</h1>
        <p className="text-muted-foreground mt-2">
          Recognizing our most dedicated students and their weekly submission streaks.
        </p>
      </div>

      <HonorRollTabs
        publicEntries={publicEntries}
        staffEntries={staffEntries}
        publicHallOfFame={publicHallOfFame}
        staffHallOfFame={staffHallOfFame}
        mvpData={mvpData}
        showStaffTab={true}
      />
    </div>
  )
}
