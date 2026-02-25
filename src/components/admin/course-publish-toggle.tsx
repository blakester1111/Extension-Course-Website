'use client'

import { toggleCoursePublished } from '@/app/(dashboard)/admin/courses/actions'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

export function CoursePublishToggle({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  const [published, setPublished] = useState(isPublished)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const next = !published
    setPublished(next)
    await toggleCoursePublished(courseId, next)
    setLoading(false)
  }

  return (
    <button onClick={handleToggle} disabled={loading}>
      <Badge
        variant={published ? 'default' : 'outline'}
        className={
          published
            ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
            : 'text-muted-foreground cursor-pointer'
        }
      >
        {published ? 'Published' : 'Draft'}
      </Badge>
    </button>
  )
}
