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

async function fetchItinerary(tripId: string): Promise<ItinerarySegment[]> {
  if (!isSupabaseConfigured) return SEED_ITINERARY;
  if (!supabase) return SEED_ITINERARY;
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

  const updateItinerary = async (segments: ItinerarySegment[]) => {
    mutate(segments, false);
    if (isSupabaseConfigured && supabase) {
      for (const seg of segments) {
        await supabase.from('itinerary_segments').upsert({
          id: seg.id,
          trip_id: tripId,
          country: seg.country,
          city: seg.city,
          start_date: seg.startDate,
          end_date: seg.endDate,
          flag: seg.flag,
          nights: seg.nights,
          country_code: seg.countryCode,
        });
      }
      mutate();
    }
  };

  return { itinerary: data ?? SEED_ITINERARY, isLoading, error, updateItinerary };
}
