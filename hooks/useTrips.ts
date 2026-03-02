'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { supabase } from '@/lib/supabase/client';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export interface TripRow {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  cover_city: string | null;
  created_at: string;
}

async function fetchTrips(): Promise<TripRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TripRow[];
}

async function fetchTrip(id: string): Promise<TripRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as TripRow;
}

export interface CreateTripInput {
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  cover_city?: string | null;
}

export async function createTrip(input: CreateTripInput): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.error('[createTrip] Supabase not configured');
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('trips')
    .insert({
      name: input.name,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      cover_city: input.cover_city ?? null,
      owner_id: user?.id ?? null,
    })
    .select('id')
    .single();
  if (error) {
    console.error('[createTrip] Supabase error:', error.message, error.details, error.hint);
    return null;
  }

  const tripId = (data as { id: string }).id;

  if (user) {
    await supabase.from('buddies').insert({
      trip_id: tripId,
      user_id: user.id,
      name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Owner',
      email: user.email,
      avatar: (user.user_metadata?.full_name ?? user.email ?? '?')[0].toUpperCase(),
      color: '#3B82F6',
      role: 'owner',
      status: 'active',
    });
  }

  return tripId;
}

export async function updateTrip(
  id: string,
  fields: Partial<Omit<TripRow, 'id' | 'created_at'>>,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from('trips').update(fields).eq('id', id);
  if (error) return false;
  globalMutate(`trip-${id}`);
  globalMutate('trips');
  return true;
}

export async function deleteTrip(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) return false;
  globalMutate('trips');
  return true;
}

export function useTrips() {
  const { data, error, isLoading, mutate } = useSWR('trips', fetchTrips);
  return { trips: data ?? [], isLoading, error, mutate };
}

export function useTripDetail(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `trip-${id}` : null,
    () => fetchTrip(id),
  );
  return { trip: data ?? null, isLoading, error, mutate };
}
