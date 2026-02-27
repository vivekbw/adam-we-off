'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { useTrips, type TripRow } from '@/hooks/useTrips';
import { CITY_IMAGES, BUDDIES, daysBetween, fmtDate } from '@/lib/constants';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

function TripCard({ trip, index }: { trip: TripRow; index: number }) {
  const cityKey = trip.cover_city ?? '';
  const coverSrc =
    CITY_IMAGES[cityKey] ??
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80';
  const dayCount =
    trip.start_date && trip.end_date
      ? daysBetween(trip.start_date, trip.end_date)
      : null;

  return (
    <motion.article
      className={styles.tripCard}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Link href={`/trip/${trip.id}`} className={styles.tripLink}>
        <div className={styles.cover}>
          <Image
            src={coverSrc}
            alt={trip.name}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className={styles.coverImg}
          />
        </div>
        <div className={styles.content}>
          <h2 className={styles.tripTitle}>{trip.name}</h2>
          <p className={styles.dates}>
            {trip.start_date && trip.end_date
              ? `${fmtDate(trip.start_date)} – ${fmtDate(trip.end_date)}`
              : 'Dates TBD'}
            {dayCount ? ` · ${dayCount} days` : ''}
          </p>
          <div className={styles.buddies}>
            {BUDDIES.map((b) => (
              <div
                key={b.id}
                className={styles.avatar}
                style={{ backgroundColor: b.color }}
                title={b.name}
              >
                {b.avatar}
              </div>
            ))}
          </div>
          {trip.cover_city && (
            <div className={styles.cities}>
              <span className={styles.cityTag}>{trip.cover_city}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

export default function HomePage() {
  const { trips, isLoading } = useTrips();

  return (
    <div className={styles.page}>
      <TopBar
        pathname="/"
        onBuddiesClick={() => {}}
        onSplitClick={() => {}}
      />
      <main className={styles.main}>
        <h1 className={styles.heading}>Your trips</h1>
        <div className={styles.grid}>
          {isLoading && (
            <>
              <Skeleton width="100%" height="280px" borderRadius="var(--radius-lg)" />
              <Skeleton width="100%" height="280px" borderRadius="var(--radius-lg)" />
            </>
          )}

          {!isLoading &&
            trips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} />
            ))}

          {!isLoading && trips.length === 0 && (
            <div className={styles.empty}>
              <p>No trips yet. Create your first one!</p>
            </div>
          )}

          <motion.article
            className={styles.newTripCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: trips.length * 0.06 + 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <Link href="#" className={styles.newTripLink}>
              <span className={styles.plus}>+</span>
              <span className={styles.newTripLabel}>Plan a new trip</span>
            </Link>
          </motion.article>
        </div>
      </main>
    </div>
  );
}
