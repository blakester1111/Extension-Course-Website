import { resend } from './client'
import { getEmailTemplate } from './email-defaults'

interface NudgeEmailParams {
  to: string
  studentFirstName: string
  supervisorFullName: string
  senderEmail: string
  courseNames: string[]
  daysSinceLastSubmission: number | null
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
      return `<p style="color: #333; line-height: 1.7; font-size: 15px; font-family: Georgia, 'Times New Roman', serif; margin: 0 0 16px 0;">${inner}</p>`
    })
    .join('')
}

export async function sendNudgeEmail({
  to,
  studentFirstName,
  supervisorFullName,
  senderEmail,
  courseNames,
  daysSinceLastSubmission,
}: NudgeEmailParams) {
  const template = await getEmailTemplate('nudge')

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://extension.fcdc-services.com').replace(/\/$/, '')

  const daysStr = daysSinceLastSubmission !== null
    ? `${daysSinceLastSubmission}`
    : 'N/A'

  const vars: Record<string, string> = {
    studentName: studentFirstName,
    supervisorName: supervisorFullName,
    daysSinceSubmission: daysStr,
    courseList: courseNames.join(', '),
  }

  const subject = replacePlaceholders(template.subject, vars)
  const bodyHtml = textToHtml(replacePlaceholders(template.body, vars))
  const signatureHtml = textToHtml(replacePlaceholders(template.signature, vars))

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd;">
      <!-- Orange Header -->
      <div style="background-color: #E8731A; padding: 14px 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 3px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">REMINDER</h1>
      </div>

      <!-- Body -->
      <div style="padding: 28px 32px; background-color: #fafafa;">
        ${bodyHtml}

        <div style="text-align: right; margin-top: 24px;">
          ${signatureHtml}
        </div>

        <div style="text-align: center; margin-top: 28px;">
          <a href="${appUrl}/student/dashboard" style="background-color: #E8731A; color: white; padding: 12px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 14px; font-family: Arial, Helvetica, sans-serif; font-weight: bold; letter-spacing: 0.5px;">
            Go to My Courses
          </a>
        </div>
      </div>

      <!-- Orange Footer -->
      <div style="background-color: #E8731A; padding: 14px 24px; text-align: center;">
        <span style="color: white; margin: 0; font-size: 18px; letter-spacing: 3px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">EXTENSION COURSES</span>
      </div>
    </div>
  `

  try {
    await resend.emails.send({
      from: `${supervisorFullName} <${senderEmail}>`,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send nudge email:', error)
    throw error
  }
}
