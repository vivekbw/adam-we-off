'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { mutate as globalMutate } from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_ITINERARY, SEED_TRIP_ID, type ItinerarySegment } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const LOCAL_ITINERARY_STORAGE_PREFIX = 'weoff-local-itinerary';

function seedItineraryForTrip(tripId: string) {
  return tripId === SEED_TRIP_ID ? SEED_ITINERARY : [];
}

function localItineraryKey(tripId: string) {
  return `${LOCAL_ITINERARY_STORAGE_PREFIX}:${tripId}`;
}

function readLocalItinerary(tripId: string): ItinerarySegment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(localItineraryKey(tripId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as ItinerarySegment[] : [];
  } catch {
    return [];
  }
}

function writeLocalItinerary(tripId: string, segments: ItinerarySegment[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(localItineraryKey(tripId), JSON.stringify(segments));
}

function fallbackItineraryForTrip(tripId: string) {
  const local = readLocalItinerary(tripId);
  if (local.length > 0) return local;
  return seedItineraryForTrip(tripId);
}

function syncDerivedTripState(tripId: string, segments: ItinerarySegment[]) {
  globalMutate(`cities-${tripId}`, segments.map((segment) => segment.city), false);
  globalMutate(`itinerary-${tripId}`, segments, false);
}

function toSegment(row: Record<string, unknown>): ItinerarySegment {
  return {
    id: String(row.id ?? ''),
    country: String(row.country ?? ''),
    city: String(row.city ?? ''),
    startDate: String((row as { start_date?: string }).start_date ?? row.startDate ?? ''),
    endDate: String((row as { end_date?: string }).end_date ?? row.endDate ?? ''),
    flag: String(row.flag ?? ''),
    nights: Number(row.nights ?? 0),
    countryCode: String((row as { country_code?: string }).country_code ?? row.countryCode ?? ''),
  };
}

function segmentToRow(seg: ItinerarySegment, tripId: string) {
  return {
    id: seg.id,
    trip_id: tripId,
    country: seg.country,
    city: seg.city,
    start_date: seg.startDate,
    end_date: seg.endDate,
    flag: seg.flag,
    nights: seg.nights,
    country_code: seg.countryCode,
  };
}

async function fetchItinerary(tripId: string): Promise<ItinerarySegment[]> {
  if (!isSupabaseConfigured || !supabase) return fallbackItineraryForTrip(tripId);
  const { data, error } = await supabase
    .from('itinerary_segments')
    .select('*')
    .eq('trip_id', tripId)
    .order('start_date');
  if (error) return fallbackItineraryForTrip(tripId);
  const rows = (data ?? []).map(toSegment);
  return rows.length > 0 ? rows : fallbackItineraryForTrip(tripId);
}

export function useItinerary(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `itinerary-${tripId}`,
    () => fetchItinerary(tripId),
    { fallbackData: fallbackItineraryForTrip(tripId) }
  );

  const [hydratedFallback, setHydratedFallback] = useState<ItinerarySegment[]>(() => fallbackItineraryForTrip(tripId));

  useEffect(() => {
    const nextFallback = fallbackItineraryForTrip(tripId);
    setHydratedFallback(nextFallback);
    if ((!data || data.length === 0) && nextFallback.length > 0) {
      mutate(nextFallback, false);
      syncDerivedTripState(tripId, nextFallback);
    }
  }, [data, mutate, tripId]);

  const itinerary = data && data.length > 0
    ? data
    : hydratedFallback.length > 0
      ? hydratedFallback
      : fallbackItineraryForTrip(tripId);

  const updateItinerary = async (segments: ItinerarySegment[]) => {
    mutate(segments, false);
    writeLocalItinerary(tripId, segments);
    syncDerivedTripState(tripId, segments);
    if (isSupabaseConfigured && supabase) {
      try {
        for (const seg of segments) {
          await supabase.from('itinerary_segments').upsert(segmentToRow(seg, tripId));
        }
        mutate();
      } catch {
        return;
      }
    }
  };

  const addSegment = async (partial: Partial<ItinerarySegment>) => {
    const id = `seg-${Date.now()}`;
    const lastSeg = itinerary[itinerary.length - 1];
    const startDate = lastSeg ? lastSeg.endDate : new Date().toISOString().split('T')[0];
    const nights = partial.nights ?? 2;
    const dt = new Date(startDate + 'T00:00:00');
    dt.setDate(dt.getDate() + nights);
    const endDate = dt.toISOString().split('T')[0];

    const newSeg: ItinerarySegment = {
      id,
      country: partial.country ?? '',
      city: partial.city ?? '',
      startDate,
      endDate,
      flag: partial.flag ?? '',
      nights,
      countryCode: partial.countryCode ?? '',
    };
    const updated = [...itinerary, newSeg];
    mutate(updated, false);
    writeLocalItinerary(tripId, updated);
    syncDerivedTripState(tripId, updated);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('itinerary_segments').insert(segmentToRow(newSeg, tripId));
        mutate();
      } catch {
        return;
      }
    }
  };

  const removeSegment = async (segId: string) => {
    const updated = itinerary.filter((s) => s.id !== segId);
    mutate(updated, false);
    writeLocalItinerary(tripId, updated);
    syncDerivedTripState(tripId, updated);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('itinerary_segments').delete().eq('id', segId);
        mutate();
      } catch {
        return;
      }
    }
  };

  return { itinerary, isLoading, error, updateItinerary, addSegment, removeSegment };
}

export function useTripCities(tripId: string) {
  const { data } = useSWR(
    tripId ? `cities-${tripId}` : null,
    async () => {
      const segments = await fetchItinerary(tripId);
      return segments.map((s) => s.city);
    },
  );
  return data ?? [];
}
