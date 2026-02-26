'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Settings, Clock, Check } from 'lucide-react'

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'UTC', label: 'UTC' },
]

interface SettingsFormProps {
  settings: Record<string, string>
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [timezone, setTimezone] = useState(settings.timezone || 'America/New_York')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()

    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'timezone', value: timezone, updated_at: new Date().toISOString() })

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timezone & Reporting
        </CardTitle>
        <CardDescription>
          Configure the timezone used for weekly period calculations (Thursday 2:00 PM to Thursday 2:00 PM) and report date displays.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Report Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-full sm:w-[300px]" id="timezone">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Weekly periods run from Thursday 2:00 PM to the following Thursday 2:00 PM in this timezone.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
