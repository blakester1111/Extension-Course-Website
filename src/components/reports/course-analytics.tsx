'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, GraduationCap, BookOpen } from 'lucide-react'
import {
  BarChart,
  Bar,
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
  lessonCount: number
  enrollmentCount: number
  completionCount: number
  completionRate: number
  lessonStats: LessonStat[]
  dropOffData: { lesson: string; lessonTitle: string; dropOffs: number }[]
}

export function CourseAnalytics({ courses }: { courses: CourseData[] }) {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '')

  const course = courses.find(c => c.id === selectedCourse)

  // Overview cards across all courses
  const totalEnrollments = courses.reduce((sum, c) => sum + c.enrollmentCount, 0)
  const totalCompletions = courses.reduce((sum, c) => sum + c.completionCount, 0)
  const avgCompletionRate = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + c.completionRate, 0) / courses.length)
    : 0

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
            <p className="text-xs text-muted-foreground">Across {courses.length} courses</p>
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
            <p className="text-xs text-muted-foreground">Average across all courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-course enrollment table */}
      <Card>
        <CardHeader>
          <CardTitle>Course Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deep-dive into selected course */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Lesson-Level Analysis</CardTitle>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      <BarChart
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
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                        <Bar
                          dataKey="correctionRate"
                          name="Correction Rate"
                          fill="hsl(25 95% 53%)"
                          radius={[4, 4, 0, 0]}
                          opacity={0.8}
                        />
                      </BarChart>
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
            <p className="text-muted-foreground text-center py-4">Select a course to view detailed analytics.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
