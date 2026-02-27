'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_ACTIVITIES, type Activity } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

function toActivity(row: Record<string, unknown>): Activity {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    city: String(r.city ?? ''),
    country: String(r.country ?? ''),
    flag: String(r.flag ?? ''),
    name: String(r.name ?? ''),
    date: String(r.date ?? ''),
    cost: Number(r.cost ?? 0),
    status: String(r.status ?? ''),
    link: String(r.link ?? ''),
    bookedBy: (r as { booked_by?: string }).booked_by != null
      ? String((r as { booked_by?: string }).booked_by)
      : null,
    individual: Boolean((r as { individual?: boolean }).individual ?? r.individual ?? false),
  };
}

async function fetchActivities(tripId: string): Promise<Activity[]> {
  if (!isSupabaseConfigured || !supabase) return SEED_ACTIVITIES;
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('trip_id', tripId)
    .order('date');
  if (error) throw error;
  return (data ?? []).map(toActivity);
}

export function useActivities(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `activities-${tripId}`,
    () => fetchActivities(tripId),
    { fallbackData: SEED_ACTIVITIES }
  );

  const activities = data ?? SEED_ACTIVITIES;

  const updateActivity = async (id: string, changes: Partial<Activity>) => {
    const updated = activities.map((a) => (a.id === id ? { ...a, ...changes } : a));
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      const activity = updated.find((a) => a.id === id);
      if (activity) {
        await supabase.from('activities').upsert({
          id: activity.id,
          trip_id: tripId,
          city: activity.city,
          country: activity.country,
          flag: activity.flag,
          name: activity.name,
          date: activity.date,
          cost: activity.cost,
          status: activity.status,
          link: activity.link,
          booked_by: activity.bookedBy,
          individual: activity.individual,
        });
      }
      mutate();
    }
  };

  const addActivity = async (partial: Partial<Activity>) => {
    const id = `a${Date.now()}`;
    const newActivity: Activity = {
      id,
      city: partial.city ?? '',
      country: partial.country ?? '',
      flag: partial.flag ?? '',
      name: partial.name ?? '',
      date: partial.date ?? '',
      cost: partial.cost ?? 0,
      status: partial.status ?? 'Considering',
      link: partial.link ?? '',
      bookedBy: partial.bookedBy ?? null,
      individual: partial.individual ?? false,
    };
    const updated = [...activities, newActivity];
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('activities').insert({
        id: newActivity.id,
        trip_id: tripId,
        city: newActivity.city,
        country: newActivity.country,
        flag: newActivity.flag,
        name: newActivity.name,
        date: newActivity.date,
        cost: newActivity.cost,
        status: newActivity.status,
        link: newActivity.link,
        booked_by: newActivity.bookedBy,
        individual: newActivity.individual,
      });
      mutate();
    }
  };

  const deleteActivity = async (id: string) => {
    const updated = activities.filter((a) => a.id !== id);
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('activities').delete().eq('id', id);
      mutate();
    }
  };

  return { activities, isLoading, error, updateActivity, addActivity, deleteActivity };
}
