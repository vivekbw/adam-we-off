// ── IMAGE MAPS (Unsplash w=600&q=80 for cities, w=400&q=80 for activities/stays) ──

export const CITY_IMAGES: Record<string, string> = {
  Tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
  Hanoi: "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=600&q=80",
  "Chiang Mai": "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80",
  Bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80",
  "Phi Phi Islands": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
  Ubud: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
  Uluwatu: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80",
};

export const ACTIVITY_IMAGES: Record<string, string> = {
  "Tokyo Giants Baseball Game": "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&q=80",
  "Sumo Wrestling Tournament": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
  "Shibuya Sky Tower": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&q=80",
  "teamLab Borderless": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  "Ha Giang Loop Motorbike Tour (3 days)": "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80",
  "Elephant Sanctuary Half-Day": "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=400&q=80",
  "Muay Thai Fight Night": "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&q=80",
  "Sunset Boat Tour": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
  "Sacred Monkey Forest": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80",
  "Kecak Fire Dance": "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80",
};

export const STAY_IMAGES: Record<string, string> = {
  "The Millennials Shibuya": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
  "Motorventures Tour": "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=400&q=80",
  "Wannamas Boutique House": "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=400&q=80",
  "Revolution Khao San": "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80",
  "Phi Phi Island Cabana Hotel": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80",
  "Kupu Kupu Private Villa": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80",
  "TBD Villa": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80",
};

// ── NOTE COLORS (bg, border, text per type) ────────────────────────────────────

export const NOTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Allergy: { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" },
  Preference: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
  Goal: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
  Visa: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
  Health: { bg: "#F5F3FF", border: "#DDD6FE", text: "#5B21B6" },
  Other: { bg: "#F3F4F6", border: "#D1D5DB", text: "#374151" },
};

// ── TYPESCRIPT INTERFACES ─────────────────────────────────────────────────────

export interface Trip {
  id: string;
  name?: string;
  startDate?: string;
  endDate?: string;
}

export interface ItinerarySegment {
  id: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  flag: string;
  nights: number;
  countryCode: string;
}

export interface Flight {
  id: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  fromFlag: string;
  toFlag: string;
  date: string;
  dep: string;
  arr: string;
  airline: string;
  status: string;
  seats: Record<string, string>;
  bookingStatus: Record<string, string>;
  cost: number | null;
}

export function deriveFlightStatus(
  bookingStatus: Record<string, string>,
  buddyNames?: string[]
): string {
  const names = buddyNames && buddyNames.length > 0
    ? buddyNames
    : Object.keys(bookingStatus);
  if (names.length === 0) return 'Need to Book';
  return names.every((name) => bookingStatus[name] === 'Booked')
    ? 'Booked'
    : 'Need to Book';
}

export interface Stay {
  id: string;
  city: string;
  country: string;
  flag: string;
  checkIn: string;
  checkOut: string;
  name: string;
  type: string;
  status: string;
  bookedBy: string | null;
  costPerNight: number;
  nights: number;
  link: string | null;
  confirmationLink: string | null;
}

export interface Activity {
  id: string;
  city: string;
  country: string;
  flag: string;
  name: string;
  date: string;
  cost: number;
  status: string;
  link: string;
  bookedBy: string | null;
  individual: boolean;
}

export interface Note {
  id: string;
  type: string;
  icon: string;
  author: string;
  content: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  split: string[];
  date: string;
  category: string;
}


// ── SEED DATA ─────────────────────────────────────────────────────────────────

export const SEED_ITINERARY: ItinerarySegment[] = [
  { id: "i1", country: "Japan", city: "Tokyo", startDate: "2026-05-24", endDate: "2026-05-29", flag: "🇯🇵", nights: 5, countryCode: "JP" },
  { id: "i2", country: "Vietnam", city: "Hanoi", startDate: "2026-05-29", endDate: "2026-06-02", flag: "🇻🇳", nights: 4, countryCode: "VN" },
  { id: "i3", country: "Thailand", city: "Chiang Mai", startDate: "2026-06-02", endDate: "2026-06-04", flag: "🇹🇭", nights: 2, countryCode: "TH" },
  { id: "i4", country: "Thailand", city: "Bangkok", startDate: "2026-06-04", endDate: "2026-06-07", flag: "🇹🇭", nights: 3, countryCode: "TH" },
  { id: "i5", country: "Indonesia", city: "Phi Phi Islands", startDate: "2026-06-07", endDate: "2026-06-09", flag: "🇮🇩", nights: 2, countryCode: "ID" },
  { id: "i6", country: "Indonesia", city: "Ubud", startDate: "2026-06-09", endDate: "2026-06-11", flag: "🇮🇩", nights: 2, countryCode: "ID" },
  { id: "i7", country: "Indonesia", city: "Uluwatu", startDate: "2026-06-11", endDate: "2026-06-13", flag: "🇮🇩", nights: 2, countryCode: "ID" },
];

