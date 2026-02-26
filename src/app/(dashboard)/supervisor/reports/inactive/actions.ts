'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNudgeEmail } from '@/lib/resend/send-nudge-email'

async function requireSupervisorOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['supervisor', 'admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Not authorized')
  }

  return { supabase, user, profile }
}

export async function sendNudge(
  studentId: string,
  studentEmail: string,
  studentFirstName: string,
  courseNames: string[],
  daysSinceLastSubmission: number | null,
) {
  const { supabase, profile } = await requireSupervisorOrAdmin()

  const supervisorFullName = profile.full_name || 'Extension Course Supervisor'
  const nameParts = supervisorFullName.toLowerCase().trim().split(/\s+/)
  const firstName = nameParts[0] || 'extension'
  const lastName = nameParts[nameParts.length - 1] || 'courses'
  const senderEmail = `${firstName}.${lastName}@fcdc-services.com`

  await sendNudgeEmail({
    to: studentEmail,
    studentFirstName,
    supervisorFullName,
    senderEmail,
    courseNames,
    daysSinceLastSubmission,
  })

  // Also send an in-app notification
  await supabase
    .from('notifications')
    .insert({
      user_id: studentId,
      type: 'nudge',
      title: 'Check in from your supervisor',
      message: `${supervisorFullName} is checking in on your study progress. Keep up the great work!`,
      link: '/student/dashboard',
    })

  revalidatePath('/supervisor/reports/inactive')
  return { success: true }
}
