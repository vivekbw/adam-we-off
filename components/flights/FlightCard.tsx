'use client';

import type { Flight } from '@/lib/constants';
import { fmtDate } from '@/lib/constants';
import styles from './FlightCard.module.css';

const FLIGHT_WARNINGS: Record<string, string> = {
  f5: 'BKK is large — allow 2h before departure. ~1h taxi from Khaosan area.',
  f6: 'DPS return: bus from Uluwatu ~1.5h. Book transport early!',
  f2: 'NRT→HAN 10:45am. Tour pickup 7am May 30 — tight!',
};

export interface FlightCardProps {
  flight: Flight;
  isSelected: boolean;
  onClick: () => void;
}

export function FlightCard({ flight, isSelected, onClick }: FlightCardProps) {
  const warning = FLIGHT_WARNINGS[flight.id];
  const statusClass =
    flight.status === 'Booked' ? styles.tagGreen : styles.tagYellow;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
    >
      <div className={styles.routeRow}>
        <div className={styles.route}>
          <span className={styles.flag}>{flight.fromFlag}</span>
          <div>
            <div className={styles.airport}>
              {flight.from} ({flight.fromCode})
            </div>
            <div className={styles.time}>{flight.dep}</div>
          </div>
          <div className={styles.connector}>
            <div className={styles.connectorLine} />
            <span className={styles.connectorIcon}>✈️</span>
            <div className={styles.connectorLine} />
          </div>
          <div>
            <div className={styles.airport}>
              {flight.to} ({flight.toCode})
            </div>
            <div className={styles.time}>{flight.arr}</div>
          </div>
          <span className={styles.flag}>{flight.toFlag}</span>
        </div>
        <span className={`${styles.statusTag} ${statusClass}`}>
          {flight.status}
        </span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.meta}>
          {fmtDate(flight.date)} · {flight.airline}
        </span>
        {flight.cost != null && (
          <span className={styles.cost}>~${flight.cost} CAD</span>
        )}
      </div>
      {Object.keys(flight.seats).length > 0 && (
        <div className={styles.seatsRow}>
          {Object.entries(flight.seats).map(([name, seat]) => (
            <span key={name} className={styles.seatTag}>
              {name}: {seat}
            </span>
          ))}
        </div>
      )}
      {warning && (
        <div className={styles.warningRow}>⚠️ {warning}</div>
      )}
    </div>
  );
}
