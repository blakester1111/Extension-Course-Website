'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { verifyInvoice, rejectInvoice } from '@/app/(dashboard)/supervisor/enrollments/actions'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'

export function InvoiceVerifyButtons({ enrollmentId }: { enrollmentId: string }) {
  const [loading, setLoading] = useState<'verify' | 'reject' | null>(null)
  const router = useRouter()

  async function handleVerify() {
    if (!confirm('Verify this invoice and grant course access?')) return
    setLoading('verify')
    const result = await verifyInvoice(enrollmentId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Invoice verified — student now has access')
    }
    setLoading(null)
    router.refresh()
  }

  async function handleReject() {
    if (!confirm('Reject this enrollment? The student will need to re-enroll.')) return
    setLoading('reject')
    const result = await rejectInvoice(enrollmentId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Enrollment rejected')
    }
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        onClick={handleVerify}
        disabled={loading !== null}
        className="h-8"
      >
        <Check className="h-3 w-3 mr-1" />
        {loading === 'verify' ? 'Verifying...' : 'Verify'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={loading !== null}
        className="h-8"
      >
        <X className="h-3 w-3 mr-1" />
        Reject
      </Button>
    </div>
  )
}
