'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Loader2 } from 'lucide-react'

interface CheckoutFormProps {
  courseId: string
  courseTitle: string
  courseSlug: string
  priceCents: number
  userEmail: string
  userName: string
}

export function CheckoutForm({
  courseId,
  courseTitle,
  courseSlug,
  priceCents,
  userEmail,
  userName,
}: CheckoutFormProps) {
  const nameParts = userName.split(' ')
  const [firstName, setFirstName] = useState(nameParts[0] || '')
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '')
  const [email, setEmail] = useState(userEmail)
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('US')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const priceDisplay = `$${(priceCents / 100).toFixed(2)}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
        }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{courseTitle}</span>
            <span className="text-lg font-semibold">{priceDisplay}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                placeholder="Washington"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                autoComplete="address-level1"
                placeholder="DC"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                autoComplete="postal-code"
                placeholder="20001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoComplete="country-name"
                placeholder="US"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {priceDisplay}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <p className="text-xs text-center text-muted-foreground mt-4">
        You&apos;ll be redirected to Stripe to securely enter your payment details.
      </p>
    </form>
  )
}
