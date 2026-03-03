'use client';

import type { Flight } from '@/lib/constants';
import { fmtDate, fmtDateLong, flightSearchLinks } from '@/lib/constants';
import styles from './FlightDetail.module.css';

export interface FlightDetailProps {
  flight: Flight;
  buddyNames?: string[];
}

const ROWS: Array<[string, (f: Flight) => string]> = [
  ['Date', (f) => fmtDateLong(f.date)],
  ['Departure', (f) => f.dep],
  ['Arrival', (f) => f.arr],
  ['Airline', (f) => f.airline],
];

export function FlightDetail({ flight, buddyNames = [] }: FlightDetailProps) {
  const links = flightSearchLinks(flight.fromCode, flight.toCode, flight.date);
  const statusClass =
    flight.status === 'Booked' ? styles.tagGreen : styles.tagOrange;
  const travelerNames = buddyNames.length > 0 ? buddyNames : Object.keys(flight.bookingStatus ?? {});

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.routeFlags}>
          <span className={styles.flag}>{flight.fromFlag}</span>
          <div className={styles.airlineCenter}>
            <div className={styles.connectorLine}>━━━ ✈️ ━━━</div>
            <div className={styles.airlineLabel}>{flight.airline}</div>
          </div>
          <span className={styles.flag}>{flight.toFlag}</span>
        </div>
        <span className={`${styles.statusTag} ${statusClass}`}>
          {flight.status}
        </span>
      </div>
      <h3 className={styles.title}>
        {flight.from} → {flight.to}
      </h3>
      {ROWS.map(([label, getValue]) => (
        <div key={label} className={styles.row}>
          <span className={styles.rowLabel}>{label}</span>
          <span className={styles.rowValue}>{getValue(flight)}</span>
        </div>
      ))}
      {travelerNames.length > 0 && (
        <div className={styles.travelersSection}>
          <div className={styles.travelersTitle}>Travelers</div>
          <div className={styles.travelersList}>
            {travelerNames.map((name) => {
              const status = flight.bookingStatus?.[name] ?? 'Need to Book';
              const isBooked = status === 'Booked';
              return (
                <div key={name} className={styles.travelerRow}>
                  <span className={styles.travelerName}>{name}</span>
                  <span className={`${styles.travelerStatus} ${isBooked ? styles.travelerBooked : styles.travelerNeedToBook}`}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className={styles.searchSection}>
        <div className={styles.searchTitle}>Search & Book</div>
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className={styles.searchLink}
          >
            <span>🔗 {link.name}</span>
            <span className={styles.searchLinkMeta}>
              Filter by {fmtDate(flight.date)} →
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
