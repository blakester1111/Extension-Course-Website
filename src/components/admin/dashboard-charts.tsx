'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = {
  blue: 'hsl(221 83% 53%)',
  green: 'hsl(142 71% 45%)',
  amber: 'hsl(38 92% 50%)',
  red: 'hsl(0 72% 51%)',
  purple: 'hsl(262 83% 58%)',
  cyan: 'hsl(192 91% 36%)',
}

const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.cyan, COLORS.red]

interface WeeklyActivityData {
  label: string
  submitted: number
  passed: number
}

interface CourseEnrollmentData {
  name: string
  enrolled: number
}

interface OrgBreakdownData {
  name: string
  value: number
}

interface MonthlyTrendData {
  label: string
  submissions: number
  completions: number
}

export function WeeklyActivityChart({ data }: { data: WeeklyActivityData[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">This Week — Submissions vs Passes</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e5e5' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="submitted" name="Submitted" fill={COLORS.blue} radius={[3, 3, 0, 0]} />
              <Bar dataKey="passed" name="Passed" fill={COLORS.green} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function CourseEnrollmentChart({ data }: { data: CourseEnrollmentData[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Enrollments by Course</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                width={140}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e5e5' }}
              />
              <Bar dataKey="enrolled" name="Enrolled" fill={COLORS.blue} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function PieLegend({ data, colors }: { data: OrgBreakdownData[]; colors: string[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
          <span className="text-muted-foreground">
            {d.name}: <span className="font-medium text-foreground">{d.value}</span>
            {total > 0 && <span className="ml-0.5">({Math.round(d.value / total * 100)}%)</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

export function OrgBreakdownChart({ data, title = 'Students by Organization' }: { data: OrgBreakdownData[]; title?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e5e5' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <PieLegend data={data} colors={PIE_COLORS} />
      </CardContent>
    </Card>
  )
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrendData[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Monthly Trends — Submissions & Completions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e5e5' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="submissions"
                name="Submissions"
                stroke={COLORS.blue}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="completions"
                name="Completions"
                stroke={COLORS.green}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function StaffVsPublicChart({ data }: { data: OrgBreakdownData[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Staff vs Public Students</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={[COLORS.blue, COLORS.amber][i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e5e5' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <PieLegend data={data} colors={[COLORS.blue, COLORS.amber]} />
      </CardContent>
    </Card>
  )
}
