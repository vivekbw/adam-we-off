'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plane, Plus, Search } from 'lucide-react';
import type { Flight, ItinerarySegment } from '@/lib/constants';
import { deriveFlightStatus } from '@/lib/constants';
import { FlightCard } from './FlightCard';
import { FlightDetail } from './FlightDetail';
import { FlightGlobe } from './FlightGlobe';
import { AddFlightForm } from './AddFlightForm';
import { FlightSearchResults } from './FlightSearchResults';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { Button } from '@/components/ui/button';
import styles from './FlightsSection.module.css';

export interface FlightsSectionProps {
  flights: Flight[];
  onAddFlight?: (partial: Partial<Flight>) => void;
  onDeleteFlight?: (id: string) => void;
  onUpdateFlight?: (id: string, changes: Partial<Flight>) => void;
  itinerary?: ItinerarySegment[];
  buddyNames?: string[];
}

interface SuggestedRoute {
  from: string;
  to: string;
  fromFlag: string;
  toFlag: string;
  date: string;
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
        date: a.endDate,
      });
    }
  }
  return suggestions;
}

export function FlightsSection({
  flights,
  onAddFlight,
  onDeleteFlight,
  onUpdateFlight,
  itinerary = [],
  buddyNames = [],
}: FlightsSectionProps) {
  const [selected, setSelected] = useState<Flight | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addDefaults, setAddDefaults] = useState<Partial<Flight> | undefined>();
  const [activeRoute, setActiveRoute] = useState<SuggestedRoute | null>(null);

  const flightSearch = useFlightSearch();

  const suggested = useMemo(
    () => computeSuggestedRoutes(itinerary, flights),
    [itinerary, flights]
  );

  const handleCardClick = (flight: Flight) => {
    setSelected((prev) => (prev?.id === flight.id ? null : flight));
  };

  const handleSuggestClick = (route: SuggestedRoute) => {
    setActiveRoute(route);
    flightSearch.search(route.from, route.to, route.date);
  };

  const handleManualAdd = (route: SuggestedRoute) => {
    setAddDefaults({
      from: route.from,
      to: route.to,
      fromFlag: route.fromFlag,
      toFlag: route.toFlag,
    });
    setShowAdd(true);
  };

  const handleCloseSearch = useCallback(() => {
    setActiveRoute(null);
    flightSearch.clear();
  }, [flightSearch]);

  const handleAddFromSearch = useCallback(
    (partial: Partial<Flight>) => {
      if (onAddFlight) {
        if (activeRoute) {
          partial.fromFlag = activeRoute.fromFlag;
          partial.toFlag = activeRoute.toFlag;
        }
        if (buddyNames.length > 0 && !partial.bookingStatus) {
          const bs: Record<string, string> = {};
          for (const name of buddyNames) bs[name] = 'Need to Book';
          partial.bookingStatus = bs;
        }
        onAddFlight(partial);
      }
      handleCloseSearch();
    },
    [onAddFlight, activeRoute, handleCloseSearch, buddyNames]
  );

  const handleToggleBookingStatus = useCallback(
    (flightId: string, buddyName: string) => {
      if (!onUpdateFlight) return;
      const flight = flights.find((f) => f.id === flightId);
      if (!flight) return;
      const current = flight.bookingStatus?.[buddyName] ?? 'Need to Book';
      const next = current === 'Booked' ? 'Need to Book' : 'Booked';
      const newBookingStatus = { ...flight.bookingStatus, [buddyName]: next };
      onUpdateFlight(flightId, {
        bookingStatus: newBookingStatus,
        status: deriveFlightStatus(newBookingStatus),
      });
    },
    [flights, onUpdateFlight]
  );

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
              <div key={i} className={styles.suggestGroup}>
                <button
                  type="button"
                  className={`${styles.suggestChip} ${
                    activeRoute?.from === r.from && activeRoute?.to === r.to && activeRoute?.date === r.date
                      ? styles.suggestChipActive
                      : ''
                  }`}
                  onClick={() => handleSuggestClick(r)}
                  title="Search for cheap flights"
                >
                  <Search size={11} />
                  <span>{r.fromFlag} {r.from}</span>
                  <Plane size={13} className={styles.suggestPlane} />
                  <span>{r.toFlag} {r.to}</span>
                </button>
                {onAddFlight && (
                  <button
                    type="button"
                    className={styles.suggestManual}
                    onClick={() => handleManualAdd(r)}
                    title="Add flight manually"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeRoute && (
        <FlightSearchResults
          offers={flightSearch.offers}
          loading={flightSearch.loading}
          error={flightSearch.error}
          fromCity={activeRoute.from}
          toCity={activeRoute.to}
          fromFlag={activeRoute.fromFlag}
          toFlag={activeRoute.toFlag}
          onClose={handleCloseSearch}
          onAddFlight={onAddFlight ? handleAddFromSearch : undefined}
        />
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
              buddyNames={buddyNames}
              onToggleBookingStatus={onUpdateFlight ? handleToggleBookingStatus : undefined}
            />
          ))}
        </div>

        <aside className={styles.sidebar}>
          {selected && <FlightDetail flight={selected} buddyNames={buddyNames} />}
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
          buddyNames={buddyNames}
        />
      )}
    </div>
  );
}
