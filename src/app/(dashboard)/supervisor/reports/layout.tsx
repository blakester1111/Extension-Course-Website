'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const reportTabs = [
  { href: '/supervisor/reports', label: 'Overview' },
  { href: '/supervisor/reports/progress', label: 'Progress Board' },
  { href: '/supervisor/reports/inactive', label: 'Inactive Students' },
  { href: '/supervisor/reports/completions', label: 'Completions' },
  { href: '/supervisor/reports/grading', label: 'Grading' },
  { href: '/supervisor/reports/courses', label: 'Course Analytics' },
  { href: '/supervisor/reports/weekly-export', label: 'Weekly Report' },
]

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Analytics and insights for your extension courses</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b pb-px">
        {reportTabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-md transition-colors',
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
