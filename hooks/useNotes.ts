'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_NOTES, type Note } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

function toNote(row: Record<string, unknown>): Note {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    type: String(r.type ?? ''),
    icon: String(r.icon ?? ''),
    author: String(r.author ?? ''),
    content: String(r.content ?? ''),
  };
}

async function fetchNotes(tripId: string): Promise<Note[]> {
  if (!isSupabaseConfigured) return SEED_NOTES;
  if (!supabase) return SEED_NOTES;
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toNote);
}

export function useNotes(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `notes-${tripId}`,
    () => fetchNotes(tripId),
    { fallbackData: SEED_NOTES }
  );

  const notes = data ?? SEED_NOTES;

  const addNote = async (note: Omit<Note, 'id'>) => {
    const id = `n${Date.now()}`;
    const newNote: Note = { ...note, id };
    const updated = [...notes, newNote];
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('notes').insert({
        id: newNote.id,
        trip_id: tripId,
        type: newNote.type,
        icon: newNote.icon,
        author: newNote.author,
        content: newNote.content,
      });
      mutate();
    }
  };

  const editNote = async (id: string, content: string) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, content } : n));
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('notes').update({ content }).eq('id', id).eq('trip_id', tripId);
      mutate();
    }
  };

  const deleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('notes').delete().eq('id', id).eq('trip_id', tripId);
      mutate();
    }
  };

  return { notes, isLoading, error, addNote, editNote, deleteNote };
}
