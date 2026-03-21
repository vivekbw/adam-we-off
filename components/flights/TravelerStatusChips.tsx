'use client';

import type { BuddyRow } from '@/hooks/useBuddies';
import type { Flight } from '@/lib/constants';
import { getTravelerStatusesForFlight } from '@/lib/flights/travelers';
import styles from './TravelerStatusChips.module.css';

export interface TravelerStatusChipsProps {
  flight: Flight;
  travelers: BuddyRow[];
  variant?: 'icon' | 'full';
  onToggle?: (travelerName: string) => void;
}

function initialsForTraveler(traveler: BuddyRow) {
  const source = traveler.avatar?.trim() || traveler.name.trim();
  if (!source) return '?';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function TravelerStatusChips({
  flight,
  travelers,
  variant = 'icon',
  onToggle,
}: TravelerStatusChipsProps) {
  if (travelers.length === 0) return null;

  const statuses = getTravelerStatusesForFlight(
    flight,
    travelers.map((traveler) => traveler.name),
  );

  return (
    <div className={styles.row}>
      {travelers.map((traveler) => {
        const travelerStatus = statuses[traveler.name];
        const statusClass = travelerStatus === 'Booked' ? styles.booked : styles.pending;
        const sharedTitle = `${traveler.name}: ${travelerStatus}`;

        if (variant === 'full') {
          return (
            <button
              key={traveler.id}
              type="button"
              className={`${styles.labelWrap} ${statusClass}`}
              title={sharedTitle}
              onClick={() => onToggle?.(traveler.name)}
            >
              <span className={`${styles.button} ${statusClass}`}>
                <span className={styles.avatar}>{initialsForTraveler(traveler)}</span>
              </span>
              <span className={styles.labelText}>
                <span className={styles.name}>{traveler.name}</span>
                <span className={styles.status}>{travelerStatus}</span>
              </span>
            </button>
          );
        }

        return (
          <button
            key={traveler.id}
            type="button"
            className={`${styles.button} ${statusClass}`}
            title={sharedTitle}
            onClick={() => onToggle?.(traveler.name)}
          >
            <span className={styles.avatar}>{initialsForTraveler(traveler)}</span>
          </button>
        );
      })}
    </div>
  );
}
