'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_ITINERARY, type ItinerarySegment } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

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
  if (!isSupabaseConfigured || !supabase) return SEED_ITINERARY;
  const { data, error } = await supabase
    .from('itinerary_segments')
    .select('*')
    .eq('trip_id', tripId)
    .order('start_date');
  if (error) throw error;
  return (data ?? []).map(toSegment);
}

export function useItinerary(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `itinerary-${tripId}`,
    () => fetchItinerary(tripId),
    { fallbackData: SEED_ITINERARY }
  );

  const itinerary = data ?? SEED_ITINERARY;

  const updateItinerary = async (segments: ItinerarySegment[]) => {
    mutate(segments, false);
    if (isSupabaseConfigured && supabase) {
      for (const seg of segments) {
        await supabase.from('itinerary_segments').upsert(segmentToRow(seg, tripId));
      }
      mutate();
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
    if (isSupabaseConfigured && supabase) {
      await supabase.from('itinerary_segments').insert(segmentToRow(newSeg, tripId));
      mutate();
    }
  };

  const removeSegment = async (segId: string) => {
    const updated = itinerary.filter((s) => s.id !== segId);
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('itinerary_segments').delete().eq('id', segId);
      mutate();
    }
  };

  return { itinerary, isLoading, error, updateItinerary, addSegment, removeSegment };
}
