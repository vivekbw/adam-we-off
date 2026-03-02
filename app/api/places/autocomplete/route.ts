import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json({ predictions: [] });
  }

  const input = req.nextUrl.searchParams.get('input');
  if (!input || input.length < 2) {
    return Response.json({ predictions: [] });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input);
    url.searchParams.set('types', '(cities)');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    const predictions = (data.predictions || []).slice(0, 6).map((p: any) => {
      const terms = p.terms || [];
      const city = terms[0]?.value ?? p.structured_formatting?.main_text ?? input;
      const country = terms[terms.length - 1]?.value ?? '';
      return {
        placeId: p.place_id,
        description: p.description,
        city,
        country,
      };
    });

    return Response.json({ predictions });
  } catch {
    return Response.json({ predictions: [] });
  }
}
