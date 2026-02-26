'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, Target, AlertTriangle } from 'lucide-react'
import {
  LineChart,
  Line,
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
  passRate: number
  passed: number
  corrections: number
}

interface GradingStatsProps {
  totalGraded: number
  gradedCurrentPeriod: number
  avgTurnaroundHours: number
  passRate: number
  correctionRate: number
  avgGrade: number
  supervisors: SupervisorGradingData[]
  chartData: { label: string; graded: number }[]
  mode: string
}

function formatTurnaround(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${Math.round(hours)}h`
  const days = Math.round(hours / 24 * 10) / 10
  return `${days}d`
}

const modeLabels: Record<string, string> = {
  thisweek: 'Grading Activity (This Week)',
  daily: 'Grading Activity (Last 7 Days)',
  weekly: 'Grading Activity (Last 12 Weeks)',
  monthly: 'Grading Activity (Last 12 Months)',
  custom: 'Grading Activity (Custom Range)',
}

export function GradingStats({
  totalGraded,
  gradedCurrentPeriod,
  avgTurnaroundHours,
  passRate,
  correctionRate,
  avgGrade,
  supervisors,
  chartData,
  mode,
}: GradingStatsProps) {
  const stats = [
    {
      label: 'Graded (Current Period)',
      value: gradedCurrentPeriod.toString(),
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
      label: 'Pass Rate',
      value: `${passRate}%`,
      subtitle: 'Of graded submissions that passed',
      icon: Target,
    },
    {
      label: 'Correction Rate',
      value: `${correctionRate}%`,
      subtitle: 'Of graded submissions needing corrections',
      icon: AlertTriangle,
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

      <Card>
        <CardHeader>
          <CardTitle>{modeLabels[mode] || 'Grading Activity'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
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
                <Line
                  type="monotone"
                  dataKey="graded"
                  name="Graded"
                  stroke="hsl(221 83% 53%)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'hsl(221 83% 53%)' }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
                  <TableHead>Pass Rate</TableHead>
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
                      <Badge variant={sup.passRate >= 80 ? 'default' : 'secondary'}>
                        {sup.passRate}%
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
