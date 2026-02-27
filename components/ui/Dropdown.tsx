'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  value: string | null;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select...',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = value
    ? options.find((o) => o.value === value)?.label ?? placeholder
    : placeholder;

  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, handleOutsideClick]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      data-open={isOpen}
    >
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={selectedLabel}
      >
        <span className={value ? styles.value : styles.placeholder}>
          {selectedLabel}
        </span>
        <svg
          className={styles.chevron}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <ul
          className={styles.list}
          role="listbox"
          aria-label="Options"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
