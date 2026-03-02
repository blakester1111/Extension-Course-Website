'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StudentSupervisorAssign } from '@/components/admin/student-supervisor-assign'
import { StaffToggleButton } from '@/components/admin/staff-toggle-button'
import { UserRoleSelect } from '@/components/admin/user-role-select'
import { OrganizationAssign } from '@/components/admin/organization-assign'
import { CertPermissionToggles } from '@/components/admin/cert-permission-toggles'
import { Trophy, Mail, Phone, MapPin, Calendar, Pencil, Check, X, TriangleAlert } from 'lucide-react'
import { updateProfileContact, updateUserEmail } from '@/app/(dashboard)/admin/students/profile-actions'
import { toast } from 'sonner'
import type { UserRole } from '@/types/database'

export interface ContactInfo {
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

interface UserProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    full_name: string
    email: string
    role: string
    organization: string | null
    supervisor_id: string | null
    is_staff: boolean
    can_attest_certs: boolean
    can_sign_certs: boolean
    created_at: string
  }
  contactInfo?: ContactInfo | null
  honorRank?: number
  // Admin-only props (omit for supervisor view)
  isAdmin?: boolean
  currentUserId?: string
  currentUserRole?: UserRole
  supervisors?: { id: string; full_name: string; role: string }[]
}

