'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { CourseCard } from './course-card'
import type { Course } from '@/types/database'

export function CourseGrid({ courses, enrolledCourseIds = [] }: { courses: Course[]; enrolledCourseIds?: string[] }) {
  const [search, setSearch] = useState('')
  const enrolledSet = new Set(enrolledCourseIds)

  const filtered = search.trim()
    ? courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : courses

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} isEnrolled={enrolledSet.has(course.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
