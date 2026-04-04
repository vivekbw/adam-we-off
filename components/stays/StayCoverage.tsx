'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CITY_IMAGES, fmtDate, type ItinerarySegment, type Stay } from '@/lib/constants';
import styles from './StayCoverage.module.css';

export interface StayCoverageProps {
  stays: Stay[];
  itinerary: ItinerarySegment[];
  onSegmentClick?: (stay: Stay) => void;
}

const photoCache = new Map<string, string>();
const photoPromises = new Map<string, Promise<string | null>>();

function normalizePlace(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fetchCityPhoto(city: string): Promise<string | null> {
  if (photoCache.has(city)) return photoCache.get(city)!;

  const existing = photoPromises.get(city);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(
        `/api/places/search?query=${encodeURIComponent(city + ' city')}&type=tourist_attraction`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const photoRef = data?.results?.[0]?.photoRef;
      if (!photoRef) return null;
      const photoUrl = `/api/places/details?photoRef=${encodeURIComponent(photoRef)}&maxWidth=800`;
      photoCache.set(city, photoUrl);
      return photoUrl;
    } catch {
      return null;
    } finally {
      photoPromises.delete(city);
    }
  })();

  photoPromises.set(city, promise);
  return promise;
}

function useCityPhoto(city: string): string | null {
  const hardcoded = CITY_IMAGES[city];
  const [url, setUrl] = useState<string | null>(hardcoded ?? photoCache.get(city) ?? null);

  useEffect(() => {
    if (hardcoded) return;

    const cached = photoCache.get(city);
    if (cached) {
      setUrl(cached);
      return;
    }

    let active = true;
    fetchCityPhoto(city).then((result) => {
      if (active && result) setUrl(result);
    });

    return () => {
      active = false;
    };
  }, [city, hardcoded]);

  return url;
}

function findStayForSegment(segment: ItinerarySegment, stays: Stay[]) {
  const segmentCity = normalizePlace(segment.city);
  const segmentCountry = normalizePlace(segment.country);

  return stays.find((stay) => {
    const sameCity = normalizePlace(stay.city) === segmentCity;
    const sameCountry = normalizePlace(stay.country) === segmentCountry;
    const sameStartDate = stay.checkIn === segment.startDate;
    return sameCity || (sameCountry && sameStartDate);
  });
}

function SegmentCard({
  segment,
  stay,
  basePct,
  index,
  onSegmentClick,
}: {
  segment: ItinerarySegment;
  stay?: Stay;
  basePct: number;
  index: number;
  onSegmentClick?: (stay: Stay) => void;
}) {
  const imageUrl = useCityPhoto(segment.city);
  const isBooked = stay?.status === 'Booked';
  const statusLabel = isBooked ? 'Booked' : 'Need to Book';
  const statusClass = isBooked ? styles.statusBooked : styles.statusPending;

  return (
    <motion.button
      type="button"
      className={styles.card}
      style={{ flexBasis: `${basePct}%` }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => {
        if (stay) onSegmentClick?.(stay);
      }}
      disabled={!stay}
      aria-label={`${segment.city}, ${statusLabel}`}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={segment.city}
          className={styles.cardImage}
          loading="lazy"
        />
      )}
      <div className={styles.overlay} />
      <div className={`${styles.statusWash} ${statusClass}`} />
      <div className={styles.content}>
        <div className={styles.flag}>{segment.flag}</div>
        <div className={styles.cityName}>{segment.city}</div>
        <div className={styles.date}>
          {fmtDate(segment.startDate)} → {fmtDate(segment.endDate)}
        </div>
        <div className={styles.stayName}>
          {stay?.name || `${segment.city} stay`}
        </div>
      </div>
      <div className={`${styles.statusTag} ${statusClass}`}>
        {statusLabel}
      </div>
    </motion.button>
  );
}

export function StayCoverage({ stays, itinerary, onSegmentClick }: StayCoverageProps) {
  const totalNights = itinerary.reduce((sum, segment) => sum + segment.nights, 0);
  if (totalNights === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.strip}>
        {itinerary.map((segment, index) => {
          const pct = totalNights > 0 ? Math.max((segment.nights / totalNights) * 100, 8) : 0;
          const stay = findStayForSegment(segment, stays);
          return (
            <SegmentCard
              key={segment.id}
              segment={segment}
              stay={stay}
              basePct={pct}
              index={index}
              onSegmentClick={onSegmentClick}
            />
          );
        })}
      </div>
    </div>
  );
}
