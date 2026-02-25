export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Award } from 'lucide-react'

export const metadata = {
  title: 'Honor Roll — FCDC Extension Course',
  description: 'Celebrate our top students and their weekly submission streaks.',
}

function getStreakBadge(weeks: number) {
  if (weeks >= 52) return { label: 'Diamond', className: 'bg-cyan-100 text-cyan-800' }
  if (weeks >= 26) return { label: 'Platinum', className: 'bg-purple-100 text-purple-800' }
  if (weeks >= 12) return { label: 'Gold', className: 'bg-yellow-100 text-yellow-800' }
  if (weeks >= 4) return { label: 'Silver', className: 'bg-gray-100 text-gray-800' }
  if (weeks >= 1) return { label: 'Bronze', className: 'bg-orange-100 text-orange-800' }
  return null
}

export default async function HonorRollPage() {
  const supabase = await createClient()

  const { data: streaks } = await supabase
    .from('honor_roll_streaks')
    .select('*, student:profiles(full_name)')
    .gt('total_lessons_submitted', 0)
    .order('current_streak_weeks', { ascending: false })
    .order('total_lessons_submitted', { ascending: false })
    .limit(100)

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {(streaks || []).slice(0, 3).map((entry: any, index: number) => (
          <Card key={entry.id} className={index === 0 ? 'border-yellow-300 bg-yellow-50/50' : ''}>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold mb-1">
                {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
              </div>
              <p className="font-semibold">{entry.student?.full_name || 'Anonymous'}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{entry.current_streak_weeks} week streak</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {entry.total_lessons_submitted} lessons completed
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Full Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!streaks || streaks.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No streaks yet. Be the first to earn a spot on the honor roll!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Current Streak</TableHead>
                  <TableHead>Longest Streak</TableHead>
                  <TableHead>Total Lessons</TableHead>
                  <TableHead>Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streaks.map((entry: any, index: number) => {
                  const badge = getStreakBadge(entry.current_streak_weeks)
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono font-bold">{index + 1}</TableCell>
                      <TableCell className="font-medium">{entry.student?.full_name || 'Anonymous'}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {entry.current_streak_weeks} weeks
                        </span>
                      </TableCell>
                      <TableCell>{entry.longest_streak_weeks} weeks</TableCell>
                      <TableCell>{entry.total_lessons_submitted}</TableCell>
                      <TableCell>
                        {badge && <Badge className={badge.className}>{badge.label}</Badge>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
