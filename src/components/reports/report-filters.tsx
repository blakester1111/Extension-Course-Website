'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const audienceOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'staff', label: 'Staff' },
]

const orgOptions = [
  { value: 'all', label: 'All' },
  { value: 'day', label: 'Day' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'unassigned', label: 'Unassigned' },
]

interface ReportFiltersProps {
  defaultOrg?: string
}

export function ReportFilters({ defaultOrg }: ReportFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentAudience = searchParams.get('audience') || 'paid'
  const currentOrg = searchParams.get('org') || defaultOrg || 'all'

  const updateParam = useCallback((key: string, value: string, defaultValue: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === defaultValue) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Paid / Staff toggle */}
      <div className="flex rounded-lg border bg-muted p-0.5">
        {audienceOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => updateParam('audience', opt.value, 'paid')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentAudience === opt.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Org toggle */}
      <div className="flex rounded-lg border bg-muted p-0.5">
        {orgOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => updateParam('org', opt.value, 'all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentOrg === opt.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
