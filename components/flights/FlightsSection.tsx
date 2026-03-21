'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plane, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Flight, ItinerarySegment } from '@/lib/constants';
import type { BuddyRow } from '@/hooks/useBuddies';
import { fmtDate } from '@/lib/constants';
import { getFlightValidationWarnings, type ImportedFlightCandidate } from '@/lib/flights/import';
import { getAllFlightWarnings } from '@/lib/flights/insights';
import {
  deriveFlightStatusFromTravelerStatuses,
  type FlightTravelerStatus,
  getTravelerStatusesForFlight,
  seedTravelerStatuses,
} from '@/lib/flights/travelers';
import { FlightCard } from './FlightCard';
import { FlightDetail } from './FlightDetail';
import { FlightGlobe } from './FlightGlobe';
import { AddFlightForm } from './AddFlightForm';
import { FlightImportDropzone } from './FlightImportDropzone';
import { FlightImportReviewDialog } from './FlightImportReviewDialog';
import { Button } from '@/components/ui/button';
import styles from './FlightsSection.module.css';

export interface FlightsSectionProps {
  flights: Flight[];
  onAddFlight?: (partial: Partial<Flight>) => void | Promise<void>;
  onUpdateFlight?: (id: string, changes: Partial<Flight>) => void | Promise<void>;
  onImportFlights?: (partials: Partial<Flight>[]) => Promise<Flight[]>;
  onDeleteFlight?: (id: string) => void;
  itinerary?: ItinerarySegment[];
  travelers?: BuddyRow[];
}

interface SuggestedRoute {
  from: string;
  to: string;
  fromFlag: string;
  toFlag: string;
}

