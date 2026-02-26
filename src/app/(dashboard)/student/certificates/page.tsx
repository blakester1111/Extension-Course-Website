export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'My Certificates — FCDC Extension Course',
}

export default async function StudentCertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, status, certificate_number, issued_at, is_backentered, course:courses(title)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  const issued = (certificates || []).filter((c: any) => c.status === 'issued')
  const pending = (certificates || []).filter((c: any) => c.status !== 'issued')

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Certificates</h1>
        <p className="text-muted-foreground">View and print your course completion certificates</p>
      </div>

      {issued.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {issued.map((cert: any) => (
            <Link key={cert.id} href={`/student/certificates/${cert.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="pt-6 text-center space-y-3">
                  <Award className="h-10 w-10 text-yellow-500 mx-auto" />
                  <p className="font-semibold">{cert.course?.title}</p>
                  <Badge variant="outline" className="font-mono text-xs">
                    {cert.certificate_number || (cert.is_backentered ? 'Back-entered' : '—')}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pending.map((cert: any) => (
                <div key={cert.id} className="flex items-center justify-between py-2">
                  <span className="font-medium">{cert.course?.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {cert.status === 'pending_attestation' ? 'Awaiting Attestation' : 'Awaiting Signature'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {issued.length === 0 && pending.length === 0 && (
        <Card>
          <CardContent>
            <p className="text-center text-muted-foreground py-12">
              No certificates yet. Complete a course to earn one!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
