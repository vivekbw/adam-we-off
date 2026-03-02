'use client';

import type { Activity } from '@/lib/constants';
import {
  ACTIVITY_IMAGES,
  fmtDate,
} from '@/lib/constants';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import styles from './ActivityCard.module.css';

export interface ActivityCardProps {
  activity: Activity;
  onUpdate: (id: string, changes: Partial<Activity>) => void;
  onDelete?: (id: string) => void;
  buddyNames?: string[];
}

export function ActivityCard({ activity, onUpdate, onDelete, buddyNames = [] }: ActivityCardProps) {
  const imageUrl =
    activity.status === 'Booked' ? ACTIVITY_IMAGES[activity.name] : null;
  const isBooked = activity.status === 'Booked';

  const bookedByOptions = [
    ...buddyNames.map((n) => ({ label: n, value: n })),
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
          <Checkbox
            id={`individual-${activity.id}`}
            checked={activity.individual}
            onCheckedChange={(checked) =>
              onUpdate(activity.id, { individual: checked === true })
            }
          />
          <Label htmlFor={`individual-${activity.id}`}>
            Individual (no cost split)
          </Label>
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

        <div className={styles.actionRow}>
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
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="xs">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete &quot;{activity.name}&quot;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This activity will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(activity.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </article>
  );
}
