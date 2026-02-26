'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Calendar } from 'lucide-react'
import type { PeriodMode } from '@/lib/report-periods'

export function DateRangeSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentMode = (searchParams.get('mode') as PeriodMode) || 'thisweek'
  const currentFrom = searchParams.get('from') || ''
  const currentTo = searchParams.get('to') || ''

  const [customFrom, setCustomFrom] = useState(currentFrom)
  const [customTo, setCustomTo] = useState(currentTo)
  const [showCustom, setShowCustom] = useState(currentMode === 'custom')

  function setMode(mode: PeriodMode) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', mode)
    if (mode !== 'custom') {
      params.delete('from')
      params.delete('to')
      setShowCustom(false)
    } else {
      setShowCustom(true)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', 'custom')
    params.set('from', customFrom)
    params.set('to', customTo)
    router.push(`${pathname}?${params.toString()}`)
  }

  const modes: { value: PeriodMode; label: string }[] = [
    { value: 'thisweek', label: 'This Week' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom' },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex rounded-lg border bg-muted p-0.5">
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentMode === m.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 text-sm w-[140px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 text-sm w-[140px]"
            />
          </div>
          <Button size="sm" onClick={applyCustomRange} className="h-8">
            <Calendar className="h-3 w-3 mr-1" />
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}
