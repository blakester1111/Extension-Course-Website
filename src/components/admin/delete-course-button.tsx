'use client'

import { Button } from '@/components/ui/button'
import { deleteCourse } from '@/app/(dashboard)/admin/courses/actions'
import { Trash2 } from 'lucide-react'

export function DeleteCourseButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  async function handleDelete() {
    if (!confirm(`Delete "${courseTitle}"? This cannot be undone.`)) return
    await deleteCourse(courseId)
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-destructive">
      <Trash2 className="h-3 w-3" />
    </Button>
  )
}
