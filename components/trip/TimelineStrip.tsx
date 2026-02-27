'use client';

import { motion } from 'framer-motion';
import type { ItinerarySegment } from '@/lib/constants';
import { CITY_IMAGES, fmtDate } from '@/lib/constants';
import styles from './TimelineStrip.module.css';

export interface TimelineStripProps {
  itinerary: ItinerarySegment[];
}

export function TimelineStrip({ itinerary }: TimelineStripProps) {
  const totalNights = itinerary.reduce((sum, seg) => sum + seg.nights, 0);

  return (
    <div className={styles.strip}>
      {itinerary.map((seg, i) => {
        const pct = Math.max((seg.nights / totalNights) * 100, 8);
        const imageUrl = CITY_IMAGES[seg.city];

        return (
          <motion.div
            key={seg.id}
            className={styles.card}
            style={{ flex: `0 0 ${pct}%` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={seg.city}
                className={styles.cardImage}
              />
            )}
            <div className={styles.overlay} />
            {i < itinerary.length - 1 && (
              <div className={styles.chevron} aria-hidden>›</div>
            )}
            <div className={styles.content}>
              <div className={styles.flag}>{seg.flag}</div>
              <div className={styles.cityName}>{seg.city}</div>
              <div className={styles.date}>{fmtDate(seg.startDate)}</div>
              <div className={styles.nights}>{seg.nights}n</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
