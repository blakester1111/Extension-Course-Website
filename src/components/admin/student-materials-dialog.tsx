'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { getStudentMaterials, toggleMaterial } from '@/app/(dashboard)/admin/students/materials-actions'
import { ClipboardList, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface MaterialRow {
  student_id: string
  course_id: string
  owns_book: boolean
  owns_lectures: boolean
}

interface CourseWithCategory {
  id: string
  title: string
  category: string
}

interface StudentMaterialsDialogProps {
  studentId: string
  studentName: string
  courses: CourseWithCategory[]
}

// Display name overrides for the materials list only
const TITLE_OVERRIDES: Record<string, string> = {
  'Advanced Procedure & Axioms and Thought Emotion and Effort': 'Thought, Emotion and Effort Lectures',
}

function displayTitle(title: string): string {
  return TITLE_OVERRIDES[title] || title
}

const CATEGORY_LABELS: Record<string, string> = {
  basics: 'Basics',
  congresses: 'Congresses',
  accs: 'Advanced Clinical Courses',
}

export function StudentMaterialsDialog({ studentId, studentName, courses }: StudentMaterialsDialogProps) {
  const [open, setOpen] = useState(false)
  const [materials, setMaterials] = useState<Map<string, MaterialRow>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getStudentMaterials(studentId).then(result => {
      if (result.materials) {
        const map = new Map<string, MaterialRow>()
        for (const m of result.materials) {
          map.set(m.course_id, m)
        }
        setMaterials(map)
      }
      setLoading(false)
    })
  }, [open, studentId])

  async function handleToggle(courseId: string, currentValue: boolean) {
    const newValue = !currentValue
    setMaterials(prev => {
      const next = new Map(prev)
      const existing = next.get(courseId) || {
        student_id: studentId,
        course_id: courseId,
        owns_book: false,
        owns_lectures: false,
      }
      next.set(courseId, { ...existing, owns_book: newValue })
      return next
    })

    const result = await toggleMaterial(studentId, courseId, 'owns_book', newValue)
    if (result.error) {
      toast.error(result.error)
      setMaterials(prev => {
        const next = new Map(prev)
        const existing = next.get(courseId)
        if (existing) {
          next.set(courseId, { ...existing, owns_book: currentValue })
        }
        return next
      })
    }
  }

  function isOwned(courseId: string): boolean {
    return materials.get(courseId)?.owns_book ?? false
  }

  const ownedCount = courses.filter(c => isOwned(c.id)).length

  function handlePrintReport() {
    const dateStr = format(new Date(), 'MMMM d, yyyy')

    // Group not-owned courses by category (in display order)
    const notOwned = courses.filter(c => !isOwned(c.id))
    const byCategory = new Map<string, string[]>()
    for (const c of notOwned) {
      const list = byCategory.get(c.category) || []
      list.push(displayTitle(c.title))
      byCategory.set(c.category, list)
    }

    // Build the not-yet-purchased section
    const categoryOrder = ['basics', 'congresses', 'accs']
    let notPurchasedHtml = ''
    for (const cat of categoryOrder) {
      const titles = byCategory.get(cat)
      if (!titles || titles.length === 0) continue
      const label = CATEGORY_LABELS[cat] || cat
      notPurchasedHtml += `<h3>${label}</h3><ul>${titles.map(t => `<li>${t}</li>`).join('')}</ul>`
    }
    if (!notPurchasedHtml) {
      notPurchasedHtml = '<p class="complete">All materials owned!</p>'
    }

    // Build the owned section
    const ownedCourses = courses.filter(c => isOwned(c.id))
    const ownedByCategory = new Map<string, string[]>()
    for (const c of ownedCourses) {
      const list = ownedByCategory.get(c.category) || []
      list.push(displayTitle(c.title))
      ownedByCategory.set(c.category, list)
    }

    let ownedHtml = ''
    for (const cat of categoryOrder) {
      const titles = ownedByCategory.get(cat)
      if (!titles || titles.length === 0) continue
      const label = CATEGORY_LABELS[cat] || cat
      ownedHtml += `<h3>${label}</h3><ul>${titles.map(t => `<li>${t}</li>`).join('')}</ul>`
    }
    if (!ownedHtml) {
      ownedHtml = '<p class="none">No materials owned yet.</p>'
    }

    const printWindow = window.open('', '_blank', 'width=700,height=700')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Materials Report — ${studentName}</title>
        <style>
          body { font-family: Georgia, serif; margin: 40px; color: #333; }
          h1 { font-size: 18px; margin-bottom: 2px; }
          h2 { font-size: 15px; margin-top: 28px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
          h3 { font-size: 13px; color: #555; margin: 14px 0 4px 0; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 24px; }
          ul { margin: 0 0 0 20px; padding: 0; }
          li { font-size: 13px; line-height: 1.7; }
          .complete { font-size: 13px; color: #16a34a; font-style: italic; }
          .none { font-size: 13px; color: #999; font-style: italic; }
          .summary { font-size: 12px; color: #666; margin-top: 24px; border-top: 1px solid #ccc; padding-top: 12px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <h1>Materials report for ${studentName} as of ${dateStr}</h1>
        <h2>Materials Owned</h2>
        ${ownedHtml}

        <h2>Materials Not Yet Purchased</h2>
        ${notPurchasedHtml}

        <p class="summary">${ownedCount} of ${courses.length} materials owned</p>
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
          <ClipboardList className="h-3.5 w-3.5" />
          Materials
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Materials Guide — {studentName}</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Track which course materials this student owns.
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading materials...</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No courses available</p>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_55px] items-center px-3 py-1.5 text-xs text-muted-foreground font-medium border-b sticky top-0 bg-background z-10">
              <span>Course Title</span>
              <span className="text-center">Owns</span>
            </div>

            {courses.map(course => {
              const owned = isOwned(course.id)

              return (
                <div
                  key={course.id}
                  className="grid grid-cols-[1fr_55px] items-center px-3 py-1.5 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm truncate pr-2">{displayTitle(course.title)}</span>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={owned}
                      onCheckedChange={() => handleToggle(course.id, owned)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {ownedCount} of {courses.length} materials owned
          </span>
          <Button variant="outline" size="sm" onClick={handlePrintReport} disabled={loading}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
