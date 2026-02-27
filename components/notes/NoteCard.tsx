'use client';

import { useState } from 'react';
import type { Note } from '@/lib/constants';
import { NOTE_COLORS } from '@/lib/constants';
import styles from './NoteCard.module.css';

const NOTE_ICONS: Record<string, string> = {
  Allergy: '🚀',
  Preference: '🌿',
  Goal: '🎯',
  Visa: '📋',
  Health: '💊',
  Other: '💬',
};

export interface NoteCardProps {
  note: Note;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const colors = NOTE_COLORS[note.type] ?? NOTE_COLORS.Other;
  const icon = NOTE_ICONS[note.type] ?? NOTE_ICONS.Other;

  const handleSave = () => {
    if (editContent.trim() !== note.content) {
      onEdit(note.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  return (
    <div
      className={styles.card}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>{icon}</span>
          <span className={styles.typeLabel} style={{ color: colors.text }}>
            {note.type}
          </span>
          <span className={styles.authorTag}>{note.author}</span>
        </div>
        <div className={styles.headerActions}>
          {!isEditing && (
            <>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.editBtn}`}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={() => onDelete(note.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      <div className={styles.body}>
        {isEditing ? (
          <>
            <textarea
              className={styles.textarea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
            />
            <div className={styles.editActions}>
              <button type="button" className={styles.saveBtn} onClick={handleSave}>
                Save
              </button>
              <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <p className={styles.content}>{note.content}</p>
        )}
      </div>
    </div>
  );
}
