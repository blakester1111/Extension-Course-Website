'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { assignStudentRoute } from '@/app/(dashboard)/admin/routes/actions'
import { toast } from 'sonner'

interface Props {
  studentId: string
  currentRouteId: string | null
  routes: { id: string; name: string }[]
}

export function RouteAssign({ studentId, currentRouteId, routes }: Props) {
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleChange(value: string) {
    const routeId = value === 'none' ? null : value
    setSaving(true)
    const result = await assignStudentRoute(studentId, routeId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Route updated')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <Select
      value={currentRouteId || 'none'}
      onValueChange={handleChange}
      disabled={saving}
    >
      <SelectTrigger className="h-7 text-xs w-full">
        <SelectValue placeholder="No route" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No route</SelectItem>
        {routes.map(r => (
          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
