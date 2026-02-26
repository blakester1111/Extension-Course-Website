export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/admin/settings-form'

export const metadata = {
  title: 'Settings — FCDC Extension Courses',
}

export default async function SettingsPage() {
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

  // Get current settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')

  const settingsMap: Record<string, string> = {}
  for (const s of settings || []) {
    settingsMap[s.key] = s.value
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure site-wide settings</p>
      </div>

      <SettingsForm settings={settingsMap} />
    </div>
  )
}
