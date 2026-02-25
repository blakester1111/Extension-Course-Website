'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { enrollStudent } from '@/app/(dashboard)/admin/courses/actions'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface Props {
  studentId: string
  isStaff: boolean
  availableCourses: { id: string; title: string }[]
}

export function StudentEnrollButton({ studentId, isStaff, availableCourses }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const router = useRouter()

  if (availableCourses.length === 0) {
    return <span className="text-xs text-muted-foreground">All enrolled</span>
  }

  async function handleEnroll() {
    if (!selectedCourse) return
    if (isStaff && !invoiceNumber.trim()) {
      toast.error('Invoice number required for staff enrollment')
      return
    }
    setEnrolling(true)

    const result = await enrollStudent(
      studentId,
      selectedCourse,
      isStaff ? invoiceNumber.trim() : undefined
    )

    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Enrollment failed')
    } else {
      toast.success(isStaff ? 'Staff enrollment pending verification' : 'Student enrolled successfully')
      setSelectedCourse('')
      setInvoiceNumber('')
      router.refresh()
    }
    setEnrolling(false)
  }

  return (
    <div className="flex items-center gap-1">
      <Select value={selectedCourse} onValueChange={setSelectedCourse}>
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Select course" />
        </SelectTrigger>
        <SelectContent>
          {availableCourses.map((course) => (
            <SelectItem key={course.id} value={course.id} className="text-xs">
              {course.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isStaff && (
        <Input
          placeholder="Invoice #"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          className="w-28 h-8 text-xs"
        />
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleEnroll}
        disabled={!selectedCourse || enrolling || (isStaff && !invoiceNumber.trim())}
        className="h-8 px-2"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}
