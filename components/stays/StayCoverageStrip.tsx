'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle } from 'lucide-react';
import type { Stay, ItinerarySegment } from '@/lib/constants';
import { CITY_IMAGES, fmtDate } from '@/lib/constants';
import styles from './StayCoverageStrip.module.css';

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

interface CityBookingStatus {
  seg: ItinerarySegment;
  bookedNights: number;
  totalNights: number;
  status: 'booked' | 'partial' | 'pending';
}

function computeCityStatuses(
  itinerary: ItinerarySegment[],
  stays: Stay[]
): CityBookingStatus[] {
  return itinerary.map((seg) => {
    const cityStays = stays.filter(
      (s) => s.city.toLowerCase() === seg.city.toLowerCase()
    );
    const bookedNights = cityStays
      .filter((s) => s.status === 'Booked')
      .reduce((sum, s) => sum + s.nights, 0);
    const totalCoveredNights = cityStays.reduce((sum, s) => sum + s.nights, 0);

    let status: 'booked' | 'partial' | 'pending';
    if (bookedNights >= seg.nights) {
      status = 'booked';
    } else if (totalCoveredNights > 0) {
      status = 'partial';
    } else {
      status = 'pending';
    }

    return { seg, bookedNights, totalNights: seg.nights, status };
  });
}

function CityCard({
  city,
  index,
  basePct,
}: {
  city: CityBookingStatus;
  index: number;
  basePct: number;
}) {
  const imageUrl = useCityPhoto(city.seg.city);

  const overlayClass =
    city.status === 'booked'
      ? styles.statusBooked
      : city.status === 'partial'
        ? styles.statusPartial
        : styles.statusPending;

  const badgeClass =
    city.status === 'booked'
      ? styles.badgeBooked
      : city.status === 'partial'
        ? styles.badgePartial
        : styles.badgePending;

  const badgeLabel =
    city.status === 'booked'
      ? 'Booked'
      : city.status === 'partial'
        ? `${city.bookedNights}/${city.totalNights}n`
        : 'Need Stay';

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
          alt={city.seg.city}
          className={styles.cardImage}
          loading="lazy"
        />
      )}
      <div className={overlayClass + ' ' + styles.statusOverlay} />
      <div className={styles.gradient} />
      <div className={`${styles.statusBadge} ${badgeClass}`}>
        {city.status === 'booked' ? (
          <Check size={9} />
        ) : (
          <AlertTriangle size={9} />
        )}
        {badgeLabel}
      </div>
      <div className={styles.content}>
        <div className={styles.flag}>{city.seg.flag}</div>
        <div className={styles.cityName}>{city.seg.city}</div>
        <div className={styles.dates}>
          {fmtDate(city.seg.startDate)} – {fmtDate(city.seg.endDate)}
        </div>
        <div className={styles.nights}>
          <span className={styles.bookedNights}>
            {city.bookedNights}/{city.totalNights}
          </span>{' '}
          nights
        </div>
      </div>
    </motion.div>
  );
}

export interface StayCoverageStripProps {
  itinerary: ItinerarySegment[];
  stays: Stay[];
}

export function StayCoverageStrip({ itinerary, stays }: StayCoverageStripProps) {
  const statuses = computeCityStatuses(itinerary, stays);
  const totalNights = statuses.reduce((sum, c) => sum + c.totalNights, 0);

  if (statuses.length === 0) return null;

  return (
    <div className={styles.strip}>
      {statuses.map((city, i) => {
        const basePct = Math.max((city.totalNights / totalNights) * 100, 10);
        return <CityCard key={city.seg.id} city={city} index={i} basePct={basePct} />;
      })}
    </div>
  );
}
