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

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) throw new Error('Not authorized')
  return { supabase, user, profile }
}

export async function updateUserRole(profileId: string, role: string) {
  const { supabase, user, profile: callerProfile } = await requireAdmin()

  // Only super_admin can promote to admin/super_admin or demote existing admins
  if (role === 'admin' || role === 'super_admin') {
    if (callerProfile.role !== 'super_admin') {
      return { error: 'Only super_admin can promote users to admin' }
    }
  }

  // Check if target is currently an admin — only super_admin can modify them
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', profileId)
    .single()

  if (targetProfile?.role === 'admin' || targetProfile?.role === 'super_admin') {
    if (callerProfile.role !== 'super_admin') {
      return { error: 'Only super_admin can modify admin accounts' }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/supervisors')
  revalidatePath('/admin/students')
  revalidatePath('/admin/admins')
}

export async function assignSupervisor(studentId: string, supervisorId: string | null) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ supervisor_id: supervisorId })
    .eq('id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
}

export async function toggleStaffStatus(profileId: string, isStaff: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ is_staff: isStaff })
    .eq('id', profileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
}
