'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

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

export function StudentDetailDialog({
  student,
  onClose,
}: {
  student: StudentProgress | null
  onClose: () => void
}) {
  if (!student) return null

  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{student.fullName}</DialogTitle>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Overall Progress</span>
            <Badge variant={student.completionPercent === 100 ? 'default' : 'secondary'}>
              {student.totalPassed}/{student.totalLessons} lessons ({student.completionPercent}%)
            </Badge>
          </div>
          {student.lastSubmission && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Submission</span>
              <span>{format(new Date(student.lastSubmission), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold">Enrolled Courses</h4>
          {student.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active enrollments.</p>
          ) : (
            student.enrollments.map(enrollment => {
              const pct = enrollment.lessonCount > 0
                ? Math.round((enrollment.passedCount / enrollment.lessonCount) * 100)
                : 0
              const isComplete = pct === 100 && enrollment.lessonCount > 0

              return (
                <div
                  key={enrollment.courseId}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{enrollment.courseTitle}</span>
                    {isComplete ? (
                      <Badge className="bg-green-600 text-white">Complete</Badge>
                    ) : (
                      <Badge variant="outline">
                        {enrollment.passedCount}/{enrollment.lessonCount}
                      </Badge>
                    )}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: isComplete ? 'hsl(142 71% 45%)' : 'hsl(var(--primary))',
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{pct}% complete</p>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
