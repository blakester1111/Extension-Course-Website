'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateLessonInstructions } from '@/app/(dashboard)/admin/courses/[id]/lessons/actions'
import { Save, X } from 'lucide-react'

interface LessonInstructionsProps {
  lessonId: string
  courseId: string
  initialInstructions: string
}

export function LessonInstructions({ lessonId, courseId, initialInstructions }: LessonInstructionsProps) {
  const [instructions, setInstructions] = useState(initialInstructions)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasChanges = instructions !== initialInstructions

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const result = await updateLessonInstructions(lessonId, courseId, instructions)
    if (result?.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  function handleClear() {
    setInstructions('')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Lesson Instructions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Instructions shown to the student before the questions (e.g., what to read or listen to).
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g., Read Chapter 1 of Dianetics: The Modern Science of Mental Health..."
          rows={5}
        />

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} size="sm" disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save Instructions'}
          </Button>
          {instructions && (
            <Button onClick={handleClear} size="sm" variant="outline">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          {saved && (
            <span className="text-sm text-green-600">Saved</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
