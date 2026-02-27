'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  deleteBackenteredSubmission,
  deleteBackenteredCourse,
  revertSubmissionToSubmitted,
  resetSubmissionToDraft,
  deleteCertificate,
  changeEnrollmentCourse,
  transferEnrollment,
  bulkUpdateBackenteredDates,
} from '@/app/(dashboard)/admin/courses/actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Settings2, Trash2, RotateCcw, FileX, ArrowRightLeft, CalendarDays, Replace } from 'lucide-react'

interface Props {
  studentId: string
  studentName: string
  enrolledCourses: { id: string; title: string }[]
  allCourses: { id: string; title: string }[]
  allUsers: { id: string; full_name: string; email: string }[]
}

interface SubmissionRow {
  id: string
  lesson_id: string
  lesson_title: string
  sort_order: number
  status: string
  grade: number | null
  is_backentered: boolean
  graded_at: string | null
}

interface CertRow {
  id: string
  status: string
  certificate_number: string | null
  is_backentered: boolean
  issued_at: string | null
}

export function ManageSubmissionsDialog({ studentId, studentName, enrolledCourses, allCourses, allUsers }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [certificate, setCertificate] = useState<CertRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    description: string
    action: () => Promise<void>
  } | null>(null)

  // Change course state
  const [newCourseId, setNewCourseId] = useState('')
  // Transfer state
  const [transferToId, setTransferToId] = useState('')
  const [transferSearch, setTransferSearch] = useState('')
  // Bulk date state
  const [bulkDate, setBulkDate] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!selectedCourse || !open) return

    async function fetchData() {
      setLoading(true)

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, sort_order')
        .eq('course_id', selectedCourse)
        .order('sort_order')

      const { data: subs } = await supabase
        .from('lesson_submissions')
        .select('id, lesson_id, status, grade, is_backentered, graded_at')
        .eq('student_id', studentId)
        .in('lesson_id', (lessons || []).map((l: any) => l.id))

      const subMap = new Map((subs || []).map((s: any) => [s.lesson_id, s]))

      const rows: SubmissionRow[] = (lessons || []).map((l: any) => {
        const sub = subMap.get(l.id) as any
        return {
          id: sub?.id || '',
          lesson_id: l.id,
          lesson_title: l.title,
          sort_order: l.sort_order,
          status: sub?.status || 'none',
          grade: sub?.grade ?? null,
          is_backentered: sub?.is_backentered || false,
          graded_at: sub?.graded_at || null,
        }
      })

      setSubmissions(rows)

      const { data: cert } = await supabase
        .from('certificates')
        .select('id, status, certificate_number, is_backentered, issued_at')
        .eq('student_id', studentId)
        .eq('course_id', selectedCourse)
        .maybeSingle()

      setCertificate(cert)
      setLoading(false)
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, open])

  function statusBadge(status: string, isBE: boolean) {
    const variants: Record<string, { label: string; className: string }> = {
      none: { label: 'Not Started', className: 'bg-gray-100 text-gray-600' },
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
      submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
      graded_pass: { label: isBE ? 'Pass (BE)' : 'Pass', className: isBE ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700' },
      graded_corrections: { label: 'Corrections', className: 'bg-yellow-100 text-yellow-700' },
    }
    const v = variants[status] || { label: status, className: '' }
    return <Badge variant="outline" className={`text-[10px] ${v.className}`}>{v.label}</Badge>
  }

  function refreshCourse() {
    setSelectedCourse(prev => {
      const curr = prev
      setTimeout(() => setSelectedCourse(curr), 50)
      return ''
    })
    router.refresh()
  }

  async function runAction(fn: () => Promise<any>, successMsg: string) {
    setActing(true)
    const result = await fn()
    if (result?.error) {
      toast.error(result.error)
    } else {
      const msg = result?.message || successMsg
      toast.success(msg)
      refreshCourse()
    }
    setActing(false)
    setConfirmAction(null)
  }

  function handleDeleteBE(sub: SubmissionRow) {
    setConfirmAction({
      title: 'Delete Back-Entered Submission',
      description: `Delete back-entered completion for "${sub.lesson_title}"? This will remove the submission and its answers. If the course is no longer complete, the certificate will also be removed.`,
      action: () => runAction(
        () => deleteBackenteredSubmission(sub.id),
        `Deleted back-entered submission for ${sub.lesson_title}`
      ),
    })
  }

  function handleDeleteAllBE() {
    const beCount = submissions.filter(s => s.is_backentered).length
    setConfirmAction({
      title: 'Delete All Back-Entered Data',
      description: `Delete all ${beCount} back-entered submission(s) for this course? The back-entered certificate will also be removed.`,
      action: () => runAction(
        () => deleteBackenteredCourse(studentId, selectedCourse),
        `Deleted ${beCount} back-entered submissions`
      ),
    })
  }

  function handleRevertToSubmitted(sub: SubmissionRow) {
    setConfirmAction({
      title: 'Revert to Submitted',
      description: `Revert grading for "${sub.lesson_title}"? The submission will be placed back in the grading queue. Student answers are preserved, but supervisor feedback will be cleared.`,
      action: () => runAction(
        () => revertSubmissionToSubmitted(sub.id),
        `Reverted ${sub.lesson_title} to submitted`
      ),
    })
  }

  function handleResetToDraft(sub: SubmissionRow) {
    setConfirmAction({
      title: 'Reset to Draft',
      description: `Reset "${sub.lesson_title}" to draft? All answers and feedback will be cleared. The student will need to re-answer from scratch.`,
      action: () => runAction(
        () => resetSubmissionToDraft(sub.id),
        `Reset ${sub.lesson_title} to draft`
      ),
    })
  }

  function handleDeleteCertificate() {
    if (!certificate) return
    const isIssued = certificate.status === 'issued'
    setConfirmAction({
      title: isIssued ? 'Delete Issued Certificate' : 'Delete Certificate',
      description: isIssued
        ? `This certificate has already been issued${certificate.certificate_number ? ` (${certificate.certificate_number})` : ''}. Are you sure you want to delete it? This cannot be undone.`
        : `Delete the pending certificate for this course?`,
      action: () => runAction(
        () => deleteCertificate(certificate.id),
        'Certificate deleted'
      ),
    })
  }

  function handleChangeCourse() {
    if (!newCourseId || !selectedCourse) return
    const newTitle = allCourses.find(c => c.id === newCourseId)?.title || 'new course'
    const oldTitle = enrolledCourses.find(c => c.id === selectedCourse)?.title || 'current course'
    setConfirmAction({
      title: 'Change Enrollment Course',
      description: `Move ${studentName}'s enrollment from "${oldTitle}" to "${newTitle}"? All submissions and the certificate for the old course will be deleted. This cannot be undone.`,
      action: async () => {
        await runAction(
          () => changeEnrollmentCourse(studentId, selectedCourse, newCourseId),
          `Enrollment changed to ${newTitle}`
        )
        setNewCourseId('')
        setSelectedCourse('')
      },
    })
  }

  function handleTransfer() {
    if (!transferToId || !selectedCourse) return
    const target = allUsers.find(u => u.id === transferToId)
    const courseTitle = enrolledCourses.find(c => c.id === selectedCourse)?.title || 'this course'
    setConfirmAction({
      title: 'Transfer Enrollment',
      description: `Transfer "${courseTitle}" enrollment (and all submissions/certificate) from ${studentName} to ${target?.full_name || 'selected user'}? This cannot be undone.`,
      action: async () => {
        await runAction(
          () => transferEnrollment(studentId, transferToId, selectedCourse),
          `Transferred to ${target?.full_name}`
        )
        setTransferToId('')
        setSelectedCourse('')
      },
    })
  }

  function handleBulkDateUpdate() {
    if (!bulkDate || !selectedCourse) return
    const beCount = submissions.filter(s => s.is_backentered).length
    setConfirmAction({
      title: 'Update Back-Entered Dates',
      description: `Update the completion date to ${bulkDate} for all ${beCount} back-entered submission(s) in this course? The certificate date will also be updated.`,
      action: async () => {
        await runAction(
          () => bulkUpdateBackenteredDates(studentId, selectedCourse, bulkDate),
          `Updated ${beCount} submission dates`
        )
        setBulkDate('')
      },
    })
  }

  const hasBackentered = submissions.some(s => s.is_backentered)
  const enrolledCourseIds = new Set(enrolledCourses.map(c => c.id))
  const swapCourseOptions = allCourses.filter(c => !enrolledCourseIds.has(c.id))

  // Filter users for transfer (exclude current student)
  const filteredTransferUsers = allUsers
    .filter(u => u.id !== studentId)
    .filter(u => {
      if (!transferSearch.trim()) return true
      const q = transferSearch.toLowerCase()
      return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
    .slice(0, 50)

  if (enrolledCourses.length === 0) return null

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            <Settings2 className="h-3 w-3" />
            Manage
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Submissions</DialogTitle>
            <DialogDescription>
              View and manage submission data for <strong>{studentName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {enrolledCourses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && selectedCourse && (
              <>
                {/* Certificate section */}
                {certificate && (
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Certificate</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {certificate.status.replace(/_/g, ' ')}
                          {certificate.certificate_number && ` — ${certificate.certificate_number}`}
                          {certificate.is_backentered && ' (back-entered)'}
                          {certificate.issued_at && ` — Issued ${new Date(certificate.issued_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={handleDeleteCertificate}
                        disabled={acting}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}

                {/* Back-enter bulk controls */}
                {hasBackentered && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Back-Entered Data</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {submissions.filter(s => s.is_backentered).length} back-entered submission(s)
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={handleDeleteAllBE}
                        disabled={acting}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete All BE
                      </Button>
                    </div>
                    {/* Bulk date correction */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-amber-700 dark:text-amber-300">Correct completion date</Label>
                        <Input
                          type="date"
                          value={bulkDate}
                          onChange={(e) => setBulkDate(e.target.value)}
                          className="h-7 text-xs"
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={handleBulkDateUpdate}
                        disabled={acting || !bulkDate}
                      >
                        <CalendarDays className="h-3 w-3" />
                        Update Dates
                      </Button>
                    </div>
                  </div>
                )}

                {/* Submissions table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground w-8">#</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground">Lesson</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground w-24">Status</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground w-16">Grade</th>
                        <th className="text-right p-2 text-xs font-medium text-muted-foreground w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub, i) => (
                        <tr key={sub.lesson_id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-2 text-xs text-muted-foreground">{i + 1}</td>
                          <td className="p-2 text-xs">{sub.lesson_title}</td>
                          <td className="p-2">{statusBadge(sub.status, sub.is_backentered)}</td>
                          <td className="p-2 text-xs">
                            {sub.grade !== null ? `${sub.grade}%` : '—'}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-end gap-1">
                              {sub.is_backentered && sub.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteBE(sub)}
                                  disabled={acting}
                                  title="Delete back-entered submission"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                              {!sub.is_backentered && ['graded_pass', 'graded_corrections'].includes(sub.status) && sub.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleRevertToSubmitted(sub)}
                                  disabled={acting}
                                  title="Revert to submitted (re-grade)"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              )}
                              {!sub.is_backentered && sub.status !== 'none' && sub.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => handleResetToDraft(sub)}
                                  disabled={acting}
                                  title="Reset to draft (clear all answers)"
                                >
                                  <FileX className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1"><Trash2 className="h-3 w-3 text-red-500" /> Delete back-enter</span>
                  <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3 text-blue-500" /> Revert to queue</span>
                  <span className="flex items-center gap-1"><FileX className="h-3 w-3 text-orange-500" /> Reset to draft</span>
                </div>

                {/* Enrollment actions */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Enrollment Actions</p>

                  {/* Change course */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Change to different course</Label>
                      <Select value={newCourseId} onValueChange={setNewCourseId}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select new course..." />
                        </SelectTrigger>
                        <SelectContent>
                          {swapCourseOptions.map(c => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={handleChangeCourse}
                      disabled={acting || !newCourseId}
                    >
                      <Replace className="h-3 w-3" />
                      Change
                    </Button>
                  </div>

                  {/* Transfer enrollment */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Transfer enrollment to another student</Label>
                      <Input
                        placeholder="Search by name or email..."
                        value={transferSearch}
                        onChange={(e) => setTransferSearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                      {transferSearch.trim().length >= 2 && (
                        <Select value={transferToId} onValueChange={setTransferToId}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select student..." />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredTransferUsers.length === 0 ? (
                              <div className="p-2 text-xs text-muted-foreground">No matches</div>
                            ) : (
                              filteredTransferUsers.map(u => (
                                <SelectItem key={u.id} value={u.id} className="text-xs">
                                  {u.full_name} ({u.email})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={handleTransfer}
                      disabled={acting || !transferToId}
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Transfer
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmAction?.action() }}
              disabled={acting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
