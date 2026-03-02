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

export async function getStudentMaterials(studentId: string) {
  const { supabase } = await requireStaffRole()

  const { data: materials, error } = await supabase
    .from('student_materials')
    .select('*')
    .eq('student_id', studentId)

  if (error) return { error: error.message }
  return { materials: materials || [] }
}

export async function toggleMaterial(
  studentId: string,
  courseId: string,
  field: 'owns_book' | 'owns_lectures',
  value: boolean
) {
  const { supabase } = await requireStaffRole()

  // Upsert: create row if not exists, update if exists
  const { error } = await supabase
    .from('student_materials')
    .upsert(
      {
        student_id: studentId,
        course_id: courseId,
        [field]: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,course_id' }
    )

  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  return { success: true }
}
