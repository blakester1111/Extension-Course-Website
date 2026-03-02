export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProtectedPdfViewer } from '@/components/resources/pdf-viewer'

export const metadata = {
  title: 'Resources — FCDC Extension Courses',
  description: 'Study charts and reference materials for extension course students.',
}

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Study charts and reference materials for your extension courses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProtectedPdfViewer
          pdfUrl="/routes-to-knowledge.pdf"
          title="The Complete Routes to Knowledge"
          thumbnailWidth={380}
        />
      </div>
    </div>
  )
}
