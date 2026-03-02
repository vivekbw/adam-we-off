'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { flagForCountry } from '@/lib/country-flags';
import styles from './CityAutocomplete.module.css';

interface Prediction {
  placeId: string;
  description: string;
  city: string;
  country: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (city: string, country: string, flag: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

export function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search for a city…',
  id,
  required,
}: CityAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      return;
    }
    try {
      const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      setPredictions(data.predictions ?? []);
      setOpen(true);
      setActiveIdx(-1);
    } catch {
      setPredictions([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(value), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchPredictions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(p: Prediction) {
    const flag = flagForCountry(p.country);
    onChange(p.city);
    onSelect(p.city, p.country, flag);
    setOpen(false);
    setPredictions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || predictions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % predictions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? predictions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(predictions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={styles.wrapper}>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {open && predictions.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {predictions.map((p, i) => {
            const flag = flagForCountry(p.country);
            return (
              <li
                key={p.placeId}
                role="option"
                aria-selected={i === activeIdx}
                className={`${styles.option} ${i === activeIdx ? styles.optionActive : ''}`}
                onMouseDown={() => handleSelect(p)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                {flag && <span className={styles.flag}>{flag}</span>}
                <span className={styles.optionText}>
                  <span className={styles.city}>{p.city}</span>
                  <span className={styles.country}>{p.country}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
