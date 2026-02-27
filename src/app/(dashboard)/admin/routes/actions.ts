'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Not authorized')
  }

  return { supabase, user }
}

export async function createRoute(name: string, description: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('study_routes')
    .insert({ name: name.trim(), description: description.trim() || null })

  if (error) {
    if (error.code === '23505') return { error: 'A route with this name already exists' }
    return { error: error.message }
  }

  revalidatePath('/admin/routes')
  return { success: true }
}

export async function deleteRoute(routeId: string) {
  const { supabase } = await requireAdmin()

  // Check if any students are assigned to this route
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('study_route_id', routeId)

  if (count && count > 0) {
    return { error: `Cannot delete: ${count} student(s) are assigned to this route. Reassign them first.` }
  }

  const { error } = await supabase
    .from('study_routes')
    .delete()
    .eq('id', routeId)

  if (error) return { error: error.message }

  revalidatePath('/admin/routes')
  return { success: true }
}

export async function updateRouteCourses(
  routeId: string,
  courseIds: string[]
) {
  const { supabase } = await requireAdmin()

  // Delete existing courses for this route
  await supabase
    .from('study_route_courses')
    .delete()
    .eq('route_id', routeId)

  // Insert new course list with positions
  if (courseIds.length > 0) {
    const rows = courseIds.map((courseId, idx) => ({
      route_id: routeId,
      course_id: courseId,
      position: idx + 1,
    }))

    const { error } = await supabase
      .from('study_route_courses')
      .insert(rows)

    if (error) return { error: error.message }
  }

  revalidatePath('/admin/routes')
  return { success: true }
}

export async function assignStudentRoute(studentId: string, routeId: string | null) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ study_route_id: routeId })
    .eq('id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  return { success: true }
}
