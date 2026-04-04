'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { Stay, ItinerarySegment } from '@/lib/constants';
import type { ImportedStayCandidate } from '@/lib/stays/import';
import { flagForCountry } from '@/lib/country-flags';
import { StayCoverage } from './StayCoverage';
import { StayCard } from './StayCard';
import { AddStayForm } from './AddStayForm';
import { StayImportDropzone } from './StayImportDropzone';
import { StayImportReviewDialog } from './StayImportReviewDialog';
import { Button } from '@/components/ui/button';
import styles from './StaysSection.module.css';

export interface StaysSectionProps {
  stays: Stay[];
  onUpdateStay: (id: string, changes: Partial<Stay>) => void;
  onAddStay?: (partial: Partial<Stay>) => void | Promise<void>;
  onImportStays?: (partials: Partial<Stay>[]) => Promise<Stay[]>;
  onDeleteStay?: (id: string) => void;
  itinerary: ItinerarySegment[];
  buddyNames?: string[];
}

function normalizePlace(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function StaysSection({
  stays,
  onUpdateStay,
  onAddStay,
  onImportStays,
  onDeleteStay,
  itinerary,
  buddyNames = [],
}: StaysSectionProps) {
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState(100);
  const [vibeFilter, setVibeFilter] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingStay, setEditingStay] = useState<Stay | null>(null);
  const [stayDefaults, setStayDefaults] = useState<Partial<Stay> | undefined>();
  const [showImportReview, setShowImportReview] = useState(false);
  const [importDrafts, setImportDrafts] = useState<ImportedStayCandidate[]>([]);

  const bookedCount = stays.filter((s) => s.status === 'Booked').length;

  const VIBE_TYPE_MAP: Record<string, string[]> = {
    Social: ['Hostel'],
    Relaxing: ['Villa', 'Hotel', 'Boutique'],
    Adventurous: ['Tour'],
    Romantic: ['Villa'],
    Budget: ['Hostel'],
  };

  const filteredStays = useMemo(() => {
    return stays.filter((s) => {
      if (s.costPerNight > priceFilter) return false;
      if (vibeFilter) {
        const types = VIBE_TYPE_MAP[vibeFilter];
        if (types && !types.some((t) => s.type.toLowerCase().includes(t.toLowerCase())))
          return false;
      }
      return true;
    });
  }, [stays, priceFilter, vibeFilter]);

  const filteredByCountry = useMemo(() => {
    const grouped: Record<string, Stay[]> = {};
    for (const stay of filteredStays) {
      if (!grouped[stay.country]) grouped[stay.country] = [];
      grouped[stay.country].push(stay);
    }
    return grouped;
  }, [filteredStays]);

  const handleSegmentClick = (stay: Stay) => {
    setSelectedStayId(stay.id);
  };

  const itineraryLookup = useMemo(() => {
    const map = new Map<string, { country: string; flag: string }>();
    itinerary.forEach((segment) => {
      map.set(normalizePlace(segment.city), {
        country: segment.country,
        flag: segment.flag,
      });
    });
    return map;
  }, [itinerary]);

  const prepareStay = (partial: Partial<Stay>, existing?: Partial<Stay>) => {
    const city = partial.city ?? existing?.city ?? '';
    const countryHint = itineraryLookup.get(normalizePlace(city));
    const country = partial.country ?? existing?.country ?? countryHint?.country ?? '';
    return {
      ...partial,
      country,
      flag: partial.flag ?? existing?.flag ?? countryHint?.flag ?? flagForCountry(country),
    };
  };

  const openAddStay = () => {
    setEditingStay(null);
    setStayDefaults(undefined);
    setShowAdd(true);
  };

  const openEditStay = (stay: Stay) => {
    setEditingStay(stay);
    setStayDefaults(stay);
    setShowAdd(true);
  };

  const handleImport = async (files: File[]) => {
    if (!onImportStays) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch('/api/stays/import', {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to import stay files.');
    }

    const imported = (payload.imported ?? []) as ImportedStayCandidate[];
    const errors = payload.errors ?? [];

    if (imported.length === 0) {
      toast.error(errors[0]?.error ?? 'No stays were found in those files.');
      return;
    }

    setImportDrafts(imported.map((item) => ({
      ...item,
      stay: prepareStay(item.stay),
    })));
    setShowImportReview(true);

    if (errors.length > 0) {
      toast.warning(
        `We pulled ${imported.length} stay draft${imported.length === 1 ? '' : 's'}, but ${errors.length} file${errors.length === 1 ? '' : 's'} needed extra review.`,
      );
    }
  };

  const handleConfirmImport = async (drafts: ImportedStayCandidate[]) => {
    if (!onImportStays) return;

    const preparedDrafts = drafts.map((draft) => ({
      ...draft,
      stay: prepareStay(draft.stay),
    }));
    const importedStays = await onImportStays(preparedDrafts.map((item) => item.stay));
    setImportDrafts([]);
    setSelectedStayId(importedStays[0]?.id ?? null);
    toast.success(
      `Confirmed ${importedStays.length} imported stay${importedStays.length === 1 ? '' : 's'}.`,
    );
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Stays</h2>
          <p className={styles.subtitle}>
            {bookedCount} of {stays.length} booked
          </p>
        </div>
        {onAddStay && (
          <Button onClick={openAddStay}>+ Add Stay</Button>
        )}
      </header>

      {onImportStays && (
        <StayImportDropzone onImport={handleImport} />
      )}

      <div className={styles.coverage}>
        <StayCoverage
          stays={stays}
          itinerary={itinerary}
          onSegmentClick={handleSegmentClick}
        />
      </div>

      <div className={styles.filterBar}>
        <div className={styles.priceFilter}>
          <label className={styles.filterLabel}>Max $/night: {priceFilter}</label>
          <input
            type="range"
            className={styles.priceSlider}
            min={20}
            max={500}
            step={10}
            value={priceFilter}
            onChange={(e) => setPriceFilter(Number(e.target.value))}
          />
        </div>
        <div className={styles.vibeFilters}>
          {['All', 'Social', 'Relaxing', 'Adventurous', 'Romantic', 'Budget'].map(
            (v) => (
              <button
                key={v}
                type="button"
                className={`${styles.vibeBtn} ${(v === 'All' ? !vibeFilter : vibeFilter === v) ? styles.vibeBtnActive : ''}`}
                onClick={() =>
                  setVibeFilter(v === 'All' ? null : v)
                }
              >
                {v}
              </button>
            )
          )}
        </div>
      </div>

      {Object.entries(filteredByCountry).map(([country, countryStays]) => {
        const flag = countryStays[0]?.flag ?? '';
        return (
          <div key={country} className={styles.countryGroup}>
            <h3 className={styles.countryHeader}>
              <span className={styles.countryFlag}>{flag}</span>
              {country}
            </h3>
            <div className={styles.grid}>
              {countryStays.map((stay) => (
                <StayCard
                  key={stay.id}
                  stay={stay}
                  isSelected={selectedStayId === stay.id}
                  onSelect={() =>
                    setSelectedStayId((prev) => (prev === stay.id ? null : stay.id))
                  }
                  onUpdate={onUpdateStay}
                  onDelete={onDeleteStay}
                  buddyNames={buddyNames}
                  onEdit={openEditStay}
                />
              ))}
            </div>
          </div>
        );
      })}

      {onAddStay && (
        <AddStayForm
          open={showAdd}
          onOpenChange={(open) => {
            setShowAdd(open);
            if (!open) {
              setEditingStay(null);
            }
          }}
          onSubmit={async (partial) => {
            const prepared = prepareStay(partial, editingStay ?? stayDefaults);
            if (editingStay) {
              await onUpdateStay(editingStay.id, prepared);
            } else {
              await onAddStay(prepared);
            }
          }}
          defaults={stayDefaults}
          buddyNames={buddyNames}
          title={editingStay ? 'Edit Stay' : 'Add Stay'}
          description={
            editingStay
              ? 'Update the stay details, dates, and booking status.'
              : 'Add a new stay manually if you do not want to import it from a booking file.'
          }
          submitLabel={editingStay ? 'Save Changes' : 'Add Stay'}
        />
      )}

      {onImportStays && (
        <StayImportReviewDialog
          open={showImportReview}
          drafts={importDrafts}
          buddyNames={buddyNames}
          onOpenChange={(open) => {
            setShowImportReview(open);
            if (!open) {
              setImportDrafts([]);
            }
          }}
          onConfirm={handleConfirmImport}
        />
      )}
    </section>
  );
}
