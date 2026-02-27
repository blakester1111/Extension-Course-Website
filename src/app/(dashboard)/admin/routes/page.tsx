export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RouteManager } from '@/components/admin/route-manager'

export const metadata = {
  title: 'Study Routes — FCDC Extension Courses',
}

export default async function AdminRoutesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/student/dashboard')
  }

  // Get all routes with their courses
  const { data: routes } = await supabase
    .from('study_routes')
    .select('*')
    .order('name')

  const { data: routeCourses } = await supabase
    .from('study_route_courses')
    .select('*, course:courses(id, title, category)')
    .order('position')

  // Get all published courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, category, sort_order')
    .eq('is_published', true)
    .order('sort_order')

  // Build route data with courses
  const routeData = (routes || []).map(route => ({
    ...route,
    courses: (routeCourses || [])
      .filter(rc => rc.route_id === route.id)
      .map(rc => ({
        id: rc.id,
        courseId: rc.course_id,
        position: rc.position,
        title: (rc.course as any)?.title || 'Unknown',
        category: (rc.course as any)?.category || 'basics',
      })),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Study Routes</h1>
        <p className="text-muted-foreground">
          Define study routes that sequence courses across categories. Students can be assigned a route to guide their next course suggestions.
        </p>
      </div>
      <RouteManager
        routes={routeData}
        allCourses={(courses || []).map(c => ({ id: c.id, title: c.title, category: c.category }))}
      />
    </div>
  )
}
