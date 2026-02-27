'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateUserRole } from '@/app/(dashboard)/admin/supervisors/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types/database'

interface Props {
  profileId: string
  currentRole: UserRole
  currentUserId: string
  currentUserRole: UserRole
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Admin' },
]

export function UserRoleSelect({ profileId, currentRole, currentUserId, currentUserRole }: Props) {
  const [value, setValue] = useState<string>(currentRole)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  // Can't change your own role
  if (profileId === currentUserId) {
    return (
      <span className="inline-block w-36 text-sm text-muted-foreground capitalize">
        {currentRole === 'super_admin' ? 'Super Admin' : currentRole}
      </span>
    )
  }

  // Only super_admin can change admin roles
  const canPromoteToAdmin = currentUserRole === 'super_admin'

  async function handleChange(newRole: string) {
    if (newRole === value) return

    const label = newRole === 'super_admin' ? 'Super Admin' : newRole.charAt(0).toUpperCase() + newRole.slice(1)
    if (!confirm(`Change this user's role to ${label}?`)) return

    setUpdating(true)
    const result = await updateUserRole(profileId, newRole)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setValue(newRole)
      toast.success(`Role changed to ${label}`)
      router.refresh()
    }
    setUpdating(false)
  }

  const availableRoles = canPromoteToAdmin
    ? roleOptions
    : roleOptions.filter(r => r.value !== 'admin')

  return (
    <Select value={value} onValueChange={handleChange} disabled={updating}>
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((r) => (
          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