export const SEED_FLIGHTS: Flight[] = [
  {
    id: "f1",
    from: "Toronto",
    fromCode: "YYZ",
    to: "Tokyo",
    toCode: "NRT",
    fromFlag: "🇨🇦",
    toFlag: "🇯🇵",
    date: "2026-05-24",
    dep: "10:00am",
    arr: "4:25pm+1",
    airline: "Air Canada",
    status: "Need to Book",
    seats: {},
    bookingStatus: {},
    cost: 770,
  },
  {
    id: "f2",
    from: "Tokyo",
    fromCode: "NRT",
    to: "Hanoi",
    toCode: "HAN",
    fromFlag: "🇯🇵",
    toFlag: "🇻🇳",
    date: "2026-05-29",
    dep: "10:45am",
    arr: "6:40pm",
    airline: "Vietnam Airlines",
    status: "Need to Book",
    seats: {},
    bookingStatus: {},
    cost: 450,
  },
  {
    id: "f3",
    from: "Hanoi",
    fromCode: "HAN",
    to: "Chiang Mai",
    toCode: "CNX",
    fromFlag: "🇻🇳",
    toFlag: "🇹🇭",
    date: "2026-06-02",
    dep: "10:35am",
    arr: "2:50pm",
    airline: "Thai AirAsia",
    status: "Need to Book",
    seats: {},
    bookingStatus: {},
    cost: 100,
  },
  {
    id: "f4",
    from: "Chiang Mai",
    fromCode: "CNX",
    to: "Bangkok",
    toCode: "BKK",
    fromFlag: "🇹🇭",
    toFlag: "🇹🇭",
    date: "2026-06-04",
    dep: "9:10pm",
    arr: "10:30pm",
    airline: "Thai AirAsia",
    status: "Need to Book",
    seats: {},
    bookingStatus: {},
    cost: 80,
  },
  {
    id: "f5",
    from: "Bangkok",
    fromCode: "BKK",
    to: "Bali / Kuta",
    toCode: "DPS",
    fromFlag: "🇹🇭",
    toFlag: "🇮🇩",
    date: "2026-06-07",
    dep: "12:40pm",
    arr: "6:00pm",
    airline: "AirAsia",
    status: "Need to Book",
    seats: {},
    bookingStatus: {},
    cost: 140,
  },
  {
    id: "f6",
    from: "Bali / Kuta",
    fromCode: "DPS",
    to: "Toronto",
    toCode: "YYZ",
    fromFlag: "🇮🇩",
    toFlag: "🇨🇦",
    date: "2026-06-13",
    dep: "4:30pm",
    arr: "—",
    airline: "Connecting",
    status: "Need to Book",
    seats: {},
    bookingStatus: {},
    cost: null,
  },
];

export const SEED_STAYS: Stay[] = [
  {
    id: "s1",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    checkIn: "2026-05-24",
    checkOut: "2026-05-29",
    name: "The Millennials Shibuya",
    type: "Hostel",
    status: "Booked",
    bookedBy: "Kate",
    costPerNight: 171,
    nights: 5,
    link: "https://www.hostelworld.com",
    confirmationLink: "https://booking.com/confirmation/123",
  },
  {
    id: "s2",
    city: "Hanoi",
    country: "Vietnam",
    flag: "🇻🇳",
    checkIn: "2026-05-29",
    checkOut: "2026-06-02",
    name: "Motorventures Tour",
    type: "Tour Included",
    status: "Booked",
    bookedBy: "Vienna",
    costPerNight: 25,
    nights: 4,
    link: "https://motorventures.com",
    confirmationLink: null,
  },
  {
    id: "s3",
    city: "Chiang Mai",
    country: "Thailand",
    flag: "🇹🇭",
    checkIn: "2026-06-02",
    checkOut: "2026-06-04",
    name: "Wannamas Boutique House",
    type: "Hostel",
    status: "Need to Book",
    bookedBy: null,
    costPerNight: 30,
    nights: 2,
    link: null,
    confirmationLink: null,
  },
  {
    id: "s4",
    city: "Bangkok",
    country: "Thailand",
    flag: "🇹🇭",
    checkIn: "2026-06-04",
    checkOut: "2026-06-07",
    name: "Revolution Khao San",
    type: "Hostel",
    status: "Need to Book",
    bookedBy: null,
    costPerNight: 30,
    nights: 3,
    link: null,
    confirmationLink: null,
  },
  {
    id: "s5",
    city: "Phi Phi Islands",
    country: "Indonesia",
    flag: "🇮🇩",
    checkIn: "2026-06-07",
    checkOut: "2026-06-09",
    name: "Phi Phi Island Cabana Hotel",
    type: "Hotel",
    status: "Need to Book",
    bookedBy: null,
    costPerNight: 45,
    nights: 2,
    link: null,
    confirmationLink: null,
  },
  {
    id: "s6",
    city: "Ubud",
    country: "Indonesia",
    flag: "🇮🇩",
    checkIn: "2026-06-09",
    checkOut: "2026-06-11",
    name: "Kupu Kupu Private Villa",
    type: "Villa",
    status: "Need to Book",
    bookedBy: null,
    costPerNight: 80,
    nights: 2,
    link: null,
    confirmationLink: null,
  },
  {
    id: "s7",
    city: "Uluwatu",
    country: "Indonesia",
    flag: "🇮🇩",
    checkIn: "2026-06-11",
    checkOut: "2026-06-13",
    name: "TBD Villa",
    type: "Villa",
    status: "Need to Book",
    bookedBy: null,
    costPerNight: 80,
    nights: 2,
    link: null,
    confirmationLink: null,
  },
];

