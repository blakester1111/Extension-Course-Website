'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { attestCertificate, sealCertificate, updateMailStatus } from '@/app/(dashboard)/admin/certificates/actions'
import { updateCertificateDate, deleteCertificate } from '@/app/(dashboard)/admin/courses/actions'
import { toast } from 'sonner'
import { CheckCircle, Stamp, FileCheck, Loader2, Pencil, Mail, Package, PackageCheck, Trash2 } from 'lucide-react'

interface CertData {
  id: string
  status: string
  certificateNumber: string | null
  isBackentered: boolean
  studentName: string
  studentEmail: string
  wantsMail: boolean
  courseTitle: string
  attesterName: string | null
  attestedAt: string | null
  sealerName: string | null
  sealedAt: string | null
  issuedAt: string | null
  createdAt: string
  mailStatus: string | null
  mailedAt: string | null
}

interface Props {
  certificates: CertData[]
  canAttest: boolean
  canSeal: boolean
}

export function CertificateQueue({ certificates, canAttest, canSeal }: Props) {
  const [tab, setTab] = useState<'pending_attestation' | 'pending_seal' | 'issued'>('pending_attestation')

  const pending = certificates.filter(c => c.status === 'pending_attestation')
  const awaitingSeal = certificates.filter(c => c.status === 'pending_seal')
  const issued = certificates.filter(c => c.status === 'issued')

  const tabs = [
    { key: 'pending_attestation' as const, label: 'Pending Attestation', count: pending.length },
    { key: 'pending_seal' as const, label: 'Pending Seal', count: awaitingSeal.length },
    { key: 'issued' as const, label: 'Issued', count: issued.length },
  ]

  const currentList = tab === 'pending_attestation' ? pending : tab === 'pending_seal' ? awaitingSeal : issued

  return (
    <>
      <div className="flex rounded-lg border bg-muted p-0.5 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {tab === 'pending_attestation' && <><FileCheck className="h-5 w-5" /> Awaiting Certificates & Awards Attestation</>}
            {tab === 'pending_seal' && <><Stamp className="h-5 w-5" /> Awaiting Keeper of Seals Signature</>}
            {tab === 'issued' && <><CheckCircle className="h-5 w-5" /> Issued Certificates</>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {currentList.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {tab === 'issued' ? 'No certificates issued yet.' : 'No certificates in this queue.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  {tab === 'pending_seal' && <TableHead>Cert # / Attested By</TableHead>}
                  {tab === 'issued' && <TableHead>Cert #</TableHead>}
                  {tab === 'issued' && <TableHead>Issued</TableHead>}
                  {tab === 'issued' && <TableHead>Mail</TableHead>}
                  <TableHead>Created</TableHead>
                  {(tab === 'pending_attestation' && canAttest) && <TableHead>Action</TableHead>}
                  {(tab === 'pending_seal' && canSeal) && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentList.map(cert => (
                  <CertRow
                    key={cert.id}
                    cert={cert}
                    tab={tab}
                    canAttest={canAttest}
                    canSeal={canSeal}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function CertRow({ cert, tab, canAttest, canSeal }: {
  cert: CertData
  tab: string
  canAttest: boolean
  canSeal: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [certNumber, setCertNumber] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete certificate for ${cert.studentName} — ${cert.courseTitle}? This cannot be undone.`)) return
    setDeleting(true)
    const result = await deleteCertificate(cert.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Certificate deleted')
      router.refresh()
    }
    setDeleting(false)
  }

  async function handleAttest() {
    if (!certNumber.trim()) {
      toast.error('Please enter a certificate number')
      return
    }
    setLoading(true)
    const result = await attestCertificate(cert.id, certNumber.trim())
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Attested certificate for ${cert.studentName}`)
      setCertNumber('')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleSeal() {
    setLoading(true)
    const result = await sealCertificate(cert.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Certificate issued for ${cert.studentName}`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium flex items-center gap-1.5">
            {cert.studentName}
            {cert.wantsMail && (
              <span title="Wants mailed certificate"><Mail className="h-3.5 w-3.5 text-blue-500" /></span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{cert.studentEmail}</p>
        </div>
      </TableCell>
      <TableCell>{cert.courseTitle}</TableCell>
      {tab === 'pending_seal' && (
        <TableCell>
          <div>
            <Badge variant="outline" className="font-mono text-xs">{cert.certificateNumber}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{cert.attesterName || '—'}</p>
          </div>
        </TableCell>
      )}
      {tab === 'issued' && (
        <TableCell>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="font-mono text-xs">
              {cert.certificateNumber || (cert.isBackentered ? 'Back Entered' : '—')}
            </Badge>
            {cert.isBackentered && (
              <Badge variant="secondary" className="text-xs">BE</Badge>
            )}
          </div>
        </TableCell>
      )}
      {tab === 'issued' && (
        <TableCell>
          <EditableDateCell
            certId={cert.id}
            currentDate={cert.issuedAt}
          />
        </TableCell>
      )}
      {tab === 'issued' && (
        <TableCell>
          <div className="flex items-center gap-2">
            <MailStatusCell cert={cert} />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete certificate"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          </div>
        </TableCell>
      )}
      <TableCell className="text-sm text-muted-foreground">
        {new Date(cert.createdAt).toLocaleDateString()}
      </TableCell>
      {tab === 'pending_attestation' && canAttest && (
        <TableCell>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cert #"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              className="w-28 h-8 text-xs"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAttest() }}
            />
            <Button size="sm" onClick={handleAttest} disabled={loading || !certNumber.trim()} className="gap-1">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileCheck className="h-3 w-3" />}
              Attest
            </Button>
          </div>
        </TableCell>
      )}
      {tab === 'pending_seal' && canSeal && (
        <TableCell>
          <Button size="sm" onClick={handleSeal} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Stamp className="h-3 w-3" />}
            Sign & Issue
          </Button>
        </TableCell>
      )}
    </TableRow>
  )
}

function EditableDateCell({ certId, currentDate }: { certId: string; currentDate: string | null }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const displayDate = currentDate ? new Date(currentDate).toLocaleDateString() : '—'
  const inputValue = currentDate ? new Date(currentDate).toISOString().split('T')[0] : ''

  async function handleSave(newDate: string) {
    if (!newDate) return
    setSaving(true)
    const result = await updateCertificateDate(certId, newDate)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Date updated')
      router.refresh()
    }
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <Input
        type="date"
        defaultValue={inputValue}
        className="w-36 h-7 text-xs"
        autoFocus
        disabled={saving}
        onBlur={(e) => {
          if (e.target.value && e.target.value !== inputValue) {
            handleSave(e.target.value)
          } else {
            setEditing(false)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const val = (e.target as HTMLInputElement).value
            if (val) handleSave(val)
          }
          if (e.key === 'Escape') setEditing(false)
        }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      title="Click to edit date"
    >
      {displayDate}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
    </button>
  )
}

function MailStatusCell({ cert }: { cert: CertData }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Only show mail tracking for students who want mail
  if (!cert.wantsMail) {
    return <span className="text-xs text-muted-foreground">Digital</span>
  }

  async function handleToggle() {
    setLoading(true)
    const newStatus = cert.mailStatus === 'mailed' ? 'needs_mailing' : 'mailed'
    const result = await updateMailStatus(cert.id, newStatus as any)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(newStatus === 'mailed' ? 'Marked as mailed' : 'Marked as needs mailing')
      router.refresh()
    }
    setLoading(false)
  }

  if (cert.mailStatus === 'mailed') {
    return (
      <div className="flex flex-col gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto py-0.5 px-1.5 text-xs text-green-600 hover:text-green-700 gap-1"
          onClick={handleToggle}
          disabled={loading}
          title="Click to undo"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
          Mailed
        </Button>
        {cert.mailedAt && (
          <span className="text-[10px] text-muted-foreground pl-1.5">
            {new Date(cert.mailedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs gap-1"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
      Mark Mailed
    </Button>
  )
}
