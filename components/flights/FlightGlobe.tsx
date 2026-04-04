'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { CITY_IMAGES, type Flight, type ItinerarySegment } from '@/lib/constants';
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

interface ProjectedPoint {
  x: number;
  y: number;
}

interface ContinentLabel {
  name: string;
  left: string;
  top: string;
}

interface CityMarker {
  coords: [number, number];
  city: string;
  flag: string;
  code: string;
  imageUrl: string | null;
}

interface MarkerOffset {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
}

const REFERENCE_MAP_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/World_location_map_%28equirectangular_180%29.svg/1280px-World_location_map_%28equirectangular_180%29.svg.png';

const MARKER_OFFSETS: Record<string, MarkerOffset> = {
  YYZ: { x: 0, y: -8, labelX: 0, labelY: 10 },
  NRT: { x: 28, y: -8, labelX: 18, labelY: 10 },
  HAN: { x: -16, y: 2, labelX: -8, labelY: 12 },
  CNX: { x: -10, y: 20, labelX: -8, labelY: 12 },
  BKK: { x: 8, y: 36, labelX: 6, labelY: 12 },
  DPS: { x: 24, y: 24, labelX: 16, labelY: 12 },
};

const CONTINENT_LABELS: ContinentLabel[] = [
  { name: 'North America', left: '12%', top: '27%' },
  { name: 'South America', left: '28%', top: '73%' },
  { name: 'Europe', left: '49%', top: '24%' },
  { name: 'Africa', left: '52%', top: '58%' },
  { name: 'Asia', left: '69%', top: '26%' },
  { name: 'Oceania', left: '84%', top: '77%' },
];

function resolveCoords(code: string): [number, number] | null {
  return COORDS[code] ?? null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function projectPoint([lat, lng]: [number, number], width: number, height: number): ProjectedPoint {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

function describeRoute(
  from: [number, number],
  to: [number, number],
  width: number,
  height: number,
) {
  const start = projectPoint(from, width, height);
  const end = projectPoint(to, width, height);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy) || 1;
  const lift = clamp(distance * 0.22, 42, 120);
  const controlX = (start.x + end.x) / 2;
  const controlY = clamp((start.y + end.y) / 2 - lift, 24, height - 24);
  const path = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
  const labelX = (start.x + 2 * controlX + end.x) / 4;
  const labelY = (start.y + 2 * controlY + end.y) / 4;

  return {
    start,
    end,
    control: { x: controlX, y: controlY },
    label: { x: labelX, y: labelY },
    path,
  };
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      setSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };

    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(node);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return [ref, size] as const;
}

function FlightGlobeInner({
  flights,
  itinerary = [],
}: {
  flights: Flight[];
  itinerary?: ItinerarySegment[];
}) {
  const [mapRef, size] = useElementSize<HTMLDivElement>();

  const flagLookup = useMemo(() => {
    const map: Record<string, string> = {};
    itinerary.forEach((segment) => {
      map[segment.city.toLowerCase()] = segment.flag;
    });
    return map;
  }, [itinerary]);

  const segments = useMemo<MapSegment[]>(() => {
    const sorted = [...flights].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return sorted
      .map((flight, index) => {
        const from = resolveCoords(flight.fromCode);
        const to = resolveCoords(flight.toCode);
        if (!from || !to) return null;

        return {
          from,
          to,
          fromCode: flight.fromCode,
          toCode: flight.toCode,
          fromCity: flight.from,
          toCity: flight.to,
          fromFlag: flight.fromFlag || flagLookup[flight.from.toLowerCase()] || '',
          toFlag: flight.toFlag || flagLookup[flight.to.toLowerCase()] || '',
          status: flight.status,
          order: index + 1,
        };
      })
      .filter((segment): segment is MapSegment => segment !== null);
  }, [flights, flagLookup]);

  const cities = useMemo(() => {
    const entries = new Map<string, CityMarker>();

    segments.forEach((segment) => {
      if (!entries.has(segment.fromCode)) {
        entries.set(segment.fromCode, {
          coords: segment.from,
          city: segment.fromCity,
          flag: segment.fromFlag,
          code: segment.fromCode,
          imageUrl: CITY_IMAGES[segment.fromCity] ?? CITY_IMAGES[segment.toCity] ?? null,
        });
      }
      if (!entries.has(segment.toCode)) {
        entries.set(segment.toCode, {
          coords: segment.to,
          city: segment.toCity,
          flag: segment.toFlag,
          code: segment.toCode,
          imageUrl: CITY_IMAGES[segment.toCity] ?? CITY_IMAGES[segment.fromCity] ?? null,
        });
      }
    });

    return Array.from(entries.values());
  }, [segments]);

  const projectedRoutes = useMemo(() => {
    if (size.width === 0 || size.height === 0) return [];
    return segments.map((segment) => ({
      ...segment,
      ...describeRoute(segment.from, segment.to, size.width, size.height),
    }));
  }, [segments, size.height, size.width]);

  const projectedCities = useMemo(() => {
    if (size.width === 0 || size.height === 0) return [];
    return cities.map((city) => ({
      ...city,
      point: projectPoint(city.coords, size.width, size.height),
    }));
  }, [cities, size.height, size.width]);

  if (segments.length === 0) {
    return (
      <div className={styles.empty}>
        <span>Add flights to see your route map</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map}>
        <img
          src={REFERENCE_MAP_URL}
          alt=""
          className={styles.mapImage}
          aria-hidden="true"
        />
        <div className={styles.mapTint} />
        <svg
          className={styles.routeSvg}
          viewBox={`0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="flight-route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffb066" />
              <stop offset="50%" stopColor="#ff7f50" />
              <stop offset="100%" stopColor="#ff5470" />
            </linearGradient>
          </defs>

          {projectedRoutes.map((segment) => (
            <g key={`${segment.fromCode}-${segment.toCode}-${segment.order}`}>
              <path
                d={segment.path}
                className={styles.routeGlow}
              />
              <path
                d={segment.path}
                className={styles.routePath}
              />
              <g transform={`translate(${segment.label.x}, ${segment.label.y})`}>
                <circle r="12" className={styles.routeBadge} />
                <text textAnchor="middle" dominantBaseline="central" className={styles.routeBadgeText}>
                  {segment.order}
                </text>
              </g>
            </g>
          ))}
        </svg>

        <div className={styles.markerLayer}>
          {CONTINENT_LABELS.map((label) => (
            <div
              key={label.name}
              className={styles.continentLabel}
              style={{ left: label.left, top: label.top }}
            >
              {label.name}
            </div>
          ))}
          {projectedCities.map((city) => {
            const offset = MARKER_OFFSETS[city.code] ?? { x: 0, y: 0, labelX: 0, labelY: 10 };
            return (
              <div
                key={city.code}
                className={styles.marker}
                style={{
                  left: `${city.point.x + offset.x}px`,
                  top: `${city.point.y + offset.y}px`,
                }}
              >
                <div className={styles.pinStack}>
                  <div className={styles.pinThumb}>
                    {city.imageUrl ? (
                      <img
                        src={city.imageUrl}
                        alt=""
                        className={styles.pinThumbImage}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.pinThumbFallback}>
                        {city.flag || city.city.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className={styles.pinTriangle} />
                </div>
                <div
                  className={styles.markerLabel}
                  style={{
                    transform: `translate(${offset.labelX}px, ${offset.labelY}px)`,
                  }}
                >
                  {city.flag ? `${city.flag} ` : ''}
                  {city.city}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const FlightGlobe = memo(FlightGlobeInner);
