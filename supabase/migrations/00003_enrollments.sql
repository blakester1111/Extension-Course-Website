-- Enrollments table
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(student_id, course_id)
);

alter table public.enrollments enable row level security;

-- Students can view their own enrollments
create policy "Students can view own enrollments"
  on public.enrollments for select
  using (auth.uid() = student_id);

-- Admins can manage all enrollments
create policy "Admins can manage all enrollments"
  on public.enrollments for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow authenticated users to self-enroll (for free courses via API)
create policy "Users can self-enroll"
  on public.enrollments for insert
  with check (auth.uid() = student_id);
