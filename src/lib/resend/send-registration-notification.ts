import { resend } from './client'
import { getEmailTemplate, getRegistrationRecipients } from './email-defaults'

interface RegistrationNotificationParams {
  fullName: string
  email: string
}

function replacePlaceholders(
  text: string,
  vars: Record<string, string>,
): string {
  let result = text
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value)
  }
  return result
}

function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .map(paragraph => {
      const inner = paragraph.replace(/\n/g, '<br/>')
      return `<p style="color: #525252; line-height: 1.7; font-size: 15px;">${inner}</p>`
    })
    .join('')
}

export async function sendRegistrationNotification({ fullName, email }: RegistrationNotificationParams) {
  const recipients = await getRegistrationRecipients()

  if (recipients.length === 0) {
    console.warn('No registration notification recipients configured, skipping')
    return
  }

  const template = await getEmailTemplate('registration')

  const vars: Record<string, string> = {
    fullName,
    email,
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  }

  const subject = replacePlaceholders(template.subject, vars)
  const bodyHtml = textToHtml(replacePlaceholders(template.body, vars))
  const signatureHtml = textToHtml(replacePlaceholders(template.signature, vars))

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #171717; margin-bottom: 8px;">New User Registration</h2>

      ${bodyHtml}

      ${signatureHtml}

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="color: #a3a3a3; font-size: 12px;">FCDC Extension Courses</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'FCDC Extension Courses <info@fcdc-services.com>',
      to: recipients,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send registration notification email:', error)
  }
}
