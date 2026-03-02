'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getStudentNotes, addStudentNote, deleteStudentNote } from '@/app/(dashboard)/admin/students/notes-actions'
import { StickyNote, Plus, Trash2, Printer, Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'

interface Note {
  id: string
  content: string
  created_at: string
  author?: { full_name: string } | null
}

interface StudentNotesDialogProps {
  studentId: string
  studentName: string
}

export function StudentNotesDialog({ studentId, studentName }: StudentNotesDialogProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getStudentNotes(studentId).then(result => {
      if (result.notes) setNotes(result.notes)
      setLoading(false)
    })
  }, [open, studentId])

  async function handleAdd() {
    if (!newNote.trim()) return
    setSubmitting(true)
    const result = await addStudentNote(studentId, newNote)
    if (result.error) {
      toast.error(result.error)
    } else if (result.note) {
      setNotes(prev => [result.note, ...prev])
      setNewNote('')
      textareaRef.current?.focus()
    }
    setSubmitting(false)
  }

  async function handleDelete(noteId: string) {
    if (!confirm('Delete this note?')) return
    const result = await deleteStudentNote(noteId)
    if (result.error) {
      toast.error(result.error)
    } else {
      setNotes(prev => prev.filter(n => n.id !== noteId))
    }
  }

  function handlePrint(note: Note) {
    const authorName = note.author?.full_name || 'Unknown'
    const dateStr = format(new Date(note.created_at), 'MMMM d, yyyy h:mm a')
    const printWindow = window.open('', '_blank', 'width=700,height=500')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Extension Course Student Note — ${studentName}</title>
        <style>
          body { font-family: Georgia, serif; margin: 40px; color: #333; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .meta { font-size: 12px; color: #666; margin-bottom: 24px; border-bottom: 1px solid #ccc; padding-bottom: 12px; }
          .content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <h1>Extension Course Student Note — ${studentName}</h1>
        <div class="meta">By ${authorName} on ${dateStr}</div>
        <div class="content">${note.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <script>window.print();</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <StickyNote className="h-3.5 w-3.5" />
          Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Notes — {studentName}</DialogTitle>
        </DialogHeader>

        {/* Add new note */}
        <div className="space-y-2 border-b pb-4">
          <Textarea
            ref={textareaRef}
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Ctrl+Enter to submit</p>
            <Button size="sm" onClick={handleAdd} disabled={submitting || !newNote.trim()}>
              <Send className="h-3 w-3 mr-1.5" />
              {submitting ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </div>

        {/* Notes history */}
        <ScrollArea className="flex-1 min-h-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notes yet</p>
          ) : (
            <div className="space-y-3 pr-3">
              {notes.map(note => (
                <div key={note.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {note.author?.full_name || 'Unknown'} — {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handlePrint(note)}
                        title="Print this note"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleDelete(note.id)}
                        title="Delete this note"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
