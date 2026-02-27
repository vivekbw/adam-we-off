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

function stayToRow(s: Stay, tripId: string) {
  return {
    id: s.id,
    trip_id: tripId,
    city: s.city,
    country: s.country,
    flag: s.flag,
    check_in: s.checkIn,
    check_out: s.checkOut,
    name: s.name,
    type: s.type,
    status: s.status,
    booked_by: s.bookedBy,
    cost_per_night: s.costPerNight,
    nights: s.nights,
    link: s.link,
    confirmation_link: s.confirmationLink,
  };
}

async function fetchStays(tripId: string): Promise<Stay[]> {
  if (!isSupabaseConfigured || !supabase) return SEED_STAYS;
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
        await supabase.from('stays').upsert(stayToRow(stay, tripId));
      }
      mutate();
    }
  };

  const addStay = async (partial: Partial<Stay>) => {
    const id = `st-${Date.now()}`;
    const newStay: Stay = {
      id,
      city: partial.city ?? '',
      country: partial.country ?? '',
      flag: partial.flag ?? '',
      checkIn: partial.checkIn ?? '',
      checkOut: partial.checkOut ?? '',
      name: partial.name ?? '',
      type: partial.type ?? 'Hotel',
      status: partial.status ?? 'Need to Book',
      bookedBy: partial.bookedBy ?? null,
      costPerNight: partial.costPerNight ?? 0,
      nights: partial.nights ?? 1,
      link: partial.link ?? null,
      confirmationLink: partial.confirmationLink ?? null,
    };
    const updated = [...stays, newStay];
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('stays').insert(stayToRow(newStay, tripId));
      mutate();
    }
  };

  const deleteStay = async (id: string) => {
    const updated = stays.filter((s) => s.id !== id);
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('stays').delete().eq('id', id);
      mutate();
    }
  };

  return { stays, isLoading, error, updateStay, addStay, deleteStay };
}
