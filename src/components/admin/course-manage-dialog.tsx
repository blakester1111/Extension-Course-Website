'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BackenterDialog } from '@/components/admin/backenter-dialog'
import { ManageSubmissionsDialog } from '@/components/admin/manage-submissions-dialog'
import { RouteAssign } from '@/components/admin/route-assign'
import { enrollStudent } from '@/app/(dashboard)/admin/courses/actions'
import { toast } from 'sonner'
import { BookOpen, Plus } from 'lucide-react'

interface Enrollment {
  course_id: string
  title: string
  status: string
  invoice_number: string | null
}

interface Props {
  studentId: string
  studentName: string
  isStaff: boolean
  studyRouteId: string | null
  enrollments: Enrollment[]
  availableCourses: { id: string; title: string }[]
  allCourses: { id: string; title: string }[]
  allUsers: { id: string; full_name: string; email: string }[]
  studyRoutes: { id: string; name: string }[]
}

export function CourseManageDialog({
  studentId,
  studentName,
  isStaff,
  studyRouteId,
  enrollments,
  availableCourses,
  allCourses,
  allUsers,
  studyRoutes,
}: Props) {
  const [open, setOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const router = useRouter()

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-[110px] gap-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5" />
          Courses
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
            {enrollments.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Courses — {studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Enrolled courses */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Enrolled Courses</Label>
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No enrollments</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {enrollments.map(e => (
                  <div key={e.course_id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm">{e.title}</span>
                    <Badge
                      variant={e.status === 'pending_invoice_verification' ? 'outline' : 'secondary'}
                      className={`text-xs ${e.status === 'pending_invoice_verification' ? 'border-yellow-500 text-yellow-700' : ''}`}
                    >
                      {e.status === 'pending_invoice_verification' ? 'Pending' : e.status === 'active' ? 'Active' : e.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enroll in new course */}
          {availableCourses.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Enroll in Course</Label>
              <div className="flex items-center gap-2">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="Select course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-sm">
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleEnroll}
                  disabled={!selectedCourse || enrolling || (isStaff && !invoiceNumber.trim())}
                  className="h-9 px-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Enroll
                </Button>
              </div>
              {isStaff && (
                <Input
                  placeholder="Invoice # (required for staff)"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="h-9 text-sm"
                />
              )}
            </div>
          )}

          {/* Study Route */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Study Route</Label>
            <div className="w-full">
              <RouteAssign
                studentId={studentId}
                currentRouteId={studyRouteId}
                routes={studyRoutes}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <BackenterDialog
              studentId={studentId}
              studentName={studentName}
              availableCourses={allCourses}
            />
            {enrollments.length > 0 && (
              <ManageSubmissionsDialog
                studentId={studentId}
                studentName={studentName}
                enrolledCourses={enrollments.map(e => ({ id: e.course_id, title: e.title }))}
                allCourses={allCourses}
                allUsers={allUsers}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
