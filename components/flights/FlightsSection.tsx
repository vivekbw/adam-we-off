'use client';

import { useState } from 'react';
import type { Flight } from '@/lib/constants';
import { FlightCard } from './FlightCard';
import { FlightDetail } from './FlightDetail';
import { FlightGlobe } from './FlightGlobe';
import { AddFlightForm } from './AddFlightForm';
import { Button } from '@/components/ui/button';
import styles from './FlightsSection.module.css';

export interface FlightsSectionProps {
  flights: Flight[];
  onAddFlight?: (partial: Partial<Flight>) => void;
  onDeleteFlight?: (id: string) => void;
}

export function FlightsSection({ flights, onAddFlight, onDeleteFlight }: FlightsSectionProps) {
  const [selected, setSelected] = useState<Flight | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleCardClick = (flight: Flight) => {
    setSelected((prev) => (prev?.id === flight.id ? null : flight));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.heading}>✈️ Flights</h2>
          <p className={styles.subheading}>
            All {flights.length} flight segments for your trip.
          </p>
        </div>
        {onAddFlight && (
          <Button onClick={() => setShowAdd(true)}>+ Add Flight</Button>
        )}
      </header>

      <div className={styles.grid}>
        <div className={styles.list}>
          {flights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              isSelected={selected?.id === flight.id}
              onClick={() => handleCardClick(flight)}
              onDelete={onDeleteFlight}
            />
          ))}
        </div>

        <aside className={styles.sidebar}>
          {selected && (
            <FlightDetail flight={selected} />
          )}
          <div className={styles.globeCard}>
            <div className={styles.globeTitle}>🌍 Flight Path Overview</div>
            <div className={styles.globeSvg}>
              <FlightGlobe flights={flights} />
            </div>
            <div className={styles.legend}>
              <span>🔵 Booked</span>
              <span>🔴 Pending</span>
            </div>
          </div>
        </aside>
      </div>

      {onAddFlight && (
        <AddFlightForm
          open={showAdd}
          onOpenChange={setShowAdd}
          onAdd={(partial) => {
            onAddFlight(partial);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}
