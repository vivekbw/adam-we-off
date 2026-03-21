import type { Flight, ItinerarySegment } from '@/lib/constants';
import { fmtDate } from '@/lib/constants';
import { flagForCountry } from '@/lib/country-flags';

const MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const TIME_RE = /^\d{1,2}:\d{2}(?:am|pm)$/i;
const MONEY_RE = /(?:CA)?\$(\d[\d,]*\.?\d{0,2})/i;
const FLEXIBLE_TIME_RE = /\b\d{1,2}:\d{2}(?:\s?[ap]\.?m\.?)?\b/gi;

interface ParsedLocation {
  city: string;
  country: string;
  code: string;
}

interface ParsedEvent extends ParsedLocation {
  kind: 'depart' | 'arrive';
  time: string;
  dateIso: string;
}

interface ParsedLayover {
  city: string;
  durationText: string;
  minutes: number;
}

export interface ImportedFlightCandidate {
  sourceFile: string;
  summary: string;
  confirmationCode?: string;
  expediaItinerary?: string;
  flight: Partial<Flight>;
  warnings: string[];
  extractedText?: string;
}

function cleanLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function toPreviewText(text: string) {
  const lines = cleanLines(text).slice(0, 18);
  return lines.join('\n').slice(0, 1400);
}

function trimLocationLabel(value: string) {
  return value
    .replace(/\b(?:international|domestic|intl)\b/gi, '')
    .replace(/\bairport\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[,-]\s*$/, '')
    .trim();
}

function toIsoDate(monthDay: string, year: number) {
  const match = monthDay.match(/^([A-Z][a-z]{2}) (\d{1,2})$/);
  if (!match) return '';
  const [, month, day] = match;
  const monthIndex = MONTH_INDEX[month];
  if (monthIndex == null) return '';
  return new Date(Date.UTC(year, monthIndex, Number(day))).toISOString().slice(0, 10);
}

function parseDateLabel(line: string, year: number) {
  const match = line.match(/(?:Departs|Arrives)\s+\w+,\s+([A-Z][a-z]{2} \d{1,2})/);
  return match ? toIsoDate(match[1], year) : '';
}

function parseLocation(line: string): ParsedLocation {
  const codeMatch = line.match(/\(([A-Z]{3})-/);
  const beforeCode = codeMatch ? line.slice(0, codeMatch.index).trim() : line;
  const parts = beforeCode
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: parts[0] ?? beforeCode,
    country: parts[parts.length - 1] ?? '',
    code: codeMatch?.[1] ?? '',
  };
}

function parseMinutes(durationText: string) {
  const hours = Number(durationText.match(/(\d+)h/)?.[1] ?? 0);
  const minutes = Number(durationText.match(/(\d+)m/)?.[1] ?? 0);
  return hours * 60 + minutes;
}

