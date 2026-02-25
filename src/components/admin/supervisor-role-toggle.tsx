'use client'

import { Button } from '@/components/ui/button'
import { updateUserRole } from '@/app/(dashboard)/admin/supervisors/actions'

export function SupervisorRoleToggle({ profileId, currentRole }: { profileId: string; currentRole: string }) {
  async function handleToggle() {
    const newRole = currentRole === 'supervisor' ? 'student' : 'supervisor'
    if (currentRole === 'supervisor' && !confirm('Demote this supervisor back to student?')) return
    await updateUserRole(profileId, newRole)
  }

  return (
    <Button
      variant={currentRole === 'supervisor' ? 'destructive' : 'default'}
      size="sm"
      onClick={handleToggle}
    >
      {currentRole === 'supervisor' ? 'Demote to Student' : 'Promote to Supervisor'}
    </Button>
  )
}
