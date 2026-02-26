'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile } from '@/types/database'
import { toast } from 'sonner'

export function ProfileForm({ profile, supervisorName }: { profile: Profile; supervisorName: string | null }) {
  const [fullName, setFullName] = useState(profile.full_name)
  const [certPref, setCertPref] = useState(profile.cert_mail_preference || 'digital')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, cert_mail_preference: certPref })
      .eq('id', profile.id)

    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={profile.role} disabled className="bg-muted capitalize" />
          </div>
          {supervisorName && (
            <div className="space-y-2">
              <Label>Supervisor</Label>
              <Input value={supervisorName} disabled className="bg-muted" />
            </div>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Certificate Delivery</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="certPref"
                  value="digital"
                  checked={certPref === 'digital'}
                  onChange={() => setCertPref('digital')}
                  className="accent-primary"
                />
                <span className="text-sm">Digital only — I will view and print my certificates online</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="certPref"
                  value="mail"
                  checked={certPref === 'mail'}
                  onChange={() => setCertPref('mail')}
                  className="accent-primary"
                />
                <span className="text-sm">Mail me a physical certificate</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {certPref === 'mail'
                ? 'A printed certificate will be mailed to you after each course completion.'
                : 'You can view and print certificates from the My Certificates page at any time.'}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} variant="outline" size="sm">
            {saving ? 'Saving...' : 'Save Preference'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