function normalizeTime(value: string) {
  const cleaned = value.replace(/\s+/g, '').replace(/\./g, '').toLowerCase();
  const twelveHour = cleaned.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
  if (twelveHour) {
    return `${twelveHour[1]}:${twelveHour[2]}${twelveHour[3]}`;
  }

  const twentyFourHour = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (!twentyFourHour) return value.trim();

  let hours = Number(twentyFourHour[1]);
  const minutes = twentyFourHour[2];
  const suffix = hours >= 12 ? 'pm' : 'am';
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes}${suffix}`;
}

function shiftIsoDate(dateIso: string, days: number) {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatArrivalTime(depDateIso: string, arrDateIso: string, time: string) {
  if (!depDateIso || !arrDateIso) return time;
  const dayDiff = Math.round(
    (new Date(`${arrDateIso}T00:00:00`).getTime() - new Date(`${depDateIso}T00:00:00`).getTime()) /
      86400000,
  );

  return dayDiff > 0 ? `${time}+${dayDiff}` : time;
}

function extractAmount(lines: string[]) {
  const paymentIndex = lines.findIndex((line) => line === 'Payment details');
  if (paymentIndex === -1) return null;

  for (let i = paymentIndex; i < lines.length; i += 1) {
    if (!lines[i].startsWith('Total')) continue;

    const sameLineAmount = lines[i].match(MONEY_RE);
    if (sameLineAmount) {
      return Number(sameLineAmount[1].replace(/,/g, ''));
    }

    for (let j = i + 1; j < Math.min(i + 4, lines.length); j += 1) {
      const amountMatch = lines[j].match(MONEY_RE);
      if (amountMatch) {
        return Number(amountMatch[1].replace(/,/g, ''));
      }
    }
  }

  return null;
}

function extractAnyAmount(lines: string[]) {
  const specific = extractAmount(lines);
  if (specific != null) return specific;

  const values = lines
    .flatMap((line) => Array.from(line.matchAll(MONEY_RE)))
    .map((match) => Number(match[1].replace(/,/g, '')))
    .filter((value) => !Number.isNaN(value));

  if (values.length === 0) return null;
  return Math.max(...values);
}

function normalizePlace(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function samePlace(a: string, b: string) {
  const left = normalizePlace(a);
  const right = normalizePlace(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function parseFlexibleDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.replace(/^([A-Z][a-z]{2})\s+(\d{1,2}),\s*(\d{4})$/, '$1 $2 $3');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function extractFirstDate(lines: string[]) {
  for (const line of lines) {
    const monthMatch = line.match(/\b([A-Z][a-z]{2,8} \d{1,2}, \d{4})\b/);
    if (monthMatch) {
      const date = parseFlexibleDate(monthMatch[1]);
      if (date) return date;
    }

    const isoMatch = line.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    if (isoMatch) {
      return isoMatch[1];
    }

    const reverseMonthMatch = line.match(/\b(\d{1,2} [A-Z][a-z]{2,8} \d{4})\b/);
    if (reverseMonthMatch) {
      const date = parseFlexibleDate(reverseMonthMatch[1]);
      if (date) return date;
    }
  }

  return '';
}

function extractTimes(lines: string[]) {
  const matches: string[] = [];

  for (const line of lines) {
    const nextMatches = line.match(FLEXIBLE_TIME_RE);
    if (!nextMatches) continue;

    for (const match of nextMatches) {
      const normalized = normalizeTime(match);
      if (!matches.includes(normalized)) {
        matches.push(normalized);
      }
    }
  }

  return matches;
}

function extractConfirmationCode(lines: string[]) {
  for (const line of lines) {
    const match = line.match(
      /(?:confirmation|reservation|record|booking|reference|locator)(?:\s*(?:code|number|#))?\s*[:#-]?\s*([A-Z0-9]{5,8})/i,
    );
    if (match) return match[1];
  }

  return undefined;
}

function extractAirline(lines: string[]) {
  const airlineMatch = lines.find((line) =>
    /\b(?:air|airlines|airways|westjet|delta|united|american|alaska|jetstar|easyjet|ryanair|emirates|qatar|singapore|vietnam|thai|ana|jal|lufthansa|klm|cathay|turkish)\b/i.test(
      line,
    ),
  );

  if (!airlineMatch) return 'Imported flight';

  return airlineMatch
    .replace(/^Operated by\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLocationMentions(lines: string[]): ParsedLocation[] {
  const locations: ParsedLocation[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const matches = line.matchAll(
      /([A-Z][A-Za-z'./& -]{1,60}?)(?:,\s*([A-Z][A-Za-z'./& -]{2,40}))?\s*\(([A-Z]{3})\b[^)]*\)/g,
    );

    for (const match of matches) {
      const city = trimLocationLabel(match[1]);
      const country = trimLocationLabel(match[2] ?? '');
      const code = match[3];
      if (!city || !code) continue;

      const key = `${normalizePlace(city)}-${code}`;
      if (seen.has(key)) continue;
      seen.add(key);

      locations.push({ city, country, code });
    }
  }

  return locations;
}

function fallbackLocationFromCode(lines: string[]) {
  const codes = lines
    .flatMap((line) => Array.from(line.matchAll(/\b[A-Z]{3}\b/g)).map((match) => match[0]))
    .filter((code, index, all) => all.indexOf(code) === index);

  if (codes.length < 2) return null;

  return {
    from: { city: codes[0], country: '', code: codes[0] },
    to: { city: codes[codes.length - 1], country: '', code: codes[codes.length - 1] },
  };
}

function parseArrivalDate(flight: Flight) {
  if (!flight.date) return '';
  const offset = Number(flight.arr.match(/\+(\d+)/)?.[1] ?? 0);
  return shiftIsoDate(flight.date, offset);
}

function parseClockMinutes(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return null;

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toLowerCase() === 'pm') hours += 12;
  return hours * 60 + minutes;
}

function findMatchingLeg(flight: Flight, itinerary: ItinerarySegment[]) {
  if (itinerary.length === 0) return null;

  const first = itinerary[0];
  if (samePlace(flight.to, first.city)) {
    return { type: 'inbound' as const, segment: first };
  }

  const last = itinerary[itinerary.length - 1];
  if (samePlace(flight.from, last.city)) {
    return { type: 'outbound' as const, segment: last };
  }

  for (let i = 0; i < itinerary.length - 1; i += 1) {
    const current = itinerary[i];
    const next = itinerary[i + 1];
    if (samePlace(flight.from, current.city) && samePlace(flight.to, next.city)) {
      return { type: 'internal' as const, from: current, to: next };
    }
  }

  return null;
}

export function getFlightValidationWarnings(
  flight: Flight,
  itinerary: ItinerarySegment[],
  allFlights: Flight[],
) {
  const warnings: string[] = [];
  const match = findMatchingLeg(flight, itinerary);

  if (match?.type === 'inbound') {
    const arrivalDate = parseArrivalDate(flight);
    if (arrivalDate && arrivalDate !== match.segment.startDate) {
      warnings.push(
        `Arrives ${fmtDate(arrivalDate)}, but ${match.segment.city} starts ${fmtDate(match.segment.startDate)}.`,
      );
    }
  }

  if (match?.type === 'outbound' && flight.date && flight.date !== match.segment.endDate) {
    warnings.push(
      `Leaves ${match.segment.city} on ${fmtDate(flight.date)}, but the trip ends there on ${fmtDate(match.segment.endDate)}.`,
    );
  }

  if (match?.type === 'internal' && flight.date && flight.date !== match.from.endDate) {
    warnings.push(
      `${match.from.city} → ${match.to.city} flies on ${fmtDate(flight.date)}, but the itinerary changes on ${fmtDate(match.from.endDate)}.`,
    );
  }

  const sortedSameDay = [...allFlights]
    .filter((candidate) => candidate.date === flight.date)
    .sort((a, b) => (parseClockMinutes(a.dep) ?? 0) - (parseClockMinutes(b.dep) ?? 0));

  const currentIndex = sortedSameDay.findIndex((candidate) => candidate.id === flight.id);
  if (currentIndex > 0) {
    const previous = sortedSameDay[currentIndex - 1];
    if (previous.toCode && previous.toCode === flight.fromCode) {
      const previousArrival = parseClockMinutes(previous.arr.replace(/\+\d+$/, ''));
      const currentDeparture = parseClockMinutes(flight.dep);
      if (previousArrival != null && currentDeparture != null) {
        const gap = currentDeparture - previousArrival;
        if (gap >= 0 && gap < 90) {
          warnings.push(`Only ${gap}m to connect in ${flight.fromCode}.`);
        }
      }
    }
  }

  return Array.from(new Set(warnings));
}

export function parseExpediaFlightPdfText(text: string, sourceFile: string): ImportedFlightCandidate | null {
  const lines = cleanLines(text);
  if (lines.length === 0) return null;

  const overallDateLine = lines.find((line) => /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/.test(line));
  const year = Number(overallDateLine?.match(/(\d{4})$/)?.[1] ?? new Date().getFullYear());
  const confirmationCode = lines.find((line) => line.startsWith('Confirmation:'))?.split(':')[1]?.trim();
  const expediaItinerary = lines
    .find((line) => line.startsWith('Expedia itinerary:'))
    ?.split(':')[1]
    ?.trim();
  const routeIndex = lines.findIndex((line, index) => index > 0 && / to /.test(line));
  const routeLine = routeIndex >= 0 ? lines[routeIndex] : '';
  const airlineLine = overallDateLine
    ? lines[lines.indexOf(overallDateLine) + 1]
    : lines[2];

  const events: ParsedEvent[] = [];
  const layovers: ParsedLayover[] = [];
  let lastArrivalCity = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (TIME_RE.test(line) && lines[i + 1] && /^(Departs|Arrives)\b/.test(lines[i + 1])) {
      const locationLine = lines.slice(i + 2, i + 6).find((candidate) => /\([A-Z]{3}-/.test(candidate));
      const location = parseLocation(locationLine ?? lines[i + 2] ?? '');
      const event: ParsedEvent = {
        ...location,
        kind: lines[i + 1].startsWith('Departs') ? 'depart' : 'arrive',
        time: line.toLowerCase(),
        dateIso: parseDateLabel(lines[i + 1], year),
      };
      events.push(event);
      if (event.kind === 'arrive') {
        lastArrivalCity = event.city;
      }
    }

    if (line.startsWith('Layover:')) {
      const durationText = line.replace('Layover:', '').trim();
      layovers.push({
        city: lastArrivalCity,
        durationText,
        minutes: parseMinutes(durationText),
      });
    }
  }

  const firstDeparture = events.find((event) => event.kind === 'depart');
  const lastArrival = [...events].reverse().find((event) => event.kind === 'arrive');
  if (!firstDeparture || !lastArrival) return null;

  const travelerIndex = lines.findIndex((line) => line === 'Traveler info');
  const travelerName = travelerIndex >= 0 ? lines[travelerIndex + 1] : '';
  const firstName = travelerName.split(/\s+/)[0];
  const seatNumber = lines.find((line) => line.startsWith('Seat '))?.replace('Seat ', '').trim();

  const warnings = layovers
    .filter((layover) => layover.minutes > 0 && layover.minutes < 90)
    .map((layover) =>
      `Tight connection: ${layover.durationText}${layover.city ? ` in ${layover.city}` : ''}.`,
    );

  const flight: Partial<Flight> = {
    from: firstDeparture.city,
    fromCode: firstDeparture.code,
    fromFlag: flagForCountry(firstDeparture.country),
    to: lastArrival.city,
    toCode: lastArrival.code,
    toFlag: flagForCountry(lastArrival.country),
    date: firstDeparture.dateIso,
    dep: firstDeparture.time,
    arr: formatArrivalTime(firstDeparture.dateIso, lastArrival.dateIso, lastArrival.time),
    airline: airlineLine?.trim() || 'Imported flight',
    status: 'Booked',
    seats: seatNumber && firstName ? { [firstName]: seatNumber } : undefined,
    travelerStatuses: firstName ? { [firstName]: 'Booked' } : undefined,
    cost: extractAmount(lines),
  };

  const summaryRoute = routeLine || `${flight.from} to ${flight.to}`;

  return {
    sourceFile,
    summary: `${summaryRoute} (${fmtDate(flight.date ?? '')})`,
    confirmationCode,
    expediaItinerary,
    flight,
    warnings,
    extractedText: toPreviewText(text),
  };
}

export function createManualReviewCandidate(
  sourceFile: string,
  warning: string,
  extractedText = '',
): ImportedFlightCandidate {
  return {
    sourceFile,
    summary: `${sourceFile} · review needed`,
    confirmationCode: extractConfirmationCode(cleanLines(extractedText)),
    flight: {
      status: 'Booked',
      seats: {},
    },
    warnings: [warning],
    extractedText: toPreviewText(extractedText),
  };
}

export function parseGenericFlightDocumentText(
  text: string,
  sourceFile: string,
): ImportedFlightCandidate {
  const lines = cleanLines(text);
  if (lines.length === 0) {
    return createManualReviewCandidate(
      sourceFile,
      'We could not read text from this file. Fill in the flight details manually before confirming.',
      text,
    );
  }

  const locations = extractLocationMentions(lines);
  const codeFallback = fallbackLocationFromCode(lines);
  const firstLocation = locations[0] ?? codeFallback?.from;
  const lastLocation = locations[locations.length - 1] ?? codeFallback?.to;
  const times = extractTimes(lines);
  const date = extractFirstDate(lines);
  const airline = extractAirline(lines);
  const confirmationCode = extractConfirmationCode(lines);
  const warnings: string[] = [];

  if (!firstLocation || !lastLocation) {
    warnings.push('We could not confidently detect the route. Please review the cities and airport codes.');
  }

  if (!date) {
    warnings.push('We could not confidently detect the travel date. Please review it before confirming.');
  }

  if (times.length < 2) {
    warnings.push('We only found part of the timing details. Double-check departure and arrival times.');
  }

  if (
    firstLocation &&
    lastLocation &&
    (airline === 'Imported flight' || !firstLocation.country || !lastLocation.country)
  ) {
    warnings.push('This file needed a generic read, so it is worth giving the extracted details a quick check.');
  }

  const flight: Partial<Flight> = {
    from: firstLocation?.city ?? '',
    fromCode: firstLocation?.code ?? '',
    fromFlag: flagForCountry(firstLocation?.country ?? ''),
    to: lastLocation?.city ?? '',
    toCode: lastLocation?.code ?? '',
    toFlag: flagForCountry(lastLocation?.country ?? ''),
    date,
    dep: times[0] ?? '',
    arr: times[1] ?? '',
    airline,
    status: 'Booked',
    seats: {},
    travelerStatuses: {},
    cost: extractAnyAmount(lines),
  };

  const fromLabel = flight.fromCode || flight.from || 'Unknown origin';
  const toLabel = flight.toCode || flight.to || 'Unknown destination';
  const dateLabel = flight.date ? fmtDate(flight.date) : 'date needs review';

  return {
    sourceFile,
    summary: `${fromLabel} → ${toLabel} (${dateLabel})`,
    confirmationCode,
    flight,
    warnings: Array.from(new Set(warnings)),
    extractedText: toPreviewText(text),
  };
}

export function parseFlightDocumentText(text: string, sourceFile: string): ImportedFlightCandidate {
  const expedia = parseExpediaFlightPdfText(text, sourceFile);
  if (expedia) return expedia;
  return parseGenericFlightDocumentText(text, sourceFile);
}
