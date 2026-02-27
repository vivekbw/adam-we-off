'use client';

import { useState, useMemo } from 'react';
import type { Activity, ItinerarySegment } from '@/lib/constants';
import { fmtDate } from '@/lib/constants';
import { ActivityCard } from './ActivityCard';
import { AddActivityForm } from './AddActivityForm';
import styles from './ActivitiesSection.module.css';

const VIBES = ['All', 'Active', 'Relaxing', 'Adventurous', 'Food', 'Culture'];

const ACTIVITY_VIBE_MAP: Record<string, string[]> = {
  Active: ['sport', 'hike', 'bike', 'motorbike', 'muay thai', 'baseball', 'sumo'],
  Relaxing: ['spa', 'yoga', 'beach', 'sunset', 'boat'],
  Adventurous: ['tour', 'loop', 'motorbike', 'adventure'],
  Food: ['food', 'cooking', 'street food', 'tour'],
  Culture: ['temple', 'monkey', 'fire dance', 'teamlab', 'shibuya', 'sacred'],
};

export interface ActivitiesSectionProps {
  activities: Activity[];
  onUpdateActivity: (id: string, changes: Partial<Activity>) => void;
  onAddActivity?: (activity: Partial<Activity>) => void;
  onDeleteActivity?: (id: string) => void;
  itinerary: ItinerarySegment[];
}

export function ActivitiesSection({
  activities,
  onUpdateActivity,
  onAddActivity,
  onDeleteActivity,
  itinerary,
}: ActivitiesSectionProps) {
  const [vibeFilter, setVibeFilter] = useState<string>('All');

  const citySegments = useMemo(() => {
    const map = new Map<string, ItinerarySegment>();
    for (const seg of itinerary) {
      if (!map.has(seg.city)) map.set(seg.city, seg);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [itinerary]);

  const filteredActivities = useMemo(() => {
    if (vibeFilter === 'All') return activities;
    const keywords = ACTIVITY_VIBE_MAP[vibeFilter];
    if (!keywords) return activities;
    return activities.filter((a) =>
      keywords.some((k) => a.name.toLowerCase().includes(k))
    );
  }, [activities, vibeFilter]);

  const activitiesByCity = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    for (const act of filteredActivities) {
      if (!grouped[act.city]) grouped[act.city] = [];
      grouped[act.city].push(act);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }
    return grouped;
  }, [filteredActivities]);

  const handleAddActivity = (city: string, seg: ItinerarySegment) => {
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
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>Activities</h2>
        <p className={styles.subtitle}>
          {activities.filter((a) => a.status === 'Booked').length} of{' '}
          {activities.length} booked
        </p>
      </header>

      <div className={styles.vibeBar}>
        {VIBES.map((v) => (
          <button
            key={v}
            type="button"
            className={`${styles.vibeBtn} ${vibeFilter === v ? styles.vibeBtnActive : ''}`}
            onClick={() => setVibeFilter(v)}
          >
            {v}
          </button>
        ))}
      </div>

      {citySegments.map((seg) => {
        const cityActivities = activitiesByCity[seg.city] ?? [];
        return (
          <div key={seg.city} className={styles.cityGroup}>
            <h3 className={styles.cityHeader}>
              <span className={styles.cityFlag}>{seg.flag}</span>
              {seg.city}
              <span className={styles.cityDates}>
                {fmtDate(seg.startDate)} – {fmtDate(seg.endDate)}
              </span>
            </h3>
            <div className={styles.grid}>
              {cityActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onUpdate={onUpdateActivity}
                  onDelete={onDeleteActivity}
                />
              ))}
              {onAddActivity && (
                <AddActivityForm
                  city={seg.city}
                  onAdd={handleAddActivity(seg.city, seg)}
                />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
