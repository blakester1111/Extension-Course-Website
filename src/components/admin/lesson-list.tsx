'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createLesson, deleteLesson, reorderLessons } from '@/app/(dashboard)/admin/courses/[id]/lessons/actions'
import type { Lesson } from '@/types/database'
import { ArrowUp, ArrowDown, Trash2, Pencil, Plus } from 'lucide-react'

interface LessonListProps {
  courseId: string
  lessons: Lesson[]
}

export function LessonList({ courseId, lessons: initialLessons }: LessonListProps) {
  const [lessons, setLessons] = useState(initialLessons)
  const [newTitle, setNewTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!newTitle.trim()) return

    const formData = new FormData()
    formData.set('title', newTitle)

    const result = await createLesson(courseId, formData) as { error?: unknown; lesson?: Lesson }
    if (result?.error) {
      setError(typeof result.error === 'object' ? Object.values(result.error as Record<string, string[]>).flat().join(', ') : String(result.error))
    } else if (result?.lesson) {
      setLessons(prev => [...prev, result.lesson!])
      setNewTitle('')
      setError(null)
    }
  }

  async function handleDelete(lessonId: string) {
    if (!confirm('Delete this lesson? All questions will be removed.')) return
    const result = await deleteLesson(lessonId, courseId)
    if (!result?.error) {
      setLessons(prev => prev.filter(l => l.id !== lessonId))
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const newLessons = [...lessons]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newLessons.length) return

    ;[newLessons[index], newLessons[swapIndex]] = [newLessons[swapIndex], newLessons[index]]
    setLessons(newLessons)
    await reorderLessons(courseId, newLessons.map(l => l.id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lessons</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="New lesson title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
          />
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No lessons yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson, index) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                  <TableCell>{lesson.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === lessons.length - 1}
                        className="h-8 w-8"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Link href={`/admin/courses/${courseId}/lessons/${lesson.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(lesson.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
