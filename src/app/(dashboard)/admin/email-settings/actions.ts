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

  return supabase
}

export async function saveEmailTemplate(
  key: 'nudge' | 'welcome' | 'registration',
  template: { subject: string; body: string; signature: string },
) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('site_settings')
    .upsert({
      key: `email_template_${key}`,
      value: JSON.stringify(template),
      updated_at: new Date().toISOString(),
    })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/email-settings')
  return { success: true }
}

export async function saveSaleRecipients(
  recipients: { day: string[]; foundation: string[]; unknown: string[] },
) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('site_settings')
    .upsert({
      key: 'email_recipients_sale',
      value: JSON.stringify(recipients),
      updated_at: new Date().toISOString(),
    })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/email-settings')
  return { success: true }
}

export async function saveRegistrationRecipients(recipients: string[]) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('site_settings')
    .upsert({
      key: 'email_recipients_registration',
      value: JSON.stringify(recipients),
      updated_at: new Date().toISOString(),
    })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/email-settings')
  return { success: true }
}
