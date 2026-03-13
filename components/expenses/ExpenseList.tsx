'use client';

import { useState, useEffect } from 'react';
import type { Expense } from '@/lib/constants';
import { fmtDate } from '@/lib/constants';
import styles from './ExpenseList.module.css';

const CATEGORIES = ['Stay', 'Flight', 'Activity', 'Food', 'Transport', 'Other'];

export interface ExpenseListProps {
  expenses: Expense[];
  buddyNames?: string[];
  onEdit: (id: string, data: Expense) => void;
  onDelete: (id: string) => void;
  onAdd: (expense: Omit<Expense, 'id'>) => void;
}

function perPersonSplit(amount: number, splitCount: number): number {
  if (splitCount <= 0) return 0;
  return Math.round((amount / splitCount) * 100) / 100;
}

export function ExpenseList({ expenses, buddyNames = [], onEdit, onDelete, onAdd }: ExpenseListProps) {
  const BUDDY_NAMES = buddyNames;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPaidBy, setEditPaidBy] = useState('');
  const [editSplit, setEditSplit] = useState<string[]>([]);
  const [editCategory, setEditCategory] = useState('');

  const [addDesc, setAddDesc] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addPaidBy, setAddPaidBy] = useState(BUDDY_NAMES[0] ?? '');
  const [addSplit, setAddSplit] = useState<string[]>(BUDDY_NAMES);
  const [addCategory, setAddCategory] = useState('Other');

  useEffect(() => {
    setAddPaidBy((prev) => (BUDDY_NAMES.includes(prev) ? prev : BUDDY_NAMES[0] ?? ''));
    setAddSplit(BUDDY_NAMES);
  }, [BUDDY_NAMES.join(',')]);

  const startEdit = (e: Expense) => {
    setEditingId(e.id);
    setEditDesc(e.description);
    setEditAmount(String(e.amount));
    setEditPaidBy(e.paidBy);
    setEditSplit([...e.split]);
    setEditCategory(e.category);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) return;
    onEdit(editingId, {
      id: editingId,
      description: editDesc.trim(),
      amount,
      currency: 'CAD',
      paidBy: editPaidBy,
      split: editSplit,
      date: expenses.find((x) => x.id === editingId)?.date ?? new Date().toISOString().slice(0, 10),
      category: editCategory,
    });
    setEditingId(null);
  };

  const toggleSplit = (name: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(name)) {
      setList(list.filter((n) => n !== name));
    } else {
      setList([...list, name]);
    }
  };

  const handleAdd = () => {
    const amount = parseFloat(addAmount);
    if (!addDesc.trim() || isNaN(amount) || amount < 0) return;
    onAdd({
      description: addDesc.trim(),
      amount,
      currency: 'CAD',
      paidBy: addPaidBy,
      split: addSplit,
      date: new Date().toISOString().slice(0, 10),
      category: addCategory,
    });
    setAddDesc('');
    setAddAmount('');
    setAddPaidBy(BUDDY_NAMES[0] ?? '');
    setAddSplit([...BUDDY_NAMES]);
    setAddCategory('Other');
    setShowAddForm(false);
  };

  return (
    <div className={styles.list}>
      <button
        type="button"
        className={styles.addBtn}
        onClick={() => setShowAddForm((v) => !v)}
      >
        {showAddForm ? '− Add' : '+ Add'}
      </button>

      {showAddForm && (
        <div className={styles.addForm}>
          <input
            type="text"
            placeholder="Description"
            value={addDesc}
            onChange={(e) => setAddDesc(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          <select value={addPaidBy} onChange={(e) => setAddPaidBy(e.target.value)}>
            {BUDDY_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select value={addCategory} onChange={(e) => setAddCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Split between:
            </span>
            <div className={styles.splitToggles}>
              {BUDDY_NAMES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.splitToggle} ${addSplit.includes(n) ? styles.splitToggleActive : ''}`}
                  onClick={() => toggleSplit(n, addSplit, setAddSplit)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.addFormActions}>
            <button type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!addDesc.trim() || isNaN(parseFloat(addAmount)) || parseFloat(addAmount) < 0}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {expenses.map((exp) => (
        <div key={exp.id} className={styles.card}>
          {editingId === exp.id ? (
            <div className={styles.editForm}>
              <input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description"
              />
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                min="0"
                step="0.01"
              />
              <select value={editPaidBy} onChange={(e) => setEditPaidBy(e.target.value)}>
                {BUDDY_NAMES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Split between:
                </span>
                <div className={styles.splitToggles}>
                  {BUDDY_NAMES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.splitToggle} ${editSplit.includes(n) ? styles.splitToggleActive : ''}`}
                      onClick={() => toggleSplit(n, editSplit, setEditSplit)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.editFormActions}>
                <button type="button" onClick={cancelEdit}>
                  Cancel
                </button>
                <button type="button" onClick={saveEdit}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.cardHeader}>
                <span className={styles.description}>{exp.description}</span>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.editBtn}`}
                    onClick={() => startEdit(exp)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => onDelete(exp.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.amount}>
                {exp.currency} {exp.amount.toFixed(2)}
              </div>
              <div className={styles.meta}>
                Paid by {exp.paidBy} · {fmtDate(exp.date)} · {exp.category}
              </div>
              <div className={styles.meta}>
                Per person: {exp.currency} {perPersonSplit(exp.amount, exp.split.length).toFixed(2)}
              </div>
              <div className={styles.splitMembers}>
                {exp.split.map((s) => (
                  <span key={s} className={styles.splitTag}>
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
