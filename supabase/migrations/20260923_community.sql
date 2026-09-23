-- Apply in the Supabase SQL editor before setting COMMUNITY_ENABLED=true.
-- The public Data API has no grants on these tables. Only the Netlify function
-- holds the service role key; Auth itself uses the public anon key.
create extension if not exists pgcrypto;

create table if not exists public.community_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  rules_version text not null,
  banned_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.community_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 30),
  kind text not null check (kind in ('post','review','proposal','trip','reply')),
  body text not null check (char_length(body) between 10 and 2000),
  title text,
  spot_id text,
  rating smallint,
  parent_id uuid references public.community_entries(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
  status text not null default 'pending' check (status in ('pending','approved','rejected','removed')),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  constraint community_review_fields check ((kind='review' and rating between 1 and 5 and spot_id is not null) or (kind<>'review' and rating is null)),
  constraint community_reply_parent check ((kind='reply' and parent_id is not null) or (kind<>'reply' and parent_id is null))
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.community_entries(id) on delete cascade,
  reason text not null check (reason in ('abuse','spam','danger','privacy','other')),
  details text not null default '' check (char_length(details)<=500),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  unique(reporter_id,entry_id)
);

create table if not exists public.community_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id<>blocked_id)
);

create table if not exists public.community_moderation_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  entry_id uuid references public.community_entries(id) on delete set null,
  action text not null check(action in ('approve','reject','hide')),
  created_at timestamptz not null default now()
);

create index if not exists community_entries_public_idx on public.community_entries(status,kind,published_at desc);
create index if not exists community_entries_author_idx on public.community_entries(author_id,created_at desc);
create index if not exists community_entries_spot_idx on public.community_entries(spot_id,status,published_at desc);
create index if not exists community_entries_parent_idx on public.community_entries(parent_id,status,published_at desc);
create index if not exists community_reports_queue_idx on public.community_reports(status,created_at);

alter table public.community_profiles enable row level security;
alter table public.community_entries enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_blocks enable row level security;
alter table public.community_moderation_events enable row level security;

-- Default deny for anon/authenticated even if a project has permissive defaults.
revoke all on public.community_profiles,public.community_entries,public.community_reports,public.community_blocks,public.community_moderation_events from anon,authenticated;
grant all on public.community_profiles,public.community_entries,public.community_reports,public.community_blocks,public.community_moderation_events to service_role;
