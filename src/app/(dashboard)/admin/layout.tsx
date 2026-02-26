import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import type { UserRole } from '@/types/database'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: UserRole = 'admin'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'super_admin') role = 'super_admin'
  }

  return (
    <div className="flex flex-1">
      <Sidebar role={role} />
      <main className="flex-1 min-w-0 p-6 overflow-x-auto">{children}</main>
    </div>
  )
}
