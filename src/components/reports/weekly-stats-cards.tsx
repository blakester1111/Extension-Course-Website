'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, CheckCircle, GraduationCap, TrendingUp, TrendingDown } from 'lucide-react'

interface WeeklyStatsCardsProps {
  submittedCurrent: number
  submittedPrev: number
  activeCurrent: number
  activePrev: number
  passedCurrent: number
  passedPrev: number
  completionsCurrent: number
  completionsPrev: number
  comparisonLabel: string
  periodLabel: string
}

function getTrend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { pct: 100, direction: 'up' as const } : { pct: 0, direction: 'neutral' as const }
  const pct = Math.round(((current - previous) / previous) * 100)
  return {
    pct: Math.abs(pct),
    direction: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'neutral' as const,
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function WeeklyStatsCards(props: WeeklyStatsCardsProps) {
  const stats = [
    {
      label: `Submissions`,
      value: props.submittedCurrent,
      icon: FileText,
      trend: getTrend(props.submittedCurrent, props.submittedPrev),
      description: `Lessons submitted ${props.periodLabel}`,
    },
    {
      label: `Active Students`,
      value: props.activeCurrent,
      icon: Users,
      trend: getTrend(props.activeCurrent, props.activePrev),
      description: `Students who submitted ${props.periodLabel}`,
    },
    {
      label: `Lessons Passed`,
      value: props.passedCurrent,
      icon: CheckCircle,
      trend: getTrend(props.passedCurrent, props.passedPrev),
      description: `Graded as passed ${props.periodLabel}`,
    },
    {
      label: `Course Completions`,
      value: props.completionsCurrent,
      icon: GraduationCap,
      trend: getTrend(props.completionsCurrent, props.completionsPrev),
      description: `Courses fully completed ${props.periodLabel}`,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              {props.comparisonLabel && (
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend.direction === 'up' && (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">+{stat.trend.pct}%</span>
                    </>
                  )}
                  {stat.trend.direction === 'down' && (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500">-{stat.trend.pct}%</span>
                    </>
                  )}
                  {stat.trend.direction === 'neutral' && (
                    <span className="text-xs text-muted-foreground">No change</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">{props.comparisonLabel}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
