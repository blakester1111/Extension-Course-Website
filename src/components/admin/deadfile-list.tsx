'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deadfileUser, restoreUser } from '@/app/(dashboard)/admin/deadfile/actions'
import { toast } from 'sonner'
import { Loader2, UserX, UserCheck, Search, AlertTriangle } from 'lucide-react'

interface DeadfiledUser {
  id: string
  fullName: string
  email: string
  role: string
  isStaff: boolean
  deadfiledAt: string | null
  reason: string | null
  deadfiledBy: string
}

interface ActiveUser {
  id: string
  fullName: string
  email: string
  role: string
}

interface Props {
  deadfiled: DeadfiledUser[]
  activeUsers: ActiveUser[]
}

export function DeadfileList({ deadfiled, activeUsers }: Props) {
  return (
    <div className="space-y-6">
      <DeadfileAction activeUsers={activeUsers} />

      {deadfiled.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-center text-muted-foreground py-12">No deadfiled users</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Deadfiled Users ({deadfiled.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deadfiled.map(u => (
                <DeadfiledUserRow key={u.id} user={u} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DeadfileAction({ activeUsers }: { activeUsers: ActiveUser[] }) {
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [reason, setReason] = useState('')
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const filtered = search.trim()
    ? activeUsers.filter(u =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : activeUsers

  async function handleDeadfile() {
    if (!selectedUser) return
    setSubmitting(true)
    const result = await deadfileUser(selectedUser, reason)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('User has been deadfiled')
      setOpen(false)
      setSelectedUser('')
      setReason('')
      setSearch('')
      router.refresh()
    }
    setSubmitting(false)
  }

  const selectedUserData = activeUsers.find(u => u.id === selectedUser)

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedUser(''); setReason(''); setSearch('') } }}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <UserX className="h-4 w-4" />
          Deadfile a User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Deadfile User
          </DialogTitle>
          <DialogDescription>
            This will block the user from signing in and remove them from all honor roll and hall of fame listings. This action can be reversed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search User</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {filtered.slice(0, 50).map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName} ({u.email})
                  </SelectItem>
                ))}
                {filtered.length > 50 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    Showing 50 of {filtered.length} — use search to narrow down
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedUserData && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm font-medium">{selectedUserData.fullName}</p>
              <p className="text-xs text-muted-foreground">{selectedUserData.email} — {selectedUserData.role}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Internal note about why this user is being deadfiled..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleDeadfile}
            disabled={!selectedUser || submitting}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              'Deadfile User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeadfiledUserRow({ user }: { user: DeadfiledUser }) {
  const [restoring, setRestoring] = useState(false)
  const router = useRouter()

  async function handleRestore() {
    setRestoring(true)
    const result = await restoreUser(user.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${user.fullName} has been restored`)
      router.refresh()
    }
    setRestoring(false)
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{user.fullName}</p>
          <Badge variant="secondary" className="text-xs">{user.role}</Badge>
          {user.isStaff && <Badge variant="outline" className="text-xs">Staff</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        {user.reason && (
          <p className="text-xs text-muted-foreground mt-1">Reason: {user.reason}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Deadfiled {user.deadfiledAt ? new Date(user.deadfiledAt).toLocaleDateString() : '—'} by {user.deadfiledBy}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={restoring}
        className="gap-1 shrink-0"
      >
        {restoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
        Restore
      </Button>
    </div>
  )
}
