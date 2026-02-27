'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_FLIGHTS, type Flight } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

function toFlight(row: Record<string, unknown>): Flight {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    from: String(r.from ?? ''),
    fromCode: String((r as { from_code?: string }).from_code ?? r.fromCode ?? ''),
    to: String(r.to ?? ''),
    toCode: String((r as { to_code?: string }).to_code ?? r.toCode ?? ''),
    fromFlag: String((r as { from_flag?: string }).from_flag ?? r.fromFlag ?? ''),
    toFlag: String((r as { to_flag?: string }).to_flag ?? r.toFlag ?? ''),
    date: String(r.date ?? ''),
    dep: String(r.dep ?? ''),
    arr: String(r.arr ?? ''),
    airline: String(r.airline ?? ''),
    status: String(r.status ?? ''),
    seats: (typeof r.seats === 'object' && r.seats !== null ? r.seats : {}) as Record<string, string>,
    cost: r.cost != null ? Number(r.cost) : null,
  };
}

function flightToRow(f: Flight, tripId: string) {
  return {
    id: f.id,
    trip_id: tripId,
    from: f.from,
    from_code: f.fromCode,
    to: f.to,
    to_code: f.toCode,
    from_flag: f.fromFlag,
    to_flag: f.toFlag,
    date: f.date,
    dep: f.dep,
    arr: f.arr,
    airline: f.airline,
    status: f.status,
    seats: f.seats,
    cost: f.cost,
  };
}

async function fetchFlights(tripId: string): Promise<Flight[]> {
  if (!isSupabaseConfigured || !supabase) return SEED_FLIGHTS;
  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('trip_id', tripId)
    .order('date');
  if (error) throw error;
  return (data ?? []).map(toFlight);
}

export function useFlights(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `flights-${tripId}`,
    () => fetchFlights(tripId),
    { fallbackData: SEED_FLIGHTS }
  );

  const flights = data ?? SEED_FLIGHTS;

  const updateFlights = async (updated: Flight[]) => {
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      for (const f of updated) {
        await supabase.from('flights').upsert(flightToRow(f, tripId));
      }
      mutate();
    }
  };

  const addFlight = async (partial: Partial<Flight>) => {
    const id = `fl-${Date.now()}`;
    const newFlight: Flight = {
      id,
      from: partial.from ?? '',
      fromCode: partial.fromCode ?? '',
      to: partial.to ?? '',
      toCode: partial.toCode ?? '',
      fromFlag: partial.fromFlag ?? '',
      toFlag: partial.toFlag ?? '',
      date: partial.date ?? '',
      dep: partial.dep ?? '',
      arr: partial.arr ?? '',
      airline: partial.airline ?? '',
      status: partial.status ?? 'Need to Book',
      seats: partial.seats ?? {},
      cost: partial.cost ?? null,
    };
    const updated = [...flights, newFlight];
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('flights').insert(flightToRow(newFlight, tripId));
      mutate();
    }
  };

  const updateFlight = async (id: string, changes: Partial<Flight>) => {
    const updated = flights.map((f) => (f.id === id ? { ...f, ...changes } : f));
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      const flight = updated.find((f) => f.id === id);
      if (flight) {
        await supabase.from('flights').upsert(flightToRow(flight, tripId));
      }
      mutate();
    }
  };

  const deleteFlight = async (id: string) => {
    const updated = flights.filter((f) => f.id !== id);
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('flights').delete().eq('id', id);
      mutate();
    }
  };

  return { flights, isLoading, error, updateFlights, addFlight, updateFlight, deleteFlight };
}
