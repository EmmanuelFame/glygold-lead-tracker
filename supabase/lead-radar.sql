create extension if not exists pgcrypto;

create table if not exists public.lead_candidates (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'google_places',
  source_id text not null,
  business_name text not null,
  category text,
  phone text,
  website_url text,
  maps_url text,
  address text,
  rating numeric,
  review_count integer default 0,
  types text[] default '{}',
  score integer default 0,
  score_reasons text[] default '{}',
  search_query text,
  search_location text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'promoted', 'rejected')),
  raw jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  promoted_at timestamptz,
  unique (source, source_id)
);

create table if not exists public.lead_search_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'google_places',
  search_terms text[] not null default '{}',
  search_location text not null,
  batch_size integer not null default 50,
  inserted_count integer not null default 0,
  duplicate_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lead_candidates_status_score_idx
  on public.lead_candidates (status, score desc, created_at desc);

create index if not exists lead_candidates_search_idx
  on public.lead_candidates (search_location, search_query);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lead_candidates_set_updated_at on public.lead_candidates;

create trigger lead_candidates_set_updated_at
before update on public.lead_candidates
for each row
execute function public.set_updated_at();

alter table public.lead_candidates enable row level security;
alter table public.lead_search_runs enable row level security;

drop policy if exists "Lead candidates readable" on public.lead_candidates;
drop policy if exists "Lead candidates editable" on public.lead_candidates;
drop policy if exists "Lead search runs readable" on public.lead_search_runs;

create policy "Lead candidates readable"
on public.lead_candidates
for select
to anon, authenticated
using (true);

create policy "Lead candidates editable"
on public.lead_candidates
for update
to anon, authenticated
using (true)
with check (true);

create policy "Lead search runs readable"
on public.lead_search_runs
for select
to anon, authenticated
using (true);
