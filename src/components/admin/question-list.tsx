'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createQuestion, deleteQuestion, updateQuestion } from '@/app/(dashboard)/admin/courses/[id]/lessons/actions'
import type { Question } from '@/types/database'
import { Trash2, Plus, Save } from 'lucide-react'

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
          <div key={q.id} className="flex gap-2 items-start border rounded-md p-3">
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
                  {q.question_text}
                </p>
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
        ))}

        <div className="space-y-2 border-t pt-4">
          <Textarea
            placeholder="New question text..."
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
