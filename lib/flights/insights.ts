import type { Flight } from '@/lib/constants';

export const STATIC_FLIGHT_WARNINGS: Record<string, string> = {
  f5: 'BKK is large — allow 2h before departure. ~1h taxi from Khaosan area.',
  f6: 'DPS return: bus from Uluwatu ~1.5h. Book transport early!',
  f2: 'NRT→HAN 10:45am. Tour pickup 7am May 30 — tight!',
};

const AIRPORT_NOTES: Record<string, string> = {
  NRT: 'Safe travels to Narita. It is a smooth arrival airport, but immigration and the train into Tokyo can still take a while, so give yourselves a relaxed first evening.',
  HAN: 'Safe travels into Hanoi. Noi Bai arrivals can feel busy, so it is worth sorting transport before landing and keeping small cash handy for the ride into the city.',
  CNX: 'Safe travels to Chiang Mai. The airport is close to town, so this is one of the easier arrival days on the trip and a good chance to settle in quickly.',
  BKK: 'Safe travels to Bangkok. Suvarnabhumi is large and busy, so follow the signs carefully and give yourselves a little buffer before moving on.',
  DPS: 'Safe travels to Bali. Denpasar arrivals can bunch up, so expect a slower exit and have your transfer details ready before you land.',
  YYZ: 'Safe travels home to Toronto. Pearson can be a long final arrival, so leave extra patience for customs, baggage, and the trip back into the city.',
};

export function getAllFlightWarnings(flight: Flight, warnings: string[] = []) {
  const merged = [
    ...(STATIC_FLIGHT_WARNINGS[flight.id] ? [STATIC_FLIGHT_WARNINGS[flight.id]] : []),
    ...warnings,
  ];
  return Array.from(new Set(merged));
}

export function getFlightWarningExplanation(warning: string) {
  const lower = warning.toLowerCase();

  if (lower.includes('tight connection') || lower.includes('only ') && lower.includes('connect')) {
    return 'This flag means the transfer window is short. Even a small delay, slow deplaning, or terminal change could make the next flight stressful or risky.';
  }

  if (lower.includes('tour pickup') || lower.includes('tight!')) {
    return 'This flag means the next booked plan starts very soon after arrival. If the flight runs late or airport exit takes longer than expected, the following activity could be hard to make on time.';
  }

  if (lower.includes('arrives') && lower.includes('starts')) {
    return 'This flag means the flight arrival date does not line up cleanly with the itinerary start for that stop, so the trip timeline may need to be adjusted.';
  }

  if (lower.includes('flies on') && lower.includes('itinerary changes')) {
    return 'This flag means the booked flight date does not match the day the itinerary says you move between those cities.';
  }

  if (lower.includes('leaves') && lower.includes('trip ends')) {
    return 'This flag means the outbound flight does not match the planned end of that destination, which could leave an extra night or cause a rushed departure.';
  }

  if (lower.includes('pdf date changed')) {
    return 'This flag means the imported booking confirmation disagreed with the flight date already in the trip, so the schedule should be double-checked.';
  }

  if (lower.includes('allow 2h') || lower.includes('book transport early')) {
    return 'This flag is a practical airport logistics note. The route is still workable, but ground transport or airport size could make the day feel tighter than it first appears.';
  }

  return 'This flag means there is something in the booking or itinerary that deserves a second look before travel day.';
}

export function generateBookedFlightBlurb(flight: Flight) {
  const airportNote = AIRPORT_NOTES[flight.toCode];
  if (airportNote) return airportNote;

  return `Safe travels on ${flight.airline}. This leg looks comfortably booked, so the main thing left is a calm airport day and an easy arrival into ${flight.to}.`;
}
