'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText } from 'lucide-react'

interface Props {
  courseId: string
  onPayInstead: () => void
}

export function StaffEnrollButton({ courseId, onPayInstead }: Props) {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  async function handleEnroll() {
    if (!invoiceNumber.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/enroll/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, invoiceNumber: invoiceNumber.trim() }),
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        setSubmitted(true)
        router.refresh()
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2 text-yellow-600">
          <FileText className="h-5 w-5" />
          <span className="font-medium">Enrollment Pending</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your enrollment is pending invoice verification by your supervisor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Invoice number"
        value={invoiceNumber}
        onChange={(e) => setInvoiceNumber(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleEnroll()}
      />
      <Button
        className="w-full"
        onClick={handleEnroll}
        disabled={loading || !invoiceNumber.trim()}
      >
        <FileText className="h-4 w-4 mr-2" />
        {loading ? 'Submitting...' : 'Enroll with Invoice'}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Staff enrollment — requires supervisor verification
      </p>
      <button
        type="button"
        onClick={onPayInstead}
        className="w-full text-xs text-center text-muted-foreground underline hover:text-foreground"
      >
        Pay online instead
      </button>
    </div>
  )
}
