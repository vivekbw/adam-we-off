-- Migration: Auth & Traveler Management
-- Run this in Supabase SQL Editor AFTER enabling Google OAuth in the dashboard

-- 1. Add owner_id to trips
alter table trips add column if not exists owner_id uuid references auth.users(id);

-- 2. Extend buddies table
alter table buddies add column if not exists user_id uuid references auth.users(id);
alter table buddies add column if not exists email text;
alter table buddies add column if not exists status text default 'active';

-- 3. Index for fast lookups
create index if not exists idx_buddies_user on buddies(user_id);
create index if not exists idx_buddies_email on buddies(email);
create index if not exists idx_trips_owner on trips(owner_id);

-- 4. Update RLS policies
-- Keep "allow all" for now during transition.
-- The existing policies already allow all access.
-- When ready to tighten, drop the "Allow all" policies and use these:
--
-- drop policy if exists "Allow all" on trips;
-- create policy "Owner or member can read trips" on trips for select
--   using (
--     owner_id = auth.uid()
--     or id in (select trip_id from buddies where user_id = auth.uid())
--     or owner_id is null  -- fallback for legacy trips without owner
--   );
-- create policy "Owner or member can modify trips" on trips for all
--   using (
--     owner_id = auth.uid()
--     or id in (select trip_id from buddies where user_id = auth.uid())
--     or owner_id is null
--   )
--   with check (
--     owner_id = auth.uid()
--     or id in (select trip_id from buddies where user_id = auth.uid())
--     or owner_id is null
--   );
