export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/student/profile-form'

export const metadata = {
  title: 'Profile — FCDC Extension Courses',
}

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch supervisor name separately to avoid self-join RLS issues
  let supervisorName: string | null = null
  if (profile.supervisor_id) {
    const { data: supervisor } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', profile.supervisor_id)
      .single()
    supervisorName = supervisor?.full_name || null
  }

  // Fetch study route name
  let currentRouteName: string | null = null
  if (profile.study_route_id) {
    const { data: route } = await supabase
      .from('study_routes')
      .select('name')
      .eq('id', profile.study_route_id)
      .single()
    currentRouteName = route?.name || null
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <ProfileForm profile={profile} supervisorName={supervisorName} currentRouteName={currentRouteName} />
    </div>
  )
}
