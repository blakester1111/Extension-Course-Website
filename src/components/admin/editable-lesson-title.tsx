'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { updateLessonTitle } from '@/app/(dashboard)/admin/courses/[id]/lessons/actions'
import { toast } from 'sonner'
import { Pencil, Check, X, Loader2 } from 'lucide-react'

interface Props {
  lessonId: string
  courseId: string
  initialTitle: string
}

export function EditableLessonTitle({ lessonId, courseId, initialTitle }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function handleSave() {
    if (!title.trim() || title.trim() === initialTitle) {
      setTitle(initialTitle)
      setEditing(false)
      return
    }
    setSaving(true)
    const result = await updateLessonTitle(lessonId, courseId, title)
    if (result.error) {
      toast.error(result.error)
      setTitle(initialTitle)
    } else {
      toast.success('Lesson title updated')
    }
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setTitle(initialTitle)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-2 text-left"
      >
        <h1 className="text-3xl font-bold">{title}</h1>
        <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="text-2xl font-bold h-auto py-1"
        disabled={saving}
      />
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
      ) : (
        <>
          <button onClick={handleSave} className="text-green-600 hover:text-green-700 shrink-0">
            <Check className="h-5 w-5" />
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); handleCancel() }} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  )
}
