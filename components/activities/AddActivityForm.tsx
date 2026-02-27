'use client';

import { useState } from 'react';
import type { Activity } from '@/lib/constants';
import styles from './AddActivityForm.module.css';

const POPULAR_RECS = [
  { name: 'Street Food Tour', cost: 35, search: 'street+food+tour' },
  { name: 'Temple Walk', cost: 15, search: 'temple+walk' },
  { name: 'Cooking Class', cost: 55, search: 'cooking+class' },
];

export interface AddActivityFormProps {
  city: string;
  onAdd: (activity: Partial<Activity>) => void;
}

export function AddActivityForm({ city, onAdd }: AddActivityFormProps) {
  const [input, setInput] = useState('');

  const handleSearch = () => {
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

  const handleAddPopular = (rec: (typeof POPULAR_RECS)[0]) => {
    onAdd({
      name: rec.name,
      link: `https://www.viator.com/searchResults/?q=${rec.search}+${encodeURIComponent(city)}`,
      cost: rec.cost,
      status: 'Considering',
      bookedBy: null,
      individual: false,
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.inputRow}>
        <input
          type="text"
          className={styles.input}
          placeholder="Activity name or link"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button type="button" className={styles.searchBtn} onClick={handleSearch}>
          Search Activities
        </button>
      </div>
      <div className={styles.popularTitle}>Popular in {city}</div>
      <div className={styles.popularList}>
        {POPULAR_RECS.map((rec) => (
          <div key={rec.name} className={styles.popularItem}>
            <span className={styles.popularItemName}>{rec.name}</span>
            <div className={styles.popularItemRight}>
              <span className={styles.popularItemCost}>${rec.cost}</span>
              <div className={styles.popularItemLinks}>
                <a
                  href={`https://www.viator.com/searchResults/?q=${rec.search}+${encodeURIComponent(city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Viator
                </a>
                <a
                  href={`https://www.airbnb.com/experiences?location=${encodeURIComponent(city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Airbnb
                </a>
                <button
                  type="button"
                  className={`${styles.searchBtn} ${styles.addBtn}`}
                  onClick={() => handleAddPopular(rec)}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