export const SEED_ACTIVITIES: Activity[] = [
  {
    id: "a1",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    name: "Tokyo Giants Baseball Game",
    date: "2026-05-25",
    cost: 60,
    status: "Considering",
    link: "https://www.giants.jp/en/",
    bookedBy: null,
    individual: false,
  },
  {
    id: "a2",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    name: "Sumo Wrestling Tournament",
    date: "2026-05-26",
    cost: 45,
    status: "Booked",
    link: "https://www.sumo.or.jp/En/",
    bookedBy: "Adam",
    individual: false,
  },
  {
    id: "a3",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    name: "Shibuya Sky Tower",
    date: "2026-05-27",
    cost: 22,
    status: "Booked",
    link: "https://www.shibuya-scramble-square.com/sky/",
    bookedBy: "Kate",
    individual: false,
  },
  {
    id: "a4",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    name: "teamLab Borderless",
    date: "2026-05-28",
    cost: 32,
    status: "Booked",
    link: "https://www.teamlab.art/e/borderless-azabudai/",
    bookedBy: "Vienna",
    individual: false,
  },
  {
    id: "a5",
    city: "Hanoi",
    country: "Vietnam",
    flag: "🇻🇳",
    name: "Ha Giang Loop Motorbike Tour (3 days)",
    date: "2026-05-30",
    cost: 180,
    status: "Booked",
    link: "https://motorventures.com/",
    bookedBy: "Vienna",
    individual: false,
  },
  {
    id: "a6",
    city: "Chiang Mai",
    country: "Thailand",
    flag: "🇹🇭",
    name: "Elephant Sanctuary Half-Day",
    date: "2026-06-03",
    cost: 85,
    status: "Considering",
    link: "https://www.elephantnaturepark.org/",
    bookedBy: null,
    individual: false,
  },
  {
    id: "a7",
    city: "Bangkok",
    country: "Thailand",
    flag: "🇹🇭",
    name: "Muay Thai Fight Night",
    date: "2026-06-05",
    cost: 40,
    status: "Considering",
    link: "https://www.rajadamnern.com/",
    bookedBy: null,
    individual: false,
  },
  {
    id: "a8",
    city: "Phi Phi Islands",
    country: "Indonesia",
    flag: "🇮🇩",
    name: "Sunset Boat Tour",
    date: "2026-06-08",
    cost: 55,
    status: "Considering",
    link: "https://phi-phi.com/tours/",
    bookedBy: null,
    individual: false,
  },
  {
    id: "a9",
    city: "Ubud",
    country: "Indonesia",
    flag: "🇮🇩",
    name: "Sacred Monkey Forest",
    date: "2026-06-09",
    cost: 8,
    status: "Considering",
    link: "https://monkeyforestubud.com/",
    bookedBy: null,
    individual: false,
  },
  {
    id: "a10",
    city: "Uluwatu",
    country: "Indonesia",
    flag: "🇮🇩",
    name: "Kecak Fire Dance",
    date: "2026-06-12",
    cost: 18,
    status: "Considering",
    link: "https://www.pura-luhur-uluwatu.com/",
    bookedBy: null,
    individual: false,
  },
];

