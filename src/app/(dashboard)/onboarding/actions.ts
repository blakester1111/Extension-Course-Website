'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateProfileOnboarding(data: {
  fullName?: string
  studyRouteId?: string | null
  certMailPreference?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const update: Record<string, any> = {}
  if (data.fullName !== undefined) update.full_name = data.fullName
  if (data.studyRouteId !== undefined) update.study_route_id = data.studyRouteId
  if (data.certMailPreference !== undefined) update.cert_mail_preference = data.certMailPreference

  if (Object.keys(update).length === 0) return { success: true }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
