'use client';

import type { Stay } from '@/lib/constants';
import styles from './StayCoverage.module.css';

export interface StayCoverageProps {
  stays: Stay[];
  onSegmentClick?: (stay: Stay) => void;
}

export function StayCoverage({ stays, onSegmentClick }: StayCoverageProps) {
  const totalNights = stays.reduce((sum, s) => sum + s.nights, 0);
  if (totalNights === 0) return null;

  const byCountry = stays.reduce<Record<string, { flag: string; booked: number; total: number }>>(
    (acc, s) => {
      const key = s.country;
      if (!acc[key]) acc[key] = { flag: s.flag, booked: 0, total: 0 };
      acc[key].total += s.nights;
      if (s.status === 'Booked') acc[key].booked += s.nights;
      return acc;
    },
    {}
  );

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        {stays.map((stay) => {
          const pct = Math.max((stay.nights / totalNights) * 100, 2);
          const isBooked = stay.status === 'Booked';
          return (
            <div
              key={stay.id}
              className={`${styles.segment} ${isBooked ? styles.segmentBooked : styles.segmentPending}`}
              style={{ flex: `0 0 ${pct}%` }}
              role="button"
              tabIndex={0}
              onClick={() => onSegmentClick?.(stay)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSegmentClick?.(stay);
                }
              }}
              aria-label={`${stay.city} ${stay.nights} nights, ${stay.status}`}
            />
          );
        })}
      </div>
      <div className={styles.chips}>
        {Object.entries(byCountry).map(([country, { flag, booked, total }]) => (
          <span key={country} className={styles.chip}>
            <span className={styles.chipFlag}>{flag}</span>
            <span>{country}</span>
            <span className={styles.chipCount}>
              {booked}/{total}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
