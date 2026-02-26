export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CertificateTemplate } from '@/components/certificates/certificate-template'

export const metadata = {
  title: 'Certificate — FCDC Extension Course',
}

export default async function CertificateViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cert } = await supabase
    .from('certificates')
    .select(`
      id, status, certificate_number, issued_at, is_backentered,
      student:profiles!certificates_student_id_fkey(id, full_name),
      course:courses(title),
      attester:profiles!certificates_attested_by_fkey(full_name),
      sealer:profiles!certificates_sealed_by_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (!cert) notFound()

  // Only the student or admins can view
  const student = cert.student as any
  if (student?.id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      redirect('/student/certificates')
    }
  }

  if (cert.status !== 'issued') {
    redirect('/student/certificates')
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <CertificateTemplate
        studentName={student?.full_name || 'Unknown'}
        courseTitle={(cert.course as any)?.title || 'Unknown'}
        attesterName={(cert.attester as any)?.full_name || ''}
        sealerName={(cert.sealer as any)?.full_name || ''}
        issuedAt={cert.issued_at || new Date().toISOString()}
        certificateNumber={cert.certificate_number || ''}
        isBackentered={(cert as any).is_backentered || false}
      />
    </div>
  )
}
