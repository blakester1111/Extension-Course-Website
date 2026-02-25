'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const categories = [
  { value: 'all', label: 'All Courses' },
  { value: 'basics', label: 'Basics' },
  { value: 'congresses', label: 'Congresses' },
  { value: 'accs', label: 'ACCs' },
]

export function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') || 'all'

  function handleFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    router.push(`/catalog?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <Button
          key={cat.value}
          variant={current === cat.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilter(cat.value)}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  )
}
