export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserRoleManager } from '@/components/admin/user-role-manager'
import type { UserRole } from '@/types/database'

export const metadata = {
  title: 'Manage Supervisors — Admin',
}

export default async function AdminSupervisorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: supervisors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'supervisor')
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supervisors</h1>
        <p className="text-muted-foreground">Manage supervisor accounts</p>
      </div>

      <UserRoleManager currentUserId={user.id} currentUserRole={(profile?.role as UserRole) || 'admin'} />

      <Card>
        <CardHeader>
          <CardTitle>Current Supervisors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!supervisors || supervisors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No supervisors yet. Use the search above to assign one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisors.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-600 text-white">Supervisor</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
