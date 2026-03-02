'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { supabase } from '@/lib/supabase/client';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

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

function pickColor(existing: BuddyRow[]): string {
  const used = new Set(existing.map((b) => b.color));
  return BUDDY_COLORS.find((c) => !used.has(c)) ?? BUDDY_COLORS[existing.length % BUDDY_COLORS.length];
}

async function fetchBuddies(tripId: string): Promise<BuddyRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('buddies')
    .select('*')
    .eq('trip_id', tripId)
    .order('id');
  if (error) throw error;
  return (data ?? []) as BuddyRow[];
}

export function useBuddies(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    tripId ? `buddies-${tripId}` : null,
    () => fetchBuddies(tripId),
  );

  const buddies = data ?? [];

  async function addBuddy(input: {
    name: string;
    email?: string;
    user_id?: string;
    role?: string;
    avatar?: string;
  }) {
    if (!isSupabaseConfigured || !supabase) return;
    const color = pickColor(buddies);
    const avatar = input.avatar ?? input.name.charAt(0).toUpperCase();
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
    if (!isSupabaseConfigured || !supabase) return;
    const updated = buddies.filter((b) => b.id !== buddyId);
    mutate(updated, false);
    await supabase.from('buddies').delete().eq('id', buddyId);
    mutate();
  }

  async function updateBuddy(buddyId: number, changes: Partial<BuddyRow>) {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('buddies').update(changes).eq('id', buddyId);
    mutate();
  }

  return { buddies, isLoading, error, addBuddy, removeBuddy, updateBuddy };
}
