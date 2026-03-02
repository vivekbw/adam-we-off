'use client';

import { useState } from 'react';
import type { Note } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import styles from './AddNoteForm.module.css';

const NOTE_TYPES: { type: string; icon: string }[] = [
  { type: 'Allergy', icon: '🚀' },
  { type: 'Preference', icon: '🌿' },
  { type: 'Goal', icon: '🎯' },
  { type: 'Visa', icon: '📋' },
  { type: 'Health', icon: '💊' },
  { type: 'Other', icon: '💬' },
];

export interface AddNoteFormProps {
  onAdd: (note: Omit<Note, 'id'>) => void;
  onCancel: () => void;
  buddyNames?: string[];
}

export function AddNoteForm({ onAdd, onCancel, buddyNames = [] }: AddNoteFormProps) {
  const AUTHORS = [...buddyNames, 'All'];
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
        <Label className="mb-2 block">Note type</Label>
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
      <div className="grid gap-2">
        <Label htmlFor="add-note-author">Author</Label>
        <Select value={author} onValueChange={setAuthor}>
          <SelectTrigger>
            <SelectValue placeholder="Select author" />
          </SelectTrigger>
          <SelectContent>
            {AUTHORS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="add-note-content">Content</Label>
        <Textarea
          id="add-note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add your note..."
          rows={3}
        />
      </div>
      <div className={styles.actions}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!content.trim()}>
          Add Note
        </Button>
      </div>
    </form>
  );
}