function normalizePlace(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
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
  onUpdateFlight,
  onImportFlights,
  onDeleteFlight,
  itinerary = [],
  travelers = [],
}: FlightsSectionProps) {
  const [selected, setSelected] = useState<Flight | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addDefaults, setAddDefaults] = useState<Partial<Flight> | undefined>();
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [showImportReview, setShowImportReview] = useState(false);
  const [importDrafts, setImportDrafts] = useState<ImportedFlightCandidate[]>([]);
  const [importWarnings, setImportWarnings] = useState<Record<string, string[]>>({});

  const suggested = useMemo(
    () => computeSuggestedRoutes(itinerary, flights),
    [itinerary, flights]
  );
  const travelerNames = useMemo(
    () => travelers.map((traveler) => traveler.name),
    [travelers],
  );

  const flagLookup = useMemo(() => {
    const next = new Map<string, string>();

    itinerary.forEach((segment) => {
      if (segment.city && segment.flag) {
        next.set(normalizePlace(segment.city), segment.flag);
      }
    });

    flights.forEach((flight) => {
      if (flight.from && flight.fromFlag) {
        next.set(normalizePlace(flight.from), flight.fromFlag);
      }
      if (flight.to && flight.toFlag) {
        next.set(normalizePlace(flight.to), flight.toFlag);
      }
    });

    return next;
  }, [flights, itinerary]);

  const displayFlights = useMemo(
    () =>
      flights.map((flight) => ({
        ...flight,
        status: deriveFlightStatusFromTravelerStatuses(
          getTravelerStatusesForFlight(flight, travelerNames),
          flight.status,
        ),
      })),
    [flights, travelerNames],
  );

  useEffect(() => {
    if (!onUpdateFlight || travelerNames.length === 0) return;

    const unseededFlights = flights.filter(
      (flight) => Object.keys(flight.travelerStatuses).length === 0,
    );

    if (unseededFlights.length === 0) return;

    unseededFlights.forEach((flight) => {
      const travelerStatuses = seedTravelerStatuses(flight, travelerNames);
      void onUpdateFlight(flight.id, {
        travelerStatuses,
        status: deriveFlightStatusFromTravelerStatuses(travelerStatuses, flight.status),
      });
    });
  }, [flights, onUpdateFlight, travelerNames]);

  useEffect(() => {
    if (!selected) return;
    const nextSelected = displayFlights.find((flight) => flight.id === selected.id) ?? null;
    setSelected(nextSelected);
  }, [displayFlights, selected?.id]);

  const prepareFlight = (partial: Partial<Flight>, existing?: Partial<Flight>) => {
    const from = partial.from ?? existing?.from ?? '';
    const to = partial.to ?? existing?.to ?? '';

    return {
      ...partial,
      fromFlag:
        partial.fromFlag ??
        existing?.fromFlag ??
        flagLookup.get(normalizePlace(from)) ??
        '',
      toFlag:
        partial.toFlag ??
        existing?.toFlag ??
        flagLookup.get(normalizePlace(to)) ??
        '',
    };
  };

  const warningsByFlight = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const flight of displayFlights) {
      const warnings = getAllFlightWarnings(flight, [
        ...(importWarnings[flight.id] ?? []),
        ...getFlightValidationWarnings(flight, itinerary, displayFlights),
      ]);
      if (warnings.length > 0) {
        map[flight.id] = warnings;
      }
    }
    return map;
  }, [displayFlights, importWarnings, itinerary]);

  const handleCardClick = (flight: Flight) => {
    setSelected((prev) => (prev?.id === flight.id ? null : flight));
  };

  const handleSuggestClick = (route: SuggestedRoute) => {
    setEditingFlight(null);
    setAddDefaults({
      from: route.from,
      to: route.to,
      fromFlag: route.fromFlag,
      toFlag: route.toFlag,
      status: 'Need to Book',
    });
    setShowAdd(true);
  };

  const handleImport = async (files: File[]) => {
    if (!onImportFlights) return;

    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const response = await fetch('/api/flights/import', {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to import flight files.');
    }

    const imported = (payload.imported ?? []) as ImportedFlightCandidate[];
    const errors = payload.errors ?? [];

    if (imported.length === 0) {
      toast.error(errors[0]?.error ?? 'No flights were found in those files.');
      return;
    }

    setImportDrafts(imported.map((item) => ({
      ...item,
      flight: prepareFlight(item.flight),
    })));
    setShowImportReview(true);

    if (errors.length > 0) {
      toast.warning(
        `We pulled ${imported.length} draft${imported.length === 1 ? '' : 's'}, but ${errors.length} file${errors.length === 1 ? '' : 's'} needed manual review.`,
      );
    }
  };

  const handleConfirmImport = async (drafts: ImportedFlightCandidate[]) => {
    if (!onImportFlights) return;

    const preparedDrafts = drafts.map((draft) => ({
      ...draft,
      flight: prepareFlight(draft.flight),
    }));
    const persistedFlights = await onImportFlights(preparedDrafts.map((item) => item.flight));
    const nextWarnings: Record<string, string[]> = {};

    persistedFlights.forEach((flight, index) => {
      const importItem = preparedDrafts[index];
      const existingMatch = flights.find(
        (existing) =>
          existing.id !== flight.id &&
          existing.fromCode === flight.fromCode &&
          existing.toCode === flight.toCode,
      );

      const warnings = [...(importItem?.warnings ?? [])];
      if (existingMatch && existingMatch.date && flight.date && existingMatch.date !== flight.date) {
        warnings.push(
          `Imported date changed this route from ${fmtDate(existingMatch.date)} to ${fmtDate(flight.date)}.`,
        );
      }

      if (warnings.length > 0) {
        nextWarnings[flight.id] = Array.from(new Set(warnings));
      }
    });

    setImportWarnings((current) => ({ ...current, ...nextWarnings }));
    setImportDrafts([]);
    setSelected(persistedFlights[0] ?? null);

    toast.success(
      `Confirmed ${persistedFlights.length} imported flight${persistedFlights.length === 1 ? '' : 's'}.`,
    );
  };

  const openAddFlight = () => {
    setEditingFlight(null);
    setAddDefaults(undefined);
    setShowAdd(true);
  };

  const openEditFlight = (flight: Flight) => {
    setEditingFlight(flight);
    setAddDefaults(flight);
    setShowAdd(true);
  };

  const handleToggleTravelerStatus = async (flight: Flight, travelerName: string) => {
    if (!onUpdateFlight) return;

    const currentStatuses = getTravelerStatusesForFlight(flight, travelerNames);
    const nextStatus = currentStatuses[travelerName] === 'Booked' ? 'Need to Book' : 'Booked';
    const travelerStatuses: Record<string, FlightTravelerStatus> = {
      ...flight.travelerStatuses,
      [travelerName]: nextStatus,
    };

    await onUpdateFlight(flight.id, {
      travelerStatuses,
      status: deriveFlightStatusFromTravelerStatuses(
        getTravelerStatusesForFlight(
          { ...flight, travelerStatuses },
          travelerNames,
        ),
        flight.status,
      ),
    });
  };

  return (
    <div className={styles.page}>
      <FlightGlobe flights={displayFlights} itinerary={itinerary} />

      <header className={styles.header}>
        <div>
          <h2 className={styles.heading}>Flights</h2>
          <p className={styles.subheading}>
            {displayFlights.length} flight {displayFlights.length === 1 ? 'segment' : 'segments'}
          </p>
        </div>
        {onAddFlight && (
          <Button onClick={openAddFlight}>
            <Plus size={16} />
            Add Flight
          </Button>
        )}
      </header>

      {onImportFlights && (
        <FlightImportDropzone onImport={handleImport} />
      )}

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
          {displayFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              warnings={warningsByFlight[flight.id] ?? []}
              travelers={travelers}
              isSelected={selected?.id === flight.id}
              onClick={() => handleCardClick(flight)}
              onDelete={onDeleteFlight}
              onToggleTravelerStatus={(travelerName) =>
                void handleToggleTravelerStatus(flight, travelerName)
              }
            />
          ))}
        </div>

        <aside className={styles.sidebar}>
          {selected && (
            <FlightDetail
              flight={selected}
              warnings={warningsByFlight[selected.id] ?? []}
              onEdit={onUpdateFlight ? openEditFlight : undefined}
              travelers={travelers}
              onToggleTravelerStatus={(travelerName) =>
                void handleToggleTravelerStatus(selected, travelerName)
              }
            />
          )}
        </aside>
      </div>

      {onAddFlight && (
        <AddFlightForm
          open={showAdd}
          onOpenChange={(open) => {
            setShowAdd(open);
            if (!open) {
              setEditingFlight(null);
            }
          }}
          onSubmit={async (partial) => {
            const prepared = prepareFlight(partial, editingFlight ?? addDefaults);
            if (editingFlight && onUpdateFlight) {
              await onUpdateFlight(editingFlight.id, prepared);
              setSelected((current) =>
                current?.id === editingFlight.id ? { ...editingFlight, ...prepared } as Flight : current,
              );
            } else {
              await onAddFlight(prepared);
            }
          }}
          defaults={addDefaults}
          title={editingFlight ? 'Edit Flight' : 'Add Flight'}
          description={
            editingFlight
              ? 'Update the route, status, dates, and timing for this flight.'
              : 'Add a new flight segment with booking details and timing.'
          }
          submitLabel={editingFlight ? 'Save Changes' : 'Add Flight'}
        />
      )}

      {onImportFlights && (
        <FlightImportReviewDialog
          open={showImportReview}
          drafts={importDrafts}
          onOpenChange={(open) => {
            setShowImportReview(open);
            if (!open) {
              setImportDrafts([]);
            }
          }}
          onConfirm={handleConfirmImport}
        />
      )}
    </div>
  );
}
