'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_BUDDIES, SEED_TRIP_ID } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const LOCAL_BUDDIES_STORAGE_PREFIX = 'weoff-local-buddies';

export interface BuddyRow {
  id: number;
  trip_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  avatar: string | null;
  color: string;
  role: string;
  status: string;
}

const BUDDY_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
];

function localBuddiesKey(tripId: string) {
  return `${LOCAL_BUDDIES_STORAGE_PREFIX}:${tripId}`;
}

function readLocalBuddies(tripId: string): BuddyRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(localBuddiesKey(tripId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as BuddyRow[] : [];
  } catch {
    return [];
  }
}

function writeLocalBuddies(tripId: string, buddies: BuddyRow[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(localBuddiesKey(tripId), JSON.stringify(buddies));
}

function seedBuddiesForTrip(tripId: string): BuddyRow[] {
  return tripId === SEED_TRIP_ID ? [...SEED_BUDDIES] as BuddyRow[] : [];
}

function fallbackBuddiesForTrip(tripId: string): BuddyRow[] {
  const local = readLocalBuddies(tripId);
  if (local.length > 0) return local;
  return seedBuddiesForTrip(tripId);
}

function pickColor(existing: BuddyRow[]): string {
  const used = new Set(existing.map((b) => b.color));
  return BUDDY_COLORS.find((c) => !used.has(c)) ?? BUDDY_COLORS[existing.length % BUDDY_COLORS.length];
}

async function fetchBuddies(tripId: string): Promise<BuddyRow[]> {
  if (!isSupabaseConfigured || !supabase) return fallbackBuddiesForTrip(tripId);
  const { data, error } = await supabase
    .from('buddies')
    .select('*')
    .eq('trip_id', tripId)
    .order('id');
  if (error) return fallbackBuddiesForTrip(tripId);
  return ((data ?? []) as BuddyRow[]).length > 0
    ? (data ?? []) as BuddyRow[]
    : fallbackBuddiesForTrip(tripId);
}

export function useBuddies(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    tripId ? `buddies-${tripId}` : null,
    () => fetchBuddies(tripId),
    { fallbackData: fallbackBuddiesForTrip(tripId) }
  );

  const buddies = data ?? fallbackBuddiesForTrip(tripId);

  async function addBuddy(input: {
    name: string;
    email?: string;
    user_id?: string;
    role?: string;
    avatar?: string;
  }) {
    const color = pickColor(buddies);
    const avatar = input.avatar ?? input.name.charAt(0).toUpperCase();
    if (!isSupabaseConfigured || !supabase) {
      const nextBuddy: BuddyRow = {
        id: Date.now(),
        trip_id: tripId,
        user_id: input.user_id ?? null,
        name: input.name,
        email: input.email ?? null,
        avatar,
        color,
        role: input.role ?? 'editor',
        status: input.email && !input.user_id ? 'invited' : 'active',
      };
      const updated = [...buddies, nextBuddy];
      writeLocalBuddies(tripId, updated);
      mutate(updated, false);
      globalMutate(`buddies-${tripId}`);
      return;
    }
    const { error } = await supabase.from('buddies').insert({
      trip_id: tripId,
      name: input.name,
      email: input.email ?? null,
      user_id: input.user_id ?? null,
      avatar,
      color,
      role: input.role ?? 'editor',
      status: input.email && !input.user_id ? 'invited' : 'active',
    });
    if (!error) {
      mutate();
      globalMutate(`buddies-${tripId}`);
    }
  }

  async function removeBuddy(buddyId: number) {
    const updated = buddies.filter((b) => b.id !== buddyId);
    mutate(updated, false);
    if (!isSupabaseConfigured || !supabase) {
      writeLocalBuddies(tripId, updated);
      return;
    }
    await supabase.from('buddies').delete().eq('id', buddyId);
    mutate();
  }

  async function updateBuddy(buddyId: number, changes: Partial<BuddyRow>) {
    if (!isSupabaseConfigured || !supabase) {
      const updated = buddies.map((buddy) => (
        buddy.id === buddyId ? { ...buddy, ...changes } : buddy
      ));
      writeLocalBuddies(tripId, updated);
      mutate(updated, false);
      return;
    }
    await supabase.from('buddies').update(changes).eq('id', buddyId);
    mutate();
  }

  return { buddies, isLoading, error, addBuddy, removeBuddy, updateBuddy };
}
