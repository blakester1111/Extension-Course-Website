'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { backenterStudent, backenterFullCourse } from '@/app/(dashboard)/admin/courses/actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'

interface Props {
  studentId: string
  studentName: string
  availableCourses: { id: string; title: string }[]
}

interface LessonItem {
  id: string
  title: string
  sort_order: number
}

type BackenterMode = 'lessons' | 'full-course'

export function BackenterDialog({ studentId, studentName, availableCourses }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<BackenterMode>('lessons')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set())
  const [completionDate, setCompletionDate] = useState('')
  const [certNumber, setCertNumber] = useState('')
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!selectedCourse) {
      setLessons([])
      setSelectedLessons(new Set())
      return
    }

    async function fetchLessons() {
      setLoadingLessons(true)
      const { data } = await supabase
        .from('lessons')
        .select('id, title, sort_order')
        .eq('course_id', selectedCourse)
        .order('sort_order')

      setLessons(data || [])
      setSelectedLessons(new Set())
      setLoadingLessons(false)
    }

    fetchLessons()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse])

  function toggleLesson(lessonId: string) {
    setSelectedLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) {
        next.delete(lessonId)
      } else {
        next.add(lessonId)
      }
      return next
    })
  }

  function selectAll() {
    setSelectedLessons(new Set(lessons.map(l => l.id)))
  }

  function selectNone() {
    setSelectedLessons(new Set())
  }

  function resetState() {
    setSelectedCourse('')
    setSelectedLessons(new Set())
    setCompletionDate('')
    setCertNumber('')
    setMode('lessons')
  }

  async function handleSubmit() {
    if (!selectedCourse) return
    if (mode === 'lessons' && selectedLessons.size === 0) return
    setSubmitting(true)

    const dateParam = completionDate || undefined

    const certParam = certNumber.trim() || undefined

    let result
    if (mode === 'full-course') {
      result = await backenterFullCourse(studentId, selectedCourse, dateParam, certParam)
    } else {
      result = await backenterStudent(
        studentId,
        selectedCourse,
        Array.from(selectedLessons),
        dateParam,
        certParam
      )
    }

    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Back-enter failed')
    } else {
      const count = mode === 'full-course' ? 'all' : selectedLessons.size
      toast.success(`Back-entered ${count} lesson(s) for ${studentName}`)
      setOpen(false)
      resetState()
      router.refresh()
    }
    setSubmitting(false)
  }

  if (availableCourses.length === 0) return null

  const canSubmit = selectedCourse && (mode === 'full-course' || selectedLessons.size > 0) && !submitting

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
          <Upload className="h-3 w-3" />
          Back-Enter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Back-Enter Student</DialogTitle>
          <DialogDescription>
            Import prior course progress for <strong>{studentName}</strong>. No notifications or emails will be sent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode selector */}
          <div className="flex rounded-lg border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setMode('lessons')}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'lessons'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Individual Lessons
            </button>
            <button
              type="button"
              onClick={() => setMode('full-course')}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === 'full-course'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Full Course Completion
            </button>
          </div>

          {/* Course selector */}
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Completion date */}
          <div className="space-y-2">
            <Label>Completion Date</Label>
            <Input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              The date these lessons were originally completed. Leave blank for today. This date is used for weekly stats and reports.
            </p>
          </div>

          {/* Optional certificate number */}
          <div className="space-y-2">
            <Label>Certificate Number (optional)</Label>
            <Input
              placeholder="e.g. DC-1234"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If the student already has a certificate number from a prior system, enter it here. Leave blank to show &quot;Back-entered&quot; on the certificate.
            </p>
          </div>

          {/* Full course mode info */}
          {mode === 'full-course' && selectedCourse && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                All lessons in this course will be marked as completed (passed) for this student.
              </p>
            </div>
          )}

          {/* Individual lesson checkboxes (lessons mode only) */}
          {mode === 'lessons' && selectedCourse && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lessons Completed</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={selectNone}>
                    Clear
                  </Button>
                </div>
              </div>

              {loadingLessons ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lessons in this course.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-3">
                  {lessons.map(lesson => (
                    <div key={lesson.id} className="flex items-center gap-2 py-1">
                      <Checkbox
                        id={`lesson-${lesson.id}`}
                        checked={selectedLessons.has(lesson.id)}
                        onCheckedChange={() => toggleLesson(lesson.id)}
                      />
                      <Label
                        htmlFor={`lesson-${lesson.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        <span className="text-muted-foreground mr-2">{lesson.sort_order + 1}.</span>
                        {lesson.title}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {selectedLessons.size > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedLessons.size} of {lessons.length} lesson(s) will be marked as passed.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); resetState() }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : mode === 'full-course' ? (
              'Complete Entire Course'
            ) : (
              `Import ${selectedLessons.size || 0} Lesson(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
