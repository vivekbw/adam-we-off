'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_STAYS, type Stay } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

function toStay(row: Record<string, unknown>): Stay {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    city: String(r.city ?? ''),
    country: String(r.country ?? ''),
    flag: String(r.flag ?? ''),
    checkIn: String((r as { check_in?: string }).check_in ?? r.checkIn ?? ''),
    checkOut: String((r as { check_out?: string }).check_out ?? r.checkOut ?? ''),
    name: String(r.name ?? ''),
    type: String(r.type ?? ''),
    status: String(r.status ?? ''),
    bookedBy: r.booked_by != null ? String((r as { booked_by?: string }).booked_by ?? r.bookedBy) : null,
    costPerNight: Number((r as { cost_per_night?: number }).cost_per_night ?? r.costPerNight ?? 0),
    nights: Number(r.nights ?? 0),
    link: r.link != null ? String(r.link) : null,
    confirmationLink: (r as { confirmation_link?: string }).confirmation_link != null
      ? String((r as { confirmation_link?: string }).confirmation_link)
      : null,
  };
}

async function fetchStays(tripId: string): Promise<Stay[]> {
  if (!isSupabaseConfigured) return SEED_STAYS;
  if (!supabase) return SEED_STAYS;
  const { data, error } = await supabase
    .from('stays')
    .select('*')
    .eq('trip_id', tripId)
    .order('check_in');
  if (error) throw error;
  return (data ?? []).map(toStay);
}

export function useStays(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `stays-${tripId}`,
    () => fetchStays(tripId),
    { fallbackData: SEED_STAYS }
  );

  const stays = data ?? SEED_STAYS;

  const updateStay = async (id: string, changes: Partial<Stay>) => {
    const updated = stays.map((s) => (s.id === id ? { ...s, ...changes } : s));
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      const stay = updated.find((s) => s.id === id);
      if (stay) {
        await supabase.from('stays').upsert({
          id: stay.id,
          trip_id: tripId,
          city: stay.city,
          country: stay.country,
          flag: stay.flag,
          check_in: stay.checkIn,
          check_out: stay.checkOut,
          name: stay.name,
          type: stay.type,
          status: stay.status,
          booked_by: stay.bookedBy,
          cost_per_night: stay.costPerNight,
          nights: stay.nights,
          link: stay.link,
          confirmation_link: stay.confirmationLink,
        });
      }
      mutate();
    }
  };

  return { stays, isLoading, error, updateStay };
}
