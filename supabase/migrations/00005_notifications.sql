-- Notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('lesson_graded', 'lesson_submitted', 'enrollment_confirmed', 'corrections_needed')),
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role / server can insert notifications
create policy "Server can insert notifications"
  on public.notifications for insert
  with check (true);

-- Admins full access
create policy "Admins can manage all notifications"
  on public.notifications for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;

-- Index for efficient queries
create index notifications_user_unread_idx on public.notifications(user_id, is_read) where is_read = false;
