'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { attestCertificate, sealCertificate } from '@/app/(dashboard)/admin/certificates/actions'
import { updateCertificateDate } from '@/app/(dashboard)/admin/courses/actions'
import { toast } from 'sonner'
import { CheckCircle, Stamp, FileCheck, Loader2, Pencil } from 'lucide-react'

interface CertData {
  id: string
  status: string
  certificateNumber: string | null
  isBackentered: boolean
  studentName: string
  studentEmail: string
  courseTitle: string
  attesterName: string | null
  attestedAt: string | null
  sealerName: string | null
  sealedAt: string | null
  issuedAt: string | null
  createdAt: string
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
                  {tab === 'pending_seal' && <TableHead>Attested By</TableHead>}
                  {tab === 'issued' && <TableHead>Cert #</TableHead>}
                  {tab === 'issued' && <TableHead>Issued</TableHead>}
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
  const router = useRouter()

  async function handleAttest() {
    setLoading(true)
    const result = await attestCertificate(cert.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Attested certificate for ${cert.studentName}`)
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
          <p className="font-medium">{cert.studentName}</p>
          <p className="text-xs text-muted-foreground">{cert.studentEmail}</p>
        </div>
      </TableCell>
      <TableCell>{cert.courseTitle}</TableCell>
      {tab === 'pending_seal' && (
        <TableCell className="text-sm text-muted-foreground">
          {cert.attesterName || '—'}
        </TableCell>
      )}
      {tab === 'issued' && (
        <TableCell>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="font-mono text-xs">
              {cert.certificateNumber || (cert.isBackentered ? 'Back-entered' : '—')}
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
      <TableCell className="text-sm text-muted-foreground">
        {new Date(cert.createdAt).toLocaleDateString()}
      </TableCell>
      {tab === 'pending_attestation' && canAttest && (
        <TableCell>
          <Button size="sm" onClick={handleAttest} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileCheck className="h-3 w-3" />}
            Attest
          </Button>
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
