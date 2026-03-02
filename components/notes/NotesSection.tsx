'use client';

import { useState } from 'react';
import type { Note } from '@/lib/constants';
import { NoteCard } from './NoteCard';
import { AddNoteForm } from './AddNoteForm';
import { Button } from '@/components/ui/button';
import styles from './NotesSection.module.css';

export interface NotesSectionProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id'>) => void;
  onEditNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  buddyNames?: string[];
}

export function NotesSection({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  buddyNames = [],
}: NotesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Notes</h2>
        <Button
          variant={showAddForm ? 'outline' : 'default'}
          size="sm"
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? '− Close' : '+ Add Note'}
        </Button>
      </div>
      {showAddForm && (
        <div className={styles.formWrapper}>
          <AddNoteForm
            onAdd={(note) => {
              onAddNote(note);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
            buddyNames={buddyNames}
          />
        </div>
      )}
      <div className={styles.grid}>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={onEditNote}
            onDelete={onDeleteNote}
          />
        ))}
      </div>
    </section>
  );
}
