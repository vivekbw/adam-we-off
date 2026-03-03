'use client';

import { X, ExternalLink, PlusCircle } from 'lucide-react';
import type { AmadeusHotelOffer, Stay } from '@/lib/constants';
import { daysBetween } from '@/lib/constants';
import styles from './StaySearchResults.module.css';

export interface StaySearchResultsProps {
  offers: AmadeusHotelOffer[];
  loading: boolean;
  error: string | null;
  city: string;
  flag: string;
  onClose: () => void;
  onAddStay?: (partial: Partial<Stay>) => void;
}

export function StaySearchResults({
  offers,
  loading,
  error,
  city,
  flag,
  onClose,
  onAddStay,
}: StaySearchResultsProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelTitle}>Stay Deals</div>
          <div className={styles.panelCity}>
            {flag} {city}
          </div>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close search results"
        >
          <X size={16} />
        </button>
      </div>

      {loading && (
        <div className={styles.skeleton}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && offers.length === 0 && (
        <div className={styles.empty}>
          No hotels found for this city and dates. Try searching on
          Booking.com or Hostelworld directly.
        </div>
      )}

      {!loading && offers.length > 0 && (
        <>
          <ul className={styles.offerList}>
            {offers.map((offer) => {
              const isNonRefundable =
                offer.cancellationPolicy?.toLowerCase().includes('non-refundable') ??
                false;

              return (
                <li key={offer.id} className={styles.offer}>
                  <div className={styles.offerMain}>
                    <div className={styles.offerTop}>
                      <span className={styles.offerName}>
                        {offer.hotelName}
                      </span>
                      {offer.roomType && (
                        <span className={styles.offerRoom}>
                          {offer.roomType}
                        </span>
                      )}
                    </div>
                    <div className={styles.offerMeta}>
                      {offer.cancellationPolicy && (
                        <span
                          className={`${styles.policyTag} ${
                            isNonRefundable
                              ? styles.policyNonRefundable
                              : styles.policyRefundable
                          }`}
                        >
                          {offer.cancellationPolicy}
                        </span>
                      )}
                      <span>
                        {offer.checkInDate} &rarr; {offer.checkOutDate}
                      </span>
                    </div>
                    <div className={styles.bookingLinks}>
                      <a
                        href={offer.bookingLinks.bookingDotCom}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.bookingLink}
                      >
                        Booking.com <ExternalLink size={10} />
                      </a>
                      <a
                        href={offer.bookingLinks.expedia}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.bookingLink}
                      >
                        Expedia <ExternalLink size={10} />
                      </a>
                      <a
                        href={offer.bookingLinks.hostelworld}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.bookingLink}
                      >
                        Hostelworld <ExternalLink size={10} />
                      </a>
                      {onAddStay && (
                        <button
                          type="button"
                          className={styles.addBtn}
                          onClick={() =>
                            onAddStay({
                              name: offer.hotelName,
                              city,
                              checkIn: offer.checkInDate,
                              checkOut: offer.checkOutDate,
                              costPerNight: parseFloat(offer.pricePerNight) || 0,
                              nights: Math.max(
                                1,
                                daysBetween(offer.checkInDate, offer.checkOutDate)
                              ),
                              type: offer.roomType || 'Hotel',
                              status: 'Need to Book',
                              bookedBy: null,
                              link: offer.bookingLinks.bookingDotCom,
                            })
                          }
                        >
                          <PlusCircle size={10} /> Add to trip
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={styles.offerRight}>
                    <span className={styles.price}>
                      ${offer.price}{' '}
                      <span className={styles.priceCurrency}>
                        {offer.currency}
                      </span>
                    </span>
                    <span className={styles.pricePerNight}>
                      ${offer.pricePerNight}/night
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={styles.footer}>
            Prices are indicative and may vary. Check the booking sites for
            final availability and pricing.
          </div>
        </>
      )}
    </div>
  );
}
