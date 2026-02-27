import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'GOOGLE_PLACES_API_KEY not configured', results: [] },
      { status: 200 }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const type = searchParams.get('type'); // e.g. 'lodging', 'tourist_attraction'

  if (!query) {
    return Response.json({ error: 'query parameter required', results: [] }, { status: 400 });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('key', apiKey);
    if (type) url.searchParams.set('type', type);

    const res = await fetch(url.toString());
    const data = await res.json();

    const results = (data.results || []).slice(0, 10).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      types: place.types,
      location: place.geometry?.location,
      photoRef: place.photos?.[0]?.photo_reference,
    }));

    return Response.json({ results });
  } catch {
    return Response.json({ error: 'Failed to fetch places', results: [] }, { status: 500 });
  }
}
