'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { TopBar } from '@/components/layout/TopBar';
import { TimelineStrip } from '@/components/trip/TimelineStrip';
import { TripPlanner } from '@/components/trip/TripPlanner';
import { ValidationWarnings } from '@/components/trip/ValidationWarnings';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Input } from '@/components/ui/input';
import { useItinerary } from '@/hooks/useTrip';
import { useFlights } from '@/hooks/useFlights';
import { useStays } from '@/hooks/useStays';
import { useActivities } from '@/hooks/useActivities';
import { useNotes } from '@/hooks/useNotes';
import { useExpenses } from '@/hooks/useExpenses';
import { useBuddies } from '@/hooks/useBuddies';
import { useTripDetail, updateTrip } from '@/hooks/useTrips';
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

function EditableTripName({ tripId, name }: { tripId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(name);
  }, [name]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      return;
    }
    const ok = await updateTrip(tripId, { name: trimmed });
    if (!ok) {
      toast.error('Failed to update trip name');
      setValue(name);
    }
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') {
            setValue(name);
            setEditing(false);
          }
        }}
        className="text-2xl font-serif"
      />
    );
  }

  return (
    <h1
      className={styles.heading}
      onClick={() => setEditing(true)}
      title="Click to edit trip name"
      style={{ cursor: 'pointer' }}
    >
      {name}
    </h1>
  );
}

export default function TripPage() {
  const { id } = useParams() as { id: string };
  const { trip } = useTripDetail(id);
  const tripName = trip?.name ?? 'Loading…';

  const { itinerary, updateItinerary, addSegment, removeSegment } = useItinerary(id);
  const { flights } = useFlights(id);
  const { stays } = useStays(id);
  const { activities } = useActivities(id);
  const { notes } = useNotes(id);
  const { expenses, updateExpenses } = useExpenses(id);
  const { buddies } = useBuddies(id);

  const [showBuddies, setShowBuddies] = useState(false);
  const [showSplit, setShowSplit] = useState(false);

  const bookedFlights = flights.filter((f) => f.status === 'Booked').length;
  const bookedStays = stays.filter((s) => s.status === 'Booked').length;
  const bookedActivities = activities.filter((a) => a.status === 'Booked').length;

  async function handlePlannerSave(
    updatedItinerary: typeof itinerary,
    tripDates: { startDate: string; endDate: string },
  ) {
    await updateItinerary(updatedItinerary);

    if (!trip) return;

    const ok = await updateTrip(id, {
      start_date: tripDates.startDate,
      end_date: tripDates.endDate,
    });

    if (!ok) {
      throw new Error('Failed to update trip date bounds');
    }
  }

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
          <EditableTripName tripId={id} name={tripName} />
        </div>

        <TimelineStrip
          itinerary={itinerary}
          tripStartDate={trip?.start_date}
          tripEndDate={trip?.end_date}
        />

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
            <TripPlanner
              itinerary={itinerary}
              tripStartDate={trip?.start_date}
              tripEndDate={trip?.end_date}
              onSave={handlePlannerSave}
              onAddSegment={addSegment}
              onRemoveSegment={removeSegment}
              buddies={buddies}
            />
          </div>
        </div>
      </main>

      <ChatPanel />
      <BuddiesModal isOpen={showBuddies} onClose={() => setShowBuddies(false)} tripId={id} />
      <SplitModal
        isOpen={showSplit}
        onClose={() => setShowSplit(false)}
        expenses={expenses}
        onUpdateExpenses={(updated) => updateExpenses(updated)}
        buddies={buddies}
      />
    </div>
  );
}
