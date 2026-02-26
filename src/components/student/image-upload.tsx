'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { SketchPad } from './sketch-pad'
import { Upload, Camera, PenTool, Pencil, X, Loader2, ZoomIn } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  submissionId: string
  questionId: string
  existingImagePath: string | null
  disabled?: boolean
  supabaseUrl: string
}

export function ImageUpload({
  submissionId,
  questionId,
  existingImagePath,
  disabled = false,
  supabaseUrl,
}: ImageUploadProps) {
  const [imagePath, setImagePath] = useState(existingImagePath)
  const [uploading, setUploading] = useState(false)
  const [showSketchPad, setShowSketchPad] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [wasDrawn, setWasDrawn] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const imageUrl = imagePath
    ? `${supabaseUrl}/storage/v1/object/public/answer-images/${imagePath}?t=${Date.now()}`
    : null

  async function uploadFile(file: File | Blob, filename?: string) {
    setUploading(true)

    const formData = new FormData()
    if (file instanceof Blob && !(file instanceof File)) {
      formData.append('file', file, filename || 'drawing.png')
    } else {
      formData.append('file', file)
    }
    formData.append('submissionId', submissionId)
    formData.append('questionId', questionId)

    try {
      const res = await fetch('/api/upload-answer-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Upload failed')
        return
      }

      setImagePath(data.path)
      setPreviewUrl(null)
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset input

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5MB.')
      return
    }

    // Show preview
    setPreviewUrl(URL.createObjectURL(file))
    setWasDrawn(false)
    await uploadFile(file)
  }

  async function handleSketchSave(blob: Blob) {
    setShowSketchPad(false)
    setPreviewUrl(URL.createObjectURL(blob))
    setWasDrawn(true)
    await uploadFile(blob, 'drawing.png')
  }

  async function handleDelete() {
    if (!confirm('Remove this image?')) return

    try {
      const res = await fetch('/api/delete-answer-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, questionId }),
      })

      if (res.ok) {
        setImagePath(null)
        setPreviewUrl(null)
        setWasDrawn(false)
        toast.success('Image removed')
      }
    } catch {
      toast.error('Failed to remove image')
    }
  }

  if (showSketchPad) {
    const editUrl = wasDrawn ? (previewUrl || imageUrl || undefined) : undefined
    return (
      <SketchPad
        onSave={handleSketchSave}
        onCancel={() => setShowSketchPad(false)}
        initialImageUrl={editUrl}
      />
    )
  }

  const displayUrl = previewUrl || imageUrl

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <PenTool className="h-3.5 w-3.5" />
        This question requires a diagram or drawing
      </div>

      {/* Image preview */}
      {displayUrl && (
        <div className="relative group inline-block">
          <img
            src={displayUrl}
            alt="Uploaded diagram"
            className="max-h-64 rounded-md border"
          />
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-background/90 rounded-md border shadow-sm hover:bg-background"
            >
              <ZoomIn className="h-4 w-4" />
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 bg-background/90 rounded-md border shadow-sm hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-md">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Upload buttons */}
      {!disabled && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Upload File
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-4 w-4 mr-1.5" />
            Take Photo
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSketchPad(true)}
            disabled={uploading}
          >
            <PenTool className="h-4 w-4 mr-1.5" />
            Draw
          </Button>

          {wasDrawn && displayUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSketchPad(true)}
              disabled={uploading}
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit Drawing
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
