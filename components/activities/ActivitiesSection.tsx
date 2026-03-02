'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, CheckCircle2, Circle } from 'lucide-react';
import type { Activity, ItinerarySegment } from '@/lib/constants';
import { fmtDate } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ActivityCard } from './ActivityCard';
import { AddActivityForm } from './AddActivityForm';
import styles from './ActivitiesSection.module.css';

export interface ActivitiesSectionProps {
  activities: Activity[];
  onUpdateActivity: (id: string, changes: Partial<Activity>) => void;
  onAddActivity?: (activity: Partial<Activity>) => void;
  onDeleteActivity?: (id: string) => void;
  itinerary: ItinerarySegment[];
  buddyNames?: string[];
}

export function ActivitiesSection({
  activities,
  onUpdateActivity,
  onAddActivity,
  onDeleteActivity,
  itinerary,
  buddyNames = [],
}: ActivitiesSectionProps) {
  const [activeCityIdx, setActiveCityIdx] = useState(0);
  const [direction, setDirection] = useState(0);

  const citySegments = useMemo(() => {
    const map = new Map<string, ItinerarySegment>();
    for (const seg of itinerary) {
      if (!map.has(seg.city)) map.set(seg.city, seg);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [itinerary]);

  const activitiesByCity = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    for (const act of activities) {
      if (!grouped[act.city]) grouped[act.city] = [];
      grouped[act.city].push(act);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }
    return grouped;
  }, [activities]);

  const currentSeg = citySegments[activeCityIdx];
  const currentActivities = currentSeg ? (activitiesByCity[currentSeg.city] ?? []) : [];
  const bookedCount = currentActivities.filter((a) => a.status === 'Booked').length;

  const navigate = useCallback((idx: number) => {
    setDirection(idx > activeCityIdx ? 1 : -1);
    setActiveCityIdx(idx);
  }, [activeCityIdx]);

  const goPrev = useCallback(() => {
    if (activeCityIdx > 0) navigate(activeCityIdx - 1);
  }, [activeCityIdx, navigate]);

  const goNext = useCallback(() => {
    if (activeCityIdx < citySegments.length - 1) navigate(activeCityIdx + 1);
  }, [activeCityIdx, citySegments.length, navigate]);

  const handleAddActivity = useCallback((city: string, seg: ItinerarySegment) => {
    return (partial: Partial<Activity>) => {
      if (!onAddActivity) return;
      onAddActivity({
        ...partial,
        city,
        country: seg.country,
        flag: seg.flag,
        date: seg.startDate,
      });
    };
  }, [onAddActivity]);

  if (citySegments.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.emptyState}>
          <MapPin size={32} strokeWidth={1.5} />
          <p>Add cities to your itinerary to start planning activities.</p>
        </div>
      </section>
    );
  }

  const totalAllBooked = activities.filter((a) => a.status === 'Booked').length;

  return (
    <section className={styles.section}>
      <header className={styles.topHeader}>
        <div>
          <h2 className={styles.title}>Activities</h2>
          <p className={styles.subtitle}>
            {totalAllBooked} of {activities.length} booked across {citySegments.length} {citySegments.length === 1 ? 'city' : 'cities'}
          </p>
        </div>
      </header>

      <nav className={styles.cityNav}>
        {citySegments.map((seg, i) => {
          const cityActs = activitiesByCity[seg.city] ?? [];
          const cityBooked = cityActs.filter((a) => a.status === 'Booked').length;
          const isActive = i === activeCityIdx;

          return (
            <button
              key={seg.city}
              type="button"
              className={`${styles.cityPill} ${isActive ? styles.cityPillActive : ''}`}
              onClick={() => navigate(i)}
            >
              <span className={styles.pillFlag}>{seg.flag}</span>
              <span className={styles.pillCity}>{seg.city}</span>
              {cityActs.length > 0 && (
                <span className={styles.pillCount}>
                  {cityBooked}/{cityActs.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentSeg.city}
          custom={direction}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={styles.cityPanel}
        >
          <div className={styles.cityHeader}>
            <div className={styles.cityInfo}>
              <span className={styles.cityFlag}>{currentSeg.flag}</span>
              <div>
                <h3 className={styles.cityName}>{currentSeg.city}</h3>
                <span className={styles.cityDates}>
                  {fmtDate(currentSeg.startDate)} – {fmtDate(currentSeg.endDate)} · {currentSeg.nights} nights
                </span>
              </div>
            </div>
            <div className={styles.navArrows}>
              <Button
                variant="outline"
                size="icon"
                disabled={activeCityIdx === 0}
                onClick={goPrev}
                className={styles.arrowBtn}
              >
                <ChevronLeft size={18} />
              </Button>
              <span className={styles.pageIndicator}>
                {activeCityIdx + 1} / {citySegments.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={activeCityIdx === citySegments.length - 1}
                onClick={goNext}
                className={styles.arrowBtn}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>

          {currentActivities.length > 0 && (
            <div className={styles.progressRow}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${currentActivities.length > 0 ? (bookedCount / currentActivities.length) * 100 : 0}%` }}
                />
              </div>
              <div className={styles.progressLabels}>
                <span className={styles.progressStat}>
                  <CheckCircle2 size={13} />
                  {bookedCount} booked
                </span>
                <span className={styles.progressStat}>
                  <Circle size={13} />
                  {currentActivities.length - bookedCount} considering
                </span>
              </div>
            </div>
          )}

          <div className={styles.grid}>
            {currentActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onUpdate={onUpdateActivity}
                onDelete={onDeleteActivity}
                buddyNames={buddyNames}
              />
            ))}
            {onAddActivity && currentSeg && (
              <AddActivityForm
                city={currentSeg.city}
                onAdd={handleAddActivity(currentSeg.city, currentSeg)}
              />
            )}
          </div>

          {currentActivities.length === 0 && (
            <div className={styles.cityEmpty}>
              <MapPin size={20} strokeWidth={1.5} />
              <p>No activities planned for {currentSeg.city} yet.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
