import {
  startOfDay,
  endOfDay,
  subDays,
  subWeeks,
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
  addDays,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isBefore,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export type PeriodMode = 'thisweek' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface PeriodParams {
  mode: PeriodMode
  from?: string // ISO date string for custom range
  to?: string   // ISO date string for custom range
  timezone?: string // IANA timezone string
}

interface PeriodBucket {
  label: string
  start: Date
  end: Date
}

const DEFAULT_TIMEZONE = 'America/New_York'

/**
 * Get the custom week boundary: Thursday 2:00 PM in the given timezone.
 * A "week" runs from Thursday 14:00 to the following Thursday 14:00.
 */
function getThursdayBoundary(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone)
  const day = zoned.getDay() // 0=Sun, 4=Thu
  const hours = zoned.getHours()

  // Find the most recent Thursday 2pm boundary
  let daysBack = (day - 4 + 7) % 7
  if (daysBack === 0 && hours < 14) {
    daysBack = 7 // Before 2pm Thursday means the period started last Thursday
  }

  const thursday = subDays(zoned, daysBack)
  const boundary = setMilliseconds(setSeconds(setMinutes(setHours(thursday, 14), 0), 0), 0)
  return fromZonedTime(boundary, timezone)
}

/**
 * Get the start of the current custom week (Thursday 2pm)
 */
export function getCurrentWeekStart(timezone: string = DEFAULT_TIMEZONE): Date {
  return getThursdayBoundary(new Date(), timezone)
}

/**
 * Get period buckets for charting based on mode
 */
export function getPeriodBuckets(params: PeriodParams): PeriodBucket[] {
  const tz = params.timezone || DEFAULT_TIMEZONE
  const now = new Date()
  const buckets: PeriodBucket[] = []

  if (params.mode === 'custom' && params.from && params.to) {
    // For custom range, auto-detect granularity
    const from = new Date(params.from)
    const to = new Date(params.to)
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 31) {
      // Daily buckets
      let cursor = startOfDay(from)
      while (isBefore(cursor, to) || cursor.getTime() === to.getTime()) {
        buckets.push({
          label: format(cursor, 'MMM d'),
          start: cursor,
          end: endOfDay(cursor),
        })
        cursor = addDays(cursor, 1)
      }
    } else if (diffDays <= 180) {
      // Weekly buckets using Thursday boundaries
      let weekStart = getThursdayBoundary(from, tz)
      while (isBefore(weekStart, to)) {
        const weekEnd = addDays(weekStart, 7)
        buckets.push({
          label: format(toZonedTime(weekStart, tz), 'MMM d'),
          start: weekStart,
          end: weekEnd,
        })
        weekStart = weekEnd
      }
    } else {
      // Monthly buckets
      let cursor = startOfMonth(from)
      while (isBefore(cursor, to)) {
        buckets.push({
          label: format(cursor, 'MMM yyyy'),
          start: cursor,
          end: endOfMonth(cursor),
        })
        cursor = startOfMonth(addDays(endOfMonth(cursor), 1))
      }
    }
    return buckets
  }

  switch (params.mode) {
    case 'thisweek': {
      // Current Thursday 2pm to next Thursday 2pm, broken into daily buckets
      const weekStart = getCurrentWeekStart(tz)
      const weekEnd = addDays(weekStart, 7)
      let cursor = weekStart
      while (isBefore(cursor, weekEnd)) {
        const nextDay = addDays(cursor, 1)
        const zonedCursor = toZonedTime(cursor, tz)
        buckets.push({
          label: format(zonedCursor, 'EEE MMM d'),
          start: cursor,
          end: isBefore(nextDay, weekEnd) ? nextDay : weekEnd,
        })
        cursor = nextDay
      }
      break
    }
    case 'daily': {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i)
        buckets.push({
          label: format(day, 'EEE'),
          start: startOfDay(day),
          end: endOfDay(day),
        })
      }
      break
    }
    case 'weekly': {
      // Last 12 weeks using Thursday 2pm boundaries
      const currentWeekStart = getCurrentWeekStart(tz)
      for (let i = 11; i >= 0; i--) {
        const weekStart = subWeeks(currentWeekStart, i)
        const weekEnd = addDays(weekStart, 7)
        buckets.push({
          label: format(toZonedTime(weekStart, tz), 'MMM d'),
          start: weekStart,
          end: weekEnd,
        })
      }
      break
    }
    case 'monthly': {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const month = subMonths(now, i)
        buckets.push({
          label: format(month, 'MMM'),
          start: startOfMonth(month),
          end: endOfMonth(month),
        })
      }
      break
    }
  }

  return buckets
}