export const SEED_NOTES: Note[] = [
  { id: "n1", type: "Allergy", icon: "🚨", author: "Adam", content: "Shellfish allergy — avoid shrimp/crab dishes" },
  { id: "n2", type: "Preference", icon: "🌿", author: "Kate", content: "Vegetarian-friendly options needed in every city" },
  { id: "n3", type: "Goal", icon: "🎯", author: "Vienna", content: "Wants to try local street food markets every city" },
  { id: "n4", type: "Visa", icon: "📋", author: "All", content: "Vietnam requires visa on arrival — apply e-visa minimum 3 days in advance" },
  { id: "n5", type: "Health", icon: "💊", author: "All", content: "Malaria prophylaxis recommended for Vietnam & Indonesia" },
];

export const SEED_EXPENSES: Expense[] = [];

// ── HELPER FUNCTIONS ───────────────────────────────────────────────────────────

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function fmtDateLong(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function addDays(d: string, n: number): string {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split("T")[0];
}

// ── FLIGHT SEARCH LINKS ───────────────────────────────────────────────────────

export interface FlightSearchLink {
  name: string;
  url: string;
  price: number | null;
}

export function flightSearchLinks(
  from: string,
  to: string,
  date: string
): FlightSearchLink[] {
  const yy = date.slice(2, 4);
  const mm = date.slice(5, 7);
  const dd = date.slice(8, 10);
  return [
    {
      name: "Google Flights",
      url: `https://www.google.com/flights#flt=${from}.${to}.${date};c:CAD;e:1;sd:1;t:f`,
      price: null,
    },
    {
      name: "Skyscanner",
      url: `https://www.skyscanner.ca/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${yy}${mm}${dd}/`,
      price: null,
    },
    {
      name: "Expedia",
      url: `https://www.expedia.ca/Flights-Search?flight-type=on&mode=search&trip=oneway&leg1=from%3A${from}%2Cto%3A${to}%2Cdeparture%3A${date}TANYT`,
      price: null,
    },
  ];
}

// ── AMADEUS FLIGHT SEARCH ────────────────────────────────────────────────────

export interface AmadeusFlightSegment {
  carrierCode: string;
  flightNumber: string;
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
}

export interface AmadeusFlightOffer {
  id: string;
  price: string;
  currency: string;
  airline: string;
  airlineCode: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  stops: number;
  duration: string;
  originIata: string;
  destIata: string;
  segments: AmadeusFlightSegment[];
  bookingLinks: {
    googleFlights: string;
    skyscanner: string;
    expedia: string;
  };
}

export function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : "";
  const m = match[2] ? ` ${match[2]}m` : "";
  return `${h}${m}`.trim();
}

// ── AMADEUS HOTEL SEARCH ─────────────────────────────────────────────────────

export interface AmadeusHotelOffer {
  id: string;
  hotelId: string;
  hotelName: string;
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  roomDescription: string;
  price: string;
  pricePerNight: string;
  currency: string;
  cancellationPolicy: string | null;
  paymentType: string;
  bookingLinks: {
    bookingDotCom: string;
    expedia: string;
    hostelworld: string;
  };
}

export function stayBookingDeepLinks(
  city: string,
  checkIn: string,
  checkOut: string,
  guests: number = 4
) {
  const encoded = encodeURIComponent(city);
  return {
    bookingDotCom: `https://www.booking.com/searchresults.html?ss=${encoded}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}`,
    expedia: `https://www.expedia.ca/Hotel-Search?destination=${encoded}&startDate=${checkIn}&endDate=${checkOut}&adults=${guests}`,
    hostelworld: `https://www.hostelworld.com/stays/?search_keywords=${encoded}&checkIn=${checkIn}&checkOut=${checkOut}`,
  };
}

export function bookingDeepLinks(
  originIata: string,
  destIata: string,
  date: string
) {
  const yy = date.slice(2, 4);
  const mm = date.slice(5, 7);
  const dd = date.slice(8, 10);
  return {
    googleFlights: `https://www.google.com/flights#flt=${originIata}.${destIata}.${date};c:CAD;e:1;sd:1;t:f`,
    skyscanner: `https://www.skyscanner.ca/transport/flights/${originIata.toLowerCase()}/${destIata.toLowerCase()}/${yy}${mm}${dd}/`,
    expedia: `https://www.expedia.ca/Flights-Search?flight-type=on&mode=search&trip=oneway&leg1=from%3A${originIata}%2Cto%3A${destIata}%2Cdeparture%3A${date}TANYT`,
  };
}
