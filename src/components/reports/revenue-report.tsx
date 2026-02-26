'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface RevenueReportProps {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  courseRevenue: { title: string; revenue: number; count: number }[]
  chartData: { label: string; revenue: number; orders: number }[]
  recentOrders: {
    id: string
    customerName: string
    customerEmail: string
    courseTitle: string
    amountCents: number
    status: string
    createdAt: string
    organization?: string | null
  }[]
  mode: string
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

const modeLabels: Record<string, string> = {
  thisweek: 'Revenue (This Week)',
  daily: 'Revenue (Last 7 Days)',
  weekly: 'Revenue (Last 12 Weeks)',
  monthly: 'Revenue (Last 12 Months)',
  custom: 'Revenue (Custom Range)',
}

export function RevenueReport({
  totalRevenue,
  totalOrders,
  avgOrderValue,
  courseRevenue,
  chartData,
  recentOrders,
  mode,
}: RevenueReportProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCents(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Paid orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCents(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{modeLabels[mode] || 'Revenue'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value: number) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'hsl(142 71% 45%)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Course</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseRevenue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">No sales yet</TableCell>
                </TableRow>
              ) : (
                courseRevenue.map(c => (
                  <TableRow key={c.title}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.count}</TableCell>
                    <TableCell className="font-semibold">{formatCents(c.revenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Org</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No orders yet</TableCell>
                </TableRow>
              ) : (
                recentOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.courseTitle}</Badge>
                    </TableCell>
                    <TableCell>
                      {order.organization ? (
                        <Badge variant="secondary" className="text-xs capitalize">{order.organization}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCents(order.amountCents)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'paid' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
