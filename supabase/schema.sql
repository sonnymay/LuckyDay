create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  birthday date not null,
  birth_time time,
  birthplace text,
  western_zodiac text not null,
  chinese_zodiac text not null,
  main_focus text[] not null check (main_focus <@ array['Money', 'Love', 'Work', 'Health', 'Luck']),
  notification_time time,
  face_image_path text,
  left_palm_image_path text,
  right_palm_image_path text,
  handwriting_image_path text,
  face_image_updated_at timestamptz,
  left_palm_image_updated_at timestamptz,
  right_palm_image_updated_at timestamptz,
  handwriting_image_updated_at timestamptz,
  media_consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_readings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  score integer not null check (score between 0 and 100),
  reading_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (profile_id, date)
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  rating text not null check (rating in ('Yes', 'Somewhat', 'No')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (profile_id, date)
);

create table if not exists public.daily_global_data (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  moon_phase text,
  thai_calendar_note text,
  chinese_calendar_note text,
  general_energy text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.daily_readings enable row level security;
alter table public.feedback enable row level security;
alter table public.daily_global_data enable row level security;
