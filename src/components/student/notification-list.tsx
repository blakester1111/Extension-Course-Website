'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/types/database'
import { CheckCircle, BookOpen, ClipboardCheck, AlertCircle } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  enrollment_confirmed: CheckCircle,
  lesson_graded: ClipboardCheck,
  lesson_submitted: BookOpen,
  corrections_needed: AlertCircle,
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleClick(notification: Notification) {
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    router.refresh()
  }

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type] || CheckCircle

          return (
            <Card
              key={notification.id}
              className={`cursor-pointer hover:shadow-sm transition-shadow ${!notification.is_read ? 'border-primary/30 bg-primary/5' : ''}`}
              onClick={() => handleClick(notification)}
            >
              <CardContent className="flex items-start gap-3 py-3">
                <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
