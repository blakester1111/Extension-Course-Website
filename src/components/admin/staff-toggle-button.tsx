'use client'

import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { toggleStaffStatus } from '@/app/(dashboard)/admin/supervisors/actions'
import { toast } from 'sonner'
import { UserCheck } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1">
          <UserCheck className="h-3 w-3 text-muted-foreground" />
          <Switch checked={isStaff} onCheckedChange={handleToggle} />
        </div>
      </TooltipTrigger>
      <TooltipContent>Staff Member</TooltipContent>
    </Tooltip>
  )
}
