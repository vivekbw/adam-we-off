'use client';

import useSWR from 'swr';
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

export function useTrips() {
  const { data, error, isLoading, mutate } = useSWR('trips', fetchTrips);
  return { trips: data ?? [], isLoading, error, mutate };
}

export function useTripDetail(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `trip-${id}` : null,
    () => fetchTrip(id),
  );
  return { trip: data ?? null, isLoading, error };
}
