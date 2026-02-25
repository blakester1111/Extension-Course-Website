'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/use-user'
import { StaffEnrollButton } from './staff-enroll-button'

interface PurchaseButtonProps {
  courseId: string
  priceCents: number
  checkoutUrl: string | null
}

export function PurchaseButton({ courseId, priceCents, checkoutUrl }: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false)
  const { profile } = useUser()

  // Staff member — show invoice enrollment
  if (profile?.is_staff) {
    return <StaffEnrollButton courseId={courseId} />
  }

  // Free course — enroll directly
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

  if (!checkoutUrl) {
    // Admin sees a helpful link to fix it
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      return (
        <div className="space-y-2">
          <Button className="w-full" disabled variant="outline">
            No checkout link set
          </Button>
          <Button className="w-full" variant="default" size="sm" asChild>
            <Link href={`/admin/courses/${courseId}`}>Edit Course to Add Link</Link>
          </Button>
        </div>
      )
    }
    return (
      <Button className="w-full" disabled>
        Coming Soon
      </Button>
    )
  }

  // Append the auto-enroll redirect to the checkout URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  const redirectUrl = `${appUrl}/enroll/confirm?course=${courseId}`
  const fullCheckoutUrl = checkoutUrl.includes('?')
    ? `${checkoutUrl}&redirect_url=${encodeURIComponent(redirectUrl)}`
    : `${checkoutUrl}?redirect_url=${encodeURIComponent(redirectUrl)}`

  return (
    <div className="space-y-2">
      <Button className="w-full" asChild>
        <a href={fullCheckoutUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          Purchase — ${(priceCents / 100).toFixed(0)}
        </a>
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        You&apos;ll be redirected to Square to complete payment.
      </p>
    </div>
  )
}
