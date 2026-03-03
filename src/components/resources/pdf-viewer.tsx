'use client'

import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Maximize2 } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  pdfUrl: string
  title: string
  thumbnailWidth?: number
}

export function ProtectedPdfViewer({ pdfUrl, title, thumbnailWidth = 400 }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = useCallback(() => setIsOpen(true), [])
  const handleClose = useCallback(() => setIsOpen(false), [])

  // Lock body scroll and handle Escape when modal is open
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleClose])

  return (
    <>
      {/* Clickable thumbnail card */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow group overflow-hidden"
        onClick={handleOpen}
      >
        <CardContent className="p-0">
          <div
            className="relative bg-muted flex items-center justify-center overflow-hidden"
            style={{ contain: 'inline-size' }}
            onContextMenu={e => e.preventDefault()}
          >
            <Document
              file={pdfUrl}
              loading={
                <div className="flex items-center justify-center h-[280px] w-full">
                  <p className="text-sm text-muted-foreground">Loading preview...</p>
                </div>
              }
            >
              <Page
                pageNumber={1}
                width={thumbnailWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                devicePixelRatio={2}
              />
            </Document>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-black/80 rounded-full p-3">
                <Maximize2 className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1">Click to view full chart</p>
          </div>
        </CardContent>
      </Card>

      {/* Full-screen modal — native browser PDF viewer via iframe */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 print:hidden">
          <style>{`@media print { body * { visibility: hidden !important; } }`}</style>

          {/* Title bar with close button */}
          <div className="absolute top-0 left-0 right-0 h-12 z-20 flex items-center justify-between px-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
            <h2 className="text-white text-sm font-medium truncate">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 shrink-0"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Native PDF viewer — browser handles zoom, scroll, rendering */}
          <iframe
            src={`${pdfUrl}#navpanes=0`}
            className="absolute top-12 bottom-0 left-0 right-0 w-full border-0"
            style={{ height: 'calc(100% - 3rem)' }}
            title={title}
            allow="fullscreen"
          />
        </div>
      )}
    </>
  )
}
