'use client'

import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { toggleStaffStatus } from '@/app/(dashboard)/admin/supervisors/actions'
import { toast } from 'sonner'

export function StaffToggleButton({ profileId, isStaff }: { profileId: string; isStaff: boolean }) {
  const router = useRouter()

  async function handleToggle(checked: boolean) {
    const result = await toggleStaffStatus(profileId, checked)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(checked ? 'Marked as staff' : 'Removed staff designation')
      router.refresh()
    }
  }

  return <Switch checked={isStaff} onCheckedChange={handleToggle} />
}
