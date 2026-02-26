'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { gradeSubmission } from '@/app/(dashboard)/supervisor/grade/actions'
import type { LessonSubmission, Answer } from '@/types/database'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Lock, MessageSquare, Send, ZoomIn } from 'lucide-react'

interface AnswerWithQuestion extends Answer {
  question?: { question_text: string; sort_order: number; requires_image?: boolean }
}

interface GradingFormProps {
  submission: LessonSubmission
  answers: AnswerWithQuestion[]
  totalQuestions: number
  questionOffset?: number
}

type GradeState = {
  feedback: string
  needsCorrection: boolean | null // null = not yet marked
  locked: boolean
}

export function GradingForm({ submission, answers, totalQuestions, questionOffset = 0 }: GradingFormProps) {
  const isResubmission = submission.grade !== null
  const isAlreadyGraded = submission.status === 'graded_pass' || submission.status === 'graded_corrections'

  const [grades, setGrades] = useState<Record<string, GradeState>>(
    Object.fromEntries(
      answers.map(a => [
        a.id,
        {
          feedback: a.supervisor_feedback || '',
          needsCorrection: isAlreadyGraded ? a.needs_correction : (isResubmission && !a.needs_correction ? false : null),
          locked: isResubmission && !a.needs_correction,
        },
      ])
    )
  )
  const [submitting, setSubmitting] = useState(false)

  // Calculate live grade preview
  const lockedCorrectCount = Object.values(grades).filter(g => g.locked).length
  const unlockedCorrectCount = Object.values(grades).filter(g => !g.locked && g.needsCorrection === false).length
  const correctCount = lockedCorrectCount + unlockedCorrectCount
  const gradePreview = Math.round((correctCount / (totalQuestions || 1)) * 100)

  // Check if all unlocked answers have been marked
  const allMarked = Object.values(grades).every(g => g.locked || g.needsCorrection !== null)

  async function handleSubmit() {
    setSubmitting(true)

    // Only send grades for unlocked answers
    const gradeData = Object.entries(grades)
      .filter(([, g]) => !g.locked)
      .map(([answerId, g]) => ({
        answerId,
        feedback: g.feedback,
        needsCorrection: g.needsCorrection === true,
      }))

    const result = await gradeSubmission(submission.id, gradeData)

    if (result?.error) {
      toast.error(result.error)
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {isResubmission && !isAlreadyGraded && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-4 rounded-lg flex items-center gap-3">
          <MessageSquare className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Resubmission — Previous Grade: {submission.grade}%</p>
            <p className="text-sm opacity-80">Previously correct answers are locked. Grade only the revised answers below.</p>
          </div>
        </div>
      )}

      {answers.map((answer, index) => {
        const gradeState = grades[answer.id]
        const isLocked = gradeState?.locked

        if (isLocked && !isAlreadyGraded) {
          // Locked card — previously correct
          return (
            <Card key={answer.id} className="border-l-4 border-l-green-500 bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-muted-foreground font-mono text-sm">{questionOffset + index + 1}.</span>
                  <span className="flex-1">{answer.question?.question_text}</span>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 shrink-0">
                    <Lock className="h-3 w-3 mr-1" />
                    Correct
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Student&apos;s Answer</p>
                  <p className="text-sm whitespace-pre-wrap">{answer.answer_text}</p>
                </div>
                {answer.image_path && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Student&apos;s Diagram</p>
                    <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/answer-images/${answer.image_path}`} target="_blank" rel="noopener noreferrer" className="inline-block">
                      <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/answer-images/${answer.image_path}`} alt="Student diagram" className="max-h-64 rounded-md border hover:opacity-90 cursor-pointer" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        }

        // Unlocked card — needs grading (or already graded, read-only)
        const isMarkedCorrect = gradeState?.needsCorrection === false
        const isMarkedIncorrect = gradeState?.needsCorrection === true
        const borderClass = isAlreadyGraded
          ? (answer.needs_correction ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-green-500')
          : isMarkedCorrect
          ? 'border-l-4 border-l-green-500'
          : isMarkedIncorrect
          ? 'border-l-4 border-l-amber-500'
          : ''

        return (
          <Card key={answer.id} className={borderClass}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-sm">{questionOffset + index + 1}.</span>
                <span className="flex-1">{answer.question?.question_text}</span>
                {isAlreadyGraded && (
                  answer.needs_correction
                    ? <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">Incorrect</Badge>
                    : <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 shrink-0">Correct</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-xs font-medium text-muted-foreground mb-1">Student&apos;s Answer</p>
                <p className="text-sm whitespace-pre-wrap">{answer.answer_text}</p>
              </div>

              {answer.image_path && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Student&apos;s Diagram</p>
                  <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/answer-images/${answer.image_path}`} target="_blank" rel="noopener noreferrer" className="inline-block">
                    <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/answer-images/${answer.image_path}`} alt="Student diagram" className="max-h-64 rounded-md border hover:opacity-90 cursor-pointer" />
                  </a>
                </div>
              )}

              {!isAlreadyGraded && (
                <>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={isMarkedCorrect ? 'default' : 'outline'}
                      className={isMarkedCorrect
                        ? 'bg-green-600 hover:bg-green-700 text-white flex-1'
                        : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/30 flex-1'
                      }
                      onClick={() =>
                        setGrades(prev => ({
                          ...prev,
                          [answer.id]: { ...prev[answer.id], needsCorrection: false },
                        }))
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Correct
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={isMarkedIncorrect ? 'default' : 'outline'}
                      className={isMarkedIncorrect
                        ? 'bg-amber-600 hover:bg-amber-700 text-white flex-1'
                        : 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30 flex-1'
                      }
                      onClick={() =>
                        setGrades(prev => ({
                          ...prev,
                          [answer.id]: { ...prev[answer.id], needsCorrection: true },
                        }))
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Incorrect
                    </Button>
                  </div>

                  {isMarkedIncorrect && (
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        Note to student
                      </p>
                      <Textarea
                        value={gradeState?.feedback || ''}
                        onChange={(e) =>
                          setGrades(prev => ({
                            ...prev,
                            [answer.id]: { ...prev[answer.id], feedback: e.target.value },
                          }))
                        }
                        placeholder="Explain what needs to be corrected..."
                        rows={2}
                        className="border-amber-200 dark:border-amber-800 focus-visible:ring-amber-400"
                      />
                    </div>
                  )}

                  {isMarkedCorrect && (
                    <Textarea
                      value={gradeState?.feedback || ''}
                      onChange={(e) =>
                        setGrades(prev => ({
                          ...prev,
                          [answer.id]: { ...prev[answer.id], feedback: e.target.value },
                        }))
                      }
                      placeholder="Optional feedback..."
                      rows={1}
                      className="text-sm"
                    />
                  )}
                </>
              )}

              {isAlreadyGraded && answer.supervisor_feedback && (
                <div className={`p-3 rounded-md border ${
                  answer.needs_correction
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
                    : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                }`}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Supervisor Feedback</p>
                  <p className="text-sm">{answer.supervisor_feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {!isAlreadyGraded && (
        <div className="flex items-center justify-between sticky bottom-4 bg-background border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-bold ${gradePreview === 100 ? 'text-green-600' : 'text-amber-600'}`}>
              {allMarked ? `${gradePreview}%` : '—'}
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">{correctCount} of {totalQuestions} correct</p>
              {!allMarked && <p className="text-xs">Mark all answers to submit</p>}
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !allMarked}
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Grades'}
          </Button>
        </div>
      )}

      {isAlreadyGraded && submission.grade !== null && (
        <div className={`p-4 rounded-lg border text-center ${
          submission.grade === 100
            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
            : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
        }`}>
          <p className={`text-2xl font-bold ${submission.grade === 100 ? 'text-green-600' : 'text-amber-600'}`}>
            Grade: {submission.grade}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {submission.status === 'graded_pass' ? 'Lesson passed' : 'Returned for corrections'}
          </p>
        </div>
      )}
    </div>
  )
}
