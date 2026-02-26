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

/** Deadfile a public user — blocks sign-in and strips from honor roll */
export async function deadfileUser(profileId: string, reason: string) {
  const { supabase, user } = await requireAdmin()

  // Verify the target is not an admin
  const { data: target } = await supabase
    .from('profiles')
    .select('role, is_deadfiled')
    .eq('id', profileId)
    .single()

  if (!target) return { error: 'User not found' }
  if (['admin', 'super_admin'].includes(target.role)) {
    return { error: 'Cannot deadfile admin users' }
  }
  if (target.is_deadfiled) return { error: 'User is already deadfiled' }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_deadfiled: true,
      deadfiled_at: new Date().toISOString(),
      deadfiled_by: user.id,
      deadfile_reason: reason.trim() || null,
    })
    .eq('id', profileId)

  if (error) return { error: error.message }

  // Reset their honor roll streak to 0 so they don't appear in any cached views
  await supabase
    .from('honor_roll_streaks')
    .update({ current_streak_weeks: 0 })
    .eq('student_id', profileId)

  revalidatePath('/admin/deadfile')
  revalidatePath('/admin/students')
  revalidatePath('/honor-roll')
  return { success: true }
}

/** Restore a deadfiled user — re-enables sign-in */
export async function restoreUser(profileId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({
      is_deadfiled: false,
      deadfiled_at: null,
      deadfiled_by: null,
      deadfile_reason: null,
    })
    .eq('id', profileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/deadfile')
  revalidatePath('/admin/students')
  return { success: true }
}
