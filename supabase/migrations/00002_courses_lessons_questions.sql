-- Courses table
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  price_cents integer not null default 0,
  checkout_url text,
  category text not null default 'book' check (category in ('book', 'lecture', 'book_and_lecture')),
  is_published boolean not null default false,
  lesson_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.courses enable row level security;

-- Anyone can view published courses
create policy "Anyone can view published courses"
  on public.courses for select
  using (is_published = true);

-- Admins can do everything with courses
create policy "Admins can manage courses"
  on public.courses for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create trigger courses_updated_at
  before update on public.courses
  for each row execute procedure public.update_updated_at();

-- Lessons table
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lessons enable row level security;

-- Anyone can view lessons of published courses
create policy "Anyone can view lessons of published courses"
  on public.lessons for select
  using (
    exists (
      select 1 from public.courses
      where id = course_id and is_published = true
    )
  );

-- Admins can manage all lessons
create policy "Admins can manage lessons"
  on public.lessons for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create trigger lessons_updated_at
  before update on public.lessons
  for each row execute procedure public.update_updated_at();

-- Auto-update course lesson_count
create or replace function public.update_course_lesson_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'DELETE' then
    update public.courses
    set lesson_count = (select count(*) from public.lessons where course_id = OLD.course_id)
    where id = OLD.course_id;
    return OLD;
  else
    update public.courses
    set lesson_count = (select count(*) from public.lessons where course_id = NEW.course_id)
    where id = NEW.course_id;
    return NEW;
  end if;
end;
$$;

create trigger update_lesson_count
  after insert or delete on public.lessons
  for each row execute procedure public.update_course_lesson_count();

-- Questions table
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  question_text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.questions enable row level security;

-- Anyone can view questions of lessons in published courses
create policy "Anyone can view questions of published courses"
  on public.questions for select
  using (
    exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_id and c.is_published = true
    )
  );

-- Admins can manage questions
create policy "Admins can manage questions"
  on public.questions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create trigger questions_updated_at
  before update on public.questions
  for each row execute procedure public.update_updated_at();

-- Storage bucket for course images
insert into storage.buckets (id, name, public)
values ('course-images', 'course-images', true)
on conflict do nothing;

-- Allow admins to upload/delete course images
create policy "Admins can upload course images"
  on storage.objects for insert
  with check (
    bucket_id = 'course-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update course images"
  on storage.objects for update
  using (
    bucket_id = 'course-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete course images"
  on storage.objects for delete
  using (
    bucket_id = 'course-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Public read access for course images
create policy "Anyone can view course images"
  on storage.objects for select
  using (bucket_id = 'course-images');
