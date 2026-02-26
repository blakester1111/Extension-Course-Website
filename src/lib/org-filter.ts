/**
 * Filters enrolled student IDs by organization.
 */
export async function filterByOrg(
  supabase: any,
  enrolledIds: string[],
  orgFilter: string | undefined
): Promise<string[]> {
  if (!orgFilter || orgFilter === 'all') return enrolledIds
  if (enrolledIds.length === 0) return enrolledIds

  if (orgFilter === 'unassigned') {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .in('id', enrolledIds)
      .is('organization', null)
    return (profiles || []).map((p: any) => p.id)
  }

  // day or foundation
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .in('id', enrolledIds)
    .eq('organization', orgFilter)

  return (profiles || []).map((p: any) => p.id)
}

/**
 * Filters enrolled student IDs by staff status.
 * 'paid' = is_staff false, 'staff' = is_staff true
 */
export async function filterByStaff(
  supabase: any,
  enrolledIds: string[],
  audienceFilter: string | undefined
): Promise<string[]> {
  if (!audienceFilter) audienceFilter = 'paid'
  if (enrolledIds.length === 0) return enrolledIds

  const isStaff = audienceFilter === 'staff'
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .in('id', enrolledIds)
    .eq('is_staff', isStaff)

  return (profiles || []).map((p: any) => p.id)
}

/**
 * Resolves the effective org filter.
 * If no org param is set, defaults to the current user's organization.
 */
export function resolveOrgDefault(
  paramOrg: string | undefined,
  userOrg: string | null | undefined
): string {
  if (paramOrg) return paramOrg
  if (userOrg === 'day' || userOrg === 'foundation') return userOrg
  return 'all'
}
