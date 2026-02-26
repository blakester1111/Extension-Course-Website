'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/use-debounce'
import { saveAnswers, submitLesson } from '@/app/(dashboard)/student/lessons/actions'
import type { Question, Answer, LessonSubmission } from '@/types/database'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle, Save, MessageSquare, XCircle } from 'lucide-react'
import { ImageUpload } from './image-upload'
import { FormattedText } from '@/components/ui/formatted-text'

interface LessonFormProps {
  submission: LessonSubmission
  questions: Question[]
  existingAnswers: Answer[]
  totalQuestions: number
  questionOffset?: number
}

export function LessonForm({ submission, questions, existingAnswers, totalQuestions, questionOffset = 0 }: LessonFormProps) {
  const router = useRouter()
  const isReadOnly = submission.status === 'submitted' || submission.status === 'graded_pass'
  const isCorrections = submission.status === 'graded_corrections'
  const hasGrade = submission.grade !== null && submission.grade !== undefined

  // Build initial answers map
  const answerMap = new Map(existingAnswers.map(a => [a.question_id, a]))

  const correctCount = hasGrade
    ? existingAnswers.filter(a => !a.needs_correction).length
    : 0

  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(questions.map(q => [q.id, answerMap.get(q.id)?.answer_text || '']))
  )
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const debouncedAnswers = useDebounce(answers, 1500)

  // Auto-save
  useEffect(() => {
    if (isReadOnly) return

    async function autoSave() {
      setSaving(true)
      const answerData = Object.entries(debouncedAnswers).map(([questionId, answerText]) => ({
        questionId,
        answerText,
      }))
      await saveAnswers(submission.id, answerData)
      setSaving(false)
    }

    autoSave()
  }, [debouncedAnswers, submission.id, isReadOnly])

  async function handleSubmit() {
    setSubmitting(true)

    // Save first
    const answerData = Object.entries(answers).map(([questionId, answerText]) => ({
      questionId,
      answerText,
    }))
    await saveAnswers(submission.id, answerData)

    const result = await submitLesson(submission.id)

    if (result.error) {
      toast.error(result.error)
      setSubmitting(false)
      return
    }

    toast.success('Lesson submitted for grading!')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Grade Banner */}
      {hasGrade && submission.status === 'graded_pass' && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-5 flex items-center gap-4">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
            {submission.grade}%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="font-semibold text-green-800 dark:text-green-200">Lesson Passed!</p>
            </div>
            <p className="text-sm text-green-700/80 dark:text-green-300/80 mt-0.5">
              All {totalQuestions} questions correct
            </p>
          </div>
        </div>
      )}

      {hasGrade && isCorrections && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-5 flex items-center gap-4">
          <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
            {submission.grade}%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="font-semibold text-amber-800 dark:text-amber-200">Corrections Needed</p>
            </div>
            <p className="text-sm text-amber-700/80 dark:text-amber-300/80 mt-0.5">
              {correctCount} of {totalQuestions} questions correct — please revise the incorrect answers below
            </p>
          </div>
        </div>
      )}

      {/* Submitted status */}
      {submission.status === 'submitted' && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-lg flex items-start gap-3">
          <div className="h-5 w-5 mt-0.5 shrink-0 rounded-full border-2 border-blue-500 bg-blue-500" />
          <div>
            <p className="font-medium">Submitted for Grading</p>
            <p className="text-sm opacity-80">Your supervisor will review your answers and provide feedback.</p>
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.map((question, index) => {
        const existingAnswer = answerMap.get(question.id)
        const needsCorrection = existingAnswer?.needs_correction
        const isQuestionCorrect = existingAnswer && !existingAnswer.needs_correction && hasGrade
        const isQuestionLocked = isCorrections && isQuestionCorrect

        // Determine card styling
        let cardClass = ''
        if (hasGrade && (isCorrections || submission.status === 'graded_pass')) {
          if (isQuestionCorrect) {
            cardClass = 'border-l-4 border-l-green-500'
          } else if (needsCorrection) {
            cardClass = 'border-l-4 border-l-amber-500'
          }
        }

        return (
          <Card key={question.id} className={cardClass}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-sm">{questionOffset + index + 1}.</span>
                <span className="flex-1"><FormattedText text={question.question_text} /></span>
                {hasGrade && (isCorrections || submission.status === 'graded_pass') && (
                  isQuestionCorrect ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Correct
                    </Badge>
                  ) : needsCorrection ? (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">
                      <XCircle className="h-3 w-3 mr-1" />
                      Needs Revision
                    </Badge>
                  ) : null
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                rows={4}
                disabled={isReadOnly || isQuestionLocked}
                placeholder={question.requires_image ? 'Optional: describe your diagram/drawing here...' : 'Type your answer here...'}
                className={(isReadOnly || isQuestionLocked) ? 'bg-muted' : ''}
              />

              {/* Image upload for diagram/drawing questions */}
              {question.requires_image && (
                <ImageUpload
                  submissionId={submission.id}
                  questionId={question.id}
                  existingImagePath={existingAnswer?.image_path ?? null}
                  disabled={isReadOnly || !!isQuestionLocked}
                  supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
                />
              )}

              {/* Supervisor feedback */}
              {existingAnswer?.supervisor_feedback && (
                <div className={`p-3 rounded-md border flex gap-2 ${
                  needsCorrection
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
                    : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                }`}>
                  <MessageSquare className={`h-4 w-4 mt-0.5 shrink-0 ${
                    needsCorrection ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
                  }`} />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Supervisor Feedback</p>
                    <p className="text-sm">{existingAnswer.supervisor_feedback}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Submit / Resubmit bar */}
      {!isReadOnly && (
        <div className="flex items-center justify-between sticky bottom-4 bg-background border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {saving ? (
              <>
                <Save className="h-4 w-4 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Auto-saved
              </>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : isCorrections ? 'Resubmit for Grading' : 'Submit for Grading'}
          </Button>
        </div>
      )}
    </div>
  )
}
