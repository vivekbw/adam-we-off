import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    // Return a 1x1 transparent pixel if no key
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return new Response(pixel, {
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'public, max-age=86400' },
    });
  }

  const { searchParams } = new URL(req.url);
  const center = searchParams.get('center') || '';
  const zoom = searchParams.get('zoom') || '13';
  const size = searchParams.get('size') || '400x200';
  const markers = searchParams.get('markers') || center;

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(center)}&zoom=${zoom}&size=${size}&markers=${encodeURIComponent(markers)}&key=${apiKey}&style=feature:all|element:geometry|color:0xFBF7F0&style=feature:water|color:0xC2E8F0`;

  try {
    const res = await fetch(mapUrl);
    const blob = await res.blob();
    return new Response(blob, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return new Response(pixel, {
      headers: { 'Content-Type': 'image/gif' },
    });
  }
}
