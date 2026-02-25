import { resend } from './client'

interface WelcomeEmailParams {
  to: string
  firstName: string
  courseName: string
  courseUrl: string
}

export async function sendWelcomeEmail({ to, firstName, courseName, courseUrl }: WelcomeEmailParams) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #171717; margin-bottom: 8px;">Welcome to Your Extension Course!</h2>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        Dear ${firstName},
      </p>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        Thank you for enrolling in <strong>${courseName}</strong>! We're excited to have you on board.
      </p>

      <h3 style="color: #171717; margin-top: 24px; margin-bottom: 8px;">Getting Started</h3>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        Here's how the extension course works:
      </p>

      <ol style="color: #525252; line-height: 1.9; font-size: 15px; padding-left: 20px;">
        <li>Log in to your account and go to your course.</li>
        <li>Each lesson includes materials to study and questions to answer.</li>
        <li>Once you've completed a lesson, submit your answers for review.</li>
        <li>Your supervisor will grade your lesson and provide feedback.</li>
        <li>After passing, you'll move on to the next lesson.</li>
      </ol>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        <strong>We encourage you to complete at least one lesson per week</strong> to maintain good momentum and get the most out of the course. Consistent study is the key to success!
      </p>

      <p style="margin-top: 24px;">
        <a href="${courseUrl}" style="background-color: #171717; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 15px;">
          Start Your Course
        </a>
      </p>

      <p style="color: #525252; line-height: 1.7; font-size: 15px; margin-top: 24px;">
        If you have any questions, don't hesitate to reach out. We're here to help!
      </p>

      <p style="color: #525252; line-height: 1.7; font-size: 15px;">
        Good luck with your studies!
      </p>

      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="color: #a3a3a3; font-size: 12px;">FCDC Extension Courses</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'FCDC Extension Courses <extensioncourses@fcdc-services.com>',
      to,
      subject: `Welcome to ${courseName} — FCDC Extension Courses`,
      html,
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}
