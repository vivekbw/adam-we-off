'use client';

import { useEffect, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_TRIP, SEED_TRIP_ID } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const LOCAL_TRIPS_STORAGE_KEY = 'weoff-local-trips';

export interface TripRow {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  cover_city: string | null;
  created_at: string;
}

function isLocalDev() {
  return process.env.NODE_ENV !== 'production';
}

function readLocalTrips(): TripRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_TRIPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as TripRow[] : [];
  } catch {
    return [];
  }
}

function writeLocalTrips(trips: TripRow[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_TRIPS_STORAGE_KEY, JSON.stringify(trips));
}

function fallbackTrips(): TripRow[] {
  const localTrips = readLocalTrips();
  if (!isLocalDev()) return localTrips;
  const hasSeedTrip = localTrips.some((trip) => trip.id === SEED_TRIP_ID);
  return hasSeedTrip ? localTrips : [SEED_TRIP as TripRow, ...localTrips];
}

function fallbackTrip(id: string): TripRow | null {
  return fallbackTrips().find((trip) => trip.id === id) ?? null;
}

function createLocalTripRow(input: CreateTripInput): TripRow {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `trip-${Date.now()}`;
  return {
    id,
    name: input.name,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    cover_city: input.cover_city ?? null,
    created_at: new Date().toISOString(),
  };
}

async function fetchTrips(): Promise<TripRow[]> {
  if (!isSupabaseConfigured || !supabase) return fallbackTrips();
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return fallbackTrips();
  const rows = (data ?? []) as TripRow[];
  return rows.length > 0 ? rows : fallbackTrips();
}

async function fetchTrip(id: string): Promise<TripRow | null> {
  if (!isSupabaseConfigured || !supabase) return fallbackTrip(id);
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return fallbackTrip(id);
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
    const localTrip = createLocalTripRow(input);
    const updated = [localTrip, ...fallbackTrips().filter((trip) => trip.id !== SEED_TRIP_ID)];
    writeLocalTrips(updated);
    globalMutate('trips');
    globalMutate(`trip-${localTrip.id}`);
    return localTrip.id;
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
    const localTrip = createLocalTripRow(input);
    const updated = [localTrip, ...fallbackTrips().filter((trip) => trip.id !== SEED_TRIP_ID)];
    writeLocalTrips(updated);
    globalMutate('trips');
    globalMutate(`trip-${localTrip.id}`);
    return localTrip.id;
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
  if (!isSupabaseConfigured || !supabase) {
    const updated = fallbackTrips().map((trip) => (
      trip.id === id ? { ...trip, ...fields } : trip
    ));
    writeLocalTrips(updated.filter((trip) => trip.id !== SEED_TRIP_ID || id === SEED_TRIP_ID));
    globalMutate(`trip-${id}`);
    globalMutate('trips');
    return true;
  }
  const { error } = await supabase.from('trips').update(fields).eq('id', id);
  if (error) {
    const updated = fallbackTrips().map((trip) => (
      trip.id === id ? { ...trip, ...fields } : trip
    ));
    writeLocalTrips(updated.filter((trip) => trip.id !== SEED_TRIP_ID || id === SEED_TRIP_ID));
    globalMutate(`trip-${id}`);
    globalMutate('trips');
    return true;
  }
  globalMutate(`trip-${id}`);
  globalMutate('trips');
  return true;
}

export async function deleteTrip(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    const updated = readLocalTrips().filter((trip) => trip.id !== id);
    writeLocalTrips(updated);
    globalMutate('trips');
    return true;
  }
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) {
    const updated = readLocalTrips().filter((trip) => trip.id !== id);
    writeLocalTrips(updated);
    globalMutate('trips');
    return true;
  }
  globalMutate('trips');
  return true;
}

export function useTrips() {
  const { data, error, isLoading, mutate } = useSWR('trips', fetchTrips, {
    fallbackData: fallbackTrips(),
  });
  const [hydratedFallback, setHydratedFallback] = useState<TripRow[]>(() => fallbackTrips());

  useEffect(() => {
    const nextFallback = fallbackTrips();
    setHydratedFallback(nextFallback);
    if ((!data || data.length === 0) && nextFallback.length > 0) {
      mutate(nextFallback, false);
    }
  }, [data, mutate]);

  const trips = data && data.length > 0
    ? data
    : hydratedFallback.length > 0
      ? hydratedFallback
      : fallbackTrips();

  return { trips, isLoading, error, mutate };
}

export function useTripDetail(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `trip-${id}` : null,
    () => fetchTrip(id),
    { fallbackData: fallbackTrip(id) },
  );
  const [hydratedFallback, setHydratedFallback] = useState<TripRow | null>(() => fallbackTrip(id));

  useEffect(() => {
    const nextFallback = fallbackTrip(id);
    setHydratedFallback(nextFallback);
    if (!data && nextFallback) {
      mutate(nextFallback, false);
    }
  }, [data, id, mutate]);

  return { trip: data ?? hydratedFallback ?? fallbackTrip(id), isLoading, error, mutate };
}
