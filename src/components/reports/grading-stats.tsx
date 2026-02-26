'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, Target, Star } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SupervisorGradingData {
  name: string
  graded: number
  avgTurnaroundHours: number
  firstPassRate: number
  passed: number
  corrections: number
}

interface GradingStatsProps {
  totalGraded: number
  gradedThisWeek: number
  avgTurnaroundHours: number
  firstPassRate: number
  avgGrade: number
  supervisors: SupervisorGradingData[]
  weeklyData: { week: string; count: number }[]
}

function formatTurnaround(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${Math.round(hours)}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}

export function GradingStats({
  totalGraded,
  gradedThisWeek,
  avgTurnaroundHours,
  firstPassRate,
  avgGrade,
  supervisors,
  weeklyData,
}: GradingStatsProps) {
  const stats = [
    {
      label: 'Graded This Week',
      value: gradedThisWeek.toString(),
      subtitle: `${totalGraded} total all time`,
      icon: CheckCircle,
    },
    {
      label: 'Avg. Turnaround',
      value: formatTurnaround(avgTurnaroundHours),
      subtitle: 'From submission to graded',
      icon: Clock,
    },
    {
      label: 'First-Pass Rate',
      value: `${firstPassRate}%`,
      subtitle: 'Pass without corrections',
      icon: Target,
    },
    {
      label: 'Avg. Grade',
      value: avgGrade > 0 ? avgGrade.toFixed(1) : '—',
      subtitle: 'Across all graded lessons',
      icon: Star,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Weekly grading chart */}
      <Card>
        <CardHeader>
          <CardTitle>Lessons Graded Per Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="week"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Graded"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Supervisor breakdown */}
      {supervisors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supervisor Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Total Graded</TableHead>
                  <TableHead>Avg. Turnaround</TableHead>
                  <TableHead>First-Pass Rate</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Corrections</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisors.map(sup => (
                  <TableRow key={sup.name}>
                    <TableCell className="font-medium">{sup.name}</TableCell>
                    <TableCell>{sup.graded}</TableCell>
                    <TableCell>{formatTurnaround(sup.avgTurnaroundHours)}</TableCell>
                    <TableCell>
                      <Badge variant={sup.firstPassRate >= 80 ? 'default' : 'secondary'}>
                        {sup.firstPassRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-600">{sup.passed}</TableCell>
                    <TableCell className="text-orange-500">{sup.corrections}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
