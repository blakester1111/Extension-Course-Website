import { resend } from './client'

interface NudgeEmailParams {
  to: string
  studentFirstName: string
  supervisorFullName: string
  senderEmail: string
  courseNames: string[]
  daysSinceLastSubmission: number | null
}

export async function sendNudgeEmail({
  to,
  studentFirstName,
  supervisorFullName,
  senderEmail,
  courseNames,
  daysSinceLastSubmission,
}: NudgeEmailParams) {
  const courseList = courseNames.length > 0
    ? courseNames.map(name => `<li>${name}</li>`).join('')
    : '<li>Your enrolled courses</li>'

  const timeMessage = daysSinceLastSubmission !== null
    ? `It's been <strong>${daysSinceLastSubmission} day${daysSinceLastSubmission === 1 ? '' : 's'}</strong> since your last lesson submission.`
    : `We noticed you haven't submitted any lessons yet.`

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://extension.fcdc-services.com').replace(/\/$/, '')

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #171717; margin-bottom: 8px;">How Are Your Studies Going?</h2>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        Hi ${studentFirstName},
      </p>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        ${timeMessage} We'd love to see you keep the momentum going!
      </p>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        You're currently enrolled in:
      </p>

      <ul style="color: #525252; line-height: 1.9; font-size: 15px; padding-left: 20px;">
        ${courseList}
      </ul>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        Completing at least <strong>one lesson per week</strong> is the best way to make steady progress. Even a small amount of study each day adds up quickly!
      </p>

      <p style="margin-top: 24px;">
        <a href="${appUrl}/student/dashboard" style="background-color: #171717; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 15px;">
          Go to My Courses
        </a>
      </p>

      <p style="color: #525252; line-height: 1.7; font-size: 15px; margin-top: 24px;">
        If you have any questions or need help, just reply to this email. I'm here to help!
      </p>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        Best,<br/>
        ${supervisorFullName}
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="color: #a3a3a3; font-size: 12px;">FCDC Extension Courses</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: `${supervisorFullName} <${senderEmail}>`,
      to,
      subject: 'How are your Extension Courses going?',
      html,
    })
  } catch (error) {
    console.error('Failed to send nudge email:', error)
    throw error
  }
}
