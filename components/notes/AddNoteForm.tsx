'use client';

import { useState } from 'react';
import type { Note } from '@/lib/constants';
import { BUDDIES } from '@/lib/constants';
import styles from './AddNoteForm.module.css';

const NOTE_TYPES: { type: string; icon: string }[] = [
  { type: 'Allergy', icon: '🚀' },
  { type: 'Preference', icon: '🌿' },
  { type: 'Goal', icon: '🎯' },
  { type: 'Visa', icon: '📋' },
  { type: 'Health', icon: '💊' },
  { type: 'Other', icon: '💬' },
];

const AUTHORS = [...BUDDIES.map((b) => b.name), 'All'];

export interface AddNoteFormProps {
  onAdd: (note: Omit<Note, 'id'>) => void;
  onCancel: () => void;
}

export function AddNoteForm({ onAdd, onCancel }: AddNoteFormProps) {
  const [type, setType] = useState('Other');
  const [author, setAuthor] = useState('You');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const icon = NOTE_TYPES.find((t) => t.type === type)?.icon ?? '💬';
    onAdd({ type, icon, author, content: content.trim() });
    setContent('');
    setType('Other');
    setAuthor('You');
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div>
        <label className={styles.typeLabel}>Note type</label>
        <div className={styles.typePills}>
          {NOTE_TYPES.map(({ type: t, icon: i }) => (
            <button
              key={t}
              type="button"
              className={`${styles.typePill} ${type === t ? styles.typePillActive : ''}`}
              onClick={() => setType(t)}
            >
              <span>{i}</span>
              <span>{t}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.authorRow}>
        <label htmlFor="add-note-author" className={styles.authorLabel}>
          Author
        </label>
        <select
          id="add-note-author"
          className={styles.authorSelect}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        >
          {AUTHORS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.contentRow}>
        <label htmlFor="add-note-content" className={styles.contentLabel}>
          Content
        </label>
        <textarea
          id="add-note-content"
          className={styles.contentTextarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add your note..."
        />
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.addBtn} disabled={!content.trim()}>
          Add Note
        </button>
      </div>
    </form>
  );
}
