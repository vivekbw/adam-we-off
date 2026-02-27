'use client';

import { memo } from 'react';
import type { Flight } from '@/lib/constants';
import styles from './FlightGlobe.module.css';

const COORDS: Record<string, [number, number]> = {
  YYZ: [-79.6, 43.7],
  NRT: [140.4, 35.8],
  HAN: [105.8, 21.0],
  CNX: [98.9, 18.8],
  BKK: [100.7, 13.9],
  DPS: [115.2, -8.7],
  KBV: [98.9, 8.1],
};

function project([lng, lat]: [number, number]): [number, number] {
  const x = ((lng + 180) / 360) * 280 + 10;
  const y = ((90 - lat) / 180) * 180 + 10;
  return [x, y];
}

export interface FlightGlobeProps {
  flights: Flight[];
}

function FlightGlobeInner({ flights }: FlightGlobeProps) {
  const pts = flights
    .map((f) => ({
      from: COORDS[f.fromCode],
      to: COORDS[f.toCode],
      status: f.status,
    }))
    .filter((p) => p.from && p.to);

  return (
    <svg
      viewBox="0 0 300 200"
      className={styles.wrapper}
      aria-label="Flight path overview"
    >
      <defs>
        <radialGradient id="globe-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
      </defs>
      <rect width="300" height="200" fill="url(#globe-bg)" rx="12" />
      {[-60, -30, 0, 30, 60].map((lat) => {
        const [, y] = project([0, lat]);
        return (
          <line
            key={`lat-${lat}`}
            x1="10"
            x2="290"
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />
        );
      })}
      {[-120, -60, 0, 60, 120].map((lng) => {
        const [x] = project([lng, 0]);
        return (
          <line
            key={`lng-${lng}`}
            x1={x}
            x2={x}
            y1="10"
            y2="190"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />
        );
      })}
      {pts.map((p, i) => {
        const [x1, y1] = project(p.from!);
        const [x2, y2] = project(p.to!);
        const mx = (x1 + x2) / 2;
        const my = Math.min(y1, y2) - 30;
        const strokeColor =
          p.status === 'Booked' ? '#60A5FA' : '#FCA5A5';
        const strokeDasharray = p.status === 'Booked' ? 'none' : '4,2';

        return (
          <g key={i}>
            <path
              d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
              stroke={strokeColor}
              strokeWidth="1.5"
              fill="none"
              strokeDasharray={strokeDasharray}
              opacity="0.9"
            />
            <circle cx={x2} cy={y2} r="3" fill={strokeColor} />
            <circle cx={x1} cy={y1} r="3" fill="#fff" />
          </g>
        );
      })}
      <text
        x="148"
        y="195"
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize="7"
        fontFamily="var(--font-body)"
      >
        Flight Path Overview
      </text>
    </svg>
  );
}

export const FlightGlobe = memo(FlightGlobeInner);
