'use server'

import { resend } from '@/lib/resend/client'

export async function sendContactEmail(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const message = formData.get('message') as string

  if (!name || !email || !message) {
    return { error: 'All fields are required.' }
  }

  try {
    await resend.emails.send({
      from: 'FCDC Extension Course <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL || 'onboarding@resend.dev',
      replyTo: email,
      subject: `Contact Form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    })

    return { success: true }
  } catch {
    return { error: 'Failed to send message. Please try again.' }
  }
}
