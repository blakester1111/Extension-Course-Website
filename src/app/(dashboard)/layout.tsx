import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { UserProvider } from '@/components/providers/user-provider'

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <UserProvider initialUser={user} initialProfile={profile}>
      <div className="min-h-screen flex flex-col">
        <Topbar />
        {children}
      </div>
    </UserProvider>
  )
}
