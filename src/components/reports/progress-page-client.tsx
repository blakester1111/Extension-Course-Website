'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle, Search, Grid3X3, LayoutGrid } from 'lucide-react'
import { StudentDetailDialog } from './student-detail-dialog'

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

interface ProgressPageClientProps {
  students: StudentProgress[]
  courses: { id: string; title: string; lesson_count: number }[]
}

type ViewMode = 'board' | 'grid'
type SortOption = 'name-asc' | 'progress-desc' | 'progress-asc' | 'closest-to-finish' | 'recent'

export function ProgressPageClient({ students, courses }: ProgressPageClientProps) {
  const [view, setView] = useState<ViewMode>('board')
  const [courseFilter, setCourseFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('progress-desc')
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null)

  // When switching to grid view and "all" is selected, auto-select first course
  function handleViewChange(newView: ViewMode) {
    if (newView === 'grid' && courseFilter === 'all' && courses.length > 0) {
      setCourseFilter(courses[0].id)
    }
    setView(newView)
  }

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
    const lessonsRemaining = totalLessons - totalPassed
    return {
      ...s,
      totalLessons,
      totalPassed,
      lessonsRemaining,
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
      case 'closest-to-finish': {
        const aRemaining = a.lessonsRemaining === 0 ? Infinity : a.lessonsRemaining
        const bRemaining = b.lessonsRemaining === 0 ? Infinity : b.lessonsRemaining
        return aRemaining - bRemaining
      }
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
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle>Student Progress</CardTitle>
              <div className="flex rounded-lg border bg-muted p-0.5">
                <button
                  onClick={() => handleViewChange('board')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    view === 'board'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Board
                </button>
                <button
                  onClick={() => handleViewChange('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    view === 'grid'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Grid
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={courseFilter}
                onValueChange={(v) => {
                  setCourseFilter(v)
                }}
              >
                <SelectTrigger className="w-full sm:w-[260px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  {view === 'board' && <SelectItem value="all">All Courses</SelectItem>}
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
                  <SelectItem value="closest-to-finish">Closest to Finishing</SelectItem>
                  <SelectItem value="recent">Most Recently Active</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className={view === 'grid' ? 'p-0' : ''}>
          {view === 'board' ? (
            <BoardView students={sorted} onStudentClick={setSelectedStudent} />
          ) : (
            <GridView
              students={sorted}
              courseFilter={courseFilter}
              courses={courses}
            />
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

// --- Board View ---

function BoardView({
  students,
  onStudentClick,
}: {
  students: StudentProgress[]
  onStudentClick: (s: StudentProgress) => void
}) {
  if (students.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No students match the current filters.</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {students.map(student => (
        <StudentCard
          key={student.id}
          student={student}
          onClick={() => onStudentClick(student)}
        />
      ))}
    </div>
  )
}

function StudentCard({
  student,
  onClick,
}: {
  student: StudentProgress & { totalLessons: number; totalPassed: number; completionPercent: number }
  onClick: () => void
}) {
  const pct = student.completionPercent
  const isComplete = pct === 100 && student.totalLessons > 0

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

// --- Grid View ---

function GridView({
  students,
  courseFilter,
  courses,
}: {
  students: StudentProgress[]
  courseFilter: string
  courses: { id: string; title: string; lesson_count: number }[]
}) {
  const selectedCourse = courses.find(c => c.id === courseFilter)

  if (!selectedCourse) {
    return (
      <p className="text-center text-muted-foreground py-8 px-4">
        Select a specific course to view the lesson grid.
      </p>
    )
  }

  const lessonCount = selectedCourse.lesson_count
  const lessonHeaders = Array.from({ length: lessonCount }, (_, i) => i + 1)

  return (
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
          {students.length === 0 ? (
            <tr>
              <td colSpan={lessonCount + 3} className="text-center text-muted-foreground py-8">
                No students enrolled in this course.
              </td>
            </tr>
          ) : (
            students.map(student => {
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
                                ? 'hsl(142 71% 45%)'
                                : 'hsl(217 91% 60%)'
                              : 'hsl(var(--muted))',
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
  )
}
