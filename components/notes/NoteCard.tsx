'use client';

import { useState } from 'react';
import type { Note } from '@/lib/constants';
import { NOTE_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
            <div className="flex gap-1">
              <Button variant="ghost" size="xs" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="destructive" size="xs" onClick={() => onDelete(note.id)}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.body}>
        {isEditing ? (
          <>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <Button size="xs" onClick={handleSave}>Save</Button>
              <Button variant="outline" size="xs" onClick={handleCancel}>Cancel</Button>
            </div>
          </>
        ) : (
          <p className={styles.content}>{note.content}</p>
        )}
      </div>
    </div>
  );
}
