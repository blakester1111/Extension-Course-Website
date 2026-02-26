'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface CertificateAssetUploadProps {
  title: string
  description: string
  assetType: 'seal' | 'attester_signature' | 'sealer_signature'
  userId?: string
  currentImageUrl: string | null
  supabaseUrl: string
}

export function CertificateAssetUpload({
  title,
  description,
  assetType,
  userId,
  currentImageUrl,
  supabaseUrl,
}: CertificateAssetUploadProps) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Maximum 2MB.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('assetType', assetType)
    if (userId) formData.append('userId', userId)

    try {
      const res = await fetch('/api/upload-certificate-asset', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Upload failed')
        return
      }

      setImageUrl(`${supabaseUrl}/storage/v1/object/public/certificate-assets/${data.path}?t=${Date.now()}`)
      toast.success('Image uploaded')
      router.refresh()
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {imageUrl && (
          <div className="relative inline-block bg-white border rounded-lg p-3">
            <img
              src={imageUrl}
              alt={title}
              className="max-h-32 max-w-xs object-contain"
            />
          </div>
        )}

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            {imageUrl ? 'Replace Image' : 'Upload Image'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
