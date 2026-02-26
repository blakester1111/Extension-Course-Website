'use client'

import { useState } from 'react'
import type { LeaderboardEntry, HallOfFameData, MonthlyMvpResult } from '@/lib/honor-roll'
import { LeaderboardPodium, LeaderboardTable } from '@/components/honor-roll/leaderboard'
import { HallOfFame } from '@/components/honor-roll/hall-of-fame'
import { MonthlyMvp } from '@/components/gamification/monthly-mvp'

interface HonorRollTabsProps {
  publicEntries: LeaderboardEntry[]
  staffEntries: LeaderboardEntry[]
  publicHallOfFame: HallOfFameData
  staffHallOfFame: HallOfFameData
  mvpData: MonthlyMvpResult
  showStaffTab: boolean
}

export function HonorRollTabs({
  publicEntries,
  staffEntries,
  publicHallOfFame,
  staffHallOfFame,
  mvpData,
  showStaffTab,
}: HonorRollTabsProps) {
  const [tab, setTab] = useState<'public' | 'staff'>('public')

  const entries = tab === 'staff' ? staffEntries : publicEntries
  const hallOfFameData = tab === 'staff' ? staffHallOfFame : publicHallOfFame

  return (
    <>
      {showStaffTab && (
        <div className="flex justify-center">
          <div className="flex rounded-lg border bg-muted p-0.5">
            <button
              onClick={() => setTab('public')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === 'public'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setTab('staff')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === 'staff'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Staff
            </button>
          </div>
        </div>
      )}

      <MonthlyMvp data={mvpData} showStaff={true} />
      <LeaderboardPodium entries={entries} />
      <LeaderboardTable
        entries={entries}
        title={tab === 'staff' ? 'Staff Leaderboard' : 'Full Leaderboard'}
      />
      <HallOfFame
        data={hallOfFameData}
        title={tab === 'staff' ? 'Staff Hall of Fame' : 'Hall of Fame'}
      />
    </>
  )
}
