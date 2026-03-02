'use client'

import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'

// Fix white horizontal line artifacts from sub-pixel canvas tile gaps
const pdfCanvasFix = `
.react-pdf__Page canvas {
  display: block;
  image-rendering: auto;
}
`

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  pdfUrl: string
  title: string
  thumbnailWidth?: number
}

export function ProtectedPdfViewer({ pdfUrl, title, thumbnailWidth = 400 }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [fitScale, setFitScale] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [pdfRef, setPdfRef] = useState<any>(null)

  function onDocumentLoadSuccess(pdf: any) {
    setNumPages(pdf.numPages)
    setPdfRef(pdf)
  }

  // Calculate fit-to-window scale when viewer opens or PDF loads
  const calcFitScale = useCallback(async () => {
    if (!pdfRef) return
    try {
      const page = await pdfRef.getPage(1)
      const viewport = page.getViewport({ scale: 1 })
      const toolbarHeight = 48
      const padding = 32
      const availWidth = window.innerWidth - padding
      const availHeight = window.innerHeight - toolbarHeight - padding
      const fit = Math.min(availWidth / viewport.width, availHeight / viewport.height)
      setFitScale(fit)
      setScale(fit)
    } catch {
      // fallback
    }
  }, [pdfRef])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    // Recalculate on next tick when viewport is known
    setTimeout(() => calcFitScale(), 50)
  }, [calcFitScale])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Keyboard: Escape to close, block Ctrl+S/Ctrl+P when viewer open
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
      // Block save, print, copy shortcuts
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Recalculate fit when PDF ref becomes available while modal is open
  useEffect(() => {
    if (isOpen && pdfRef) calcFitScale()
  }, [isOpen, pdfRef, calcFitScale])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <style>{pdfCanvasFix}</style>
      {/* Clickable thumbnail card */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow group overflow-hidden"
        onClick={handleOpen}
      >
        <CardContent className="p-0">
          <div
            className="relative bg-muted flex items-center justify-center overflow-hidden"
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
            {/* Hover overlay */}
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

      {/* Full-screen modal viewer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col print:hidden"
          onContextMenu={e => e.preventDefault()}
          onDragStart={e => e.preventDefault()}
        >
          {/* Hide content when printing */}
          {/* eslint-disable-next-line react/no-unknown-property */}
          <style>{`@media print { body * { visibility: hidden !important; } }`}</style>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm border-b border-white/10 shrink-0">
            <h2 className="text-white text-sm font-medium truncate">{title}</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setScale(s => Math.max(fitScale * 0.5, s - fitScale * 0.25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white text-xs w-14 text-center">
                {Math.abs(scale - fitScale) < 0.01 ? 'Fit' : `${Math.round((scale / fitScale) * 100)}%`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setScale(s => Math.min(fitScale * 5, s + fitScale * 0.25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setScale(fitScale)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable PDF content */}
          <div
            className="flex-1 overflow-auto p-4"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <div className="min-w-fit flex justify-center">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white">Loading document...</p>
                  </div>
                }
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <Page
                    key={i + 1}
                    pageNumber={i + 1}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    devicePixelRatio={2}
                    className="mb-4 shadow-2xl"
                  />
                ))}
              </Document>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
