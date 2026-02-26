'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Zap, TrendingUp, Trophy } from 'lucide-react'
import { getStreakBadge } from '@/lib/honor-roll'
import { Badge } from '@/components/ui/badge'

interface PersonalStatsProps {
  currentStreak: number
  longestStreak: number
  totalLessons: number
  personalBestWeek: number // most lessons passed in a single week
  honorRank: number | null // position in leaderboard, null if not ranked
}

export function PersonalStats({
  currentStreak,
  longestStreak,
  totalLessons,
  personalBestWeek,
  honorRank,
}: PersonalStatsProps) {
  const badge = getStreakBadge(currentStreak)

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
      <Card>
        <CardContent className="pt-4 pb-4 text-center">
          <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
          <p className="text-2xl font-bold">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Week Streak</p>
          {badge && (
            <Badge variant="outline" className={`mt-1 text-xs ${badge.className}`}>
              {badge.label}
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{longestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4 text-center">
          <Zap className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
          <p className="text-2xl font-bold">{personalBestWeek}</p>
          <p className="text-xs text-muted-foreground">Best Week</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4 text-center">
          <Trophy className="h-5 w-5 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{totalLessons}</p>
          <p className="text-xs text-muted-foreground">Total Passed</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4 text-center">
          <Trophy className="h-5 w-5 mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold">{honorRank ? `#${honorRank}` : '—'}</p>
          <p className="text-xs text-muted-foreground">Leaderboard</p>
        </CardContent>
      </Card>
    </div>
  )
}
