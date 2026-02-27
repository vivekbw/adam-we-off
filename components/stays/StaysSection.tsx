'use client';

import { useState, useMemo } from 'react';
import type { Stay, ItinerarySegment } from '@/lib/constants';
import { StayCoverage } from './StayCoverage';
import { StayCard } from './StayCard';
import { AddStayForm } from './AddStayForm';
import { Button } from '@/components/ui/button';
import styles from './StaysSection.module.css';

export interface StaysSectionProps {
  stays: Stay[];
  onUpdateStay: (id: string, changes: Partial<Stay>) => void;
  onAddStay?: (partial: Partial<Stay>) => void;
  onDeleteStay?: (id: string) => void;
  itinerary: ItinerarySegment[];
}

export function StaysSection({
  stays,
  onUpdateStay,
  onAddStay,
  onDeleteStay,
  itinerary,
}: StaysSectionProps) {
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState(100);
  const [vibeFilter, setVibeFilter] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

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
          <Button onClick={() => setShowAdd(true)}>+ Add Stay</Button>
        )}
      </header>

      <div className={styles.coverage}>
        <StayCoverage stays={stays} onSegmentClick={handleSegmentClick} />
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
                />
              ))}
            </div>
          </div>
        );
      })}

      {onAddStay && (
        <AddStayForm
          open={showAdd}
          onOpenChange={setShowAdd}
          onAdd={(partial) => {
            onAddStay(partial);
            setShowAdd(false);
          }}
        />
      )}
    </section>
  );
}
