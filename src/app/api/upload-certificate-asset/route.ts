import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, can_attest_certs, can_sign_certs')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  if (!isAdmin && !profile?.can_attest_certs && !profile?.can_sign_certs) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const assetType = formData.get('assetType') as string
  const userId = formData.get('userId') as string | null

  if (!file || !assetType) {
    return NextResponse.json({ error: 'Missing file or asset type' }, { status: 400 })
  }

  if (!['seal', 'attester_signature', 'sealer_signature'].includes(assetType)) {
    return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum 2MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const isSeal = assetType === 'seal'
  const effectiveUserId = isSeal ? null : (userId || user.id)
  const prefix = isSeal ? 'seal' : `sig-${effectiveUserId}`
  const fileName = `${prefix}-${Date.now()}.${ext}`

  // Find existing asset to replace
  let existingQuery = supabase
    .from('certificate_assets')
    .select('id, image_path')
    .eq('asset_type', assetType)

  if (isSeal) {
    existingQuery = existingQuery.is('user_id', null)
  } else {
    existingQuery = existingQuery.eq('user_id', effectiveUserId!)
  }

  const { data: existing } = await existingQuery.maybeSingle()

  // Delete old file from storage
  if (existing?.image_path) {
    await supabase.storage.from('certificate-assets').remove([existing.image_path])
  }

  // Upload new file
  const { error: uploadError } = await supabase.storage
    .from('certificate-assets')
    .upload(fileName, file)

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Update existing record or insert new one
  if (existing) {
    const { error: dbError } = await supabase
      .from('certificate_assets')
      .update({ image_path: fileName })
      .eq('id', existing.id)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
  } else {
    const { error: dbError } = await supabase
      .from('certificate_assets')
      .insert({
        asset_type: assetType,
        user_id: effectiveUserId,
        image_path: fileName,
      })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ path: fileName })
}
