'use client';

import type { Expense } from '@/lib/constants';
import type { BuddyRow } from '@/hooks/useBuddies';
import { Modal } from '@/components/layout/Modal';
import { ExpenseList } from './ExpenseList';
import { BalanceCard } from './BalanceCard';
import styles from './SplitModal.module.css';

export interface SplitModalProps {
  expenses: Expense[];
  onUpdateExpenses: (expenses: Expense[]) => void;
  isOpen: boolean;
  onClose: () => void;
  buddies?: BuddyRow[];
}

export function SplitModal({
  expenses,
  onUpdateExpenses,
  isOpen,
  onClose,
  buddies = [],
}: SplitModalProps) {
  const buddyNames = buddies.map((b) => b.name);

  const handleEdit = (id: string, data: Expense) => {
    onUpdateExpenses(
      expenses.map((e) => (e.id === id ? data : e))
    );
  };

  const handleDelete = (id: string) => {
    onUpdateExpenses(expenses.filter((e) => e.id !== id));
  };

  const handleAdd = (expense: Omit<Expense, 'id'>) => {
    const id = `e${Date.now()}`;
    onUpdateExpenses([...expenses, { ...expense, id }]);
  };

  return (
    <Modal title="Split Expenses" isOpen={isOpen} onClose={onClose} wide>
      <div className={styles.layout}>
        <div className={styles.left}>
          <ExpenseList
            expenses={expenses}
            buddyNames={buddyNames}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        </div>
        <div className={styles.right}>
          <BalanceCard expenses={expenses} buddies={buddies} />
        </div>
      </div>
    </Modal>
  );
}
