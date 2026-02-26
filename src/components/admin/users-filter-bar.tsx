'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

const orgOptions = [
  { value: 'all', label: 'All Orgs' },
  { value: 'day', label: 'Day' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'unassigned', label: 'Unassigned' },
]

const audienceOptions = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'staff', label: 'Staff' },
]

export type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
]

interface UsersFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  org: string
  onOrgChange: (value: string) => void
  audience: string
  onAudienceChange: (value: string) => void
  sort: SortOption
  onSortChange: (value: SortOption) => void
  resultCount?: number
}

export function UsersFilterBar({
  search,
  onSearchChange,
  org,
  onOrgChange,
  audience,
  onAudienceChange,
  sort,
  onSortChange,
  resultCount,
}: UsersFilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search + result count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {resultCount !== undefined && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {resultCount} user{resultCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filter toggles + sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Audience: All / Public / Staff */}
        <div className="flex rounded-lg border bg-muted p-0.5">
          {audienceOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onAudienceChange(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                audience === opt.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Org: All / Day / Foundation / Unassigned */}
        <div className="flex rounded-lg border bg-muted p-0.5">
          {orgOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onOrgChange(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                org === opt.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex rounded-lg border bg-muted p-0.5">
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                sort === opt.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
