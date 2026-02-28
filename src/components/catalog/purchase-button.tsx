'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, ExternalLink, FileText } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/use-user'
import { StaffEnrollButton } from './staff-enroll-button'

interface PurchaseButtonProps {
  courseId: string
  courseSlug: string
  priceCents: number
  checkoutUrl: string | null
}

export function PurchaseButton({ courseId, courseSlug, priceCents, checkoutUrl }: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'invoice' | 'pay'>('invoice')
  const { profile } = useUser()

  // Free course — enroll directly (same for staff and non-staff)
  async function handleFreeEnroll() {
    setLoading(true)
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        window.location.href = `/student/courses/${courseId}`
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (priceCents === 0) {
    return (
      <Button className="w-full" onClick={handleFreeEnroll} disabled={loading}>
        {loading ? 'Enrolling...' : 'Enroll for Free'}
      </Button>
    )
  }

  // Staff member — show invoice enrollment with option to pay instead
  if (profile?.is_staff) {
    if (mode === 'invoice') {
      return (
        <StaffEnrollButton
          courseId={courseId}
          onPayInstead={() => setMode('pay')}
        />
      )
    }

    // Staff chose to pay normally
    return (
      <div className="space-y-2">
        <Button className="w-full" asChild>
          <Link href={`/checkout/${courseSlug}`}>
            <CreditCard className="h-4 w-4 mr-2" />
            Purchase — ${(priceCents / 100).toFixed(0)}
          </Link>
        </Button>
        {checkoutUrl && (
          <Button className="w-full" variant="outline" size="sm" asChild>
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Pay via Square (alternate)
            </a>
          </Button>
        )}
        <button
          type="button"
          onClick={() => setMode('invoice')}
          className="w-full text-xs text-center text-muted-foreground underline hover:text-foreground"
        >
          <FileText className="inline h-3 w-3 mr-1" />
          Enroll with invoice instead
        </button>
      </div>
    )
  }

  // Non-staff paid course — go to checkout
  return (
    <div className="space-y-2">
      <Button className="w-full" asChild>
        <Link href={`/checkout/${courseSlug}`}>
          <CreditCard className="h-4 w-4 mr-2" />
          Purchase — ${(priceCents / 100).toFixed(0)}
        </Link>
      </Button>
      {checkoutUrl && (
        <Button className="w-full" variant="outline" size="sm" asChild>
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Pay via Square (alternate)
          </a>
        </Button>
      )}
    </div>
  )
}
