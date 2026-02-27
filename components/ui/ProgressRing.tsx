'use client';

export interface ProgressRingProps {
  done: number;
  total: number;
  color?: string;
  size?: number;
  label?: string;
}

export function ProgressRing({
  done,
  total,
  color = 'var(--color-primary)',
  size = 48,
  label,
}: ProgressRingProps) {
  const strokeWidth = Math.max(2, size * 0.1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(done / total, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-bg-muted)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.4s ease',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: size * 0.28,
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          {done}/{total}
        </div>
      </div>
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
