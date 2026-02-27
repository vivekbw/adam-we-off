'use client';

import { useState } from 'react';
import type { Note } from '@/lib/constants';
import { NoteCard } from './NoteCard';
import { AddNoteForm } from './AddNoteForm';
import styles from './NotesSection.module.css';

export interface NotesSectionProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id'>) => void;
  onEditNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
}

export function NotesSection({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: NotesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Notes</h2>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? '− Add Note' : '+ Add Note'}
        </button>
      </div>
      {showAddForm && (
        <div className={styles.formWrapper}>
          <AddNoteForm
            onAdd={(note) => {
              onAddNote(note);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
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
