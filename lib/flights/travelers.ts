import type { Flight } from '@/lib/constants';

export type FlightTravelerStatus = 'Booked' | 'Need to Book';

export const FLIGHT_TRAVELER_STATUSES_KEY = '__travelerStatuses';

function isTravelerStatus(value: unknown): value is FlightTravelerStatus {
  return value === 'Booked' || value === 'Need to Book';
}

export function splitFlightSeatsPayload(value: unknown) {
  const raw = typeof value === 'object' && value !== null ? { ...value } as Record<string, unknown> : {};
  const travelerStatusesRaw = raw[FLIGHT_TRAVELER_STATUSES_KEY];
  delete raw[FLIGHT_TRAVELER_STATUSES_KEY];

  const seats: Record<string, string> = {};
  Object.entries(raw).forEach(([name, seat]) => {
    if (typeof seat === 'string') {
      seats[name] = seat;
    }
  });

  const travelerStatuses: Record<string, FlightTravelerStatus> = {};
  if (typeof travelerStatusesRaw === 'object' && travelerStatusesRaw !== null) {
    Object.entries(travelerStatusesRaw as Record<string, unknown>).forEach(([name, status]) => {
      if (isTravelerStatus(status)) {
        travelerStatuses[name] = status;
      }
    });
  }

  return { seats, travelerStatuses };
}

export function mergeFlightSeatsPayload(
  seats: Record<string, string>,
  travelerStatuses: Record<string, FlightTravelerStatus>,
) {
  const payload: Record<string, unknown> = { ...seats };
  if (Object.keys(travelerStatuses).length > 0) {
    payload[FLIGHT_TRAVELER_STATUSES_KEY] = travelerStatuses;
  }
  return payload;
}

export function seedTravelerStatuses(flight: Flight, travelerNames: string[]) {
  const seeded: Record<string, FlightTravelerStatus> = {};

  travelerNames.forEach((name) => {
    if (flight.seats[name]) {
      seeded[name] = 'Booked';
      return;
    }

    seeded[name] = flight.status === 'Booked' ? 'Booked' : 'Need to Book';
  });

  return seeded;
}

export function getTravelerStatusesForFlight(flight: Flight, travelerNames: string[]) {
  const statuses: Record<string, FlightTravelerStatus> = {};
  const hasExplicitStatuses = Object.keys(flight.travelerStatuses).length > 0;

  travelerNames.forEach((name) => {
    const explicit = flight.travelerStatuses[name];
    if (explicit) {
      statuses[name] = explicit;
      return;
    }

    if (flight.seats[name]) {
      statuses[name] = 'Booked';
      return;
    }

    statuses[name] = !hasExplicitStatuses && flight.status === 'Booked' ? 'Booked' : 'Need to Book';
  });

  return statuses;
}

export function deriveFlightStatusFromTravelerStatuses(
  travelerStatuses: Record<string, FlightTravelerStatus>,
  fallbackStatus: string,
) {
  const values = Object.values(travelerStatuses);
  if (values.length === 0) {
    return fallbackStatus;
  }

  return values.every((status) => status === 'Booked') ? 'Booked' : 'Need to Book';
}
