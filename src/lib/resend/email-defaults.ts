import { createAdminClient } from '@/lib/supabase/admin'

export const EMAIL_DEFAULTS = {
  nudge: {
    subject: 'Reminder — Your Extension Course Lesson',
    body: 'Dear Extension Course Student,\n\nWe want to get you through your Extension Course, but your weekly lesson has not yet been received. The key to completing the course is doing your lessons regularly. So please send in your next lesson promptly so that we can keep you progressing.\n\nI am here to assist you in completing your studies. Contact me if you need any help.',
    signature: 'Best regards,\nExtension Course Director',
  },
  welcome: {
    subject: 'Welcome to {courseName} — FCDC Extension Courses',
    body: 'Dear {firstName},\n\nThank you for enrolling in {courseName}! We\'re excited to have you on board.\n\nHere\'s how the extension course works:\n1. Log in to your account and go to your course.\n2. Each lesson includes materials to study and questions to answer.\n3. Once you\'ve completed a lesson, submit your answers for review.\n4. Your supervisor will grade your lesson and provide feedback.\n5. After passing, you\'ll move on to the next lesson.\n\nWe encourage you to complete at least one lesson per week to maintain good momentum and get the most out of the course.',
    signature: 'Good luck with your studies!\n\nFCDC Extension Courses',
  },
  registration: {
    subject: 'New User Registration — FCDC Extension Courses',
    body: 'A new user has registered on the FCDC Extension Courses site.\n\nName: {fullName}\nEmail: {email}\nDate: {date}',
    signature: 'FCDC Extension Courses',
  },
  sale_recipients: {
    day: [
      'justdust78@yahoo.com',
      'erin.gravitt@scientology.net',
      'kirstenspl@gmail.com',
    ],
    foundation: [
      'blakester1111@gmail.com',
      'tomclapp@thefoundingchurch.org',
      'maddi.arndt@gmail.com',
      'extcrse_dcf@scientology.net',
      'erin.gravitt@scientology.net',
    ],
    unknown: [] as string[],
  },
  registration_recipients: [
    'blakester1111@gmail.com',
    'tom@thefoundingchurch.org',
  ],
}

export interface EmailTemplate {
  subject: string
  body: string
  signature: string
}

export async function getEmailTemplate(key: 'nudge' | 'welcome' | 'registration'): Promise<EmailTemplate> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', `email_template_${key}`)
      .maybeSingle()

    if (data?.value) {
      const parsed = JSON.parse(data.value)
      return {
        subject: parsed.subject || EMAIL_DEFAULTS[key].subject,
        body: parsed.body || EMAIL_DEFAULTS[key].body,
        signature: parsed.signature || EMAIL_DEFAULTS[key].signature,
      }
    }
  } catch (e) {
    console.error(`Failed to fetch email template ${key}:`, e)
  }
  return EMAIL_DEFAULTS[key]
}

export async function getSaleRecipients(org: 'day' | 'foundation' | 'unknown'): Promise<string[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'email_recipients_sale')
      .maybeSingle()

    if (data?.value) {
      const parsed = JSON.parse(data.value)
      const emails = parsed[org]
      if (Array.isArray(emails) && emails.length > 0) return emails
    }
  } catch (e) {
    console.error('Failed to fetch sale recipients:', e)
  }

  const defaults = EMAIL_DEFAULTS.sale_recipients[org]
  if (defaults.length > 0) return defaults

  // Fallback for unknown: all unique recipients
  if (org === 'unknown') {
    return [...new Set([
      ...EMAIL_DEFAULTS.sale_recipients.day,
      ...EMAIL_DEFAULTS.sale_recipients.foundation,
    ])]
  }

  return defaults
}

export async function getRegistrationRecipients(): Promise<string[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'email_recipients_registration')
      .maybeSingle()

    if (data?.value) {
      const parsed = JSON.parse(data.value)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.error('Failed to fetch registration recipients:', e)
  }

  return EMAIL_DEFAULTS.registration_recipients
}
