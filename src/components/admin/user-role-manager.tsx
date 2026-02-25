'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateUserRole } from '@/app/(dashboard)/admin/supervisors/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, UserCog } from 'lucide-react'
import type { Profile, UserRole } from '@/types/database'
import { toast } from 'sonner'

const roleBadge: Record<UserRole, { label: string; className: string }> = {
  student: { label: 'Student', className: 'bg-gray-500 text-white' },
  supervisor: { label: 'Supervisor', className: 'bg-blue-600 text-white' },
  admin: { label: 'Admin', className: 'bg-purple-600 text-white' },
  super_admin: { label: 'Super Admin', className: 'bg-red-600 text-white' },
}

export function UserRoleManager({ currentUserId, currentUserRole }: { currentUserId: string; currentUserRole: UserRole }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  async function handleSearch() {
    const trimmed = query.trim()
    if (!trimmed) return

    setSearching(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
      .order('full_name', { ascending: true })
      .limit(20)

    setResults(data || [])
    setSearching(false)
  }

  async function handleRoleChange(profileId: string, newRole: string) {
    if (profileId === currentUserId) {
      alert("You can't change your own role.")
      return
    }

    const confirmMsg = newRole === 'supervisor'
      ? 'Make this user a supervisor?'
      : newRole === 'student'
        ? 'Demote this user to student?'
        : newRole === 'admin'
          ? 'Promote this user to admin?'
          : `Change this user's role to ${newRole}?`

    if (!confirm(confirmMsg)) return

    setUpdating(profileId)
    const result = await updateUserRole(profileId, newRole)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setResults(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole as UserRole } : p))
      router.refresh()
    }
    setUpdating(null)
  }

  function renderActions(profile: Profile) {
    if (profile.id === currentUserId) {
      return <span className="text-xs text-muted-foreground">(you)</span>
    }

    const buttons: React.ReactNode[] = []

    if (profile.role === 'student') {
      buttons.push(
        <Button key="sup" size="sm" disabled={updating === profile.id} onClick={() => handleRoleChange(profile.id, 'supervisor')}>
          Make Supervisor
        </Button>
      )
    }

    if (profile.role === 'supervisor') {
      buttons.push(
        <Button key="dem" variant="outline" size="sm" disabled={updating === profile.id} onClick={() => handleRoleChange(profile.id, 'student')}>
          Demote to Student
        </Button>
      )
    }

    // Only super_admin can promote to admin or demote from admin
    if (currentUserRole === 'super_admin') {
      if (profile.role === 'student' || profile.role === 'supervisor') {
        buttons.push(
          <Button key="adm" size="sm" variant="secondary" disabled={updating === profile.id} onClick={() => handleRoleChange(profile.id, 'admin')}>
            Make Admin
          </Button>
        )
      }
      if (profile.role === 'admin') {
        buttons.push(
          <Button key="demadm" variant="outline" size="sm" disabled={updating === profile.id} onClick={() => handleRoleChange(profile.id, 'student')}>
            Demote to Student
          </Button>
        )
      }
    }

    return <div className="flex items-center gap-2">{buttons}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Search Users & Assign Roles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          />
          <Button onClick={handleSearch} disabled={searching}>
            <Search className="h-4 w-4 mr-2" />
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="border rounded-md divide-y">
            {results.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={roleBadge[profile.role]?.className}>
                    {roleBadge[profile.role]?.label}
                  </Badge>
                  {profile.is_staff && (
                    <Badge variant="outline" className="text-xs">Staff</Badge>
                  )}
                  {renderActions(profile)}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && query.trim() && !searching && (
          <p className="text-sm text-muted-foreground text-center py-4">No users found matching &quot;{query}&quot;</p>
        )}
      </CardContent>
    </Card>
  )
}
