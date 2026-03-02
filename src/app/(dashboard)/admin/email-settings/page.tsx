export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmailSettingsForm } from '@/components/admin/email-settings-form'
import { EMAIL_DEFAULTS } from '@/lib/resend/email-defaults'

export const metadata = {
  title: 'Email Settings — FCDC Extension Courses',
}

export default async function EmailSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/')
  }

  // Fetch current email settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['email_template_nudge', 'email_template_welcome', 'email_recipients_sale'])

  const settingsMap: Record<string, string> = {}
  for (const s of settings || []) {
    settingsMap[s.key] = s.value
  }

  function parseTemplate(key: string, defaultKey: 'nudge' | 'welcome') {
    try {
      if (settingsMap[key]) return JSON.parse(settingsMap[key])
    } catch { /* use defaults */ }
    return EMAIL_DEFAULTS[defaultKey]
  }

  function parseRecipients() {
    try {
      if (settingsMap.email_recipients_sale) {
        return JSON.parse(settingsMap.email_recipients_sale)
      }
    } catch { /* use defaults */ }
    return EMAIL_DEFAULTS.sale_recipients
  }

  const nudgeTemplate = parseTemplate('email_template_nudge', 'nudge')
  const welcomeTemplate = parseTemplate('email_template_welcome', 'welcome')
  const saleRecipients = parseRecipients()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Settings</h1>
        <p className="text-muted-foreground">
          Configure email templates and notification recipients
        </p>
      </div>

      <EmailSettingsForm
        nudgeTemplate={nudgeTemplate}
        welcomeTemplate={welcomeTemplate}
        saleRecipients={saleRecipients}
        nudgeDefaults={EMAIL_DEFAULTS.nudge}
        welcomeDefaults={EMAIL_DEFAULTS.welcome}
        saleRecipientsDefaults={EMAIL_DEFAULTS.sale_recipients}
      />
    </div>
  )
}
