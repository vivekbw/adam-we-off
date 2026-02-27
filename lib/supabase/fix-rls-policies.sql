-- Fix RLS policies: add `with check (true)` for insert/update/delete access
-- Run this in Supabase SQL Editor if create/update/delete operations are silently failing

-- Drop existing policies
drop policy if exists "Allow all" on trips;
drop policy if exists "Allow all" on itinerary_segments;
drop policy if exists "Allow all" on flights;
drop policy if exists "Allow all" on stays;
drop policy if exists "Allow all" on activities;
drop policy if exists "Allow all" on notes;
drop policy if exists "Allow all" on expenses;
drop policy if exists "Allow all" on buddies;

-- Recreate with proper write access
create policy "Allow all" on trips for all using (true) with check (true);
create policy "Allow all" on itinerary_segments for all using (true) with check (true);
create policy "Allow all" on flights for all using (true) with check (true);
create policy "Allow all" on stays for all using (true) with check (true);
create policy "Allow all" on activities for all using (true) with check (true);
create policy "Allow all" on notes for all using (true) with check (true);
create policy "Allow all" on expenses for all using (true) with check (true);
create policy "Allow all" on buddies for all using (true) with check (true);
