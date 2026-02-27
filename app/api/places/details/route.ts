import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 200 });
  }

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');
  const photoRef = searchParams.get('photoRef');
  const maxWidth = searchParams.get('maxWidth') || '400';

  // If photoRef is provided, proxy the photo
  if (photoRef) {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${apiKey}`;
    const res = await fetch(photoUrl);
    const blob = await res.blob();
    return new Response(blob, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  if (!placeId) {
    return Response.json({ error: 'placeId or photoRef required' }, { status: 400 });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('fields', 'name,formatted_address,rating,user_ratings_total,formatted_phone_number,website,url,photos,reviews,price_level,opening_hours,geometry');

    const res = await fetch(url.toString());
    const data = await res.json();

    return Response.json({ result: data.result });
  } catch {
    return Response.json({ error: 'Failed to fetch place details' }, { status: 500 });
  }
}
