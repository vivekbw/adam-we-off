'use client';

import { useState } from 'react';
import type { Stay } from '@/lib/constants';
import {
  CITY_IMAGES,
  STAY_IMAGES,
  fmtDate,
} from '@/lib/constants';
import { Dropdown } from '@/components/ui/Dropdown';
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
import styles from './StayCard.module.css';

const VIBES = ['Social', 'Relaxing', 'Adventurous', 'Romantic', 'Budget'];
const GUEST_COUNT = 4;

function buildSearchUrls(
  city: string,
  checkIn: string,
  checkOut: string,
  maxPrice: number
): { name: string; url: string }[] {
  const encoded = encodeURIComponent(city);
  return [
    {
      name: 'Booking.com',
      url: `https://www.booking.com/searchresults.html?ss=${encoded}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${GUEST_COUNT}`,
    },
    {
      name: 'Airbnb',
      url: `https://www.airbnb.com/s/${encoded}/homes?check_in=${checkIn}&check_out=${checkOut}&adults=${GUEST_COUNT}`,
    },
    {
      name: 'Hostelworld',
      url: `https://www.hostelworld.com/stays/?search_keywords=${encoded}&checkIn=${checkIn}&checkOut=${checkOut}`,
    },
    {
      name: 'VRBO',
      url: `https://www.vrbo.com/search?location=${encoded}&checkIn=${checkIn}&checkOut=${checkOut}`,
    },
  ];
}

export interface StayCardProps {
  stay: Stay;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, changes: Partial<Stay>) => void;
  onDelete?: (id: string) => void;
  buddyNames?: string[];
}

export function StayCard({ stay, isSelected, onSelect, onUpdate, onDelete, buddyNames = [] }: StayCardProps) {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState(100);
  const [showMap, setShowMap] = useState(false);

  const imageUrl = STAY_IMAGES[stay.name] ?? CITY_IMAGES[stay.city] ?? null;
  const isBooked = stay.status === 'Booked';
  const totalCost = stay.costPerNight * stay.nights;

  const bookedByOptions = [
    ...buddyNames.map((n) => ({ label: n, value: n })),
    { label: 'None', value: '' },
  ];

  const handleBookedByChange = (value: string) => {
    if (value) {
      onUpdate(stay.id, { bookedBy: value, status: 'Booked' });
    } else {
      onUpdate(stay.id, { bookedBy: null, status: 'Need to Book' });
    }
  };

  const searchUrls = buildSearchUrls(stay.city, stay.checkIn, stay.checkOut, priceRange);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.city + ', ' + stay.country)}`;

  return (
    <article
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className={styles.header}>
        {imageUrl && (
          <img src={imageUrl} alt={stay.name} className={styles.headerImage} />
        )}
        <div className={styles.overlay} />
        <span
          className={`${styles.statusTag} ${isBooked ? styles.statusBooked : styles.statusPending}`}
        >
          {stay.status}
        </span>
        <div className={styles.headerInfo}>
          <div className={styles.cityName}>{stay.city}</div>
          <div className={styles.dates}>
            {fmtDate(stay.checkIn)} – {fmtDate(stay.checkOut)}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{stay.name}</h3>
        <div className={styles.type}>{stay.type}</div>
        <div className={styles.costs}>
          <span>
            <span className={styles.costLabel}>Per night: </span>
            <span className={styles.costValue}>${stay.costPerNight}</span>
          </span>
          <span>
            <span className={styles.costLabel}>Total: </span>
            <span className={styles.costValue}>${totalCost}</span>
          </span>
        </div>

        <div className={styles.bookedByRow}>
          <span className={styles.bookedByLabel}>Booked By</span>
          <div className={styles.bookedByDropdown} onClick={(e) => e.stopPropagation()}>
            <Dropdown
              value={stay.bookedBy}
              options={bookedByOptions}
              onChange={handleBookedByChange}
              placeholder="None"
            />
          </div>
        </div>

        {isBooked && (
          <div className={styles.bookedActions} onClick={(e) => e.stopPropagation()}>
            {stay.confirmationLink && (
              <a href={stay.confirmationLink} target="_blank" rel="noopener noreferrer">
                Confirmation
              </a>
            )}
            {stay.link && (
              <a href={stay.link} target="_blank" rel="noopener noreferrer">
                Property
              </a>
            )}
          </div>
        )}

        {!isBooked && isSelected && (
          <div className={styles.searchPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.vibeFilters}>
              {VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`${styles.vibeBtn} ${selectedVibe === v ? styles.vibeBtnActive : ''}`}
                  onClick={() => setSelectedVibe((prev) => (prev === v ? null : v))}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className={styles.priceRow}>
              <label className={styles.priceLabel}>
                Max price per night: ${priceRange}
              </label>
              <input
                type="range"
                className={styles.priceSlider}
                min={20}
                max={500}
                step={10}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
              />
            </div>
            <div className={styles.searchLinks}>
              {searchUrls.map(({ name, url }) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                  {name}
                </a>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          className={styles.viewLocationBtn}
          onClick={(e) => {
            e.stopPropagation();
            setShowMap((prev) => !prev);
          }}
        >
          {showMap ? 'Hide Location' : 'View Location'}
        </button>
        {showMap && (
          <div className={styles.mapPlaceholder}>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
          </div>
        )}

        {onDelete && (
          <div className={styles.deleteRow} onClick={(e) => e.stopPropagation()}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="xs">Delete Stay</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete &quot;{stay.name}&quot;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This stay in {stay.city} will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(stay.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </article>
  );
}
