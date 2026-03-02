import { resend } from './client'
import { getEmailTemplate } from './email-defaults'
import { getAppUrl } from './get-app-url'

interface WelcomeEmailParams {
  to: string
  firstName: string
  courseName: string
  courseId: string
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

export async function sendWelcomeEmail({ to, firstName, courseName, courseId }: WelcomeEmailParams) {
  const template = await getEmailTemplate('welcome')
  const appUrl = await getAppUrl()
  const courseUrl = `${appUrl}/student/courses/${courseId}`

  const vars: Record<string, string> = {
    firstName,
    courseName,
  }

  const subject = replacePlaceholders(template.subject, vars)
  const bodyHtml = textToHtml(replacePlaceholders(template.body, vars))
  const signatureHtml = textToHtml(replacePlaceholders(template.signature, vars))

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #171717; margin-bottom: 8px;">Welcome to Your Extension Course!</h2>

      ${bodyHtml}

      <p style="margin-top: 24px;">
        <a href="${courseUrl}" style="background-color: #171717; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 15px;">
          Start Your Course
        </a>
      </p>

      ${signatureHtml}

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="color: #a3a3a3; font-size: 12px;">FCDC Extension Courses</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'FCDC Extension Courses <extensioncourses@fcdc-services.com>',
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}
