'use client';

import { useState, useMemo } from 'react';
import { Plane, Plus } from 'lucide-react';
import type { Flight, ItinerarySegment } from '@/lib/constants';
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
  itinerary?: ItinerarySegment[];
}

interface SuggestedRoute {
  from: string;
  to: string;
  fromFlag: string;
  toFlag: string;
}

function computeSuggestedRoutes(
  itinerary: ItinerarySegment[],
  flights: Flight[]
): SuggestedRoute[] {
  if (itinerary.length < 2) return [];

  const sorted = [...itinerary].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const unique: ItinerarySegment[] = [];
  for (const seg of sorted) {
    if (unique.length === 0 || unique[unique.length - 1].city !== seg.city) {
      unique.push(seg);
    }
  }

  const flightPairs = new Set(
    flights.map((f) => `${f.from.toLowerCase()}→${f.to.toLowerCase()}`)
  );

  const suggestions: SuggestedRoute[] = [];
  for (let i = 0; i < unique.length - 1; i++) {
    const a = unique[i];
    const b = unique[i + 1];
    const key = `${a.city.toLowerCase()}→${b.city.toLowerCase()}`;
    if (!flightPairs.has(key)) {
      suggestions.push({
        from: a.city,
        to: b.city,
        fromFlag: a.flag,
        toFlag: b.flag,
      });
    }
  }
  return suggestions;
}

export function FlightsSection({
  flights,
  onAddFlight,
  onDeleteFlight,
  itinerary = [],
}: FlightsSectionProps) {
  const [selected, setSelected] = useState<Flight | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addDefaults, setAddDefaults] = useState<Partial<Flight> | undefined>();

  const suggested = useMemo(
    () => computeSuggestedRoutes(itinerary, flights),
    [itinerary, flights]
  );

  const handleCardClick = (flight: Flight) => {
    setSelected((prev) => (prev?.id === flight.id ? null : flight));
  };

  const handleSuggestClick = (route: SuggestedRoute) => {
    setAddDefaults({
      from: route.from,
      to: route.to,
      fromFlag: route.fromFlag,
      toFlag: route.toFlag,
    });
    setShowAdd(true);
  };

  return (
    <div className={styles.page}>
      <FlightGlobe flights={flights} itinerary={itinerary} />

      <header className={styles.header}>
        <div>
          <h2 className={styles.heading}>Flights</h2>
          <p className={styles.subheading}>
            {flights.length} flight {flights.length === 1 ? 'segment' : 'segments'}
          </p>
        </div>
        {onAddFlight && (
          <Button onClick={() => { setAddDefaults(undefined); setShowAdd(true); }}>
            <Plus size={16} />
            Add Flight
          </Button>
        )}
      </header>

      {suggested.length > 0 && (
        <div className={styles.suggestions}>
          <p className={styles.suggestLabel}>Missing flights</p>
          <div className={styles.suggestList}>
            {suggested.map((r, i) => (
              <button
                key={i}
                type="button"
                className={styles.suggestChip}
                onClick={() => handleSuggestClick(r)}
              >
                <span>{r.fromFlag} {r.from}</span>
                <Plane size={13} className={styles.suggestPlane} />
                <span>{r.toFlag} {r.to}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
          {selected && <FlightDetail flight={selected} />}
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
          defaults={addDefaults}
        />
      )}
    </div>
  );
}
