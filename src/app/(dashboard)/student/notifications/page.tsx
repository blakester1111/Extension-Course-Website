export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationList } from '@/components/student/notification-list'
import Link from 'next/link'

const PAGE_SIZE = 30

export const metadata = {
  title: 'Notifications — FCDC Extension Courses',
}

export default async function StudentNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1', 10))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get total count
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const totalCount = count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Stay updated on your course progress</p>
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{page > 1 ? 'No more notifications' : 'No notifications yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <NotificationList notifications={notifications} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/student/notifications?page=${page - 1}`}>Previous</Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/student/notifications?page=${page + 1}`}>Next</Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
