import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Flame, Award } from 'lucide-react'
import { getStreakBadge, type LeaderboardEntry } from '@/lib/honor-roll'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  title?: string
}

export function LeaderboardPodium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3)
  if (top3.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
      {top3.map((entry, index) => (
        <Card key={entry.id} className={index === 0 ? 'border-yellow-300 bg-yellow-50/50' : ''}>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold mb-1">
              {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
            </div>
            <p className="font-semibold">{entry.studentName}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{entry.currentStreakWeeks} week streak</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {entry.totalLessonsSubmitted} lessons completed
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function LeaderboardTable({ entries, title = 'Full Leaderboard' }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No streaks yet. Be the first to earn a spot!
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
              {entries.map((entry, index) => {
                const badge = getStreakBadge(entry.currentStreakWeeks)
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono font-bold">{index + 1}</TableCell>
                    <TableCell className="font-medium">{entry.studentName}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {entry.currentStreakWeeks} weeks
                      </span>
                    </TableCell>
                    <TableCell>{entry.longestStreakWeeks} weeks</TableCell>
                    <TableCell>{entry.totalLessonsSubmitted}</TableCell>
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
  )
}
