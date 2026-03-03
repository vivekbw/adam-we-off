'use client';

import { useRef, useEffect } from 'react';
import type { Expense } from '@/lib/constants';
import type { BuddyRow } from './useBuddies';

/**
 * Keeps expense splits in sync with the active traveler list.
 *
 * When the buddy list changes (add/remove), every expense whose split
 * previously included ALL known buddies ("group expense") is updated
 * so its split matches the new full buddy list. Removed buddies are
 * also cleaned out of non-group splits and reassigned as payer when
 * necessary.
 */
export function useExpenseBuddySync(
  buddies: BuddyRow[],
  expenses: Expense[],
  updateExpenses: (updated: Expense[]) => void
) {
  const prevBuddyKeyRef = useRef<string | null>(null);
  const prevBuddyNamesRef = useRef<string[]>([]);
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;
  const updateRef = useRef(updateExpenses);
  updateRef.current = updateExpenses;

  const buddyNames = buddies.map((b) => b.name);
  const buddyKey = buddyNames.join('\0');

  useEffect(() => {
    const prevKey = prevBuddyKeyRef.current;
    const prevNames = prevBuddyNamesRef.current;

    // First render — just store the initial state, don't sync yet
    if (prevKey === null) {
      prevBuddyKeyRef.current = buddyKey;
      prevBuddyNamesRef.current = buddyNames;
      return;
    }

    // No change in buddy list
    if (prevKey === buddyKey) return;

    const currentExpenses = expensesRef.current;
    prevBuddyKeyRef.current = buddyKey;
    prevBuddyNamesRef.current = buddyNames;

    if (buddyNames.length === 0 || currentExpenses.length === 0) return;

    const removedNames = new Set(prevNames.filter((n) => !buddyNames.includes(n)));

    const updated = currentExpenses.map((e) => {
      const wasGroupExpense =
        prevNames.length > 0 && prevNames.every((n) => e.split.includes(n));

      let newSplit: string[];
      if (wasGroupExpense) {
        newSplit = [...buddyNames];
      } else {
        newSplit = e.split.filter((s) => !removedNames.has(s));
      }

      let newPaidBy = e.paidBy;
      if (removedNames.has(newPaidBy)) {
        newPaidBy = buddyNames[0];
      }

      const splitChanged =
        newSplit.length !== e.split.length || newSplit.some((s, i) => s !== e.split[i]);
      const paidByChanged = newPaidBy !== e.paidBy;

      if (!splitChanged && !paidByChanged) return e;
      return { ...e, split: newSplit, paidBy: newPaidBy };
    });

    const hasChanges = updated.some((e, i) => e !== currentExpenses[i]);
    if (hasChanges) {
      updateRef.current(updated);
    }
  }, [buddyKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
