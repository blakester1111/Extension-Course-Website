export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { CertificateAssetUpload } from '@/components/admin/certificate-asset-upload'

export const metadata = {
  title: 'Certificate Settings — Admin',
}

export default async function CertificateSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, can_attest_certs, can_sign_certs')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  if (!isAdmin) redirect('/admin/certificates')

  // Fetch current assets
  const { data: assets } = await supabase
    .from('certificate_assets')
    .select('*')

  // Get users who have cert permissions
  const { data: certUsers } = await supabase
    .from('profiles')
    .select('id, full_name, can_attest_certs, can_sign_certs')
    .or('can_attest_certs.eq.true,can_sign_certs.eq.true')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  // Build asset map
  const assetMap: Record<string, string> = {}
  for (const a of assets || []) {
    const key = a.user_id ? `${a.asset_type}:${a.user_id}` : a.asset_type
    assetMap[key] = `${supabaseUrl}/storage/v1/object/public/certificate-assets/${a.image_path}`
  }

  // Find the seal (user_id is null)
  const sealUrl = assetMap['seal'] || null

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/certificates">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Certificates
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Certificate Settings</h1>
        <p className="text-muted-foreground">
          Manage the organizational seal and digital signatures that appear on certificates
        </p>
      </div>

      {/* Organizational Seal */}
      <CertificateAssetUpload
        title="Organizational Seal"
        description="This seal appears in the center of the certificate. Upload a high-quality image (PNG with transparency recommended)."
        assetType="seal"
        currentImageUrl={sealUrl}
        supabaseUrl={supabaseUrl}
      />

      {/* Attester Signatures */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Certificates & Awards Signatures</h2>
          <p className="text-sm text-muted-foreground">
            Signature images for users with Certificates & Awards permission
          </p>
        </div>
        {(certUsers || []).filter(u => u.can_attest_certs).map(u => (
          <CertificateAssetUpload
            key={u.id}
            title={u.full_name || 'Unknown'}
            description="Attester signature image"
            assetType="attester_signature"
            userId={u.id}
            currentImageUrl={assetMap[`attester_signature:${u.id}`] || null}
            supabaseUrl={supabaseUrl}
          />
        ))}
        {(certUsers || []).filter(u => u.can_attest_certs).length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No users with Certificates & Awards permission. Assign permissions in the Students tab.
          </p>
        )}
      </div>

      {/* Sealer Signatures */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Keeper of Seals Signatures</h2>
          <p className="text-sm text-muted-foreground">
            Signature images for users with Keeper of Seals permission
          </p>
        </div>
        {(certUsers || []).filter(u => u.can_sign_certs).map(u => (
          <CertificateAssetUpload
            key={u.id}
            title={u.full_name || 'Unknown'}
            description="Sealer signature image"
            assetType="sealer_signature"
            userId={u.id}
            currentImageUrl={assetMap[`sealer_signature:${u.id}`] || null}
            supabaseUrl={supabaseUrl}
          />
        ))}
        {(certUsers || []).filter(u => u.can_sign_certs).length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No users with Keeper of Seals permission. Assign permissions in the Students tab.
          </p>
        )}
      </div>
    </div>
  )
}
