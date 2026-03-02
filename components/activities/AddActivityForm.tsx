'use client';

import { useState } from 'react';
import type { Activity } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './AddActivityForm.module.css';

export interface AddActivityFormProps {
  city: string;
  onAdd: (activity: Partial<Activity>) => void;
}

export function AddActivityForm({ city, onAdd }: AddActivityFormProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim();
    if (!val) return;
    const isUrl = val.startsWith('http://') || val.startsWith('https://');
    onAdd({
      name: isUrl ? 'Activity' : val,
      link: isUrl ? val : '#',
      cost: 0,
      status: 'Considering',
      bookedBy: null,
      individual: false,
    });
    setInput('');
  };

  return (
    <div className={styles.card}>
      <div className={styles.inputRow}>
        <Input
          type="text"
          placeholder={`Add an activity in ${city}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
}
