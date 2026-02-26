import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollText } from 'lucide-react'
import { categoryLabels, type HallOfFameData } from '@/lib/honor-roll'
import type { CourseCategory } from '@/types/database'

interface HallOfFameProps {
  data: HallOfFameData
  title?: string
}

const categoryOrder: CourseCategory[] = ['basics', 'congresses', 'accs']

export function HallOfFame({ data, title = 'Hall of Fame' }: HallOfFameProps) {
  const hasAny = categoryOrder.some(cat => data[cat].length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Students who have completed every course in an entire lineup.
        </p>
      </CardHeader>
      <CardContent>
        {!hasAny ? (
          <p className="text-center text-muted-foreground py-8">
            No lineup completions yet. Be the first!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryOrder.map(category => (
              <div key={category}>
                <div className="border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-muted px-4 py-3 border-b">
                    <h3 className="font-semibold text-sm text-center">
                      {categoryLabels[category]} Lineup
                    </h3>
                  </div>

                  {/* Names list */}
                  <div className="p-3 min-h-[120px] max-h-[320px] overflow-y-auto">
                    {data[category].length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">
                        No completions yet
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {data[category].map((entry, i) => (
                          <li key={i} className="flex items-center justify-between gap-2 text-sm">
                            <span className="font-medium truncate">{entry.studentName}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(entry.completedAt).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
