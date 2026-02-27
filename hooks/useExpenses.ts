'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { SEED_EXPENSES, type Expense } from '@/lib/constants';

const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

function toExpense(row: Record<string, unknown>): Expense {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    description: String(r.description ?? ''),
    amount: Number(r.amount ?? 0),
    currency: String(r.currency ?? 'CAD'),
    paidBy: String((r as { paid_by?: string }).paid_by ?? r.paidBy ?? ''),
    split: Array.isArray(r.split) ? (r.split as string[]) : [],
    date: String(r.date ?? ''),
    category: String(r.category ?? ''),
  };
}

async function fetchExpenses(tripId: string): Promise<Expense[]> {
  if (!isSupabaseConfigured) return SEED_EXPENSES;
  if (!supabase) return SEED_EXPENSES;
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .order('date');
  if (error) throw error;
  return (data ?? []).map(toExpense);
}

export function useExpenses(tripId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `expenses-${tripId}`,
    () => fetchExpenses(tripId),
    { fallbackData: SEED_EXPENSES }
  );

  const expenses = data ?? SEED_EXPENSES;

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const id = `e${Date.now()}`;
    const newExpense: Expense = { ...expense, id };
    const updated = [...expenses, newExpense];
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('expenses').insert({
        id: newExpense.id,
        trip_id: tripId,
        description: newExpense.description,
        amount: newExpense.amount,
        currency: newExpense.currency,
        paid_by: newExpense.paidBy,
        split: newExpense.split,
        date: newExpense.date,
        category: newExpense.category,
      });
      mutate();
    }
  };

  const editExpense = async (id: string, changes: Partial<Expense>) => {
    const updated = expenses.map((e) => (e.id === id ? { ...e, ...changes } : e));
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      const expense = updated.find((e) => e.id === id);
      if (expense) {
        await supabase.from('expenses').upsert({
          id: expense.id,
          trip_id: tripId,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          paid_by: expense.paidBy,
          split: expense.split,
          date: expense.date,
          category: expense.category,
        });
      }
      mutate();
    }
  };

  const deleteExpense = async (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('expenses').delete().eq('id', id).eq('trip_id', tripId);
      mutate();
    }
  };

  const updateExpenses = async (updated: Expense[]) => {
    mutate(updated, false);
    if (isSupabaseConfigured && supabase) {
      for (const e of updated) {
        await supabase.from('expenses').upsert({
          id: e.id,
          trip_id: tripId,
          description: e.description,
          amount: e.amount,
          currency: e.currency,
          paid_by: e.paidBy,
          split: e.split,
          date: e.date,
          category: e.category,
        });
      }
      mutate();
    }
  };

  return { expenses, isLoading, error, addExpense, editExpense, deleteExpense, updateExpenses };
}
