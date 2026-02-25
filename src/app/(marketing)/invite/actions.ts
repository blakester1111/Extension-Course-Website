'use server'

import { resend } from '@/lib/resend/client'

export async function sendInviteEmail(formData: FormData) {
  const yourName = formData.get('yourName') as string
  const friendName = formData.get('friendName') as string
  const friendEmail = formData.get('friendEmail') as string

  if (!yourName || !friendName || !friendEmail) {
    return { error: 'All fields are required.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://extension.thefoundingchurch.org'

  try {
    await resend.emails.send({
      from: 'FCDC Extension Course <onboarding@resend.dev>',
      to: friendEmail,
      subject: `${yourName} invited you to FCDC Extension Course`,
      text: [
        `Hi ${friendName},`,
        '',
        `${yourName} thinks you'd enjoy studying with the FCDC Extension Course platform.`,
        '',
        `The Founding Church of Scientology of Washington, D.C. offers online extension courses ` +
          `that let you study the works of L. Ron Hubbard at your own pace with qualified supervision.`,
        '',
        `Check it out here: ${siteUrl}`,
        '',
        'Best,',
        'FCDC Extension Course',
      ].join('\n'),
    })

    return { success: true }
  } catch {
    return { error: 'Failed to send invitation. Please try again.' }
  }
}
