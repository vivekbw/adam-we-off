'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Building2 } from 'lucide-react';
import { daysBetween, type Stay, type ItinerarySegment } from '@/lib/constants';
import { StayCoverage } from './StayCoverage';
import { StayCard } from './StayCard';
import { AddStayForm } from './AddStayForm';
import { StaySearchResults } from './StaySearchResults';
import { useStaySearch } from '@/hooks/useStaySearch';
import { Button } from '@/components/ui/button';
import styles from './StaysSection.module.css';

interface SuggestedStay {
  city: string;
  flag: string;
  country: string;
  checkIn: string;
  checkOut: string;
}

function computeSuggestedStays(
  itinerary: ItinerarySegment[],
  stays: Stay[]
): SuggestedStay[] {
  if (itinerary.length === 0) return [];

  const sorted = [...itinerary].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const coveredCities = new Set(
    stays.map((s) => s.city.toLowerCase())
  );

  const suggestions: SuggestedStay[] = [];
  const seen = new Set<string>();

  for (const seg of sorted) {
    const key = seg.city.toLowerCase();
    if (!coveredCities.has(key) && !seen.has(key)) {
      seen.add(key);
      suggestions.push({
        city: seg.city,
        flag: seg.flag,
        country: seg.country,
        checkIn: seg.startDate,
        checkOut: seg.endDate,
      });
    }
  }

  return suggestions;
}

export interface StaysSectionProps {
  stays: Stay[];
  onUpdateStay: (id: string, changes: Partial<Stay>) => void;
  onAddStay?: (partial: Partial<Stay>) => void;
  onDeleteStay?: (id: string) => void;
  itinerary: ItinerarySegment[];
  buddyNames?: string[];
  onAddExpense?: (expense: { description: string; amount: number; currency: string; paidBy: string; split: string[]; date: string; category: string }) => void;
}

export function StaysSection({
  stays,
  onUpdateStay,
  onAddStay,
  onDeleteStay,
  itinerary,
  buddyNames = [],
  onAddExpense,
}: StaysSectionProps) {
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState(100);
  const [vibeFilter, setVibeFilter] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [activeSearch, setActiveSearch] = useState<SuggestedStay | null>(null);

  const staySearch = useStaySearch();

  const bookedCount = stays.filter((s) => s.status === 'Booked').length;

  const suggested = useMemo(
    () => computeSuggestedStays(itinerary, stays),
    [itinerary, stays]
  );

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

  const handleSuggestClick = (suggestion: SuggestedStay) => {
    setActiveSearch(suggestion);
    staySearch.search(suggestion.city, suggestion.checkIn, suggestion.checkOut);
  };

  const handleManualAdd = (suggestion: SuggestedStay) => {
    if (!onAddStay) return;
    const nights = suggestion.checkIn && suggestion.checkOut
      ? Math.max(1, daysBetween(suggestion.checkIn, suggestion.checkOut))
      : 1;
    onAddStay({
      city: suggestion.city,
      country: suggestion.country,
      flag: suggestion.flag,
      checkIn: suggestion.checkIn,
      checkOut: suggestion.checkOut,
      nights,
      status: 'Need to Book',
    });
  };

  const handleCloseSearch = useCallback(() => {
    setActiveSearch(null);
    staySearch.clear();
  }, [staySearch]);

  const handleAddFromSearch = useCallback(
    (partial: Partial<Stay>) => {
      if (onAddStay) {
        if (activeSearch) {
          partial.country = activeSearch.country;
          partial.flag = activeSearch.flag;
        }
        onAddStay(partial);
      }
      handleCloseSearch();
    },
    [onAddStay, activeSearch, handleCloseSearch]
  );

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

      {suggested.length > 0 && (
        <div className={styles.suggestions}>
          <p className={styles.suggestLabel}>Missing stays</p>
          <div className={styles.suggestList}>
            {suggested.map((s, i) => (
              <div key={i} className={styles.suggestGroup}>
                <button
                  type="button"
                  className={`${styles.suggestChip} ${
                    activeSearch?.city === s.city
                      ? styles.suggestChipActive
                      : ''
                  }`}
                  onClick={() => handleSuggestClick(s)}
                  title="Search for hotels &amp; hostels"
                >
                  <Search size={11} />
                  <span>{s.flag} {s.city}</span>
                  <Building2 size={13} className={styles.suggestIcon} />
                </button>
                {onAddStay && (
                  <button
                    type="button"
                    className={styles.suggestManual}
                    onClick={() => handleManualAdd(s)}
                    title="Add stay manually"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSearch && (
        <StaySearchResults
          offers={staySearch.offers}
          loading={staySearch.loading}
          error={staySearch.error}
          city={activeSearch.city}
          flag={activeSearch.flag}
          onClose={handleCloseSearch}
          onAddStay={onAddStay ? handleAddFromSearch : undefined}
        />
      )}

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
            if (partial.bookedBy && onAddExpense) {
              const nights = partial.nights ?? 0;
              const total = (partial.costPerNight ?? 0) * nights;
              if (total > 0) {
                onAddExpense({
                  description: `${partial.name ?? 'Stay'} – ${partial.city ?? ''} (${nights}n)`,
                  amount: total,
                  currency: 'CAD',
                  paidBy: partial.bookedBy,
                  split: buddyNames,
                  date: partial.checkIn ?? new Date().toISOString().slice(0, 10),
                  category: 'Accommodation',
                });
              }
            }
            setShowAdd(false);
          }}
          itinerary={itinerary}
          buddyNames={buddyNames}
        />
      )}
    </section>
  );
}
