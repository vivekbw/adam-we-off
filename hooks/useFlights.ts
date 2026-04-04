'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_FLIGHTS, SEED_TRIP_ID, type Flight } from '@/lib/constants';
import {
  mergeFlightSeatsPayload,
  splitFlightSeatsPayload,
} from '@/lib/flights/travelers';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

function seedFlightsForTrip(tripId: string) {
  return tripId === SEED_TRIP_ID ? SEED_FLIGHTS : [];
}

function toFlight(row: Record<string, unknown>): Flight {
  const r = row as Record<string, unknown>;
  const { seats, travelerStatuses } = splitFlightSeatsPayload(r.seats);
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
    seats,
    travelerStatuses,
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
    seats: mergeFlightSeatsPayload(f.seats, f.travelerStatuses),
    cost: f.cost,
  };
}

function sameImportedFlight(a: Partial<Flight>, b: Flight) {
  if (a.fromCode && a.toCode && b.fromCode && b.toCode) {
    return a.fromCode === b.fromCode && a.toCode === b.toCode;
  }

  return (
    (a.from ?? '').toLowerCase() === b.from.toLowerCase() &&
    (a.to ?? '').toLowerCase() === b.to.toLowerCase()
  );
}

function sortFlights(list: Flight[]) {
  return [...list].sort((a, b) => {
    const left = new Date(`${a.date || '9999-12-31'}T00:00:00`).getTime();
    const right = new Date(`${b.date || '9999-12-31'}T00:00:00`).getTime();
    return left - right;
  });
}

async function fetchFlights(tripId: string): Promise<Flight[]> {
  if (!isSupabaseConfigured || !supabase) return seedFlightsForTrip(tripId);
  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('trip_id', tripId)
    .order('date');
  if (error) return seedFlightsForTrip(tripId);
  return (data ?? []).map(toFlight);
}

export function useFlights(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `flights-${tripId}`,
    () => fetchFlights(tripId),
    { fallbackData: seedFlightsForTrip(tripId) }
  );

  const flights = data ?? seedFlightsForTrip(tripId);

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
      travelerStatuses: partial.travelerStatuses ?? {},
      cost: partial.cost ?? null,
    };
    const updated = sortFlights([...flights, newFlight]);
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('flights').insert(flightToRow(newFlight, tripId));
      mutate();
    }
  };

  const importFlights = async (partials: Partial<Flight>[]) => {
    let updated = [...flights];
    const imported: Flight[] = [];

    for (let index = 0; index < partials.length; index += 1) {
      const partial = partials[index];
      const existingIndex = updated.findIndex((flight) => sameImportedFlight(partial, flight));
      const existing = existingIndex >= 0 ? updated[existingIndex] : null;

      const merged: Flight = {
        id: existing?.id ?? `fl-${Date.now()}-${index}`,
        from: partial.from ?? existing?.from ?? '',
        fromCode: partial.fromCode ?? existing?.fromCode ?? '',
        to: partial.to ?? existing?.to ?? '',
        toCode: partial.toCode ?? existing?.toCode ?? '',
        fromFlag: partial.fromFlag ?? existing?.fromFlag ?? '',
        toFlag: partial.toFlag ?? existing?.toFlag ?? '',
        date: partial.date ?? existing?.date ?? '',
        dep: partial.dep ?? existing?.dep ?? '',
        arr: partial.arr ?? existing?.arr ?? '',
        airline: partial.airline ?? existing?.airline ?? '',
        status: partial.status ?? existing?.status ?? 'Booked',
        seats: partial.seats ?? existing?.seats ?? {},
        travelerStatuses: partial.travelerStatuses ?? existing?.travelerStatuses ?? {},
        cost: partial.cost ?? existing?.cost ?? null,
      };

      if (existingIndex >= 0) {
        updated[existingIndex] = merged;
      } else {
        updated.push(merged);
      }

      imported.push(merged);
    }

    updated = sortFlights(updated);

    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      for (const flight of imported) {
        await supabase.from('flights').upsert(flightToRow(flight, tripId));
      }
      mutate();
    }

    return imported;
  };

  const updateFlight = async (id: string, changes: Partial<Flight>) => {
    const updated = sortFlights(flights.map((f) => (f.id === id ? { ...f, ...changes } : f)));
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

  return { flights, isLoading, error, updateFlights, addFlight, updateFlight, deleteFlight, importFlights };
}
