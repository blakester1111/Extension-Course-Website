// Quick script to send a test nudge email
// Usage: node --env-file=.env.local scripts/test-nudge-email.mjs

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const resend = new Resend(process.env.RESEND_API_KEY)

// Find Blake Smith's profile
const { data: profile, error } = await supabase
  .from('profiles')
  .select('id, full_name, email')
  .ilike('full_name', '%blake smith%')
  .limit(1)
  .single()

if (error || !profile) {
  console.error('Could not find Blake Smith:', error?.message)
  process.exit(1)
}

console.log(`Found: ${profile.full_name} <${profile.email}>`)

// Find their enrolled courses
const { data: enrollments } = await supabase
  .from('enrollments')
  .select('course:courses(title)')
  .eq('student_id', profile.id)
  .eq('status', 'active')

const courseNames = (enrollments || []).map(e => e.course?.title).filter(Boolean)

// Fetch nudge template from site_settings
let subject = 'Reminder — Your Extension Course Lesson'
let bodyText = `Dear Extension Course Student,\n\nWe want to get you through your Extension Course, but your weekly lesson has not yet been received. The key to completing the course is doing your lessons regularly. So please send in your next lesson promptly so that we can keep you progressing.\n\nI am here to assist you in completing your studies. Contact me if you need any help.`
let signatureText = `Best regards,\nExtension Course Director`

const { data: setting } = await supabase
  .from('site_settings')
  .select('value')
  .eq('key', 'email_template_nudge')
  .maybeSingle()

if (setting?.value) {
  try {
    const parsed = JSON.parse(setting.value)
    if (parsed.subject) subject = parsed.subject
    if (parsed.body) bodyText = parsed.body
    if (parsed.signature) signatureText = parsed.signature
  } catch {}
}

// Replace placeholders
const vars = {
  studentName: profile.full_name.split(' ')[0],
  supervisorName: 'Extension Course Director',
  daysSinceSubmission: '7',
  courseList: courseNames.join(', '),
}

for (const [key, value] of Object.entries(vars)) {
  subject = subject.replaceAll(`{${key}}`, value)
  bodyText = bodyText.replaceAll(`{${key}}`, value)
  signatureText = signatureText.replaceAll(`{${key}}`, value)
}

function textToHtml(text) {
  return text
    .split('\n\n')
    .map(p => {
      const inner = p.replace(/\n/g, '<br/>')
      return `<p style="color: #333; line-height: 1.7; font-size: 15px; font-family: Georgia, 'Times New Roman', serif; margin: 0 0 16px 0;">${inner}</p>`
    })
    .join('')
}

// Always use production URL for email links, never localhost
const appUrl = 'https://extension.fcdc-services.com'

const html = `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd;">
  <div style="background-color: #E8731A; padding: 14px 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 3px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">REMINDER</h1>
  </div>
  <div style="padding: 28px 32px; background-color: #fafafa;">
    ${textToHtml(bodyText)}
    <div style="text-align: right; margin-top: 24px;">
      ${textToHtml(signatureText)}
    </div>
    <div style="text-align: center; margin-top: 28px;">
      <a href="${appUrl}/student/dashboard" style="background-color: #E8731A; color: white; padding: 12px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 14px; font-family: Arial, Helvetica, sans-serif; font-weight: bold; letter-spacing: 0.5px;">
        Go to My Courses
      </a>
    </div>
  </div>
  <div style="background-color: #E8731A; padding: 14px 24px; text-align: center;">
    <span style="color: white; margin: 0; font-size: 18px; letter-spacing: 3px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">EXTENSION COURSES</span>
  </div>
</div>
`

console.log(`\nSending nudge email to: ${profile.email}`)
console.log(`Subject: ${subject}`)

try {
  const result = await resend.emails.send({
    from: 'Extension Course Director <extensioncourses@fcdc-services.com>',
    to: profile.email,
    subject,
    html,
  })
  console.log('Sent successfully!', result)
} catch (err) {
  console.error('Failed to send:', err)
}
