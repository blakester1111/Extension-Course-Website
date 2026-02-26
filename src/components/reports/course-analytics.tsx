'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Users, GraduationCap, BookOpen, ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface LessonStat {
  lessonId: string
  lessonTitle: string
  sortOrder: number
  totalSubmissions: number
  passed: number
  corrections: number
  correctionRate: number
}

interface CourseData {
  id: string
  title: string
  category: string
  lessonCount: number
  enrollmentCount: number
  completionCount: number
  completionRate: number
  lessonStats: LessonStat[]
  dropOffData: { lesson: string; lessonTitle: string; dropOffs: number }[]
}

type SortOption = 'title-asc' | 'title-desc' | 'enrolled-desc' | 'enrolled-asc' | 'completion-desc' | 'completion-asc' | 'lessons-desc'

const categoryLabels: Record<string, string> = {
  basics: 'Basics',
  congresses: 'Congresses',
  accs: 'ACCs',
}

export function CourseAnalytics({ courses }: { courses: CourseData[] }) {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '')
  const [courseSearchOpen, setCourseSearchOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('title-asc')

  const course = courses.find(c => c.id === selectedCourse)

  // Filter by category
  const filtered = categoryFilter === 'all'
    ? courses
    : courses.filter(c => c.category === categoryFilter)

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'title-asc': return a.title.localeCompare(b.title)
      case 'title-desc': return b.title.localeCompare(a.title)
      case 'enrolled-desc': return b.enrollmentCount - a.enrollmentCount
      case 'enrolled-asc': return a.enrollmentCount - b.enrollmentCount
      case 'completion-desc': return b.completionRate - a.completionRate
      case 'completion-asc': return a.completionRate - b.completionRate
      case 'lessons-desc': return b.lessonCount - a.lessonCount
      default: return 0
    }
  })

  // Overview cards based on filtered courses
  const totalEnrollments = filtered.reduce((sum, c) => sum + c.enrollmentCount, 0)
  const totalCompletions = filtered.reduce((sum, c) => sum + c.completionCount, 0)
  const avgCompletionRate = filtered.length > 0
    ? Math.round(filtered.reduce((sum, c) => sum + c.completionRate, 0) / filtered.length)
    : 0

  const selectedCourseTitle = course?.title || 'Select a course...'

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Across {filtered.length} course{filtered.length !== 1 ? 's' : ''}
              {categoryFilter !== 'all' && ` in ${categoryLabels[categoryFilter]}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCompletions}</div>
            <p className="text-xs text-muted-foreground">Students who finished a course</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">Average across filtered courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Overview table with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Course Overview</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex rounded-lg border bg-muted p-0.5">
                {['all', 'basics', 'congresses', 'accs'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      categoryFilter === cat
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat === 'all' ? 'All' : categoryLabels[cat]}
                  </button>
                ))}
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="enrolled-desc">Most Enrolled</SelectItem>
                  <SelectItem value="enrolled-asc">Least Enrolled</SelectItem>
                  <SelectItem value="completion-desc">Highest Completion</SelectItem>
                  <SelectItem value="completion-asc">Lowest Completion</SelectItem>
                  <SelectItem value="lessons-desc">Most Lessons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No courses in this category.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryLabels[c.category] || c.category}</Badge>
                    </TableCell>
                    <TableCell>{c.lessonCount}</TableCell>
                    <TableCell>{c.enrollmentCount}</TableCell>
                    <TableCell>{c.completionCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${c.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm">{c.completionRate}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lesson-Level Analysis with searchable course selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Lesson Difficulty</CardTitle>
            <Popover open={courseSearchOpen} onOpenChange={setCourseSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={courseSearchOpen}
                  className="w-full sm:w-[340px] justify-between font-normal"
                >
                  <span className="truncate">{selectedCourseTitle}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search courses..." />
                  <CommandList>
                    <CommandEmpty>No course found.</CommandEmpty>
                    <CommandGroup>
                      {courses.map(c => (
                        <CommandItem
                          key={c.id}
                          value={c.title}
                          onSelect={() => {
                            setSelectedCourse(c.id)
                            setCourseSearchOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCourse === c.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className="truncate">{c.title}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {categoryLabels[c.category] || c.category}
                          </Badge>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {course ? (
            <div className="space-y-6">
              {/* Correction rate chart */}
              {course.lessonStats.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Correction Rate by Lesson (hardest lessons need most corrections)</h4>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={course.lessonStats.map(l => ({
                          lesson: `L${l.sortOrder + 1}`,
                          correctionRate: l.correctionRate,
                          lessonTitle: l.lessonTitle,
                        }))}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="lesson"
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          unit="%"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '13px',
                          }}
                          formatter={(value: unknown) => [`${value}%`, 'Correction Rate']}
                          labelFormatter={(label: unknown) => {
                            const stat = course.lessonStats.find(l => `L${l.sortOrder + 1}` === String(label))
                            return stat ? stat.lessonTitle : String(label)
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="correctionRate"
                          name="Correction Rate"
                          stroke="hsl(25 95% 53%)"
                          strokeWidth={2}
                          dot={{ r: 4, fill: 'hsl(25 95% 53%)' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Lesson detail table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Passed</TableHead>
                    <TableHead>Corrections</TableHead>
                    <TableHead>Correction Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {course.lessonStats.map(lesson => (
                    <TableRow key={lesson.lessonId}>
                      <TableCell className="text-muted-foreground">{lesson.sortOrder + 1}</TableCell>
                      <TableCell className="font-medium">{lesson.lessonTitle}</TableCell>
                      <TableCell>{lesson.totalSubmissions}</TableCell>
                      <TableCell className="text-green-600">{lesson.passed}</TableCell>
                      <TableCell className="text-orange-500">{lesson.corrections}</TableCell>
                      <TableCell>
                        <Badge variant={lesson.correctionRate > 40 ? 'destructive' : lesson.correctionRate > 20 ? 'secondary' : 'outline'}>
                          {lesson.correctionRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Search and select a course to view lesson difficulty.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
