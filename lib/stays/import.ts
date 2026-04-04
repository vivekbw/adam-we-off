import type { Stay } from '@/lib/constants';
import { daysBetween, fmtDate } from '@/lib/constants';
import { flagForCountry } from '@/lib/country-flags';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const PROPERTY_TYPES = [
  'Villa',
  'House',
  'Apartment',
  'Room',
  'Hotel',
  'Hostel',
  'Resort',
  'Condo',
  'Home',
  'Bungalow',
  'Suite',
  'Guesthouse',
  'Cabin',
  'Loft',
] as const;

const LOCATION_HINTS: Array<{
  match: string[];
  city: string;
  country: string;
}> = [
  { match: ['south kuta', 'kuta selatan'], city: 'South Kuta', country: 'Indonesia' },
  { match: ['kecamatan ubud', 'ubud'], city: 'Ubud', country: 'Indonesia' },
  { match: ['uluwatu'], city: 'Uluwatu', country: 'Indonesia' },
  { match: ['bali / kuta', 'bali', 'kuta'], city: 'Bali / Kuta', country: 'Indonesia' },
  { match: ['phi phi'], city: 'Phi Phi Islands', country: 'Thailand' },
  { match: ['bangkok'], city: 'Bangkok', country: 'Thailand' },
  { match: ['chiang mai'], city: 'Chiang Mai', country: 'Thailand' },
  { match: ['hanoi'], city: 'Hanoi', country: 'Vietnam' },
  { match: ['tokyo'], city: 'Tokyo', country: 'Japan' },
  { match: ['toronto'], city: 'Toronto', country: 'Canada' },
];

export interface ImportedStayCandidate {
  sourceFile: string;
  summary: string;
  stay: Partial<Stay>;
  warnings: string[];
  extractedText?: string;
}

function cleanLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function previewText(text: string) {
  return cleanLines(text).slice(0, 20).join('\n').slice(0, 1600);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function inferYear(monthIndex: number, day: number) {
  const now = new Date();
  const candidate = new Date(Date.UTC(now.getFullYear(), monthIndex, day));
  const diffDays = Math.round((candidate.getTime() - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  return diffDays < -180 ? now.getFullYear() + 1 : now.getFullYear();
}

function toIsoDate(monthIndex: number, day: number, year?: number) {
  const resolvedYear = year ?? inferYear(monthIndex, day);
  return new Date(Date.UTC(resolvedYear, monthIndex, day)).toISOString().slice(0, 10);
}

function parseDateRange(lines: string[]) {
  for (const line of lines) {
    const match = line.match(
      /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})\s*[–-]\s*(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?(\d{1,2})\b/i,
    );
    if (!match) continue;

    const startMonth = SHORT_MONTHS[match[1].toLowerCase()];
    const startDay = Number(match[2]);
    const endMonth = match[3] ? SHORT_MONTHS[match[3].toLowerCase()] : startMonth;
    const endDay = Number(match[4]);
    if (startMonth == null || endMonth == null) continue;

    const year = inferYear(startMonth, startDay);
    const checkIn = toIsoDate(startMonth, startDay, year);
    const checkOut = toIsoDate(endMonth, endDay, endMonth < startMonth ? year + 1 : year);
    return { checkIn, checkOut };
  }

  return null;
}

function findLocationHint(text: string) {
  const lower = text.toLowerCase();
  return LOCATION_HINTS.find((hint) => hint.match.some((part) => lower.includes(part)));
}

function detectType(line: string) {
  const lower = line.toLowerCase();
  const match = PROPERTY_TYPES.find((type) => lower.startsWith(type.toLowerCase()) || lower.includes(type.toLowerCase()));
  return match ?? 'Hotel';
}

function detectName(lines: string[]) {
  const named = lines.find((line) =>
    PROPERTY_TYPES.some((type) => line.toLowerCase().includes(`${type.toLowerCase()} in `)) ||
    PROPERTY_TYPES.some((type) => line.toLowerCase().startsWith(type.toLowerCase())),
  );

  if (named) return named.replace(/\s*[·|].*$/, '').trim();

  const fallback = lines.find((line) =>
    !/hosted by|check in|check out|invite guests|book a private car service|in \d+ months/i.test(line) &&
    line.length > 6,
  );

  return fallback ?? 'Imported stay';
}

function detectCity(lines: string[], name: string, text: string) {
  const hint = findLocationHint(text);
  if (hint) return hint.city;

  const nameMatch = name.match(/\bin\s+(.+)$/i);
  if (nameMatch) {
    return nameMatch[1].trim();
  }

  const firstLine = lines.find((line) =>
    !/\d|hosted by|check in|check out|invite guests|book a private car service|in \d+ months/i.test(line),
  );

  return firstLine?.trim() ?? '';
}

function detectCountry(text: string, city: string) {
  const directCountry = ['Indonesia', 'Thailand', 'Vietnam', 'Japan', 'Canada'].find((country) =>
    text.toLowerCase().includes(country.toLowerCase()),
  );
  if (directCountry) return directCountry;

  const hint = findLocationHint(`${city}\n${text}`);
  return hint?.country ?? '';
}

function normalizeCityName(city: string, country: string) {
  const combined = `${city}\n${country}`;
  const hint = findLocationHint(combined);
  return hint?.city ?? city;
}

function staySummary(stay: Partial<Stay>) {
  const label = stay.name || stay.city || 'Imported stay';
  if (stay.checkIn && stay.checkOut) {
    return `${label} (${fmtDate(stay.checkIn)} - ${fmtDate(stay.checkOut)})`;
  }
  return `${label} (review dates)`;
}

export function createManualReviewStayCandidate(
  sourceFile: string,
  warning: string,
  extractedText = '',
): ImportedStayCandidate {
  return {
    sourceFile,
    summary: `${sourceFile} · review needed`,
    stay: {
      status: 'Booked',
      type: 'Hotel',
      nights: 1,
      costPerNight: 0,
    },
    warnings: [warning],
    extractedText: previewText(extractedText),
  };
}

export function parseStayDocumentText(text: string, sourceFile: string): ImportedStayCandidate {
  const lines = cleanLines(text);
  if (lines.length === 0) {
    return createManualReviewStayCandidate(
      sourceFile,
      'We could not read text from this file. Fill in the stay details manually before confirming.',
      text,
    );
  }

  const joinedText = lines.join('\n');
  const name = detectName(lines);
  const rawCity = detectCity(lines, name, joinedText);
  const country = detectCountry(joinedText, rawCity);
  const city = normalizeCityName(rawCity, country);
  const dateRange = parseDateRange(lines);
  const type = detectType(name);
  const warnings: string[] = [];

  if (!city) {
    warnings.push('We could not confidently detect the stay location. Please review the city and country.');
  }

  if (!dateRange) {
    warnings.push('We could not confidently detect the check-in and check-out dates. Please review them.');
  }

  const checkIn = dateRange?.checkIn ?? '';
  const checkOut = dateRange?.checkOut ?? '';
  const nights = checkIn && checkOut ? Math.max(daysBetween(checkIn, checkOut), 1) : 1;

  if (!country) {
    warnings.push('Country was not clearly visible, so it may need a quick correction.');
  }

  const stay: Partial<Stay> = {
    name,
    city,
    country,
    flag: flagForCountry(country),
    type,
    checkIn,
    checkOut,
    nights,
    costPerNight: 0,
    status: 'Booked',
    bookedBy: null,
    link: null,
    confirmationLink: null,
  };

  return {
    sourceFile,
    summary: staySummary(stay),
    stay,
    warnings: Array.from(new Set(warnings)),
    extractedText: previewText(text),
  };
}
