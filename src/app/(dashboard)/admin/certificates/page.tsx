export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { CertificateQueue } from '@/components/admin/certificate-queue'

export const metadata = {
  title: 'Certificates — Admin',
}

export default async function CertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, can_attest_certs, can_sign_certs')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const canAttest = profile?.can_attest_certs || isAdmin
  const canSeal = profile?.can_sign_certs || isAdmin

  if (!canAttest && !canSeal) redirect('/login')

  // Fetch all certificates with student and course info
  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      id, status, certificate_number, is_backentered, attested_at, sealed_at, issued_at, created_at,
      student:profiles!certificates_student_id_fkey(full_name, email, cert_mail_preference),
      course:courses(title),
      attester:profiles!certificates_attested_by_fkey(full_name),
      sealer:profiles!certificates_sealed_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  const certs = (certificates || []).map((c: any) => ({
    id: c.id,
    status: c.status as string,
    certificateNumber: c.certificate_number,
    isBackentered: c.is_backentered || false,
    studentName: c.student?.full_name || 'Unknown',
    studentEmail: c.student?.email || '',
    wantsMail: c.student?.cert_mail_preference === 'mail',
    courseTitle: c.course?.title || 'Unknown',
    attesterName: c.attester?.full_name || null,
    attestedAt: c.attested_at,
    sealerName: c.sealer?.full_name || null,
    sealedAt: c.sealed_at,
    issuedAt: c.issued_at,
    createdAt: c.created_at,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificates</h1>
          <p className="text-muted-foreground">Attest course completions and issue certificates</p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/certificates/settings">
              <Settings className="h-4 w-4 mr-1.5" />
              Signatures & Seal
            </Link>
          </Button>
        )}
      </div>

      <CertificateQueue
        certificates={certs}
        canAttest={canAttest}
        canSeal={canSeal}
      />
    </div>
  )
}
