'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { TopBar } from '@/components/layout/TopBar';
import { useTrips, deleteTrip, type TripRow } from '@/hooks/useTrips';
import { CITY_IMAGES, BUDDIES, daysBetween, fmtDate } from '@/lib/constants';
import { Skeleton } from '@/components/ui/Skeleton';
import { NewTripModal } from '@/components/trip/NewTripModal';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import styles from './page.module.css';

function TripCard({ trip, index, onDeleted }: { trip: TripRow; index: number; onDeleted: () => void }) {
  const cityKey = trip.cover_city ?? '';
  const coverSrc =
    CITY_IMAGES[cityKey] ??
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80';
  const dayCount =
    trip.start_date && trip.end_date
      ? daysBetween(trip.start_date, trip.end_date)
      : null;

  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const ok = await deleteTrip(trip.id);
    if (ok) {
      toast.success(`"${trip.name}" deleted`);
      onDeleted();
    } else {
      toast.error('Failed to delete trip');
    }
    setDeleting(false);
  }

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      {hovered && (
        <div
          className={styles.deleteBtn}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon-xs"
                onClick={(e) => e.stopPropagation()}
              >
                ✕
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{trip.name}&quot; and all its data (flights, stays, activities, notes) will be permanently removed. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Yes, delete trip'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </motion.article>
  );
}

export default function HomePage() {
  const { trips, isLoading, mutate } = useTrips();
  const [showNewTrip, setShowNewTrip] = useState(false);

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
              <TripCard key={trip.id} trip={trip} index={i} onDeleted={() => mutate()} />
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
            <button
              type="button"
              className={styles.newTripLink}
              onClick={() => setShowNewTrip(true)}
            >
              <span className={styles.plus}>+</span>
              <span className={styles.newTripLabel}>Plan a new trip</span>
            </button>
          </motion.article>
        </div>
      </main>

      <NewTripModal open={showNewTrip} onOpenChange={setShowNewTrip} />
    </div>
  );
}
