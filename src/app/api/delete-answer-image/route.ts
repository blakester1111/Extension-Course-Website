import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { submissionId, questionId } = await request.json()

  if (!submissionId || !questionId) {
    return NextResponse.json({ error: 'Missing submissionId or questionId' }, { status: 400 })
  }

  // Verify submission ownership and editable state
  const { data: submission } = await supabase
    .from('lesson_submissions')
    .select('id, student_id, status')
    .eq('id', submissionId)
    .eq('student_id', user.id)
    .single()

  if (!submission || !['draft', 'graded_corrections'].includes(submission.status)) {
    return NextResponse.json({ error: 'Cannot edit this submission' }, { status: 403 })
  }

  // Get current image path
  const { data: answer } = await supabase
    .from('answers')
    .select('image_path')
    .eq('submission_id', submissionId)
    .eq('question_id', questionId)
    .single()

  if (answer?.image_path) {
    // Delete from storage
    await supabase.storage
      .from('answer-images')
      .remove([answer.image_path])

    // Clear image_path
    await supabase
      .from('answers')
      .update({ image_path: null })
      .eq('submission_id', submissionId)
      .eq('question_id', questionId)
  }

  return NextResponse.json({ success: true })
}
