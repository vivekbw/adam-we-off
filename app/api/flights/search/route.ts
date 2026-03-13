import { NextRequest } from "next/server";
import { bookingDeepLinks } from "@/lib/constants";
import type { AmadeusFlightOffer, AmadeusFlightSegment } from "@/lib/constants";
import { AMADEUS_BASE, getAccessToken, resolveIata } from "@/lib/amadeus";

const airlineNameCache = new Map<string, string>();

async function resolveAirlineName(
  code: string,
  token: string
): Promise<string> {
  if (airlineNameCache.has(code)) return airlineNameCache.get(code)!;

  try {
    const url = new URL(
      `${AMADEUS_BASE}/v1/reference-data/airlines`
    );
    url.searchParams.set("airlineCodes", code);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      const name = data.data?.[0]?.businessName ?? data.data?.[0]?.commonName;
      if (name) {
        airlineNameCache.set(code, name);
        return name;
      }
    }
  } catch {
    // fall through
  }

  airlineNameCache.set(code, code);
  return code;
}

interface RawSegment {
  carrierCode: string;
  number: string;
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
}

interface RawItinerary {
  duration: string;
  segments: RawSegment[];
}

interface RawOffer {
  id: string;
  itineraries: RawItinerary[];
  price: { currency: string; grandTotal: string };
  validatingAirlineCodes?: string[];
}

export async function POST(req: NextRequest) {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json(
      { error: "Amadeus credentials not configured" },
      { status: 500 }
    );
  }

  let body: { from: string; to: string; date: string; adults?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { from, to, date, adults = 1 } = body;
  if (!from || !to || !date) {
    return Response.json(
      { error: "from, to, and date are required" },
      { status: 400 }
    );
  }

  try {
    const token = await getAccessToken();

    const [originIata, destIata] = await Promise.all([
      resolveIata(from, token),
      resolveIata(to, token),
    ]);

    if (!originIata || !destIata) {
      return Response.json(
        {
          error: `Could not resolve airport code for ${!originIata ? from : to}`,
        },
        { status: 404 }
      );
    }

    const url = new URL(`${AMADEUS_BASE}/v2/shopping/flight-offers`);
    url.searchParams.set("originLocationCode", originIata);
    url.searchParams.set("destinationLocationCode", destIata);
    url.searchParams.set("departureDate", date);
    url.searchParams.set("adults", String(adults));
    url.searchParams.set("currencyCode", "CAD");
    url.searchParams.set("max", "5");
    url.searchParams.set("nonStop", "false");

    const searchRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      console.error("Amadeus search error:", searchRes.status, errBody);
      return Response.json(
        { error: "Flight search failed", detail: errBody },
        { status: searchRes.status }
      );
    }

    const searchData = await searchRes.json();
    const rawOffers: RawOffer[] = searchData.data ?? [];

    const carrierCodes = new Set<string>();
    for (const offer of rawOffers) {
      const itin = offer.itineraries[0];
      if (!itin) continue;
      for (const seg of itin.segments) {
        carrierCodes.add(seg.carrierCode);
      }
      if (offer.validatingAirlineCodes?.[0]) {
        carrierCodes.add(offer.validatingAirlineCodes[0]);
      }
    }

    await Promise.all(
      Array.from(carrierCodes).map((code) =>
        resolveAirlineName(code, token)
      )
    );

    const links = bookingDeepLinks(originIata, destIata, date);

    const offers: AmadeusFlightOffer[] = rawOffers
      .filter((offer) => offer.itineraries[0]?.segments?.length > 0)
      .map((offer) => {
      const itin = offer.itineraries[0];
      const firstSeg = itin.segments[0];
      const lastSeg = itin.segments[itin.segments.length - 1];
      const mainCarrier =
        offer.validatingAirlineCodes?.[0] ?? firstSeg.carrierCode;

      const segments: AmadeusFlightSegment[] = itin.segments.map((seg) => ({
        carrierCode: seg.carrierCode,
        flightNumber: seg.number,
        departure: seg.departure,
        arrival: seg.arrival,
      }));

      return {
        id: offer.id,
        price: offer.price.grandTotal,
        currency: offer.price.currency,
        airline: airlineNameCache.get(mainCarrier) ?? mainCarrier,
        airlineCode: mainCarrier,
        departureTime: firstSeg.departure.at.slice(11, 16),
        arrivalTime: lastSeg.arrival.at.slice(11, 16),
        departureDate: firstSeg.departure.at.slice(0, 10),
        stops: itin.segments.length - 1,
        duration: itin.duration,
        originIata,
        destIata,
        segments,
        bookingLinks: links,
      };
    });

    return Response.json({ offers, originIata, destIata });
  } catch (err) {
    console.error("Flight search error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
