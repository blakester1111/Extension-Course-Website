'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { mergeProfiles } from '@/app/(dashboard)/admin/courses/actions'
import { toast } from 'sonner'
import { Loader2, Merge } from 'lucide-react'

interface Props {
  users: { id: string; full_name: string; email: string; role: string }[]
}

export function MergeProfilesDialog({ users }: Props) {
  const [open, setOpen] = useState(false)
  const [sourceSearch, setSourceSearch] = useState('')
  const [targetSearch, setTargetSearch] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [acting, setActing] = useState(false)
  const router = useRouter()

  const source = users.find(u => u.id === sourceId)
  const target = users.find(u => u.id === targetId)

  function filterUsers(search: string, excludeId?: string) {
    if (search.trim().length < 2) return []
    const q = search.toLowerCase()
    return users
      .filter(u => u.id !== excludeId)
      .filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 30)
  }

  const sourceResults = filterUsers(sourceSearch, targetId)
  const targetResults = filterUsers(targetSearch, sourceId)

  async function handleMerge() {
    if (!sourceId || !targetId) return
    setActing(true)
    const result = await mergeProfiles(sourceId, targetId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.message || 'Profiles merged successfully')
      setOpen(false)
      resetState()
      router.refresh()
    }
    setActing(false)
    setShowConfirm(false)
  }

  function resetState() {
    setSourceSearch('')
    setTargetSearch('')
    setSourceId('')
    setTargetId('')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Merge className="h-4 w-4" />
            Merge Profiles
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Merge Duplicate Profiles</DialogTitle>
            <DialogDescription>
              Merge one profile into another. The source profile will be deleted and all its data (enrollments, submissions, certificates) will be moved to the target profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Source (to delete) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Source (will be deleted)</Label>
              <Input
                placeholder="Search by name or email..."
                value={sourceSearch}
                onChange={(e) => { setSourceSearch(e.target.value); setSourceId('') }}
                className="text-sm"
              />
              {sourceSearch.trim().length >= 2 && (
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select profile to delete..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceResults.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No matches</div>
                    ) : (
                      sourceResults.map(u => (
                        <SelectItem key={u.id} value={u.id} className="text-sm">
                          {u.full_name} ({u.email}) — {u.role}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {source && (
                <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-2">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>{source.full_name}</strong> ({source.email}) will be deleted
                  </p>
                </div>
              )}
            </div>

            {/* Target (to keep) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Target (will be kept)</Label>
              <Input
                placeholder="Search by name or email..."
                value={targetSearch}
                onChange={(e) => { setTargetSearch(e.target.value); setTargetId('') }}
                className="text-sm"
              />
              {targetSearch.trim().length >= 2 && (
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select profile to keep..." />
                  </SelectTrigger>
                  <SelectContent>
                    {targetResults.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No matches</div>
                    ) : (
                      targetResults.map(u => (
                        <SelectItem key={u.id} value={u.id} className="text-sm">
                          {u.full_name} ({u.email}) — {u.role}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {target && (
                <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-2">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>{target.full_name}</strong> ({target.email}) will receive all data
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            {source && target && (
              <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-sm">
                <p className="font-medium">What will happen:</p>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground text-xs">
                  <li>Enrollments, submissions, and certificates will be moved to {target.full_name}</li>
                  <li>If both are enrolled in the same course, {target.full_name}'s data takes priority</li>
                  <li>Notifications and order history will be transferred</li>
                  <li>Students supervised by {source.full_name} will be reassigned to {target.full_name}</li>
                  <li>{source.full_name}'s account will be permanently deleted</li>
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setOpen(false); resetState() }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => setShowConfirm(true)}
              disabled={!sourceId || !targetId || sourceId === targetId}
            >
              <Merge className="h-4 w-4 mr-1" />
              Merge Profiles
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Profile Merge</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{source?.full_name}</strong> ({source?.email}) and move all their data to <strong>{target?.full_name}</strong> ({target?.email}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleMerge() }}
              disabled={acting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete & Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
