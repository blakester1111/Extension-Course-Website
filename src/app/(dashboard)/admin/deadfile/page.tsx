export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DeadfileList } from '@/components/admin/deadfile-list'

export const metadata = {
  title: 'Deadfile — Admin',
}

export default async function DeadfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/login')
  }

  // Get all deadfiled users
  const { data: deadfiled } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_staff, deadfiled_at, deadfile_reason, deadfiled_by')
    .eq('is_deadfiled', true)
    .order('deadfiled_at', { ascending: false })

  // Resolve deadfiled_by names
  const deadfiledByIds = [...new Set((deadfiled || []).map((u: any) => u.deadfiled_by).filter(Boolean))]
  let deadfiledByMap = new Map<string, string>()
  if (deadfiledByIds.length > 0) {
    const { data: byProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', deadfiledByIds)
    for (const p of byProfiles || []) {
      deadfiledByMap.set(p.id, p.full_name)
    }
  }

  // Get non-admin, non-deadfiled users who can be deadfiled
  const { data: activeUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('is_deadfiled', false)
    .not('role', 'in', '("admin","super_admin")')
    .order('full_name')

  const deadfiledList = (deadfiled || []).map((u: any) => ({
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    role: u.role,
    isStaff: u.is_staff,
    deadfiledAt: u.deadfiled_at,
    reason: u.deadfile_reason,
    deadfiledBy: u.deadfiled_by ? (deadfiledByMap.get(u.deadfiled_by) || 'Unknown') : 'Unknown',
  }))

  const activeUserList = (activeUsers || []).map((u: any) => ({
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    role: u.role,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deadfile</h1>
        <p className="text-muted-foreground">
          Users who have been removed from active status. Deadfiled users cannot sign in and are excluded from all honor roll and hall of fame listings.
        </p>
      </div>

      <DeadfileList
        deadfiled={deadfiledList}
        activeUsers={activeUserList}
      />
    </div>
  )
}
