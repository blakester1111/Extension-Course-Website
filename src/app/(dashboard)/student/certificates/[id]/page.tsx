export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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
      id, status, certificate_number, issued_at, is_backentered, attested_by, sealed_by,
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  // Fetch certificate assets (seal + signatures for attester and sealer)
  const { data: assets } = await supabase
    .from('certificate_assets')
    .select('asset_type, user_id, image_path')

  let sealImageUrl: string | null = null
  let attesterSignatureUrl: string | null = null
  let sealerSignatureUrl: string | null = null

  for (const asset of assets || []) {
    const url = `${supabaseUrl}/storage/v1/object/public/certificate-assets/${asset.image_path}`
    if (asset.asset_type === 'seal' && !asset.user_id) {
      sealImageUrl = url
    } else if (asset.asset_type === 'attester_signature' && asset.user_id === cert.attested_by) {
      attesterSignatureUrl = url
    } else if (asset.asset_type === 'sealer_signature' && asset.user_id === cert.sealed_by) {
      sealerSignatureUrl = url
    }
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/student/certificates">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Certificates
        </Link>
      </Button>
      <CertificateTemplate
        studentName={student?.full_name || 'Unknown'}
        courseTitle={(cert.course as any)?.title || 'Unknown'}
        attesterName={(cert.attester as any)?.full_name || ''}
        sealerName={(cert.sealer as any)?.full_name || ''}
        issuedAt={cert.issued_at || new Date().toISOString()}
        certificateNumber={cert.certificate_number || ''}
        isBackentered={(cert as any).is_backentered || false}
        sealImageUrl={sealImageUrl}
        attesterSignatureUrl={attesterSignatureUrl}
        sealerSignatureUrl={sealerSignatureUrl}
      />
    </div>
  )
}
