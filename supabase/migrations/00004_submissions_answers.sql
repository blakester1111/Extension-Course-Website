-- Lesson submissions
create table public.lesson_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'graded_pass', 'graded_corrections')),
  grade integer,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, lesson_id)
);

alter table public.lesson_submissions enable row level security;

-- Students can manage their own submissions
create policy "Students can view own submissions"
  on public.lesson_submissions for select
  using (auth.uid() = student_id);

create policy "Students can insert own submissions"
  on public.lesson_submissions for insert
  with check (auth.uid() = student_id);

create policy "Students can update own draft/corrections submissions"
  on public.lesson_submissions for update
  using (auth.uid() = student_id and status in ('draft', 'graded_corrections'))
  with check (auth.uid() = student_id);

-- Supervisors can view and grade submissions from their students
create policy "Supervisors can view assigned student submissions"
  on public.lesson_submissions for select
  using (
    exists (
      select 1 from public.profiles
      where id = lesson_submissions.student_id
      and supervisor_id = auth.uid()
    )
  );

create policy "Supervisors can grade submissions"
  on public.lesson_submissions for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('supervisor', 'admin')
    )
  );

-- Admins can do everything
create policy "Admins can manage all submissions"
  on public.lesson_submissions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create trigger lesson_submissions_updated_at
  before update on public.lesson_submissions
  for each row execute procedure public.update_updated_at();

-- Answers table
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.lesson_submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text not null default '',
  supervisor_feedback text,
  needs_correction boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(submission_id, question_id)
);

alter table public.answers enable row level security;

-- Students can manage own answers
create policy "Students can view own answers"
  on public.answers for select
  using (
    exists (
      select 1 from public.lesson_submissions
      where id = submission_id and student_id = auth.uid()
    )
  );

create policy "Students can insert own answers"
  on public.answers for insert
  with check (
    exists (
      select 1 from public.lesson_submissions
      where id = submission_id and student_id = auth.uid()
    )
  );

create policy "Students can update own answers"
  on public.answers for update
  using (
    exists (
      select 1 from public.lesson_submissions
      where id = submission_id and student_id = auth.uid()
      and status in ('draft', 'graded_corrections')
    )
  );

-- Supervisors can view and update answers for assigned students
create policy "Supervisors can view assigned student answers"
  on public.answers for select
  using (
    exists (
      select 1 from public.lesson_submissions ls
      join public.profiles p on p.id = ls.student_id
      where ls.id = submission_id
      and p.supervisor_id = auth.uid()
    )
  );

create policy "Supervisors can grade answers"
  on public.answers for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('supervisor', 'admin')
    )
  );

-- Admins full access
create policy "Admins can manage all answers"
  on public.answers for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create trigger answers_updated_at
  before update on public.answers
  for each row execute procedure public.update_updated_at();
