'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, Grid3X3 } from 'lucide-react'

interface StudentEnrollment {
  courseId: string
  courseTitle: string
  lessonCount: number
  passedCount: number
  passedLessonSortOrders?: number[]
}

interface StudentProgress {
  id: string
  fullName: string
  email: string
  enrollments: StudentEnrollment[]
  totalLessons: number
  totalPassed: number
  lessonsRemaining: number
  completionPercent: number
  lastSubmission: string | null
}

interface ProgressGridProps {
  students: StudentProgress[]
  courses: { id: string; title: string; lesson_count: number }[]
}

export function ProgressGrid({ students, courses }: ProgressGridProps) {
  const [courseFilter, setCourseFilter] = useState(courses[0]?.id || '')
  const [search, setSearch] = useState('')

  const selectedCourse = courses.find(c => c.id === courseFilter)
  if (!selectedCourse) return null

  const lessonCount = selectedCourse.lesson_count

  // Filter students enrolled in selected course
  let filtered = students.filter(s =>
    s.enrollments.some(e => e.courseId === courseFilter)
  )

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(s =>
      s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    )
  }

  // Sort by progress descending
  filtered.sort((a, b) => {
    const aEnr = a.enrollments.find(e => e.courseId === courseFilter)
    const bEnr = b.enrollments.find(e => e.courseId === courseFilter)
    return (bEnr?.passedCount || 0) - (aEnr?.passedCount || 0)
  })

  // Generate lesson column headers
  const lessonHeaders = Array.from({ length: lessonCount }, (_, i) => i + 1)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Progress Grid
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-[200px]"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="sticky left-0 bg-muted/50 z-10 px-3 py-2 text-left font-medium min-w-[180px]">
                  Student
                </th>
                {lessonHeaders.map(num => (
                  <th
                    key={num}
                    className="px-1 py-2 text-center font-medium min-w-[36px]"
                    title={`Lesson ${num}`}
                  >
                    {num}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-medium min-w-[80px]">Progress</th>
                <th className="px-3 py-2 text-center font-medium min-w-[60px]">%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={lessonCount + 3} className="text-center text-muted-foreground py-8">
                    No students enrolled in this course.
                  </td>
                </tr>
              ) : (
                filtered.map(student => {
                  const enrollment = student.enrollments.find(e => e.courseId === courseFilter)
                  if (!enrollment) return null

                  const passed = enrollment.passedCount
                  const total = enrollment.lessonCount
                  const pct = total > 0 ? Math.round((passed / total) * 100) : 0
                  const isComplete = passed >= total && total > 0
                  const passedSet = new Set(enrollment.passedLessonSortOrders || [])

                  return (
                    <tr key={student.id} className="border-b hover:bg-muted/30">
                      <td className="sticky left-0 bg-background z-10 px-3 py-2 font-medium whitespace-nowrap">
                        {student.fullName}
                      </td>
                      {lessonHeaders.map(num => {
                        const isPassed = passedSet.has(num)
                        return (
                          <td key={num} className="px-1 py-2 text-center">
                            <div
                              className="w-7 h-7 mx-auto rounded-sm flex items-center justify-center text-xs font-medium transition-colors"
                              style={{
                                backgroundColor: isPassed
                                  ? isComplete
                                    ? 'hsl(142 71% 45%)'    // green when complete
                                    : 'hsl(217 91% 60%)'    // blue when in progress
                                  : 'hsl(var(--muted))',      // grey when not done
                                color: isPassed ? 'white' : 'hsl(var(--muted-foreground))',
                              }}
                              title={isPassed ? `Lesson ${num} - Passed` : `Lesson ${num} - Not completed`}
                            >
                              {isPassed ? '\u2713' : ''}
                            </div>
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 text-center whitespace-nowrap text-sm">
                        <span className={isComplete ? 'text-green-600 font-semibold' : ''}>
                          {passed}/{total}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap text-sm">
                        <span className={isComplete ? 'text-green-600 font-semibold' : ''}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