export function UserProfileDialog({
  open,
  onOpenChange,
  user: u,
  contactInfo,
  honorRank,
  isAdmin = false,
  currentUserId,
  currentUserRole,
  supervisors,
}: UserProfileDialogProps) {
  const [editingContact, setEditingContact] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [saving, setSaving] = useState(false)

  // Contact edit state
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editState, setEditState] = useState('')
  const [editZip, setEditZip] = useState('')
  const [editCountry, setEditCountry] = useState('')

  // Email edit state
  const [editEmail, setEditEmail] = useState('')
  const [showEmailConfirm, setShowEmailConfirm] = useState(false)

  // Live contact state (updates after save without full page refresh)
  const [localContact, setLocalContact] = useState<ContactInfo | null | undefined>(undefined)
  const [localEmail, setLocalEmail] = useState<string | undefined>(undefined)

  const activeContact = localContact !== undefined ? localContact : contactInfo
  const activeEmail = localEmail !== undefined ? localEmail : u.email

  const hasAddress = activeContact && (activeContact.address || activeContact.city || activeContact.state)

  const addressParts: string[] = []
  if (activeContact?.address) addressParts.push(activeContact.address)
  const cityStateZip = [
    activeContact?.city,
    activeContact?.state,
    activeContact?.zip,
  ].filter(Boolean).join(', ')
  if (cityStateZip) addressParts.push(cityStateZip)
  if (activeContact?.country && activeContact.country !== 'US' && activeContact.country !== 'United States') {
    addressParts.push(activeContact.country)
  }

  function startEditContact() {
    setEditPhone(activeContact?.phone || '')
    setEditAddress(activeContact?.address || '')
    setEditCity(activeContact?.city || '')
    setEditState(activeContact?.state || '')
    setEditZip(activeContact?.zip || '')
    setEditCountry(activeContact?.country || '')
    setEditingContact(true)
  }

  function startEditEmail() {
    setEditEmail(activeEmail)
    setEditingEmail(true)
  }

  async function saveContact() {
    setSaving(true)
    const fields = {
      phone: editPhone.trim() || null,
      address: editAddress.trim() || null,
      city: editCity.trim() || null,
      state: editState.trim() || null,
      zip: editZip.trim() || null,
      country: editCountry.trim() || null,
    }
    const result = await updateProfileContact(u.id, fields)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Contact info updated')
      setLocalContact(fields)
      setEditingContact(false)
    }
    setSaving(false)
  }

  function requestEmailSave() {
    const trimmed = editEmail.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@') || trimmed === activeEmail) {
      setEditingEmail(false)
      return
    }
    setShowEmailConfirm(true)
  }

  async function confirmEmailSave() {
    setShowEmailConfirm(false)
    setSaving(true)
    const result = await updateUserEmail(u.id, editEmail)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Email updated')
      setLocalEmail(editEmail.trim().toLowerCase())
      setEditingEmail(false)
    }
    setSaving(false)
  }

  const canEdit = isAdmin || currentUserRole === 'supervisor' || currentUserRole === 'admin' || currentUserRole === 'super_admin'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {u.full_name}
            {honorRank && (
              <span className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 font-medium">
                <Trophy className="h-3.5 w-3.5" />
                #{honorRank}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Contact Info */}
          <div className="space-y-2">
            {/* Email */}
            {editingEmail ? (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="h-7 text-sm flex-1"
                  type="email"
                  disabled={saving}
                />
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={requestEmailSave} disabled={saving}>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingEmail(false)} disabled={saving}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm group">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1">{activeEmail}</span>
                {isAdmin && (
                  <button onClick={startEditEmail} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            )}

            {/* Phone + Address (editable) */}
            {editingContact ? (
              <div className="space-y-2 border rounded-md p-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="Phone"
                    className="h-7 text-sm"
                    disabled={saving}
                  />
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1.5" />
                  <div className="flex-1 space-y-1.5">
                    <Input
                      value={editAddress}
                      onChange={e => setEditAddress(e.target.value)}
                      placeholder="Street address"
                      className="h-7 text-sm"
                      disabled={saving}
                    />
                    <div className="flex gap-1.5">
                      <Input
                        value={editCity}
                        onChange={e => setEditCity(e.target.value)}
                        placeholder="City"
                        className="h-7 text-sm flex-1"
                        disabled={saving}
                      />
                      <Input
                        value={editState}
                        onChange={e => setEditState(e.target.value)}
                        placeholder="State"
                        className="h-7 text-sm w-16"
                        disabled={saving}
                      />
                      <Input
                        value={editZip}
                        onChange={e => setEditZip(e.target.value)}
                        placeholder="Zip"
                        className="h-7 text-sm w-20"
                        disabled={saving}
                      />
                    </div>
                    <Input
                      value={editCountry}
                      onChange={e => setEditCountry(e.target.value)}
                      placeholder="Country"
                      className="h-7 text-sm"
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingContact(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={saveContact} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {activeContact?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{activeContact.phone}</span>
                  </div>
                )}
                {hasAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{addressParts.join(', ')}</span>
                  </div>
                )}
                {canEdit && (
                  <button
                    onClick={startEditContact}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    {activeContact?.phone || hasAddress ? 'Edit contact info' : 'Add contact info'}
                  </button>
                )}
              </>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && currentUserId && currentUserRole && supervisors && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <UserRoleSelect
                  profileId={u.id}
                  currentRole={u.role as UserRole}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Organization</span>
                <div className="w-48">
                  <OrganizationAssign
                    profileId={u.id}
                    currentOrg={u.organization || null}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Supervisor</span>
                <StudentSupervisorAssign
                  studentId={u.id}
                  currentSupervisorId={u.supervisor_id}
                  supervisors={supervisors.filter(s => s.id !== u.id)}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Staff</span>
                <StaffToggleButton profileId={u.id} isStaff={u.is_staff} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Certificates</span>
                <CertPermissionToggles
                  profileId={u.id}
                  canAttestCerts={u.can_attest_certs}
                  canSignCerts={u.can_sign_certs}
                />
              </div>
            </div>
          )}

          {/* Read-only info for supervisor view */}
          {!isAdmin && (
            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Organization</span>
                <span className="capitalize">{u.organization || 'Unassigned'}</span>
              </div>
              {u.is_staff && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>Staff</span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Email change confirmation */}
      <AlertDialog open={showEmailConfirm} onOpenChange={setShowEmailConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-amber-500" />
              Change Login Email
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  You are changing <strong>{u.full_name}</strong>&apos;s email
                  from <strong>{activeEmail}</strong> to <strong>{editEmail.trim().toLowerCase()}</strong>.
                </p>
                <p>
                  This will take effect immediately. The student will need to use the
                  new email address to log in. Their old email will no longer work.
                </p>
                <div className="bg-muted rounded-md p-3 space-y-1.5">
                  <p className="font-medium text-foreground">Tell the student:</p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li>Your login email has been changed to <strong className="text-foreground">{editEmail.trim().toLowerCase()}</strong></li>
                    <li>Use this new email the next time you sign in</li>
                    <li>Your password has not changed</li>
                    <li>If you forgot your password, use &quot;Forgot Password&quot; with the new email</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEmailSave}>
              Change Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
