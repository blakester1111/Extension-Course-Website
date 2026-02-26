'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  profileId: string
  currentOrg: string | null
}

export function OrganizationAssign({ profileId, currentOrg }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleChange(value: string) {
    setLoading(true)
    const orgValue = value === 'unassigned' ? null : value

    const { error } = await supabase
      .from('profiles')
      .update({ organization: orgValue })
      .eq('id', profileId)

    if (error) {
      toast.error('Failed to update organization')
    } else {
      toast.success(`Organization updated`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Select
      value={currentOrg || 'unassigned'}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-32 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned" className="text-xs">Unassigned</SelectItem>
        <SelectItem value="day" className="text-xs">Day</SelectItem>
        <SelectItem value="foundation" className="text-xs">Foundation</SelectItem>
      </SelectContent>
    </Select>
  )
}
