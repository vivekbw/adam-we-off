'use client';

import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({
  width,
  height,
  borderRadius,
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;
  if (borderRadius !== undefined) {
    style.borderRadius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
  }

  const classNames = [styles.skeleton, className].filter(Boolean).join(' ');

  return <div className={classNames} style={style} aria-hidden />;
}

export function CardSkeleton({ className }: { className?: string }) {
  const classNames = [styles.cardSkeleton, className].filter(Boolean).join(' ');

  return (
    <div className={classNames} aria-hidden>
      <div className={styles.cardHeader} />
      <div className={styles.cardLine} />
      <div className={styles.cardLine} />
      <div className={styles.cardLineShort} />
    </div>
  );
}

export function TextSkeleton({ className }: { className?: string }) {
  const classNames = [styles.textSkeleton, className].filter(Boolean).join(' ');

  return <div className={classNames} aria-hidden />;
}
