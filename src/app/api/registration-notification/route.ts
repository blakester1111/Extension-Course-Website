import { NextRequest, NextResponse } from 'next/server'
import { sendRegistrationNotification } from '@/lib/resend/send-registration-notification'

export async function POST(req: NextRequest) {
  try {
    const { fullName, email } = await req.json()

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    await sendRegistrationNotification({ fullName, email })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration notification error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
