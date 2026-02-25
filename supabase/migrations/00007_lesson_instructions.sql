-- Add instructions column to lessons table
alter table public.lessons add column instructions text not null default '';
