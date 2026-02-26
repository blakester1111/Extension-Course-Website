import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get current ISO week
  const now = new Date()
  const currentWeek = getISOWeek(now)

  // Reset streaks for students who missed the previous week (skip deadfiled users)
  const { data: deadfiledIds } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_deadfiled', true)

  const deadfiledSet = new Set((deadfiledIds || []).map((p: any) => p.id))

  const { data: streaks } = await supabase
    .from('honor_roll_streaks')
    .select('*')
    .gt('current_streak_weeks', 0)

  let resetCount = 0

  for (const streak of streaks || []) {
    // Skip deadfiled users — their streaks were already zeroed on deadfile
    if (deadfiledSet.has(streak.student_id)) continue

    if (streak.last_submission_week && streak.last_submission_week < currentWeek) {
      // Check if the gap is more than 1 week
      const lastWeekDate = parseISOWeek(streak.last_submission_week)
      const daysSince = Math.floor((now.getTime() - lastWeekDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSince > 13) { // More than ~2 weeks ago
        await supabase
          .from('honor_roll_streaks')
          .update({ current_streak_weeks: 0 })
          .eq('id', streak.id)
        resetCount++
      }
    }
  }

  return NextResponse.json({
    message: `Streak maintenance complete. Reset ${resetCount} streaks.`,
    currentWeek,
  })
}

function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function parseISOWeek(weekStr: string): Date {
  const [year, week] = weekStr.split('-W').map(Number)
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  return new Date(jan4.getTime() + ((week - 1) * 7 + 1 - dayOfWeek) * 86400000)
}
