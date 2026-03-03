import { NextRequest } from "next/server";
import { stayBookingDeepLinks } from "@/lib/constants";
import type { AmadeusHotelOffer } from "@/lib/constants";
import { AMADEUS_BASE, getAccessToken, resolveIata } from "@/lib/amadeus";

const MAX_HOTELS = 15;

interface HotelListEntry {
  hotelId: string;
  name: string;
  chainCode?: string;
  geoCode?: { latitude: number; longitude: number };
  address?: { countryCode?: string };
}

interface RawRoomOffer {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  roomQuantity?: string;
  room?: {
    type?: string;
    typeEstimated?: { category?: string };
    description?: { text?: string; lang?: string };
  };
  guests?: { adults?: number };
  price?: {
    currency?: string;
    base?: string;
    total?: string;
    variations?: { average?: { base?: string } };
  };
  policies?: {
    paymentType?: string;
    cancellation?: {
      type?: string;
      description?: { text?: string };
    };
  };
}

interface RawHotelOffers {
  type: string;
  hotel: {
    hotelId: string;
    name: string;
    chainCode?: string;
    cityCode?: string;
    latitude?: number;
    longitude?: number;
  };
  available: boolean;
  offers: RawRoomOffer[];
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

  let body: {
    city: string;
    checkIn: string;
    checkOut: string;
    adults?: number;
    ratings?: number[];
    amenities?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { city, checkIn, checkOut, adults = 1, ratings, amenities } = body;
  if (!city || !checkIn || !checkOut) {
    return Response.json(
      { error: "city, checkIn, and checkOut are required" },
      { status: 400 }
    );
  }

  try {
    const token = await getAccessToken();

    const cityIata = await resolveIata(city, token);
    if (!cityIata) {
      return Response.json(
        { error: `Could not resolve city code for ${city}` },
        { status: 404 }
      );
    }

    // Step 1: Get hotel list by city
    const listUrl = new URL(
      `${AMADEUS_BASE}/v1/reference-data/locations/hotels/by-city`
    );
    listUrl.searchParams.set("cityCode", cityIata);
    listUrl.searchParams.set("hotelSource", "ALL");

    if (ratings && ratings.length > 0) {
      listUrl.searchParams.set("ratings", ratings.join(","));
    }
    if (amenities && amenities.length > 0) {
      listUrl.searchParams.set("amenities", amenities.join(","));
    }

    console.log("[Amadeus] Hotel list request:", listUrl.toString());
    const listRes = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) {
      const errBody = await listRes.text();
      console.error("[Amadeus] Hotel list error:", listRes.status, errBody);
      return Response.json(
        { error: "Hotel list lookup failed", detail: errBody },
        { status: listRes.status }
      );
    }

    const listData = await listRes.json();
    const hotels: HotelListEntry[] = (listData.data ?? []).slice(
      0,
      MAX_HOTELS
    );

    if (hotels.length === 0) {
      return Response.json({ offers: [], cityIata, cityName: city });
    }

    const hotelIds = hotels.map((h) => h.hotelId).join(",");

    // Step 2: Get offers for those hotels
    const offersUrl = new URL(
      `${AMADEUS_BASE}/v3/shopping/hotel-offers`
    );
    offersUrl.searchParams.set("hotelIds", hotelIds);
    offersUrl.searchParams.set("checkInDate", checkIn);
    offersUrl.searchParams.set("checkOutDate", checkOut);
    offersUrl.searchParams.set("adults", String(adults));
    offersUrl.searchParams.set("roomQuantity", "1");
    offersUrl.searchParams.set("currencyCode", "CAD");

    console.log("[Amadeus] Hotel offers request:", offersUrl.toString());
    const offersRes = await fetch(offersUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!offersRes.ok) {
      const errBody = await offersRes.text();
      console.error("[Amadeus] Hotel offers error:", offersRes.status, errBody);
      return Response.json(
        { error: "Hotel offers lookup failed", detail: errBody },
        { status: offersRes.status }
      );
    }

    const offersData = await offersRes.json();
    const rawHotels: RawHotelOffers[] = offersData.data ?? [];

    const bookingLinks = stayBookingDeepLinks(city, checkIn, checkOut, adults);

    const nightCount = Math.max(
      1,
      Math.round(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
      )
    );

    const offers: AmadeusHotelOffer[] = rawHotels
      .filter((h) => h.available && h.offers.length > 0)
      .map((h) => {
        const offer = h.offers[0];
        const total = offer.price?.total ?? offer.price?.base ?? "0";
        const avgPerNight =
          offer.price?.variations?.average?.base ??
          String((parseFloat(total) / nightCount).toFixed(2));

        const roomCategory =
          offer.room?.typeEstimated?.category?.replace(/_/g, " ") ?? "";
        const roomDesc = offer.room?.description?.text ?? "";

        let cancellation: string | null = null;
        if (offer.policies?.cancellation) {
          const c = offer.policies.cancellation;
          if (c.type === "FULL_STAY") {
            cancellation = "Non-refundable";
          } else if (c.description?.text) {
            cancellation = c.description.text;
          } else {
            cancellation = "Cancellation applies";
          }
        }

        return {
          id: offer.id,
          hotelId: h.hotel.hotelId,
          hotelName: h.hotel.name,
          cityCode: h.hotel.cityCode ?? cityIata,
          checkInDate: offer.checkInDate,
          checkOutDate: offer.checkOutDate,
          roomType: roomCategory,
          roomDescription: roomDesc,
          price: total,
          pricePerNight: avgPerNight,
          currency: offer.price?.currency ?? "CAD",
          cancellationPolicy: cancellation,
          paymentType: offer.policies?.paymentType ?? "unknown",
          bookingLinks,
        };
      });

    return Response.json({ offers, cityIata, cityName: city });
  } catch (err) {
    console.error("Hotel search error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
