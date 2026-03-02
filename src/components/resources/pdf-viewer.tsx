'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'

// Fix sub-pixel canvas tile gaps
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
  const [displayZoom, setDisplayZoom] = useState(1)
  const [renderZoom, setRenderZoom] = useState(1)
  const [transitioning, setTransitioning] = useState(false)
  const [fitScale, setFitScale] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [pdfRef, setPdfRef] = useState<any>(null)
  const [snapshot, setSnapshot] = useState<{ url: string; w: number; h: number } | null>(null)
  const pagesRendered = useRef(0)
  const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const contentRef = useRef<HTMLDivElement>(null)

  function onDocumentLoadSuccess(pdf: any) {
    setNumPages(pdf.numPages)
    setPdfRef(pdf)
  }

  function handlePageRenderSuccess() {
    pagesRendered.current++
    if (pagesRendered.current >= numPages && numPages > 0) {
      requestAnimationFrame(() => {
        setTransitioning(false)
        setSnapshot(null)
      })
    }
  }

  function handleZoomChange(newZoom: number) {
    if (newZoom === displayZoom) return

    // Capture current canvas as snapshot BEFORE any changes
    try {
      const canvas = contentRef.current?.querySelector('.react-pdf__Page canvas') as HTMLCanvasElement | null
      if (canvas) {
        setSnapshot({
          url: canvas.toDataURL('image/jpeg', 0.6),
          w: canvas.offsetWidth,
          h: canvas.offsetHeight,
        })
      }
    } catch {
      // canvas might be tainted
    }

    setDisplayZoom(newZoom)
    setTransitioning(true)
    pagesRendered.current = 0

    // Clear any pending zoom (handles rapid clicks)
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)

    // Small delay so snapshot renders before scale change triggers canvas clear
    zoomTimeoutRef.current = setTimeout(() => {
      setRenderZoom(newZoom)
    }, 50)
  }

  const calcFitScale = useCallback(async () => {
    if (!pdfRef) return
    try {
      const page = await pdfRef.getPage(1)
      const viewport = page.getViewport({ scale: 1 })
      const toolbarHeight = 48
      const horizontalPadding = 32
      const verticalPadding = 48
      const availWidth = window.innerWidth - horizontalPadding
      const availHeight = window.innerHeight - toolbarHeight - verticalPadding
      const fit = Math.min(availWidth / viewport.width, availHeight / viewport.height)
      setFitScale(fit)
      setDisplayZoom(1)
      setRenderZoom(1)
    } catch {
      // fallback
    }
  }, [pdfRef])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setTimeout(() => calcFitScale(), 50)
  }, [calcFitScale])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setDisplayZoom(1)
    setRenderZoom(1)
    setTransitioning(false)
    setSnapshot(null)
  }, [])

  useEffect(() => {
    return () => { if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current) }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  useEffect(() => {
    if (isOpen && pdfRef) calcFitScale()
  }, [isOpen, pdfRef, calcFitScale])

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
          className="fixed inset-0 z-[100] bg-black/90 print:hidden"
          onContextMenu={e => e.preventDefault()}
          onDragStart={e => e.preventDefault()}
        >
          <style>{`@media print { body * { visibility: hidden !important; } }`}</style>

          {/* Toolbar — absolutely pinned, never scrolls */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/10">
            <h2 className="text-white text-sm font-medium truncate">{title}</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => handleZoomChange(displayZoom - 1)}
                disabled={displayZoom <= 1 || transitioning}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white text-xs w-14 text-center">
                {displayZoom === 1 ? 'Fit' : `${displayZoom * 100}%`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => handleZoomChange(displayZoom + 1)}
                disabled={displayZoom >= 5 || transitioning}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => handleZoomChange(1)}
                disabled={displayZoom === 1 || transitioning}
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

          {/* Scrollable PDF content — independent scroll region below toolbar */}
          <div
            className="absolute top-[41px] bottom-0 left-0 right-0 overflow-auto p-4"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <div ref={contentRef} className="min-w-fit flex justify-center relative">
              {/* Blurred snapshot overlay — hides canvas clearing during zoom */}
              {snapshot && transitioning && (
                <img
                  src={snapshot.url}
                  width={snapshot.w}
                  height={snapshot.h}
                  alt=""
                  className="absolute top-0 left-1/2 z-10 pointer-events-none"
                  style={{
                    transform: 'translateX(-50%)',
                    filter: 'blur(6px)',
                  }}
                />
              )}

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
                    scale={fitScale * renderZoom}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    devicePixelRatio={3}
                    onRenderSuccess={handlePageRenderSuccess}
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
