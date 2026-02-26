'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Bell,
  User,
  ClipboardCheck,
  Trophy,
  GraduationCap,
  Shield,
  BarChart3,
  DollarSign,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarLink {
  href: string
  label: string
  icon: React.ElementType
}

const studentLinks: SidebarLink[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/honor-roll', label: 'Honor Roll', icon: Trophy },
  { href: '/student/notifications', label: 'Notifications', icon: Bell },
  { href: '/student/profile', label: 'Profile', icon: User },
]

const myLearningLinks: SidebarLink[] = [
  { href: '/student/dashboard', label: 'My Courses', icon: BookOpen },
  { href: '/student/notifications', label: 'My Notifications', icon: Bell },
  { href: '/student/profile', label: 'My Profile', icon: User },
]

const supervisorLinks: SidebarLink[] = [
  { href: '/supervisor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/supervisor/queue', label: 'Grading Queue', icon: ClipboardCheck },
  { href: '/supervisor/enrollments', label: 'Pending Invoices', icon: FileText },
  { href: '/supervisor/students', label: 'Students', icon: Users },
  { href: '/supervisor/reports', label: 'Reports', icon: BarChart3 },
]

const adminLinks: SidebarLink[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/supervisors', label: 'Supervisors', icon: GraduationCap },
  { href: '/admin/students', label: 'Users', icon: Users },
  { href: '/supervisor/queue', label: 'Grading Queue', icon: ClipboardCheck },
  { href: '/supervisor/students', label: 'All Students Progress', icon: FileText },
  { href: '/supervisor/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/reports/revenue', label: 'Revenue', icon: DollarSign },
]

const superAdminLinks: SidebarLink[] = [
  ...adminLinks,
  { href: '/admin/admins', label: 'Admins', icon: Shield },
]

const linksByRole: Record<UserRole, SidebarLink[]> = {
  student: studentLinks,
  supervisor: supervisorLinks,
  admin: adminLinks,
  super_admin: superAdminLinks,
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const links = linksByRole[role] || adminLinks
  const showMyLearning = role !== 'student'
  const [expanded, setExpanded] = useState(false)

  function NavLink({ link }: { link: SidebarLink }) {
    const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
    const Icon = link.icon

    const linkEl = (
      <Link
        href={link.href}
        className={cn(
          'flex items-center rounded-md transition-colors',
          expanded ? 'gap-3 px-3 py-2' : 'justify-center px-0 py-2',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {expanded && (
          <span className="text-sm font-medium whitespace-nowrap">{link.label}</span>
        )}
      </Link>
    )

    if (!expanded) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {link.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return linkEl
  }

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        'hidden md:flex flex-col border-r bg-background transition-all duration-200 ease-in-out',
        expanded ? 'w-56' : 'w-12'
      )}
    >
      <div className="flex-1 py-4">
        <nav className={cn('space-y-1', expanded ? 'px-2' : 'px-1')}>
          {links.map((link) => (
            <NavLink key={link.href} link={link} />
          ))}

          {showMyLearning && (
            <>
              <div className="my-3 border-t" />
              {expanded && (
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  My Learning
                </p>
              )}
              {myLearningLinks.map((link) => (
                <NavLink key={link.href} link={link} />
              ))}
            </>
          )}
        </nav>
      </div>
    </aside>
  )
}
