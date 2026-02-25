-- Orders table to track Stripe purchases
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete set null,
  course_id uuid not null references public.courses(id) on delete cascade,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  customer_email text not null,
  customer_first_name text not null,
  customer_last_name text not null,
  customer_phone text,
  customer_country text,
  customer_address text,
  customer_city text,
  customer_state text,
  customer_zip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.orders enable row level security;

-- Admins can view all orders
create policy "Admins can view all orders"
  on public.orders for select
  using (get_user_role(auth.uid()) in ('admin', 'super_admin'));

-- Users can view their own orders
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = student_id);

-- Service role can insert/update (used by API routes)
-- No insert/update policies for regular users — all writes go through server API with service role

-- Updated_at trigger
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at();
