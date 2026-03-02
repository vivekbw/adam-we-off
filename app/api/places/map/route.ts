import { NextRequest } from 'next/server';

const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

function pixelResponse() {
  return new Response(TRANSPARENT_PIXEL, {
    headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'public, max-age=86400' },
  });
}

const MAP_STYLES = [
  'style=feature:all|element:geometry|color:0xf5f5f5',
  'style=feature:water|color:0xc9e8f5',
  'style=feature:road|visibility:off',
  'style=feature:poi|visibility:off',
  'style=feature:transit|visibility:off',
  'style=feature:administrative.country|element:geometry.stroke|color:0xbdbdbd|weight:1',
  'style=feature:administrative.country|element:labels.text.fill|color:0x9e9e9e',
  'style=feature:landscape.natural|color:0xeaeaea',
].join('&');

export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return pixelResponse();

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode');

  let mapUrl: string;

  if (mode === 'flights') {
    const center = searchParams.get('center') || '20,60';
    const zoom = searchParams.get('zoom') || '2';
    const size = searchParams.get('size') || '640x360';
    const paths = searchParams.getAll('path');
    const markers = searchParams.getAll('marker');

    const parts = [
      `https://maps.googleapis.com/maps/api/staticmap?`,
      `center=${encodeURIComponent(center)}`,
      `&zoom=${zoom}`,
      `&size=${size}`,
      `&scale=2`,
      `&maptype=roadmap`,
      `&key=${apiKey}`,
      `&${MAP_STYLES}`,
    ];

    for (const p of paths) parts.push(`&path=${encodeURIComponent(p)}`);
    for (const m of markers) parts.push(`&markers=${encodeURIComponent(m)}`);

    mapUrl = parts.join('');
  } else {
    const center = searchParams.get('center') || '';
    const zoom = searchParams.get('zoom') || '13';
    const size = searchParams.get('size') || '400x200';
    const markers = searchParams.get('markers') || center;

    mapUrl = [
      `https://maps.googleapis.com/maps/api/staticmap?`,
      `center=${encodeURIComponent(center)}`,
      `&zoom=${zoom}`,
      `&size=${size}`,
      `&markers=${encodeURIComponent(markers)}`,
      `&key=${apiKey}`,
      `&style=feature:all|element:geometry|color:0xFBF7F0`,
      `&style=feature:water|color:0xC2E8F0`,
    ].join('');
  }

  try {
    const res = await fetch(mapUrl);
    if (!res.ok) return pixelResponse();
    const blob = await res.blob();
    return new Response(blob, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return pixelResponse();
  }
}
