-- Site settings table for admin-configurable values
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.site_settings enable row level security;

-- Anyone can read settings
create policy "Anyone can read settings"
  on public.site_settings for select
  using (true);

-- Only admins can update
create policy "Admins can update settings"
  on public.site_settings for update
  using (get_user_role(auth.uid()) in ('admin', 'super_admin'));

create policy "Admins can insert settings"
  on public.site_settings for insert
  with check (get_user_role(auth.uid()) in ('admin', 'super_admin'));

-- Default timezone
insert into public.site_settings (key, value) values ('timezone', 'America/New_York')
on conflict (key) do nothing;
