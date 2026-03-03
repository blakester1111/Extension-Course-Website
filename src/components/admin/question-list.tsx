'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createQuestion, deleteQuestion, updateQuestion, updateCorrectAnswer, toggleQuestionRequiresImage } from '@/app/(dashboard)/admin/courses/[id]/lessons/actions'
import type { Question } from '@/types/database'
import { Trash2, Plus, Save, ImageIcon, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { FormattedText } from '@/components/ui/formatted-text'

interface QuestionListProps {
  lessonId: string
  courseId: string
  questions: Question[]
  questionOffset?: number
}

export function QuestionList({ lessonId, courseId, questions: initialQuestions, questionOffset = 0 }: QuestionListProps) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [newQuestion, setNewQuestion] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [editAnswer, setEditAnswer] = useState('')
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!newQuestion.trim()) return

    const formData = new FormData()
    formData.set('question_text', newQuestion)

    const result = await createQuestion(lessonId, courseId, formData) as { error?: unknown; question?: Question }
    if (result?.error) {
      setError(typeof result.error === 'object' ? Object.values(result.error as Record<string, string[]>).flat().join(', ') : String(result.error))
    } else if (result?.question) {
      setQuestions(prev => [...prev, result.question!])
      setNewQuestion('')
      setError(null)
    }
  }

  async function handleUpdate(questionId: string, sortOrder: number) {
    const formData = new FormData()
    formData.set('question_text', editText)
    formData.set('sort_order', String(sortOrder))

    const result = await updateQuestion(questionId, lessonId, courseId, formData)
    if (result?.error) {
      setError(typeof result.error === 'object' ? Object.values(result.error).flat().join(', ') : String(result.error))
    } else {
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, question_text: editText } : q))
      setEditingId(null)
      setError(null)
    }
  }

  async function handleDelete(questionId: string) {
    if (!confirm('Delete this question?')) return
    const result = await deleteQuestion(questionId, lessonId, courseId)
    if (!result?.error) {
      setQuestions(prev => prev.filter(q => q.id !== questionId))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {questions.map((q, index) => (
          <div key={q.id} className="border rounded-md p-3 space-y-2">
            <div className="flex gap-2 items-start">
              <span className="text-sm font-mono text-muted-foreground mt-2 min-w-[2rem]">
                {questionOffset + index + 1}.
              </span>
              {editingId === q.id ? (
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">Use *asterisks* around text for <em>italics</em></p>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => handleUpdate(q.id, q.sort_order)}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className="flex-1 text-sm cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                    onClick={() => {
                      setEditingId(q.id)
                      setEditText(q.question_text)
                    }}
                  >
                    <FormattedText text={q.question_text} />
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setExpandedAnswers(prev => {
                        const next = new Set(prev)
                        next.has(q.id) ? next.delete(q.id) : next.add(q.id)
                        return next
                      })
                    }}
                    className={`h-8 w-8 shrink-0 ${q.correct_answer ? 'text-blue-600' : 'text-muted-foreground'}`}
                    title={q.correct_answer ? 'View/edit correct answer' : 'Add correct answer'}
                  >
                    <BookOpen className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      const newVal = !q.requires_image
                      const result = await toggleQuestionRequiresImage(q.id, lessonId, courseId, newVal)
                      if (!result?.error) {
                        setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, requires_image: newVal } : p))
                      }
                    }}
                    className={`h-8 w-8 shrink-0 ${q.requires_image ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60' : 'text-muted-foreground'}`}
                    title={q.requires_image ? 'Requires image (click to remove)' : 'Click to require diagram/image'}
                  >
                    <ImageIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(q.id)}
                    className="h-8 w-8 text-destructive shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>

            {/* Correct answer section */}
            {expandedAnswers.has(q.id) && (
              <div className="ml-8 space-y-2">
                {editingAnswerId === q.id ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Grading Manual Answer
                    </p>
                    <Textarea
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      rows={3}
                      placeholder="Enter the correct answer from the grading manual..."
                      className="border-blue-200 dark:border-blue-800"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={async () => {
                        const result = await updateCorrectAnswer(q.id, lessonId, courseId, editAnswer || null)
                        if (!result?.error) {
                          setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, correct_answer: editAnswer || null } : p))
                          setEditingAnswerId(null)
                        }
                      }}>
                        <Save className="h-3 w-3 mr-1" />
                        Save Answer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingAnswerId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                    onClick={() => {
                      setEditingAnswerId(q.id)
                      setEditAnswer(q.correct_answer || '')
                    }}
                  >
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Grading Manual Answer
                      <span className="text-muted-foreground ml-1">(click to edit)</span>
                    </p>
                    {q.correct_answer ? (
                      <p className="text-sm whitespace-pre-wrap">{q.correct_answer}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No answer entered yet — click to add</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="space-y-2 border-t pt-4">
          <Textarea
            placeholder="New question text... (use *asterisks* for italics)"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            rows={2}
          />
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
