import { resend } from './client'

interface SaleNotificationParams {
  courseName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  address: string
  city: string
  state: string
  zip: string
  paymentMethod: string
}

export async function sendSaleNotificationEmail(params: SaleNotificationParams) {
  const recipients = (process.env.SALE_NOTIFICATION_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (recipients.length === 0) {
    console.warn('No SALE_NOTIFICATION_EMAILS configured, skipping sale notification')
    return
  }

  const {
    courseName,
    firstName,
    lastName,
    email,
    phone,
    country,
    address,
    city,
    state,
    zip,
    paymentMethod,
  } = params

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #171717; margin-bottom: 24px;">Extension Course Sale</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold; vertical-align: top; white-space: nowrap;">Select Ext Course:</td>
          <td style="padding: 8px 0;">${courseName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">First Name:</td>
          <td style="padding: 8px 0;">${firstName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">Last Name:</td>
          <td style="padding: 8px 0;">${lastName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">Phone:</td>
          <td style="padding: 8px 0;">${phone || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">Country:</td>
          <td style="padding: 8px 0;">${country || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">Street Address:</td>
          <td style="padding: 8px 0;">${address || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">City:</td>
          <td style="padding: 8px 0;">${city || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">State:</td>
          <td style="padding: 8px 0;">${state || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">Zip:</td>
          <td style="padding: 8px 0;">${zip || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 16px 8px 0; font-weight: bold;">Payment Method:</td>
          <td style="padding: 8px 0;">${paymentMethod}</td>
        </tr>
      </table>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="color: #a3a3a3; font-size: 12px;">FCDC Extension Courses</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'FCDC Extension Courses <info@fcdc-services.com>',
      to: recipients,
      subject: '[FCDC] Extension Course Sale',
      html,
    })
  } catch (error) {
    console.error('Failed to send sale notification email:', error)
  }
}
