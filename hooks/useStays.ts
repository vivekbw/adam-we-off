'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_STAYS, SEED_TRIP_ID, type Stay } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

function seedStaysForTrip(tripId: string) {
  return tripId === SEED_TRIP_ID ? SEED_STAYS : [];
}

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

function sameImportedStay(a: Partial<Stay>, b: Stay) {
  return (
    (a.name ?? '').toLowerCase() === b.name.toLowerCase() ||
    (
      (a.city ?? '').toLowerCase() === b.city.toLowerCase() &&
      (a.checkIn ?? '') === b.checkIn &&
      (a.checkOut ?? '') === b.checkOut
    )
  );
}

function sortStays(list: Stay[]) {
  return [...list].sort((a, b) => {
    const left = new Date(`${a.checkIn || '9999-12-31'}T00:00:00`).getTime();
    const right = new Date(`${b.checkIn || '9999-12-31'}T00:00:00`).getTime();
    return left - right;
  });
}

async function fetchStays(tripId: string): Promise<Stay[]> {
  if (!isSupabaseConfigured || !supabase) return seedStaysForTrip(tripId);
  const { data, error } = await supabase
    .from('stays')
    .select('*')
    .eq('trip_id', tripId)
    .order('check_in');
  if (error) return seedStaysForTrip(tripId);
  return (data ?? []).map(toStay);
}

export function useStays(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `stays-${tripId}`,
    () => fetchStays(tripId),
    { fallbackData: seedStaysForTrip(tripId) }
  );

  const stays = data ?? seedStaysForTrip(tripId);

  const updateStay = async (id: string, changes: Partial<Stay>) => {
    const updated = sortStays(stays.map((s) => (s.id === id ? { ...s, ...changes } : s)));
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
    const updated = sortStays([...stays, newStay]);
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('stays').insert(stayToRow(newStay, tripId));
      mutate();
    }
  };

  const importStays = async (partials: Partial<Stay>[]) => {
    let updated = [...stays];
    const imported: Stay[] = [];

    for (let index = 0; index < partials.length; index += 1) {
      const partial = partials[index];
      const existingIndex = updated.findIndex((stay) => sameImportedStay(partial, stay));
      const existing = existingIndex >= 0 ? updated[existingIndex] : null;

      const merged: Stay = {
        id: existing?.id ?? `st-${Date.now()}-${index}`,
        city: partial.city ?? existing?.city ?? '',
        country: partial.country ?? existing?.country ?? '',
        flag: partial.flag ?? existing?.flag ?? '',
        checkIn: partial.checkIn ?? existing?.checkIn ?? '',
        checkOut: partial.checkOut ?? existing?.checkOut ?? '',
        name: partial.name ?? existing?.name ?? '',
        type: partial.type ?? existing?.type ?? 'Hotel',
        status: partial.status ?? existing?.status ?? 'Booked',
        bookedBy: partial.bookedBy ?? existing?.bookedBy ?? null,
        costPerNight: partial.costPerNight ?? existing?.costPerNight ?? 0,
        nights: partial.nights ?? existing?.nights ?? 1,
        link: partial.link ?? existing?.link ?? null,
        confirmationLink: partial.confirmationLink ?? existing?.confirmationLink ?? null,
      };

      if (existingIndex >= 0) {
        updated[existingIndex] = merged;
      } else {
        updated.push(merged);
      }

      imported.push(merged);
    }

    updated = sortStays(updated);

    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      for (const stay of imported) {
        await supabase.from('stays').upsert(stayToRow(stay, tripId));
      }
      mutate();
    }

    return imported;
  };

  const deleteStay = async (id: string) => {
    const updated = stays.filter((s) => s.id !== id);
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('stays').delete().eq('id', id);
      mutate();
    }
  };

  return { stays, isLoading, error, updateStay, addStay, deleteStay, importStays };
}
