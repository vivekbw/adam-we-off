-- We Off — Supabase Schema
-- Run this in Supabase SQL Editor to set up the database

-- Trips
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  cover_city text,
  owner_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Itinerary segments
create table if not exists itinerary_segments (
  id text primary key,
  trip_id uuid references trips(id) on delete cascade,
  country text not null,
  city text not null,
  start_date date not null,
  end_date date not null,
  flag text,
  nights integer not null,
  country_code text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Flights
create table if not exists flights (
  id text primary key,
  trip_id uuid references trips(id) on delete cascade,
  "from" text not null,
  from_code text not null,
  "to" text not null,
  to_code text not null,
  from_flag text,
  to_flag text,
  date date not null,
  dep text,
  arr text,
  airline text,
  status text default 'Need to Book',
  seats jsonb default '{}',
  cost numeric,
  created_at timestamptz default now()
);

-- Stays
create table if not exists stays (
  id text primary key,
  trip_id uuid references trips(id) on delete cascade,
  city text not null,
  country text not null,
  flag text,
  check_in date not null,
  check_out date not null,
  name text not null,
  type text,
  status text default 'Need to Book',
  booked_by text,
  cost_per_night numeric,
  nights integer not null,
  link text,
  confirmation_link text,
  created_at timestamptz default now()
);

-- Activities
create table if not exists activities (
  id text primary key,
  trip_id uuid references trips(id) on delete cascade,
  city text not null,
  country text not null,
  flag text,
  name text not null,
  date date,
  cost numeric,
  status text default 'Considering',
  link text,
  booked_by text,
  individual boolean default false,
  created_at timestamptz default now()
);

-- Notes
create table if not exists notes (
  id text primary key,
  trip_id uuid references trips(id) on delete cascade,
  type text not null,
  icon text,
  author text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Expenses
create table if not exists expenses (
  id text primary key,
  trip_id uuid references trips(id) on delete cascade,
  description text not null,
  amount numeric not null,
  currency text default 'CAD',
  paid_by text not null,
  split text[] not null,
  date date,
  category text,
  created_at timestamptz default now()
);

-- Buddies (trip travelers)
create table if not exists buddies (
  id serial primary key,
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  email text,
  avatar text,
  color text,
  role text default 'editor',
  status text default 'active'
);

-- Row Level Security (enable on all tables)
alter table trips enable row level security;
alter table itinerary_segments enable row level security;
alter table flights enable row level security;
alter table stays enable row level security;
alter table activities enable row level security;
alter table notes enable row level security;
alter table expenses enable row level security;
alter table buddies enable row level security;

-- For now, allow all access (tighten with auth later)
-- using (true) = read access, with check (true) = write access
create policy "Allow all" on trips for all using (true) with check (true);
create policy "Allow all" on itinerary_segments for all using (true) with check (true);
create policy "Allow all" on flights for all using (true) with check (true);
create policy "Allow all" on stays for all using (true) with check (true);
create policy "Allow all" on activities for all using (true) with check (true);
create policy "Allow all" on notes for all using (true) with check (true);
create policy "Allow all" on expenses for all using (true) with check (true);
create policy "Allow all" on buddies for all using (true) with check (true);

-- Indexes
create index if not exists idx_itinerary_trip on itinerary_segments(trip_id);
create index if not exists idx_flights_trip on flights(trip_id);
create index if not exists idx_stays_trip on stays(trip_id);
create index if not exists idx_activities_trip on activities(trip_id);
create index if not exists idx_notes_trip on notes(trip_id);
create index if not exists idx_expenses_trip on expenses(trip_id);
create index if not exists idx_buddies_trip on buddies(trip_id);
