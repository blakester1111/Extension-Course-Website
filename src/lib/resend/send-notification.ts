import { resend } from './client'

interface NotificationEmailParams {
  to: string
  subject: string
  text: string
  link?: string
}

export async function sendNotificationEmail({ to, subject, text, link }: NotificationEmailParams) {
  try {
    const linkHtml = link
      ? `<p style="margin-top: 16px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}${link}" style="background-color: #171717; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a></p>`
      : ''

    await resend.emails.send({
      from: 'FCDC Extension Courses <extensioncourses@fcdc-services.com>',
      to,
      subject: `[FCDC] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #171717;">${subject}</h2>
          <p style="color: #525252; line-height: 1.6;">${text}</p>
          ${linkHtml}
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="color: #a3a3a3; font-size: 12px;">FCDC Extension Courses</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send notification email:', error)
  }
}
