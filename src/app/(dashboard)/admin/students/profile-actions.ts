'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireStaffRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin', 'supervisor'].includes(profile.role)) {
    throw new Error('Not authorized')
  }
  return { supabase, user, role: profile.role }
}

async function requireAdminRole() {
  const { supabase, user, role } = await requireStaffRole()
  if (!['admin', 'super_admin'].includes(role)) {
    throw new Error('Admin access required')
  }
  return { supabase, user, role }
}

export async function updateProfileContact(
  profileId: string,
  fields: {
    phone?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    zip?: string | null
    country?: string | null
  }
) {
  const { supabase } = await requireStaffRole()

  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', profileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  revalidatePath('/supervisor/students')
  return { success: true }
}

export async function updateUserEmail(
  profileId: string,
  newEmail: string
) {
  await requireAdminRole()

  const trimmed = newEmail.trim().toLowerCase()
  if (!trimmed || !trimmed.includes('@')) {
    return { error: 'Invalid email address' }
  }

  // Use admin client to update auth user email (no confirmation needed)
  const adminSupabase = createAdminClient()
  const { error: authError } = await adminSupabase.auth.admin.updateUserById(
    profileId,
    { email: trimmed, email_confirm: true }
  )

  if (authError) return { error: authError.message }

  // Update profiles table directly (trigger will also fire, but this ensures immediate update)
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ email: trimmed })
    .eq('id', profileId)

  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/students')
  revalidatePath('/supervisor/students')
  return { success: true }
}
