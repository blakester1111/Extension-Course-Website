'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, RotateCcw, Mail, Users, Send, UserPlus } from 'lucide-react'
import { saveEmailTemplate, saveSaleRecipients, saveRegistrationRecipients } from '@/app/(dashboard)/admin/email-settings/actions'

interface EmailTemplate {
  subject: string
  body: string
  signature: string
}

interface SaleRecipients {
  day: string[]
  foundation: string[]
  unknown: string[]
}

interface Props {
  nudgeTemplate: EmailTemplate
  welcomeTemplate: EmailTemplate
  registrationTemplate: EmailTemplate
  saleRecipients: SaleRecipients
  registrationRecipients: string[]
  nudgeDefaults: EmailTemplate
  welcomeDefaults: EmailTemplate
  registrationDefaults: EmailTemplate
  saleRecipientsDefaults: SaleRecipients
  registrationRecipientsDefaults: string[]
}

function PlaceholderBadges({ placeholders }: { placeholders: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      <span className="text-xs text-muted-foreground">Available placeholders:</span>
      {placeholders.map(p => (
        <Badge key={p} variant="secondary" className="text-xs font-mono">
          {`{${p}}`}
        </Badge>
      ))}
    </div>
  )
}

function TemplateCard({
  title,
  description,
  icon: Icon,
  templateKey,
  template,
  defaults,
  placeholders,
}: {
  title: string
  description: string
  icon: React.ElementType
  templateKey: 'nudge' | 'welcome' | 'registration'
  template: EmailTemplate
  defaults: EmailTemplate
  placeholders: string[]
}) {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [signature, setSignature] = useState(template.signature)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await saveEmailTemplate(templateKey, { subject, body, signature })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert('Failed to save: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setSubject(defaults.subject)
    setBody(defaults.body)
    setSignature(defaults.signature)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PlaceholderBadges placeholders={placeholders} />

        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject line"
          />
        </div>

        <div className="space-y-2">
          <Label>Body</Label>
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Email body text"
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Use blank lines to separate paragraphs. Placeholders will be replaced with actual values.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Signature / Sign-off</Label>
          <Textarea
            value={signature}
            onChange={e => setSignature(e.target.value)}
            placeholder="Email signature"
            rows={3}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to Default
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

function RecipientsCard({
  recipients,
  defaults,
}: {
  recipients: SaleRecipients
  defaults: SaleRecipients
}) {
  const [day, setDay] = useState(recipients.day.join('\n'))
  const [foundation, setFoundation] = useState(recipients.foundation.join('\n'))
  const [unknown, setUnknown] = useState(recipients.unknown.join('\n'))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function parseEmails(text: string): string[] {
    return text
      .split(/[\n,]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await saveSaleRecipients({
        day: parseEmails(day),
        foundation: parseEmails(foundation),
        unknown: parseEmails(unknown),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert('Failed to save: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setDay(defaults.day.join('\n'))
    setFoundation(defaults.foundation.join('\n'))
    setUnknown(defaults.unknown.join('\n'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Sale Notification Recipients
        </CardTitle>
        <CardDescription>
          Configure who receives email notifications when a course is purchased.
          Enter one email address per line.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Day Organization</Label>
            <Textarea
              value={day}
              onChange={e => setDay(e.target.value)}
              placeholder="one@example.com&#10;two@example.com"
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Foundation Organization</Label>
            <Textarea
              value={foundation}
              onChange={e => setFoundation(e.target.value)}
              placeholder="one@example.com&#10;two@example.com"
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Unknown / Unset Organization</Label>
            <Textarea
              value={unknown}
              onChange={e => setUnknown(e.target.value)}
              placeholder="one@example.com&#10;two@example.com"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              If empty, all Day + Foundation recipients will be notified.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Recipients'}
          </Button>
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to Default
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

function RegistrationRecipientsCard({
  recipients,
  defaults,
}: {
  recipients: string[]
  defaults: string[]
}) {
  const [emails, setEmails] = useState(recipients.join('\n'))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function parseEmails(text: string): string[] {
    return text
      .split(/[\n,]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await saveRegistrationRecipients(parseEmails(emails))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert('Failed to save: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setEmails(defaults.join('\n'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Registration Notification Recipients
        </CardTitle>
        <CardDescription>
          Configure who receives email notifications when a new user registers on the site.
          Enter one email address per line.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-md space-y-2">
          <Label>Recipients</Label>
          <Textarea
            value={emails}
            onChange={e => setEmails(e.target.value)}
            placeholder="one@example.com&#10;two@example.com"
            rows={4}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Recipients'}
          </Button>
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to Default
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

export function EmailSettingsForm({
  nudgeTemplate,
  welcomeTemplate,
  registrationTemplate,
  saleRecipients,
  registrationRecipients,
  nudgeDefaults,
  welcomeDefaults,
  registrationDefaults,
  saleRecipientsDefaults,
  registrationRecipientsDefaults,
}: Props) {
  return (
    <div className="space-y-6">
      <TemplateCard
        title="Nudge Reminder Email"
        description="Sent to students who haven't submitted lessons recently. Styled as an orange branded reminder card."
        icon={Send}
        templateKey="nudge"
        template={nudgeTemplate}
        defaults={nudgeDefaults}
        placeholders={['studentName', 'supervisorName', 'daysSinceSubmission', 'courseList']}
      />

      <TemplateCard
        title="Welcome Email"
        description="Sent to students when they enroll in a course (via purchase, admin enrollment, or invoice verification)."
        icon={Mail}
        templateKey="welcome"
        template={welcomeTemplate}
        defaults={welcomeDefaults}
        placeholders={['firstName', 'courseName']}
      />

      <TemplateCard
        title="Registration Notification Email"
        description="Sent to staff when a new user registers on the site (not a course enrollment, just account creation)."
        icon={UserPlus}
        templateKey="registration"
        template={registrationTemplate}
        defaults={registrationDefaults}
        placeholders={['fullName', 'email', 'date']}
      />

      <RecipientsCard
        recipients={saleRecipients}
        defaults={saleRecipientsDefaults}
      />

      <RegistrationRecipientsCard
        recipients={registrationRecipients}
        defaults={registrationRecipientsDefaults}
      />
    </div>
  )
}
