'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Search } from 'lucide-react'
import { StudentDetailDialog } from './student-detail-dialog'

interface StudentEnrollment {
  courseId: string
  courseTitle: string
  lessonCount: number
  passedCount: number
}

interface StudentProgress {
  id: string
  fullName: string
  email: string
  enrollments: StudentEnrollment[]
  totalLessons: number
  totalPassed: number
  completionPercent: number
  lastSubmission: string | null
}

interface ProgressBoardProps {
  students: StudentProgress[]
  courses: { id: string; title: string; lesson_count: number }[]
}

type SortOption = 'name-asc' | 'progress-desc' | 'progress-asc' | 'recent'

export function ProgressBoard({ students, courses }: ProgressBoardProps) {
  const [courseFilter, setCourseFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('progress-desc')
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null)

  // Filter students
  let filtered = students.filter(s => {
    if (courseFilter !== 'all') {
      return s.enrollments.some(e => e.courseId === courseFilter)
    }
    return s.enrollments.length > 0
  })

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(s =>
      s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    )
  }

  // Compute progress based on filter
  const withFilteredProgress = filtered.map(s => {
    if (courseFilter === 'all') return s
    const filteredEnrollments = s.enrollments.filter(e => e.courseId === courseFilter)
    const totalLessons = filteredEnrollments.reduce((sum, e) => sum + e.lessonCount, 0)
    const totalPassed = filteredEnrollments.reduce((sum, e) => sum + e.passedCount, 0)
    return {
      ...s,
      totalLessons,
      totalPassed,
      completionPercent: totalLessons > 0 ? Math.round((totalPassed / totalLessons) * 100) : 0,
    }
  })

  // Sort
  const sorted = [...withFilteredProgress].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.fullName.localeCompare(b.fullName)
      case 'progress-desc':
        return b.completionPercent - a.completionPercent
      case 'progress-asc':
        return a.completionPercent - b.completionPercent
      case 'recent':
        if (!a.lastSubmission && !b.lastSubmission) return 0
        if (!a.lastSubmission) return 1
        if (!b.lastSubmission) return -1
        return new Date(b.lastSubmission).getTime() - new Date(a.lastSubmission).getTime()
      default:
        return 0
    }
  })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Student Progress Board</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress-desc">Most Progress</SelectItem>
                <SelectItem value="progress-asc">Least Progress</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No students match the current filters.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {sorted.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onClick={() => setSelectedStudent(student)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StudentDetailDialog
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </>
  )
}

function StudentCard({ student, onClick }: { student: StudentProgress & { totalLessons: number; totalPassed: number; completionPercent: number }; onClick: () => void }) {
  const pct = student.completionPercent
  const isComplete = pct === 100 && student.totalLessons > 0

  // Green saturation from low (10%) to high (90%)
  const saturation = 10 + (pct / 100) * 80
  const lightness = isComplete ? 35 : 90 - (pct / 100) * 45

  const bgColor = isComplete
    ? 'hsl(142 71% 35%)'
    : `hsl(142 ${saturation}% ${lightness}%)`

  const textColor = pct > 60 || isComplete ? 'white' : 'hsl(var(--foreground))'

  return (
    <button
      onClick={onClick}
      className="relative rounded-lg p-3 text-left transition-all hover:scale-[1.03] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: isComplete ? '2px solid hsl(45 93% 47%)' : '1px solid hsl(var(--border))',
      }}
    >
      {isComplete && (
        <CheckCircle className="absolute top-1.5 right-1.5 h-4 w-4" style={{ color: 'hsl(45 93% 47%)' }} />
      )}
      <div className="text-sm font-semibold truncate">{student.fullName}</div>
      <div className="text-xs mt-1 opacity-80">
        {student.totalPassed}/{student.totalLessons} lessons
      </div>
      <div className="mt-2 w-full bg-black/10 rounded-full h-1.5">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max(pct, 2)}%`,
            backgroundColor: pct > 60 || isComplete ? 'rgba(255,255,255,0.6)' : 'hsl(142 71% 45%)',
          }}
        />
      </div>
      <div className="text-xs mt-1 font-medium">{pct}%</div>
    </button>
  )
}
