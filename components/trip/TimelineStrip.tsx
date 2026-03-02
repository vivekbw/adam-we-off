'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ItinerarySegment } from '@/lib/constants';
import { CITY_IMAGES, fmtDate } from '@/lib/constants';
import styles from './TimelineStrip.module.css';

const photoCache = new Map<string, string>();
const photoPromises = new Map<string, Promise<string | null>>();

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
  const [url, setUrl] = useState<string | null>(
    hardcoded ?? photoCache.get(city) ?? null
  );

  useEffect(() => {
    if (hardcoded) return;

    const cached = photoCache.get(city);
    if (cached) { setUrl(cached); return; }

    let active = true;
    fetchCityPhoto(city).then((result) => {
      if (active && result) setUrl(result);
    });
    return () => { active = false; };
  }, [city, hardcoded]);

  return url;
}

function SegmentCard({
  seg,
  index,
  basePct,
}: {
  seg: ItinerarySegment;
  index: number;
  basePct: number;
}) {
  const imageUrl = useCityPhoto(seg.city);

  return (
    <motion.div
      className={styles.card}
      style={{ flexBasis: `${basePct}%` }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={seg.city}
          className={styles.cardImage}
          loading="lazy"
        />
      )}
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.flag}>{seg.flag}</div>
        <div className={styles.cityName}>{seg.city}</div>
        <div className={styles.date}>{fmtDate(seg.startDate)}</div>
        <div className={styles.nights}>{seg.nights}n</div>
      </div>
    </motion.div>
  );
}

export interface TimelineStripProps {
  itinerary: ItinerarySegment[];
}

export function TimelineStrip({ itinerary }: TimelineStripProps) {
  const totalNights = itinerary.reduce((sum, seg) => sum + seg.nights, 0);

  return (
    <div className={styles.strip}>
      {itinerary.map((seg, i) => {
        const basePct = Math.max((seg.nights / totalNights) * 100, 8);
        return (
          <SegmentCard
            key={seg.id}
            seg={seg}
            index={i}
            basePct={basePct}
          />
        );
      })}
    </div>
  );
}
