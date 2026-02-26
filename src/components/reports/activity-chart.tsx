'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ActivityChartProps {
  data: { label: string; submitted: number; passed: number }[]
  mode: string
}

const modeLabels: Record<string, string> = {
  thisweek: 'This Week Activity (Thu–Thu)',
  daily: 'Daily Activity (Last 7 Days)',
  weekly: 'Weekly Activity (Last 12 Weeks)',
  monthly: 'Monthly Activity (Last 12 Months)',
  custom: 'Activity (Custom Range)',
}

export function ActivityChart({ data, mode }: ActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{modeLabels[mode] || 'Activity'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="submitted"
                name="Submitted"
                stroke="hsl(221 83% 53%)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(221 83% 53%)' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="passed"
                name="Passed"
                stroke="hsl(142 71% 45%)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(142 71% 45%)' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
