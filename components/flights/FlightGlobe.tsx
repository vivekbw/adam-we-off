'use client';

import { memo, useMemo, useEffect, useRef } from 'react';
import type { Flight, ItinerarySegment } from '@/lib/constants';
import styles from './FlightGlobe.module.css';

const COORDS: Record<string, [number, number]> = {
  YYZ: [43.6777, -79.6248],
  NRT: [35.7647, 140.3864],
  HND: [35.5494, 139.7798],
  HAN: [21.2212, 105.807],
  CNX: [18.7669, 98.9625],
  BKK: [13.69, 100.7501],
  DPS: [-8.7482, 115.1672],
  KBV: [8.0986, 98.9862],
  HKG: [22.308, 113.9185],
  SIN: [1.3644, 103.9915],
  ICN: [37.4602, 126.4407],
  KUL: [2.7456, 101.7099],
  CGK: [-6.1256, 106.6558],
  PNH: [11.5466, 104.8441],
  SGN: [10.8185, 106.6519],
  DEL: [28.5562, 77.1],
  DAD: [16.0439, 108.1992],
  BOM: [19.0896, 72.8656],
  HYD: [17.2403, 78.4294],
  CCU: [22.6547, 88.4467],
  MAA: [12.9941, 80.1709],
  BLR: [13.1979, 77.7063],
  KTM: [27.6966, 85.3591],
  CMB: [7.1801, 79.8842],
  MLE: [4.1918, 73.5292],
  PEK: [40.0799, 116.6031],
  PVG: [31.1443, 121.8083],
  TPE: [25.0777, 121.2322],
  MNL: [14.5086, 121.0194],
  RGN: [16.9074, 96.1342],
};

const CITY_TO_CODE: Record<string, string> = {};
for (const [code] of Object.entries(COORDS)) {
  CITY_TO_CODE[code] = code;
}

function resolveCoords(code: string): [number, number] | null {
  return COORDS[code] ?? null;
}

function arcPoints(
  from: [number, number],
  to: [number, number],
  segments = 60
): [number, number][] {
  const points: [number, number][] = [];
  const dLng = to[1] - from[1];
  const useDateline = Math.abs(dLng) > 180;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat = from[0] + (to[0] - from[0]) * t;
    let lng: number;

    if (useDateline) {
      const adjusted = dLng > 0 ? dLng - 360 : dLng + 360;
      lng = from[1] + adjusted * t;
      if (lng > 180) lng -= 360;
      if (lng < -180) lng += 360;
    } else {
      lng = from[1] + dLng * t;
    }

    const elevation =
      Math.sin(Math.PI * t) * Math.max(1.5, Math.abs(dLng) * 0.04);
    points.push([lat + elevation, lng]);
  }
  return points;
}

interface MapSegment {
  from: [number, number];
  to: [number, number];
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  fromFlag: string;
  toFlag: string;
  status: string;
  order: number;
}

function FlightGlobeInner({
  flights,
  itinerary = [],
}: {
  flights: Flight[];
  itinerary?: ItinerarySegment[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const flagLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const seg of itinerary) {
      map[seg.city.toLowerCase()] = seg.flag;
    }
    return map;
  }, [itinerary]);

  const segments = useMemo<MapSegment[]>(() => {
    const sorted = [...flights].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted
      .map((f, i) => {
        const from = resolveCoords(f.fromCode);
        const to = resolveCoords(f.toCode);
        if (!from || !to) return null;
        return {
          from,
          to,
          fromCode: f.fromCode,
          toCode: f.toCode,
          fromCity: f.from,
          toCity: f.to,
          fromFlag: f.fromFlag || flagLookup[f.from.toLowerCase()] || '',
          toFlag: f.toFlag || flagLookup[f.to.toLowerCase()] || '',
          status: f.status,
          order: i + 1,
        };
      })
      .filter((s): s is MapSegment => s !== null);
  }, [flights, flagLookup]);

  useEffect(() => {
    if (!mapRef.current || segments.length === 0) return;

    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;
      // @ts-expect-error CSS import handled by webpack
      await import('leaflet/dist/leaflet.css');

      if (cancelled || !mapRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const allLats = segments.flatMap((s) => [s.from[0], s.to[0]]);
      const allLngs = segments.flatMap((s) => [s.from[1], s.to[1]]);

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        touchZoom: true,
        keyboard: true,
        minZoom: 2,
        maxZoom: 10,
        worldCopyJump: true,
      });

      const bounds = L.latLngBounds(
        [Math.min(...allLats) - 4, Math.min(...allLngs) - 8],
        [Math.max(...allLats) + 4, Math.max(...allLngs) + 8]
      );
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 6 });
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 18 }
      ).addTo(map);

      const cities = new Map<
        string,
        { coords: [number, number]; city: string; flag: string; code: string; firstOrder: number }
      >();

      for (const s of segments) {
        if (!cities.has(s.fromCode)) {
          cities.set(s.fromCode, {
            coords: s.from,
            city: s.fromCity,
            flag: s.fromFlag,
            code: s.fromCode,
            firstOrder: s.order,
          });
        }
        if (!cities.has(s.toCode)) {
          cities.set(s.toCode, {
            coords: s.to,
            city: s.toCity,
            flag: s.toFlag,
            code: s.toCode,
            firstOrder: s.order,
          });
        }
      }

      for (const s of segments) {
        const color = '#2563EB';
        const points = arcPoints(s.from, s.to);

        L.polyline(points, {
          color,
          weight: 2.5,
          opacity: 0.7,
          smoothFactor: 1.5,
        }).addTo(map);

        const midIdx = Math.floor(points.length / 2);
        const midPoint = points[midIdx];
        const numIcon = L.divIcon({
          className: 'flight-route-num',
          html: `<div class="flight-route-num-badge">${s.order}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        L.marker(midPoint, { icon: numIcon, interactive: false }).addTo(map);
      }

      for (const [, info] of cities) {
        const icon = L.divIcon({
          className: 'flight-city-marker',
          html: `<div class="flight-city-dot"></div>
                 <div class="flight-city-label">${info.flag ? info.flag + ' ' : ''}${info.city}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        L.marker(info.coords, { icon }).addTo(map);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [segments]);

  if (segments.length === 0) {
    return (
      <div className={styles.empty}>
        <span>Add flights to see your route map</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map} />
    </div>
  );
}

export const FlightGlobe = memo(FlightGlobeInner);
