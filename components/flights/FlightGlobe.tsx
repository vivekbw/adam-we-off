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

function normalizeLongitude(value: number) {
  if (value > 180) return value - 360;
  if (value < -180) return value + 360;
  return value;
}

function curvedRouteSegments(
  from: [number, number],
  to: [number, number],
  steps = 72,
): [number, number][][] {
  const [startLat, startLng] = from;
  const [endLat, rawEndLng] = to;
  let endLng = rawEndLng;
  let deltaLng = endLng - startLng;

  if (Math.abs(deltaLng) > 180) {
    endLng += deltaLng > 0 ? -360 : 360;
    deltaLng = endLng - startLng;
  }

  const deltaLat = endLat - startLat;
  const controlLng = startLng + deltaLng * 0.5;
  const averageLat = (startLat + endLat) / 2;
  const curveDirection = averageLat >= 0 ? 1 : -1;
  const curveLift = Math.min(32, Math.max(8, Math.abs(deltaLng) * 0.16 + Math.abs(deltaLat) * 0.35));
  const controlLat = Math.max(
    -80,
    Math.min(80, averageLat + curveLift * curveDirection),
  );

  const rawPath: [number, number][] = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const inv = 1 - t;
    const lat =
      inv * inv * startLat +
      2 * inv * t * controlLat +
      t * t * endLat;
    const lng =
      inv * inv * startLng +
      2 * inv * t * controlLng +
      t * t * endLng;
    rawPath.push([lat, lng]);
  }

  const grouped: [number, number][][] = [];
  let currentGroup: [number, number][] = [[rawPath[0][0], normalizeLongitude(rawPath[0][1])]];

  for (let index = 1; index < rawPath.length; index += 1) {
    const previous = rawPath[index - 1];
    const point = rawPath[index];

    if (previous[1] >= -180 && point[1] < -180) {
      const ratio = (-180 - previous[1]) / (point[1] - previous[1]);
      const latAtBoundary = previous[0] + (point[0] - previous[0]) * ratio;
      currentGroup.push([latAtBoundary, -180]);
      grouped.push(currentGroup);
      currentGroup = [[latAtBoundary, 180], [point[0], normalizeLongitude(point[1])]];
      continue;
    }

    if (previous[1] <= 180 && point[1] > 180) {
      const ratio = (180 - previous[1]) / (point[1] - previous[1]);
      const latAtBoundary = previous[0] + (point[0] - previous[0]) * ratio;
      currentGroup.push([latAtBoundary, 180]);
      grouped.push(currentGroup);
      currentGroup = [[latAtBoundary, -180], [point[0], normalizeLongitude(point[1])]];
      continue;
    }

    currentGroup.push([point[0], normalizeLongitude(point[1])]);
  }

  if (currentGroup.length > 0) {
    grouped.push(currentGroup);
  }

  return grouped.filter((group) => group.length > 1);
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
        worldCopyJump: false,
        maxBounds: [[-85, -180], [85, 180]],
        maxBoundsViscosity: 1,
      });

      const bounds = L.latLngBounds(
        [Math.min(...allLats) - 4, Math.min(...allLngs) - 8],
        [Math.max(...allLats) + 4, Math.max(...allLngs) + 8]
      );
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 6 });
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, noWrap: true }
      ).addTo(map);

      L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, opacity: 0.3, noWrap: true }
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
        const color = '#f05a28';
        const pathGroups = curvedRouteSegments(s.from, s.to);

        pathGroups.forEach((group) => {
          L.polyline(group, {
            color: '#fff7ed',
            weight: 5,
            opacity: 0.5,
            smoothFactor: 1,
            lineCap: 'round',
          }).addTo(map);

          L.polyline(group, {
            color,
            weight: 3.25,
            opacity: 0.92,
            smoothFactor: 1,
            lineCap: 'round',
          }).addTo(map);
        });

        const midGroup = pathGroups[Math.floor(pathGroups.length / 2)] ?? pathGroups[0];
        const midIdx = Math.floor(midGroup.length / 2);
        const midPoint = midGroup[midIdx];
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
