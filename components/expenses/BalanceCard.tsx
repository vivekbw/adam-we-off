'use client';

import type { Expense } from '@/lib/constants';
import type { BuddyRow } from '@/hooks/useBuddies';
import styles from './BalanceCard.module.css';

export interface BalanceCardProps {
  expenses: Expense[];
  buddies?: BuddyRow[];
}

export function BalanceCard({ expenses, buddies = [] }: BalanceCardProps) {
  const buddyMap = new Map(buddies.map((b) => [b.name, b]));

  const balances = new Map<string, number>();
  for (const b of buddies) {
    balances.set(b.name, 0);
  }

  for (const exp of expenses) {
    const paidBy = exp.paidBy;
    const paid = exp.amount;
    const splitCount = exp.split.length;
    const perPerson = splitCount > 0 ? paid / splitCount : 0;

    if (balances.has(paidBy)) {
      balances.set(paidBy, (balances.get(paidBy) ?? 0) + paid);
    } else {
      balances.set(paidBy, paid);
    }

    for (const name of exp.split) {
      if (balances.has(name)) {
        balances.set(name, (balances.get(name) ?? 0) - perPerson);
      } else {
        balances.set(name, -perPerson);
      }
    }
  }

  const totalTracked = expenses.reduce((s, e) => s + e.amount, 0);
  const peopleWithBalance = Array.from(balances.entries()).filter(([, v]) => Math.abs(v) > 0.01);
  const avgPerPerson = peopleWithBalance.length > 0 ? totalTracked / peopleWithBalance.length : 0;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Balances</h3>
      <div className={styles.balanceList}>
        {Array.from(balances.entries()).map(([name, amount]) => {
          const buddy = buddyMap.get(name);
          const avatarColor = buddy?.color ?? '#6B7280';
          const avatarLetter = buddy?.avatar ?? name[0];
          const rounded = Math.round(amount * 100) / 100;
          const rowClass =
            rounded > 0
              ? styles.balanceRowPositive
              : rounded < 0
                ? styles.balanceRowNegative
                : styles.balanceRowZero;
          return (
            <div key={name} className={`${styles.balanceRow} ${rowClass}`}>
              <div className={styles.personInfo}>
                <div
                  className={styles.avatar}
                  style={{ backgroundColor: avatarColor }}
                >
                  {avatarLetter}
                </div>
                <span className={styles.personName}>{name}</span>
              </div>
              <span className={styles.amount}>
                {rounded >= 0 ? '+' : ''}CAD {rounded.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
      {buddies.length === 0 && (
        <p className={styles.emptyHint}>Add travelers to see balances</p>
      )}
      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Total tracked</span>
          <span>CAD {totalTracked.toFixed(2)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Avg per person</span>
          <span>CAD {avgPerPerson.toFixed(2)}</span>
        </div>
      </div>
      <button type="button" className={styles.uploadBtn}>
        Upload Receipt
      </button>
    </div>
  );
}
