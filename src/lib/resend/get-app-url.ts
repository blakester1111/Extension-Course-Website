import { createAdminClient } from '@/lib/supabase/admin'

const PRODUCTION_URL = 'https://extension.fcdc-services.com'

let cachedUrl: string = ''
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

/**
 * Get the public-facing app URL for use in emails.
 * Reads from site_settings first, then falls back to the production URL.
 * Never returns localhost — emails must always link to the hosted site.
 */
export async function getAppUrl(): Promise<string> {
  // Return cache if fresh
  if (cachedUrl !== '' && Date.now() - cacheTime < CACHE_TTL) {
    return cachedUrl
  }

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'app_url')
      .maybeSingle()

    if (data?.value && !data.value.includes('localhost')) {
      cachedUrl = data.value.replace(/\/$/, '')
      cacheTime = Date.now()
      return cachedUrl
    }
  } catch {
    // Fall through to default
  }

  // Fall back to env var only if it's not localhost
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    cachedUrl = envUrl.replace(/\/$/, '')
    cacheTime = Date.now()
    return cachedUrl
  }

  return PRODUCTION_URL
}
