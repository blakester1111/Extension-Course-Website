import { ProtectedPdfViewer } from '@/components/resources/pdf-viewer'

export const metadata = {
  title: 'Resources — FCDC Extension Courses',
  description: 'Study charts and reference materials for extension course students.',
}

export default function ResourcesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
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
