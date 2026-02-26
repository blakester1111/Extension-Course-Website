'use client'

import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { updateCertPermissions } from '@/app/(dashboard)/admin/certificates/actions'
import { toast } from 'sonner'
import { FileCheck, Stamp } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Props {
  profileId: string
  canAttestCerts: boolean
  canSignCerts: boolean
}

export function CertPermissionToggles({ profileId, canAttestCerts, canSignCerts }: Props) {
  const router = useRouter()

  async function handleAttestToggle(checked: boolean) {
    const result = await updateCertPermissions(profileId, { can_attest_certs: checked })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(checked ? 'Granted Certs & Awards permission' : 'Revoked Certs & Awards permission')
      router.refresh()
    }
  }

  async function handleSignToggle(checked: boolean) {
    const result = await updateCertPermissions(profileId, { can_sign_certs: checked })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(checked ? 'Granted Keeper of Seals permission' : 'Revoked Keeper of Seals permission')
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <FileCheck className="h-3 w-3 text-muted-foreground" />
            <Switch checked={canAttestCerts} onCheckedChange={handleAttestToggle} />
          </div>
        </TooltipTrigger>
        <TooltipContent>Certificates & Awards</TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Stamp className="h-3 w-3 text-muted-foreground" />
            <Switch checked={canSignCerts} onCheckedChange={handleSignToggle} />
          </div>
        </TooltipTrigger>
        <TooltipContent>Keeper of Seals & Signature</TooltipContent>
      </Tooltip>
    </div>
  )
}