/**
 * Get the "current" and "previous" period for comparison stats
 */
export function getComparisonPeriods(params: PeriodParams) {
  const tz = params.timezone || DEFAULT_TIMEZONE
  const now = new Date()

  switch (params.mode) {
    case 'thisweek': {
      const currentStart = getCurrentWeekStart(tz)
      const currentEnd = addDays(currentStart, 7)
      const prevStart = subWeeks(currentStart, 1)
      const prevEnd = currentStart
      return {
        current: { start: currentStart, end: currentEnd, label: 'this week' },
        previous: { start: prevStart, end: prevEnd, label: 'last week' },
      }
    }
    case 'daily': {
      const todayStart = startOfDay(now)
      const todayEnd = endOfDay(now)
      const yesterdayStart = startOfDay(subDays(now, 1))
      const yesterdayEnd = endOfDay(subDays(now, 1))
      return {
        current: { start: todayStart, end: todayEnd, label: 'today' },
        previous: { start: yesterdayStart, end: yesterdayEnd, label: 'yesterday' },
      }
    }
    case 'weekly': {
      const currentStart = getCurrentWeekStart(tz)
      const currentEnd = addDays(currentStart, 7)
      const prevStart = subWeeks(currentStart, 1)
      const prevEnd = currentStart
      return {
        current: { start: currentStart, end: currentEnd, label: 'this week' },
        previous: { start: prevStart, end: prevEnd, label: 'last week' },
      }
    }
    case 'monthly': {
      const currentStart = startOfMonth(now)
      const currentEnd = endOfMonth(now)
      const prevMonth = subMonths(now, 1)
      const prevStart = startOfMonth(prevMonth)
      const prevEnd = endOfMonth(prevMonth)
      return {
        current: { start: currentStart, end: currentEnd, label: 'this month' },
        previous: { start: prevStart, end: prevEnd, label: 'last month' },
      }
    }
    case 'custom': {
      // For custom, no comparison — just the range
      const from = params.from ? new Date(params.from) : subDays(now, 30)
      const to = params.to ? new Date(params.to) : now
      return {
        current: { start: from, end: to, label: 'selected range' },
        previous: null,
      }
    }
  }
}

export function parsePeriodParams(searchParams: Record<string, string | undefined>): PeriodParams {
  return {
    mode: (searchParams.mode as PeriodMode) || 'thisweek',
    from: searchParams.from,
    to: searchParams.to,
  }
}

/**
 * Generate a list of past weeks (Thursday-to-Thursday) for week selection.
 * Returns most recent first.
 */
export function getPastWeeks(count: number, timezone: string = DEFAULT_TIMEZONE): { label: string; start: Date; end: Date }[] {
  const currentStart = getCurrentWeekStart(timezone)
  const weeks: { label: string; start: Date; end: Date }[] = []

  for (let i = 0; i < count; i++) {
    const weekStart = subWeeks(currentStart, i)
    const weekEnd = addDays(weekStart, 7)
    const zonedStart = toZonedTime(weekStart, timezone)
    const zonedEnd = toZonedTime(weekEnd, timezone)
    const label = i === 0
      ? `This Week (${format(zonedStart, 'MMM d')} – ${format(zonedEnd, 'MMM d')})`
      : `${format(zonedStart, 'MMM d')} – ${format(zonedEnd, 'MMM d, yyyy')}`
    weeks.push({ label, start: weekStart, end: weekEnd })
  }

  return weeks
}
