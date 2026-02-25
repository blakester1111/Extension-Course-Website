-- Honor roll streaks table
create table public.honor_roll_streaks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade unique,
  current_streak_weeks integer not null default 0,
  longest_streak_weeks integer not null default 0,
  total_lessons_submitted integer not null default 0,
  last_submission_week text, -- ISO week format: '2024-W03'
  updated_at timestamptz not null default now()
);

alter table public.honor_roll_streaks enable row level security;

-- Anyone can view honor roll (it's public)
create policy "Anyone can view honor roll"
  on public.honor_roll_streaks for select
  using (true);

-- Service role manages streaks
create policy "Server can manage streaks"
  on public.honor_roll_streaks for all
  using (true);

create trigger honor_roll_streaks_updated_at
  before update on public.honor_roll_streaks
  for each row execute procedure public.update_updated_at();

-- Function to update streak when a lesson is graded as passed
create or replace function public.update_honor_roll_on_pass()
returns trigger
language plpgsql
security definer
as $$
declare
  current_week text;
  existing_record record;
begin
  -- Only trigger when status changes to graded_pass
  if NEW.status != 'graded_pass' or (OLD.status = 'graded_pass') then
    return NEW;
  end if;

  current_week := to_char(now(), 'IYYY-"W"IW');

  select * into existing_record
  from public.honor_roll_streaks
  where student_id = NEW.student_id;

  if not found then
    insert into public.honor_roll_streaks (student_id, current_streak_weeks, longest_streak_weeks, total_lessons_submitted, last_submission_week)
    values (NEW.student_id, 1, 1, 1, current_week);
  else
    -- If same week, just increment total
    if existing_record.last_submission_week = current_week then
      update public.honor_roll_streaks
      set total_lessons_submitted = existing_record.total_lessons_submitted + 1
      where student_id = NEW.student_id;
    else
      -- New week submission
      update public.honor_roll_streaks
      set
        current_streak_weeks = existing_record.current_streak_weeks + 1,
        longest_streak_weeks = greatest(existing_record.longest_streak_weeks, existing_record.current_streak_weeks + 1),
        total_lessons_submitted = existing_record.total_lessons_submitted + 1,
        last_submission_week = current_week
      where student_id = NEW.student_id;
    end if;
  end if;

  return NEW;
end;
$$;

create trigger honor_roll_update_on_pass
  after update on public.lesson_submissions
  for each row execute procedure public.update_honor_roll_on_pass();
