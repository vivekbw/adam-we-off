'use client';

import type { Flight } from '@/lib/constants';
import type { BuddyRow } from '@/hooks/useBuddies';
import { fmtDate, fmtDateLong, flightSearchLinks } from '@/lib/constants';
import { generateBookedFlightBlurb, getFlightWarningExplanation } from '@/lib/flights/insights';
import { Button } from '@/components/ui/button';
import { TravelerStatusChips } from './TravelerStatusChips';
import styles from './FlightDetail.module.css';

export interface FlightDetailProps {
  flight: Flight;
  warnings?: string[];
  onEdit?: (flight: Flight) => void;
  travelers?: BuddyRow[];
  onToggleTravelerStatus?: (travelerName: string) => void;
}

const ROWS: Array<[string, (f: Flight) => string]> = [
  ['Date', (f) => fmtDateLong(f.date)],
  ['Departure', (f) => f.dep],
  ['Arrival', (f) => f.arr],
  ['Airline', (f) => f.airline],
];

export function FlightDetail({
  flight,
  warnings = [],
  onEdit,
  travelers = [],
  onToggleTravelerStatus,
}: FlightDetailProps) {
  const links = flightSearchLinks(flight.fromCode, flight.toCode, flight.date);
  const statusClass =
    flight.status === 'Booked' ? styles.tagGreen : styles.tagYellow;
  const isBooked = flight.status === 'Booked';
  const showTravelNote = isBooked && warnings.length === 0;
  const showWarnings = warnings.length > 0;

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
        <div className={styles.headerActions}>
          <span className={`${styles.statusTag} ${statusClass}`}>
            {flight.status}
          </span>
          {onEdit && (
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(flight)}>
              Edit
            </Button>
          )}
        </div>
      </div>
      <h3 className={styles.title}>
        {flight.from} → {flight.to}
      </h3>
      {travelers.length > 0 && (
        <div className={styles.travelersSection}>
          <div className={styles.travelersTitle}>Traveler Booking</div>
          <TravelerStatusChips
            flight={flight}
            travelers={travelers}
            variant="full"
            onToggle={onToggleTravelerStatus}
          />
        </div>
      )}
      {ROWS.map(([label, getValue]) => (
        <div key={label} className={styles.row}>
          <span className={styles.rowLabel}>{label}</span>
          <span className={styles.rowValue}>{getValue(flight)}</span>
        </div>
      ))}
      {showWarnings && (
        <div className={styles.warningSection}>
          <div className={styles.warningTitle}>Flag Details</div>
          {warnings.map((warning) => (
            <div key={warning} className={styles.warningItem}>
              <div className={styles.warningSummary}>⚠️ {warning}</div>
              <div className={styles.warningExplain}>{getFlightWarningExplanation(warning)}</div>
            </div>
          ))}
        </div>
      )}
      {showTravelNote && (
        <div className={styles.noteSection}>
          <div className={styles.noteTitle}>Travel Note</div>
          <div className={styles.noteBody}>
            {generateBookedFlightBlurb(flight)}
          </div>
        </div>
      )}
      {!isBooked && (
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
      )}
    </div>
  );
}
