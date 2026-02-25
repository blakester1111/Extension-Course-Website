'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { assignSupervisor } from '@/app/(dashboard)/admin/supervisors/actions'
import { toast } from 'sonner'

interface Props {
  studentId: string
  currentSupervisorId: string | null
  supervisors: { id: string; full_name: string; role?: string }[]
}

export function StudentSupervisorAssign({ studentId, currentSupervisorId, supervisors }: Props) {
  const [value, setValue] = useState(currentSupervisorId || 'none')

  async function handleChange(newValue: string) {
    setValue(newValue)
    const result = await assignSupervisor(studentId, newValue === 'none' ? null : newValue)
    if (result?.error) {
      toast.error(result.error)
      setValue(currentSupervisorId || 'none')
    } else {
      toast.success(newValue === 'none' ? 'Supervisor removed' : 'Supervisor assigned')
    }
  }

  if (supervisors.length === 0) {
    return <span className="text-xs text-muted-foreground">No supervisors available</span>
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Assign supervisor" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Unassigned</SelectItem>
        {supervisors.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.full_name}
            {s.role && s.role !== 'supervisor' && ` (${s.role === 'super_admin' ? 'Super Admin' : s.role})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
