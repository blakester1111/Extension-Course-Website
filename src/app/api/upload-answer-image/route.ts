import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const submissionId = formData.get('submissionId') as string
  const questionId = formData.get('questionId') as string

  if (!file || !submissionId || !questionId) {
    return NextResponse.json({ error: 'Missing file, submissionId, or questionId' }, { status: 400 })
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, HEIC.' }, { status: 400 })
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

  // For corrections, verify this question needs correction
  if (submission.status === 'graded_corrections') {
    const { data: answer } = await supabase
      .from('answers')
      .select('needs_correction')
      .eq('submission_id', submissionId)
      .eq('question_id', questionId)
      .single()

    if (answer && !answer.needs_correction) {
      return NextResponse.json({ error: 'This answer is already correct' }, { status: 403 })
    }
  }

  // Determine file extension
  const ext = file.type === 'image/png' ? 'png'
    : file.type === 'image/webp' ? 'webp'
    : 'jpg'

  const storagePath = `${submissionId}/${questionId}.${ext}`

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('answer-images')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Check if answer record already exists
  const { data: existingAnswer } = await supabase
    .from('answers')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (existingAnswer) {
    // Update only image_path on existing record (preserve answer_text)
    const { error: updateError } = await supabase
      .from('answers')
      .update({ image_path: storagePath })
      .eq('submission_id', submissionId)
      .eq('question_id', questionId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  } else {
    // Create new answer record with image
    const { error: insertError } = await supabase
      .from('answers')
      .insert({
        submission_id: submissionId,
        question_id: questionId,
        image_path: storagePath,
        answer_text: '',
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/answer-images/${storagePath}`

  return NextResponse.json({ url: publicUrl, path: storagePath })
}
