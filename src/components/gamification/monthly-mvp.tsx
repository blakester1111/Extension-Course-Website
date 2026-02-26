'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'

export interface MonthlyMvpData {
  month: string // e.g. "February 2026"
  publicMvp: { name: string; lessons: number } | null
  staffMvp: { name: string; lessons: number } | null
}

interface MonthlyMvpProps {
  data: MonthlyMvpData
  showStaff: boolean
}

export function MonthlyMvp({ data, showStaff }: MonthlyMvpProps) {
  const hasMvp = data.publicMvp || (showStaff && data.staffMvp)
  if (!hasMvp) return null

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          MVP — {data.month}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {data.publicMvp && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Public</p>
              <p className="font-semibold">{data.publicMvp.name}</p>
              <p className="text-xs text-muted-foreground">{data.publicMvp.lessons} lessons passed</p>
            </div>
          )}
          {showStaff && data.staffMvp && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Staff</p>
              <p className="font-semibold">{data.staffMvp.name}</p>
              <p className="text-xs text-muted-foreground">{data.staffMvp.lessons} lessons passed</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
