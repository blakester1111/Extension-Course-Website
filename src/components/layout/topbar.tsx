'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LogOut, User, Menu, X, Sun, Moon,
  LayoutDashboard, BookOpen, FileText, Users, ClipboardCheck,
  Trophy, GraduationCap, Shield, BarChart3, DollarSign, Settings, Bell, Award,
} from 'lucide-react'
import { NotificationBell } from './notification-bell'
import type { UserRole } from '@/types/database'

interface MobileNavLink {
  href: string
  label: string
  icon: React.ElementType
}

const mobileStudentNav: MobileNavLink[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/certificates', label: 'Certificates', icon: Award },
  { href: '/student/honor-roll', label: 'Honor Roll', icon: Trophy },
  { href: '/student/notifications', label: 'Notifications', icon: Bell },
  { href: '/student/profile', label: 'Profile', icon: User },
]

const mobileSupervisorNav: MobileNavLink[] = [
  { href: '/supervisor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/supervisor/queue', label: 'Grading Queue', icon: ClipboardCheck },
  { href: '/supervisor/enrollments', label: 'Pending Invoices', icon: FileText },
  { href: '/supervisor/students', label: 'Students', icon: Users },
  { href: '/supervisor/reports', label: 'Reports', icon: BarChart3 },
]

const mobileAdminNav: MobileNavLink[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/supervisors', label: 'Supervisors', icon: GraduationCap },
  { href: '/admin/students', label: 'Users', icon: Users },
  { href: '/supervisor/queue', label: 'Grading Queue', icon: ClipboardCheck },
  { href: '/supervisor/students', label: 'All Students Progress', icon: FileText },
  { href: '/supervisor/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/reports/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

const mobileSuperAdminNav: MobileNavLink[] = [
  ...mobileAdminNav,
  { href: '/admin/admins', label: 'Admins', icon: Shield },
]

const mobileMyLearningNav: MobileNavLink[] = [
  { href: '/student/dashboard', label: 'My Courses', icon: BookOpen },
  { href: '/student/certificates', label: 'My Certificates', icon: Award },
  { href: '/student/honor-roll', label: 'Honor Roll', icon: Trophy },
  { href: '/student/notifications', label: 'My Notifications', icon: Bell },
  { href: '/student/profile', label: 'My Profile', icon: User },
]

function getMobileNav(role: UserRole): MobileNavLink[] {
  switch (role) {
    case 'student': return mobileStudentNav
    case 'supervisor': return mobileSupervisorNav
    case 'admin': return mobileAdminNav
    case 'super_admin': return mobileSuperAdminNav
    default: return mobileStudentNav
  }
}

export function Topbar() {
  const { user, profile, loading } = useUser()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  // Determine dashboard path based on role
  const dashboardPath = profile
    ? `/${profile.role === 'super_admin' ? 'admin' : profile.role}/dashboard`
    : '/student/dashboard'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 sm:px-6 md:pl-0 md:pr-6 flex h-14 items-center">
        <Link href="/" className="flex items-center font-bold mr-6 shrink-0">
          <div className="shrink-0 flex justify-center md:w-12">
            <Image src="/fcdc-logo.png" alt="FCDC" width={36} height={36} className="h-7 w-7 md:h-9 md:w-9" />
          </div>
          <span className="hidden sm:inline ml-2 md:ml-6">FCDC Extension Course</span>
          <span className="sm:hidden ml-2">FCDC</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4 text-sm flex-1">
          <Link href="/catalog" className="text-muted-foreground hover:text-foreground transition-colors">
            Catalog
          </Link>
          <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="/calculator" className="text-muted-foreground hover:text-foreground transition-colors">
            Calculator
          </Link>
        </nav>

        {/* Desktop auth area */}
        <div className="hidden sm:flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          {loading ? (
            /* Show nothing while auth is loading — prevents flash of Sign In buttons */
            <div className="w-8 h-8" />
          ) : user && profile ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{profile.role === 'super_admin' ? 'Super Admin' : profile.role}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardPath}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/student/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile: notification bell + theme toggle + hamburger */}
        <div className="flex sm:hidden items-center gap-1 ml-auto">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
          {!loading && user && profile && <NotificationBell />}
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t bg-background max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {loading ? null : user && profile ? (
              <>
                {/* User info */}
                <div className="pb-2 mb-1">
                  <p className="text-sm font-semibold">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile.role === 'super_admin' ? 'Super Admin' : profile.role}</p>
                </div>

                {/* Role-based navigation */}
                <div className="border-t pt-2 pb-1">
                  {getMobileNav(profile.role as UserRole).map(link => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-3 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                      </Link>
                    )
                  })}
                </div>

                {/* My Learning section for non-students */}
                {profile.role !== 'student' && (
                  <div className="border-t pt-2 pb-1">
                    <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      My Learning
                    </p>
                    {mobileMyLearningNav.map(link => {
                      const Icon = link.icon
                      return (
                        <Link
                          key={link.href + '-learning'}
                          href={link.href}
                          className="flex items-center gap-3 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {link.label}
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Site pages */}
                <div className="border-t pt-2 pb-1">
                  <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Site
                  </p>
                  <Link
                    href="/catalog"
                    className="flex items-center gap-3 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Catalog
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="flex items-center gap-3 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/calculator"
                    className="flex items-center gap-3 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Calculator
                  </Link>
                </div>

                {/* Sign out */}
                <div className="border-t pt-2">
                  <button
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false) }}
                    className="flex items-center gap-3 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/catalog"
                  className="block px-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Catalog
                </Link>
                <Link
                  href="/how-it-works"
                  className="block px-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  href="/calculator"
                  className="block px-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Calculator
                </Link>
                <div className="flex gap-2 border-t pt-3 mt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
