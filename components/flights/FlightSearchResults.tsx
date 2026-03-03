'use client';

import { X, ExternalLink, PlusCircle } from 'lucide-react';
import type { AmadeusFlightOffer, Flight } from '@/lib/constants';
import { formatDuration } from '@/lib/constants';
import styles from './FlightSearchResults.module.css';

export interface FlightSearchResultsProps {
  offers: AmadeusFlightOffer[];
  loading: boolean;
  error: string | null;
  fromCity: string;
  toCity: string;
  fromFlag: string;
  toFlag: string;
  onClose: () => void;
  onAddFlight?: (partial: Partial<Flight>) => void;
}

export function FlightSearchResults({
  offers,
  loading,
  error,
  fromCity,
  toCity,
  fromFlag,
  toFlag,
  onClose,
  onAddFlight,
}: FlightSearchResultsProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelTitle}>Flight Deals</div>
          <div className={styles.panelRoute}>
            {fromFlag} {fromCity} &rarr; {toFlag} {toCity}
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
          No flights found for this route and date. Try searching on the
          booking sites directly.
        </div>
      )}

      {!loading && offers.length > 0 && (
        <>
          <ul className={styles.offerList}>
            {offers.map((offer) => (
              <li key={offer.id} className={styles.offer}>
                <div className={styles.offerMain}>
                  <div className={styles.offerTop}>
                    <span className={styles.offerTimes}>
                      {offer.departureTime} &rarr; {offer.arrivalTime}
                    </span>
                    <span className={styles.offerAirline}>
                      {offer.airline}
                    </span>
                  </div>
                  <div className={styles.offerMeta}>
                    <span
                      className={`${styles.stopsTag} ${
                        offer.stops === 0
                          ? styles.stopsDirect
                          : styles.stopsMulti
                      }`}
                    >
                      {offer.stops === 0
                        ? 'Direct'
                        : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
                    </span>
                    <span>{formatDuration(offer.duration)}</span>
                    <span>
                      {offer.originIata} &rarr; {offer.destIata}
                    </span>
                  </div>
                  <div className={styles.bookingLinks}>
                    <a
                      href={offer.bookingLinks.googleFlights}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.bookingLink}
                    >
                      Google Flights <ExternalLink size={10} />
                    </a>
                    <a
                      href={offer.bookingLinks.skyscanner}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.bookingLink}
                    >
                      Skyscanner <ExternalLink size={10} />
                    </a>
                    <a
                      href={offer.bookingLinks.expedia}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.bookingLink}
                    >
                      Expedia <ExternalLink size={10} />
                    </a>
                    {onAddFlight && (
                      <button
                        type="button"
                        className={styles.addBtn}
                        onClick={() =>
                          onAddFlight({
                            from: fromCity,
                            fromCode: offer.originIata,
                            to: toCity,
                            toCode: offer.destIata,
                            date: offer.departureDate,
                            dep: offer.departureTime,
                            arr: offer.arrivalTime,
                            airline: offer.airline,
                            cost: parseFloat(offer.price) || null,
                            status: 'Need to Book',
                            seats: {},
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
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.footer}>
            Prices are indicative and may vary. Low-cost carriers, AA, Delta
            &amp; BA not included.
          </div>
        </>
      )}
    </div>
  );
}
