'use client';

import type { Activity } from '@/lib/constants';
import {
  BUDDIES,
  ACTIVITY_IMAGES,
  fmtDate,
} from '@/lib/constants';
import { Dropdown } from '@/components/ui/Dropdown';
import styles from './ActivityCard.module.css';

export interface ActivityCardProps {
  activity: Activity;
  onUpdate: (id: string, changes: Partial<Activity>) => void;
}

export function ActivityCard({ activity, onUpdate }: ActivityCardProps) {
  const imageUrl =
    activity.status === 'Booked' ? ACTIVITY_IMAGES[activity.name] : null;
  const isBooked = activity.status === 'Booked';

  const bookedByOptions = [
    ...BUDDIES.map((b) => ({ label: b.name, value: b.name })),
    { label: 'None', value: '' },
  ];

  const handleBookedByChange = (value: string) => {
    if (value) {
      onUpdate(activity.id, { bookedBy: value, status: 'Booked' });
    } else {
      onUpdate(activity.id, { bookedBy: null, status: 'Considering' });
    }
  };

  return (
    <article className={styles.card}>
      {imageUrl && (
        <div className={styles.header}>
          <img src={imageUrl} alt={activity.name} className={styles.headerImage} />
          <div className={styles.overlay} />
        </div>
      )}
      <div className={styles.body}>
        <h3 className={styles.name}>{activity.name}</h3>
        <div className={styles.meta}>
          <span
            className={`${styles.statusTag} ${isBooked ? styles.statusBooked : styles.statusConsidering}`}
          >
            {activity.status}
          </span>
          <span>{fmtDate(activity.date)}</span>
          <span className={styles.cost}>${activity.cost}/person</span>
        </div>

        <div className={styles.individualRow} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            id={`individual-${activity.id}`}
            checked={activity.individual}
            onChange={(e) =>
              onUpdate(activity.id, { individual: e.target.checked })
            }
          />
          <label htmlFor={`individual-${activity.id}`}>
            Individual (no cost split)
          </label>
        </div>

        <div className={styles.bookedByRow} onClick={(e) => e.stopPropagation()}>
          <span className={styles.bookedByLabel}>Booked By</span>
          <div className={styles.bookedByDropdown}>
            <Dropdown
              value={activity.bookedBy}
              options={bookedByOptions}
              onChange={handleBookedByChange}
              placeholder="None"
            />
          </div>
        </div>

        {isBooked ? (
          <a
            href={activity.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionLink}
          >
            View Booking
          </a>
        ) : (
          <a
            href={activity.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionLink}
          >
            Book Now
          </a>
        )}
      </div>
    </article>
  );
}
