'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { TopBar } from '@/components/layout/TopBar';
import { TimelineStrip } from '@/components/trip/TimelineStrip';
import { TripPlanner } from '@/components/trip/TripPlanner';
import { ValidationWarnings } from '@/components/trip/ValidationWarnings';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useItinerary } from '@/hooks/useTrip';
import { useFlights } from '@/hooks/useFlights';
import { useStays } from '@/hooks/useStays';
import { useActivities } from '@/hooks/useActivities';
import { useNotes } from '@/hooks/useNotes';
import { useExpenses } from '@/hooks/useExpenses';
import { useTripDetail } from '@/hooks/useTrips';
import { fmtDate, daysBetween } from '@/lib/constants';
import styles from './page.module.css';

const SplitModal = dynamic(
  () => import('@/components/expenses/SplitModal').then((m) => ({ default: m.SplitModal })),
  { ssr: false }
);
const BuddiesModal = dynamic(
  () => import('@/components/chat/BuddiesModal').then((m) => ({ default: m.BuddiesModal })),
  { ssr: false }
);
const ChatPanel = dynamic(
  () => import('@/components/chat/ChatPanel').then((m) => ({ default: m.ChatPanel })),
  { ssr: false }
);

export default function TripPage() {
  const { id } = useParams() as { id: string };
  const { trip } = useTripDetail(id);
  const tripName = trip?.name ?? 'Loading…';

  const { itinerary, updateItinerary } = useItinerary(id);
  const { flights } = useFlights(id);
  const { stays } = useStays(id);
  const { activities } = useActivities(id);
  const { notes } = useNotes(id);
  const { expenses, updateExpenses } = useExpenses(id);

  const [showBuddies, setShowBuddies] = useState(false);
  const [showSplit, setShowSplit] = useState(false);

  const totalDays =
    itinerary.length > 0
      ? daysBetween(itinerary[0].startDate, itinerary[itinerary.length - 1].endDate)
      : 20;

  const bookedFlights = flights.filter((f) => f.status === 'Booked').length;
  const bookedStays = stays.filter((s) => s.status === 'Booked').length;
  const bookedActivities = activities.filter((a) => a.status === 'Booked').length;

  const sections = [
    {
      id: 'flights',
      emoji: '✈️',
      label: 'Flights',
      sub: `${flights.length} segments`,
      done: bookedFlights,
      total: flights.length,
      color: '#C2491D',
    },
    {
      id: 'stays',
      emoji: '🛏️',
      label: 'Stays',
      sub: `${stays.length} cities`,
      done: bookedStays,
      total: stays.length,
      color: '#2D6A4F',
    },
    {
      id: 'activities',
      emoji: '⭐',
      label: 'Activities',
      sub: `${activities.length} planned`,
      done: bookedActivities,
      total: activities.length,
      color: '#6B4C9A',
    },
    {
      id: 'notes',
      emoji: '📝',
      label: 'Trip Notes',
      sub: `${notes.length} items`,
      done: notes.length,
      total: notes.length,
      color: '#B8860B',
    },
  ];

  return (
    <div className={styles.page}>
      <TopBar
        pathname={`/trip/${id}`}
        tripName={tripName}
        onBuddiesClick={() => setShowBuddies(true)}
        onSplitClick={() => setShowSplit(true)}
      />
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heading}>{tripName}</h1>
          <p className={styles.dates}>
            {itinerary.length > 0
              ? `${fmtDate(itinerary[0].startDate)} – ${fmtDate(itinerary[itinerary.length - 1].endDate)} · ${totalDays} days`
              : ''}
          </p>
        </div>

        <TimelineStrip itinerary={itinerary} />

        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.sectionGrid}>
              {sections.map((s) => (
                <Link
                  key={s.id}
                  href={`/trip/${id}/${s.id}`}
                  className={styles.sectionCard}
                >
                  <div>
                    <div className={styles.sectionEmoji}>{s.emoji}</div>
                    <div className={styles.sectionLabel}>{s.label}</div>
                    <div className={styles.sectionSub}>{s.sub}</div>
                  </div>
                  <ProgressRing done={s.done} total={s.total} color={s.color} label="booked" />
                </Link>
              ))}
            </div>

            <ValidationWarnings />
          </div>

          <div className={styles.right}>
            <TripPlanner itinerary={itinerary} onSave={updateItinerary} />
          </div>
        </div>
      </main>

      <ChatPanel />
      <BuddiesModal isOpen={showBuddies} onClose={() => setShowBuddies(false)} />
      <SplitModal
        isOpen={showSplit}
        onClose={() => setShowSplit(false)}
        expenses={expenses}
        onUpdateExpenses={(updated) => updateExpenses(updated)}
      />
    </div>
  );
}
