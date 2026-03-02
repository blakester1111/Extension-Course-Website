'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireStaffRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin', 'supervisor'].includes(profile.role)) {
    throw new Error('Not authorized')
  }
  return { supabase, user }
}

export async function getStudentNotes(studentId: string) {
  const { supabase } = await requireStaffRole()

  const { data: notes, error } = await supabase
    .from('student_notes')
    .select('*, author:profiles!student_notes_author_id_fkey(full_name)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { notes: notes || [] }
}

export async function addStudentNote(studentId: string, content: string) {
  const { supabase, user } = await requireStaffRole()

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Note cannot be empty' }

  const { data: note, error } = await supabase
    .from('student_notes')
    .insert({ student_id: studentId, author_id: user.id, content: trimmed })
    .select('*, author:profiles!student_notes_author_id_fkey(full_name)')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  return { note }
}

export async function deleteStudentNote(noteId: string) {
  const { supabase } = await requireStaffRole()

  const { error } = await supabase
    .from('student_notes')
    .delete()
    .eq('id', noteId)

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  return { success: true }
}
