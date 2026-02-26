export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RevenueReport } from '@/components/reports/revenue-report'
import { startOfMonth, subMonths, format, endOfMonth } from 'date-fns'

export const metadata = {
  title: 'Revenue Report — FCDC Extension Courses',
}

export default async function RevenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/login')
  }

  // Get all paid orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, amount_cents, course_id, status, created_at, customer_first_name, customer_last_name, customer_email')
    .order('created_at', { ascending: false })

  // Get courses for labeling
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')

  const courseMap = new Map((courses || []).map(c => [c.id, c.title]))

  const paidOrders = (orders || []).filter(o => o.status === 'paid')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount_cents, 0)
  const totalOrders = paidOrders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Revenue per course
  const revenuePerCourse = new Map<string, { title: string; revenue: number; count: number }>()
  for (const order of paidOrders) {
    const title = courseMap.get(order.course_id) || 'Unknown'
    const entry = revenuePerCourse.get(order.course_id) || { title, revenue: 0, count: 0 }
    entry.revenue += order.amount_cents
    entry.count++
    revenuePerCourse.set(order.course_id, entry)
  }

  const courseRevenue = Array.from(revenuePerCourse.values())
    .sort((a, b) => b.revenue - a.revenue)

  // Monthly revenue (last 12 months)
  const now = new Date()
  const monthlyData: { month: string; revenue: number; orders: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthEnd = endOfMonth(monthStart)
    const monthOrders = paidOrders.filter(o => {
      const d = new Date(o.created_at)
      return d >= monthStart && d <= monthEnd
    })

    monthlyData.push({
      month: format(monthStart, 'MMM yyyy'),
      revenue: monthOrders.reduce((sum, o) => sum + o.amount_cents, 0) / 100,
      orders: monthOrders.length,
    })
  }

  // Recent orders
  const recentOrders = (orders || []).slice(0, 20).map(o => ({
    id: o.id,
    customerName: `${o.customer_first_name} ${o.customer_last_name}`,
    customerEmail: o.customer_email,
    courseTitle: courseMap.get(o.course_id) || 'Unknown',
    amountCents: o.amount_cents,
    status: o.status,
    createdAt: o.created_at,
  }))

  return (
    <RevenueReport
      totalRevenue={totalRevenue}
      totalOrders={totalOrders}
      avgOrderValue={avgOrderValue}
      courseRevenue={courseRevenue}
      monthlyData={monthlyData}
      recentOrders={recentOrders}
    />
  )
}
