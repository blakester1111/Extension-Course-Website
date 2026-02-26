export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RevenueReport } from '@/components/reports/revenue-report'
import { DateRangeSelector } from '@/components/reports/date-range-selector'
import { getPeriodBuckets, parsePeriodParams } from '@/lib/report-periods'
import { ReportFilters } from '@/components/reports/report-filters'
import { resolveOrgDefault } from '@/lib/org-filter'
import { Suspense } from 'react'

export const metadata = {
  title: 'Revenue Report — FCDC Extension Courses',
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/login')
  }

  // Get timezone
  const { data: tzSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'timezone')
    .maybeSingle()
  const timezone = tzSetting?.value || 'America/New_York'

  const periodParams = { ...parsePeriodParams(params), timezone }
  const buckets = getPeriodBuckets(periodParams)

  const orgFilter = resolveOrgDefault(params.org, profile?.organization)
  const audienceFilter = params.audience || 'paid'

  // Get staff emails for audience filtering
  const { data: staffProfiles } = await supabase
    .from('profiles')
    .select('email')
    .eq('is_staff', true)
  const staffEmails = new Set((staffProfiles || []).map((p: any) => p.email.toLowerCase()))

  // Get all orders (optionally filtered by org)
  let ordersQuery = supabase
    .from('orders')
    .select('id, amount_cents, course_id, status, created_at, customer_first_name, customer_last_name, customer_email, organization')
    .order('created_at', { ascending: false })

  if (orgFilter === 'day' || orgFilter === 'foundation') {
    ordersQuery = ordersQuery.eq('organization', orgFilter)
  } else if (orgFilter === 'unassigned') {
    ordersQuery = ordersQuery.is('organization', null)
  }

  const { data: orders } = await ordersQuery

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')

  const courseMap = new Map((courses || []).map(c => [c.id, c.title]))

  // Filter by audience (paid vs staff)
  const filteredOrders = (orders || []).filter(o => {
    const isStaffOrder = staffEmails.has(o.customer_email.toLowerCase())
    return audienceFilter === 'staff' ? isStaffOrder : !isStaffOrder
  })

  const paidOrders = filteredOrders.filter(o => o.status === 'paid')
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

  // Chart data per bucket
  const chartData = buckets.map(bucket => {
    const bucketOrders = paidOrders.filter(o => {
      const d = new Date(o.created_at)
      return d >= bucket.start && d <= bucket.end
    })
    return {
      label: bucket.label,
      revenue: bucketOrders.reduce((sum, o) => sum + o.amount_cents, 0) / 100,
      orders: bucketOrders.length,
    }
  })

  // Recent orders (respects audience filter)
  const recentOrders = filteredOrders.slice(0, 20).map(o => ({
    id: o.id,
    customerName: `${o.customer_first_name} ${o.customer_last_name}`,
    customerEmail: o.customer_email,
    courseTitle: courseMap.get(o.course_id) || 'Unknown',
    amountCents: o.amount_cents,
    status: o.status,
    createdAt: o.created_at,
    organization: (o as any).organization || null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Report</h1>
        <p className="text-muted-foreground">Financial overview of course sales</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Suspense>
          <DateRangeSelector />
        </Suspense>
        <Suspense>
          <ReportFilters defaultOrg={orgFilter} />
        </Suspense>
      </div>

      <RevenueReport
        totalRevenue={totalRevenue}
        totalOrders={totalOrders}
        avgOrderValue={avgOrderValue}
        courseRevenue={courseRevenue}
        chartData={chartData}
        recentOrders={recentOrders}
        mode={periodParams.mode}
      />
    </div>
  )
}
