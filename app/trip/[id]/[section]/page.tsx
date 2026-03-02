'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { TopBar } from '@/components/layout/TopBar';
import { FlightsSection } from '@/components/flights/FlightsSection';
import { StaysSection } from '@/components/stays/StaysSection';
import { ActivitiesSection } from '@/components/activities/ActivitiesSection';
import { NotesSection } from '@/components/notes/NotesSection';
import { useItinerary } from '@/hooks/useTrip';
import { useFlights } from '@/hooks/useFlights';
import { useStays } from '@/hooks/useStays';
import { useActivities } from '@/hooks/useActivities';
import { useNotes } from '@/hooks/useNotes';
import { useBuddies } from '@/hooks/useBuddies';
import { useTripDetail } from '@/hooks/useTrips';
import styles from './page.module.css';

const ChatPanel = dynamic(
  () => import('@/components/chat/ChatPanel').then((m) => ({ default: m.ChatPanel })),
  { ssr: false }
);

const SECTION_MAP = {
  flights: 'Flights',
  stays: 'Stays',
  activities: 'Activities',
  notes: 'Notes',
} as const;

type SectionId = keyof typeof SECTION_MAP;

function isValidSection(s: string): s is SectionId {
  return s in SECTION_MAP;
}

export default function SectionPage() {
  const params = useParams();
  const id = params.id as string;
  const section = params.section as string;
  const { trip } = useTripDetail(id);
  const tripName = trip?.name ?? 'Loading…';

  const { itinerary } = useItinerary(id);
  const { flights, addFlight, deleteFlight } = useFlights(id);
  const { stays, updateStay, addStay, deleteStay } = useStays(id);
  const { activities, updateActivity, addActivity, deleteActivity } = useActivities(id);
  const { notes, addNote, editNote, deleteNote } = useNotes(id);
  const { buddies } = useBuddies(id);
  const buddyNames = buddies.map((b) => b.name);

  if (!isValidSection(section)) {
    return (
      <div className={styles.page}>
        <TopBar
          pathname={`/trip/${id}/${section}`}
          tripName={tripName}
          onBuddiesClick={() => {}}
          onSplitClick={() => {}}
        />
        <main className={styles.main}>
          <p className={styles.notFound}>Section &quot;{section}&quot; not found.</p>
          <Link href={`/trip/${id}`} className={styles.backLink}>
            ← Back to trip
          </Link>
        </main>
        <ChatPanel />
      </div>
    );
  }

  const renderSection = () => {
    switch (section) {
      case 'flights':
        return (
          <FlightsSection
            flights={flights}
            onAddFlight={addFlight}
            onDeleteFlight={deleteFlight}
            itinerary={itinerary}
          />
        );
      case 'stays':
        return (
          <StaysSection
            stays={stays}
            onUpdateStay={updateStay}
            onAddStay={addStay}
            onDeleteStay={deleteStay}
            itinerary={itinerary}
            buddyNames={buddyNames}
          />
        );
      case 'activities':
        return (
          <ActivitiesSection
            activities={activities}
            onUpdateActivity={updateActivity}
            onAddActivity={addActivity}
            onDeleteActivity={deleteActivity}
            itinerary={itinerary}
            buddyNames={buddyNames}
          />
        );
      case 'notes':
        return (
          <NotesSection
            notes={notes}
            onAddNote={addNote}
            onEditNote={editNote}
            onDeleteNote={deleteNote}
            buddyNames={buddyNames}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      <TopBar
        pathname={`/trip/${id}/${section}`}
        tripName={tripName}
        onBuddiesClick={() => {}}
        onSplitClick={() => {}}
      />
      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href={`/trip/${id}`} className={styles.breadcrumbLink}>
            ← Trip Overview
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span>{SECTION_MAP[section]}</span>
        </div>
        {renderSection()}
      </main>
      <ChatPanel />
    </div>
  );
}
